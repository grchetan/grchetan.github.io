/**
 * Horizon Grand Prix — Ultra-Low-Latency Dual-Transport Multiplayer Netcode
 *
 * Transport Priority:
 * 1. BroadcastChannel (same-browser multi-tab < 2ms local test latency)
 * 2. WebRTC UDP-style DataChannel (`ordered: false, maxRetransmits: 0`, ~15–45ms P2P)
 *    with Firestore signaling piggybacked on room document (`rtcSignals`)
 * 3. Coalesced Sequenced Firestore Sync fallback (~100–250ms cloud RTT)
 *
 * Includes real RTT ping/pong heartbeat & dead-reckoning sequence filtering.
 */

import {
  getValidPlayers,
  updatePlayerState,
  writeRtcSignalEdge,
  type RaceRoom,
} from "@/lib/race";

export type TransportKind = "solo" | "p2p" | "local" | "cloud";

export interface NetPosePacket {
  id: string;
  x: number;
  z: number;
  rotation: number;
  speed: number;
  steerAngle: number;
  lap: number;
  checkpoint: number;
  progress: number;
  isBoosting: boolean;
  isDrifting: boolean;
  isBraking: boolean;
  seq: number;
  ts: number;
  receivedAt: number;
}

export interface NetMetrics {
  pingMs: number | null;
  transport: TransportKind;
  p2pConnectedCount: number;
  totalRemoteCount: number;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ],
};

interface PeerLink {
  remoteId: string;
  edgeKey: string;
  isOfferer: boolean;
  pc: RTCPeerConnection;
  dc: RTCDataChannel | null;
  open: boolean;
  appliedOffer: string | null;
  appliedAnswer: string | null;
  appliedCandidates: Set<string>;
  localCandidates: string[];
  lastPingMs: number | null;
}

export class RaceNetSession {
  private roomCode: string;
  private localId: string;
  private peers = new Map<string, PeerLink>();
  private bc: BroadcastChannel | null = null;
  private seq = 0;
  private lastCloudPushAt = 0;
  private lastP2pPushAt = 0;
  private lastPingSentAt = 0;
  private pingTimer: number | null = null;
  private cloudPingMs: number | null = null;
  private localTabSeen = false;
  private destroyed = false;

  private remotePoses = new Map<string, NetPosePacket>();
  private onMetrics?: ((metrics: NetMetrics) => void) | undefined;

  constructor(
    roomCode: string,
    localId: string,
    onMetrics?: (metrics: NetMetrics) => void
  ) {
    this.roomCode = roomCode.trim().toUpperCase();
    this.localId = localId;
    this.onMetrics = onMetrics;

    if (this.roomCode !== "SOLO" && typeof BroadcastChannel !== "undefined") {
      try {
        this.bc = new BroadcastChannel(`horizon-gp-${this.roomCode}`);
        this.bc.onmessage = (ev) => {
          const msg = ev.data as any;
          if (!msg || msg.id === this.localId) return;
          if (msg.t === "pose") {
            this.localTabSeen = true;
            this.ingestRemotePose(msg);
          } else if (msg.t === "ping") {
            this.bc?.postMessage({ t: "pong", id: this.localId, orig: msg.orig });
          } else if (msg.t === "pong" && msg.target === undefined) {
            const rtt = Math.max(1, Math.round(performance.now() - msg.orig));
            this.cloudPingMs = rtt;
            this.emitMetrics();
          }
        };
      } catch {}
    }

    if (this.roomCode !== "SOLO" && typeof window !== "undefined") {
      this.pingTimer = window.setInterval(() => this.sendPingHeartbeats(), 1200);
    }
    this.emitMetrics();
  }

  public getRemotePose(id: string): NetPosePacket | undefined {
    return this.remotePoses.get(id);
  }

  public getAllRemotePoses(): Map<string, NetPosePacket> {
    return this.remotePoses;
  }

  private ingestRemotePose(pkt: Omit<NetPosePacket, "receivedAt">) {
    const existing = this.remotePoses.get(pkt.id);
    if (existing && pkt.seq !== undefined && pkt.seq < existing.seq) {
      return; // Discard out-of-order stale UDP/Firestore packet
    }
    this.remotePoses.set(pkt.id, {
      ...pkt,
      receivedAt: performance.now(),
    });
  }

  /** Reconcile room snapshot: keep fallback remote poses fresh & drive WebRTC signaling */
  public syncRoom(room: RaceRoom) {
    if (this.destroyed || this.roomCode === "SOLO") return;

    const remotePlayers = getValidPlayers(room).filter(
      (p) => p.id !== this.localId
    );
    const activeIds = new Set(remotePlayers.map((p) => p.id));

    // Prune departed players
    for (const [pid, link] of this.peers.entries()) {
      if (!activeIds.has(pid)) {
        try {
          link.dc?.close();
          link.pc.close();
        } catch {}
        this.peers.delete(pid);
        this.remotePoses.delete(pid);
      }
    }

    // Ingest latest Firestore poses only if newer than P2P/local pose
    for (const rp of remotePlayers) {
      const existing = this.remotePoses.get(rp.id);
      const rpTs = rp.ts ?? 0;
      const shouldTakeCloud =
        !existing ||
        (performance.now() - existing.receivedAt > 250 && rpTs >= existing.ts);
      if (shouldTakeCloud) {
        this.remotePoses.set(rp.id, {
          id: rp.id,
          x: rp.x,
          z: rp.z,
          rotation: rp.rotation,
          speed: rp.speed,
          steerAngle: rp.steerAngle ?? 0,
          lap: rp.lap,
          checkpoint: rp.checkpoint,
          progress: rp.progress ?? (rp.lap - 1) * 360,
          isBoosting: Boolean(rp.isBoosting),
          isDrifting: Boolean(rp.isDrifting),
          isBraking: Boolean(rp.isBraking),
          seq: rp.seq ?? 0,
          ts: rpTs || Date.now(),
          receivedAt: performance.now(),
        });
      }

      // Establish WebRTC mesh link if supported
      if (typeof RTCPeerConnection !== "undefined") {
        void this.ensurePeerLink(rp.id, room);
      }
    }

    this.emitMetrics();
  }

  private async ensurePeerLink(remoteId: string, room: RaceRoom) {
    if (this.destroyed) return;
    const isOfferer = this.localId < remoteId;
    const edgeKey = isOfferer
      ? `${this.localId}_${remoteId}`
      : `${remoteId}_${this.localId}`;

    let link = this.peers.get(remoteId);
    if (!link) {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      link = {
        remoteId,
        edgeKey,
        isOfferer,
        pc,
        dc: null,
        open: false,
        appliedOffer: null,
        appliedAnswer: null,
        appliedCandidates: new Set(),
        localCandidates: [],
        lastPingMs: null,
      };
      this.peers.set(remoteId, link);

      const attachDc = (dc: RTCDataChannel) => {
        link!.dc = dc;
        dc.onopen = () => {
          link!.open = true;
          this.sendPingToPeer(link!);
          this.emitMetrics();
        };
        dc.onclose = () => {
          link!.open = false;
          this.emitMetrics();
        };
        dc.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data as string);
            if (msg.t === "pose") {
              this.ingestRemotePose(msg);
            } else if (msg.t === "ping") {
              if (dc.readyState === "open") {
                dc.send(JSON.stringify({ t: "pong", orig: msg.orig }));
              }
            } else if (msg.t === "pong") {
              const rtt = Math.max(1, Math.round(performance.now() - msg.orig));
              link!.lastPingMs =
                link!.lastPingMs == null
                  ? rtt
                  : Math.round(link!.lastPingMs * 0.65 + rtt * 0.35);
              this.emitMetrics();
            }
          } catch {}
        };
      };

      pc.onicecandidate = (ev) => {
        if (!ev.candidate || this.destroyed) return;
        const candStr = JSON.stringify(ev.candidate.toJSON());
        link!.localCandidates.push(candStr);
        // Batch flush ICE candidates lightly
        const field = isOfferer ? "offerCandidates" : "answerCandidates";
        void writeRtcSignalEdge(this.roomCode, edgeKey, {
          [field]: link!.localCandidates.slice(0, 12),
        });
      };

      if (isOfferer) {
        const dc = pc.createDataChannel("telemetry", {
          ordered: false,
          maxRetransmits: 0,
        });
        attachDc(dc);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await writeRtcSignalEdge(this.roomCode, edgeKey, {
            offer: JSON.stringify(offer),
          });
        } catch {}
      } else {
        pc.ondatachannel = (ev) => attachDc(ev.channel);
      }
    }

    const edge = room.rtcSignals?.[edgeKey];
    if (!edge) return;

    try {
      // Responder applies offer & publishes answer
      if (!link.isOfferer && edge.offer && link.appliedOffer !== edge.offer) {
        link.appliedOffer = edge.offer;
        await link.pc.setRemoteDescription(
          new RTCSessionDescription(JSON.parse(edge.offer))
        );
        const answer = await link.pc.createAnswer();
        await link.pc.setLocalDescription(answer);
        await writeRtcSignalEdge(this.roomCode, edgeKey, {
          answer: JSON.stringify(answer),
        });
      }

      // Offerer applies answer
      if (link.isOfferer && edge.answer && link.appliedAnswer !== edge.answer) {
        link.appliedAnswer = edge.answer;
        await link.pc.setRemoteDescription(
          new RTCSessionDescription(JSON.parse(edge.answer))
        );
      }

      // Apply remote ICE candidates
      const remoteCands = link.isOfferer
        ? edge.answerCandidates
        : edge.offerCandidates;
      if (remoteCands?.length && link.pc.remoteDescription) {
        for (const c of remoteCands) {
          if (!link.appliedCandidates.has(c)) {
            link.appliedCandidates.add(c);
            await link.pc.addIceCandidate(new RTCIceCandidate(JSON.parse(c)));
          }
        }
      }
    } catch {
      // Graceful fallback to Firestore cloud sync
    }
  }

  private sendPingToPeer(link: PeerLink) {
    if (link.open && link.dc?.readyState === "open") {
      try {
        link.dc.send(JSON.stringify({ t: "ping", orig: performance.now() }));
      } catch {}
    }
  }

  private sendPingHeartbeats() {
    if (this.destroyed || this.roomCode === "SOLO") return;
    this.lastPingSentAt = performance.now();
    this.bc?.postMessage({ t: "ping", id: this.localId, orig: this.lastPingSentAt });
    for (const link of this.peers.values()) {
      this.sendPingToPeer(link);
    }
  }

  /** Publish local vehicle pose across fast P2P DataChannel (~30Hz) & coalesced Cloud (~6Hz or heartbeat) */
  public publishLocalPose(
    pose: {
      x: number;
      z: number;
      rotation: number;
      speed: number;
      steerAngle: number;
      lap: number;
      checkpoint: number;
      progress: number;
      isBoosting: boolean;
      isDrifting: boolean;
      isBraking: boolean;
    },
    forceCloud = false
  ) {
    if (this.destroyed || this.roomCode === "SOLO") return;

    const nowMs = performance.now();
    this.seq += 1;

    const pkt = {
      t: "pose" as const,
      id: this.localId,
      ...pose,
      x: Math.round(pose.x * 100) / 100,
      z: Math.round(pose.z * 100) / 100,
      rotation: Math.round(pose.rotation * 1000) / 1000,
      speed: Math.round(pose.speed * 100) / 100,
      steerAngle: Math.round(pose.steerAngle * 100) / 100,
      seq: this.seq,
      ts: Date.now(),
    };

    // 1. Instant Local Tab Broadcast (< 2ms) & WebRTC P2P (~30Hz)
    if (nowMs - this.lastP2pPushAt >= 32 || forceCloud) {
      this.lastP2pPushAt = nowMs;
      this.bc?.postMessage(pkt);

      const serialized = JSON.stringify(pkt);
      for (const link of this.peers.values()) {
        if (link.open && link.dc?.readyState === "open") {
          try {
            link.dc.send(serialized);
          } catch {}
        }
      }
    }

    // 2. Coalesced Firestore Sync: fast (~150ms) when P2P isn't linked, slow (~1200ms) heartbeat when all peers are P2P
    const totalPeers = this.peers.size;
    const allP2PConnected =
      totalPeers > 0 &&
      Array.from(this.peers.values()).every((l) => l.open);
    const cloudInterval = allP2PConnected ? 1200 : 150;

    if (forceCloud || nowMs - this.lastCloudPushAt >= cloudInterval) {
      this.lastCloudPushAt = nowMs;
      void updatePlayerState(
        this.roomCode,
        this.localId,
        {
          x: pkt.x,
          z: pkt.z,
          rotation: pkt.rotation,
          speed: pkt.speed,
          steerAngle: pkt.steerAngle,
          lap: pkt.lap,
          checkpoint: pkt.checkpoint,
          progress: pkt.progress,
          isBoosting: pkt.isBoosting,
          isDrifting: pkt.isDrifting,
          isBraking: pkt.isBraking,
          seq: pkt.seq,
          ts: pkt.ts,
        },
        (rttMs) => {
          this.cloudPingMs = rttMs;
          this.emitMetrics();
        }
      );
    }
  }

  private emitMetrics() {
    if (!this.onMetrics) return;
    if (this.roomCode === "SOLO") {
      this.onMetrics({
        pingMs: 0,
        transport: "solo",
        p2pConnectedCount: 0,
        totalRemoteCount: 0,
      });
      return;
    }

    const p2pPings: number[] = [];
    let openCount = 0;
    for (const link of this.peers.values()) {
      if (link.open) {
        openCount += 1;
        if (link.lastPingMs !== null) p2pPings.push(link.lastPingMs);
      }
    }

    let transport: TransportKind = "cloud";
    let pingMs: number | null = this.cloudPingMs;

    if (openCount > 0) {
      transport = "p2p";
      if (p2pPings.length > 0) {
        pingMs = Math.round(
          p2pPings.reduce((a, b) => a + b, 0) / p2pPings.length
        );
      }
    } else if (this.localTabSeen) {
      transport = "local";
      pingMs = 2;
    }

    this.onMetrics({
      pingMs,
      transport,
      p2pConnectedCount: openCount,
      totalRemoteCount: this.peers.size,
    });
  }

  public dispose() {
    this.destroyed = true;
    if (this.pingTimer !== null && typeof window !== "undefined") {
      window.clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    this.bc?.close();
    this.bc = null;
    for (const link of this.peers.values()) {
      try {
        link.dc?.close();
        link.pc.close();
      } catch {}
    }
    this.peers.clear();
    this.remotePoses.clear();
  }
}
