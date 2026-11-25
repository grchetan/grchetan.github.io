/**
 * Horizon Grand Prix — Multiplayer Netcode Backend
 * Features:
 * - Coalesced, strictly ordered Firestore state writes (zero overlapping async storms)
 * - Proper `deleteField()` player cleanup + null-entry sanitization
 * - Clean async subscription disposal (prevents leaked Firestore listeners)
 * - Accurate Firestore cloud RTT latency tracking (`cloudRttMs`)
 * - Automatic BroadcastChannel fallback for sub-2ms local multi-tab testing
 */

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import { readSessionPlayer, writeSessionPlayer, type Player } from "@/lib/arcade";
import { getStartingGridPos } from "@/components/site/race/race-physics";

export type RacePhase = "lobby" | "countdown" | "racing" | "finished";

export type RaceCar = {
  color: string;
};

export type RacePlayer = {
  id: string;
  name: string;
  handle: string;
  car: RaceCar;
  x: number;
  z: number;
  rotation: number;
  speed: number;
  steerAngle?: number | undefined;
  isBoosting?: boolean | undefined;
  isDrifting?: boolean | undefined;
  isBraking?: boolean | undefined;
  lap: number;
  checkpoint: number;
  progress?: number | undefined;
  seq?: number | undefined;
  ts?: number | undefined;
  finishedAt: number | null;
  bestLap: number | null;
  connectedAt: number;
};

export type RoomSettings = {
  laps: number;
  maxPlayers: number;
  withAI?: boolean | undefined;
};

export type RtcSignalEdge = {
  offer?: string | undefined;
  answer?: string | undefined;
  offerCandidates?: string[] | undefined;
  answerCandidates?: string[] | undefined;
  updatedAt?: number | undefined;
};

export type RaceRoom = {
  code: string;
  hostId: string;
  phase: RacePhase;
  settings: RoomSettings;
  players: Record<string, RacePlayer>;
  rtcSignals?: Record<string, RtcSignalEdge> | undefined;
  countdownStartedAt?: number | undefined;
  raceStartedAt?: number | undefined;
  results?: RaceResult[] | undefined;
  createdAt: number;
  updatedAt: number;
};

export type RaceResult = {
  playerId: string;
  name: string;
  handle: string;
  totalTime?: number | undefined;
  bestLap?: number | undefined;
  rank: number;
};

const COLLECTION = "raceRooms";
const LEADERBOARD = "raceLeaderboard";
const LS_ROOM = "race-room";

const COLORS = [
  "#38bdf8", // sky cyan
  "#f59e0b", // amber
  "#ec4899", // magenta
  "#22c55e", // emerald
  "#a855f7", // purple
  "#ef4444", // crimson
  "#f97316", // orange
  "#06b6d4", // teal
];

/** Cached Firestore handle to eliminate per-tick dynamic import latency */
let cachedFs: {
  db: Awaited<ReturnType<typeof getDb>>;
  mod: typeof import("firebase/firestore");
} | null = null;

async function getFs() {
  if (cachedFs) return cachedFs;
  const [db, mod] = await Promise.all([
    getDb(),
    import("firebase/firestore"),
  ]);
  cachedFs = { db, mod };
  return cachedFs;
}

/** Firestore rejects `undefined`; strip recursively before writing. */
function clean<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => clean(v)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = clean(v);
    }
    return out as T;
  }
  return value;
}

/** Sanitize `players` map so legacy `null` entries never crash UI */
export function sanitizeRoom(raw: RaceRoom | null | undefined): RaceRoom | null {
  if (!raw || typeof raw !== "object") return null;
  const players: Record<string, RacePlayer> = {};
  if (raw.players && typeof raw.players === "object") {
    for (const [id, p] of Object.entries(raw.players)) {
      if (p && typeof p === "object" && p.id && p.car) {
        players[id] = p;
      }
    }
  }
  return {
    ...raw,
    settings: {
      laps: raw.settings?.laps ?? 3,
      maxPlayers: raw.settings?.maxPlayers ?? 6,
      withAI: raw.settings?.withAI ?? true,
    },
    players,
  };
}

/** Extract sanitized list of valid RacePlayer objects */
export function getValidPlayers(room: RaceRoom | null | undefined): RacePlayer[] {
  if (!room?.players) return [];
  return Object.values(room.players).filter(
    (p): p is RacePlayer => Boolean(p && typeof p === "object" && p.id && p.car)
  );
}

/** Turn raw Firestore errors into player-friendly messages. */
export function raceError(e: unknown): string {
  const code = (e as { code?: string } | null)?.code ?? "";
  const message = (e as { message?: string } | null)?.message ?? "";
  if (code.includes("permission-denied") || /insufficient permissions/i.test(message)) {
    return "Multiplayer is locked: Firestore rules don't allow raceRooms yet.";
  }
  if (code.includes("unavailable") || /network/i.test(message)) {
    return "Network issue — check your connection and try again.";
  }
  return message || "Something went wrong.";
}

export function randomRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function randomCarColor(slot = 0): string {
  return COLORS[slot % COLORS.length] ?? "#38bdf8";
}

function readLocalRoom(): RaceRoom | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LS_ROOM);
  if (!raw) return null;
  try {
    return sanitizeRoom(JSON.parse(raw) as RaceRoom);
  } catch {
    return null;
  }
}

function broadcastLocalRoom(code: string) {
  if (typeof BroadcastChannel === "undefined") return;
  try {
    const ch = new BroadcastChannel(`race-room-${code}`);
    ch.postMessage({ type: "room-updated", ts: Date.now() });
    ch.close();
  } catch {}
}

function writeLocalRoom(room: RaceRoom) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_ROOM, JSON.stringify(room));
  broadcastLocalRoom(room.code);
}

function removeLocalRoom(code?: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS_ROOM);
  if (code) broadcastLocalRoom(code);
}

export function getRacePlayer(): Player | null {
  return readSessionPlayer();
}

export function setRacePlayer(player: Player) {
  writeSessionPlayer(player);
}

export async function createRaceRoom(
  player: Player,
  settings: RoomSettings = { laps: 3, maxPlayers: 6, withAI: true }
): Promise<RaceRoom> {
  const code = randomRoomCode();
  const spawn = getStartingGridPos(0);
  const room: RaceRoom = {
    code,
    hostId: player.id,
    phase: "lobby",
    settings,
    players: {
      [player.id]: {
        id: player.id,
        name: player.name,
        handle: player.handle,
        car: { color: randomCarColor(0) },
        x: spawn.x,
        z: spawn.z,
        rotation: spawn.rotation,
        speed: 0,
        lap: 1,
        checkpoint: 0,
        progress: 0,
        finishedAt: null,
        bestLap: null,
        connectedAt: Date.now(),
      },
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  if (isFirebaseConfigured) {
    const { db, mod } = await getFs();
    try {
      await mod.setDoc(mod.doc(db, COLLECTION, code), clean(room));
    } catch (e) {
      throw new Error(raceError(e));
    }
  } else {
    writeLocalRoom(room);
  }

  return room;
}

export async function joinRaceRoom(player: Player, code: string): Promise<RaceRoom> {
  const upper = code.trim().toUpperCase();

  if (isFirebaseConfigured) {
    const { db, mod } = await getFs();
    let snap;
    try {
      snap = await mod.getDoc(mod.doc(db, COLLECTION, upper));
    } catch (e) {
      throw new Error(raceError(e));
    }
    if (!snap.exists()) {
      throw new Error("Room not found. Check the code and try again.");
    }
    const room = sanitizeRoom(snap.data() as RaceRoom);
    if (!room) throw new Error("Room data corrupted.");
    if (room.phase !== "lobby" && !room.players[player.id]) {
      throw new Error("Race already started. Try another room.");
    }
    const existingPlayers = getValidPlayers(room);
    const playerCount = existingPlayers.length;
    if (playerCount >= room.settings.maxPlayers && !room.players[player.id]) {
      throw new Error("Room is full.");
    }

    const spawn = getStartingGridPos(playerCount);
    const entry: RacePlayer = room.players[player.id] ?? {
      id: player.id,
      name: player.name,
      handle: player.handle,
      car: { color: randomCarColor(playerCount) },
      x: spawn.x,
      z: spawn.z,
      rotation: spawn.rotation,
      speed: 0,
      lap: 1,
      checkpoint: 0,
      progress: 0,
      finishedAt: null,
      bestLap: null,
      connectedAt: Date.now(),
    };

    try {
      await mod.updateDoc(mod.doc(db, COLLECTION, upper), {
        [`players.${player.id}`]: clean(entry),
        updatedAt: Date.now(),
      });
    } catch (e) {
      throw new Error(raceError(e));
    }

    return { ...room, players: { ...room.players, [player.id]: entry } };
  }

  const local = readLocalRoom();
  if (!local || local.code !== upper) throw new Error("Room not found.");
  if (local.phase !== "lobby" && !local.players[player.id]) {
    throw new Error("Race already started.");
  }
  const existingPlayers = getValidPlayers(local);
  if (
    existingPlayers.length >= local.settings.maxPlayers &&
    !local.players[player.id]
  ) {
    throw new Error("Room is full.");
  }
  const spawn = getStartingGridPos(existingPlayers.length);
  const entry: RacePlayer = local.players[player.id] ?? {
    id: player.id,
    name: player.name,
    handle: player.handle,
    car: { color: randomCarColor(existingPlayers.length) },
    x: spawn.x,
    z: spawn.z,
    rotation: spawn.rotation,
    speed: 0,
    lap: 1,
    checkpoint: 0,
    progress: 0,
    finishedAt: null,
    bestLap: null,
    connectedAt: Date.now(),
  };
  const updated = {
    ...local,
    players: { ...local.players, [player.id]: entry },
    updatedAt: Date.now(),
  };
  writeLocalRoom(updated);
  return updated;
}

export async function leaveRaceRoom(playerId: string, code: string) {
  const upper = code.trim().toUpperCase();
  if (!upper || upper === "SOLO") return;

  if (isFirebaseConfigured) {
    try {
      const { db, mod } = await getFs();
      const ref = mod.doc(db, COLLECTION, upper);
      const snap = await mod.getDoc(ref);
      if (!snap.exists()) return;
      const room = sanitizeRoom(snap.data() as RaceRoom);
      if (!room) return;
      const players = { ...room.players };
      delete players[playerId];
      const remaining = Object.values(players);
      if (remaining.length === 0) {
        await mod.deleteDoc(ref);
      } else {
        const updates: Record<string, unknown> = {
          [`players.${playerId}`]: mod.deleteField(),
          updatedAt: Date.now(),
        };
        if (room.hostId === playerId && remaining[0]) {
          updates["hostId"] = remaining[0].id;
        }
        await mod.updateDoc(ref, updates);
      }
    } catch {
      // Ignore network leave error on cleanup
    }
  } else {
    const local = readLocalRoom();
    if (!local || local.code !== upper) return;
    const players = { ...local.players };
    delete players[playerId];
    const remaining = Object.values(players);
    if (remaining.length === 0) {
      removeLocalRoom(upper);
    } else {
      writeLocalRoom({
        ...local,
        hostId:
          local.hostId === playerId
            ? (remaining[0]?.id ?? local.hostId)
            : local.hostId,
        players,
        updatedAt: Date.now(),
      });
    }
  }
}

export async function updateRoomSettings(
  code: string,
  settings: Partial<RoomSettings>
) {
  const upper = code.trim().toUpperCase();
  const now = Date.now();
  if (isFirebaseConfigured) {
    const { db, mod } = await getFs();
    const updates: Record<string, unknown> = { updatedAt: now };
    if (settings.laps !== undefined) updates["settings.laps"] = settings.laps;
    if (settings.withAI !== undefined)
      updates["settings.withAI"] = settings.withAI;
    if (settings.maxPlayers !== undefined)
      updates["settings.maxPlayers"] = settings.maxPlayers;
    await mod.updateDoc(mod.doc(db, COLLECTION, upper), updates);
  } else {
    const local = readLocalRoom();
    if (local && local.code === upper) {
      writeLocalRoom({
        ...local,
        settings: { ...local.settings, ...settings },
        updatedAt: now,
      });
    }
  }
}

export async function startCountdown(code: string) {
  const upper = code.trim().toUpperCase();
  const now = Date.now();

  if (isFirebaseConfigured) {
    const { db, mod } = await getFs();
    await mod.updateDoc(mod.doc(db, COLLECTION, upper), {
      phase: "countdown",
      countdownStartedAt: now,
      updatedAt: now,
    });
  } else {
    const local = readLocalRoom();
    if (local && local.code === upper) {
      writeLocalRoom({
        ...local,
        phase: "countdown",
        countdownStartedAt: now,
        updatedAt: now,
      });
    }
  }
}

export async function startRace(code: string) {
  const upper = code.trim().toUpperCase();
  const now = Date.now();

  if (isFirebaseConfigured) {
    const { db, mod } = await getFs();
    await mod.updateDoc(mod.doc(db, COLLECTION, upper), {
      phase: "racing",
      raceStartedAt: now,
      updatedAt: now,
    });
  } else {
    const local = readLocalRoom();
    if (local && local.code === upper) {
      writeLocalRoom({
        ...local,
        phase: "racing",
        raceStartedAt: now,
        updatedAt: now,
      });
    }
  }
}

export async function finishRace(code: string, results: RaceResult[]) {
  const upper = code.trim().toUpperCase();
  const now = Date.now();

  if (isFirebaseConfigured) {
    const { db, mod } = await getFs();
    await mod.updateDoc(mod.doc(db, COLLECTION, upper), {
      phase: "finished",
      results: clean(results),
      updatedAt: now,
    });
  } else {
    const local = readLocalRoom();
    if (local && local.code === upper) {
      writeLocalRoom({
        ...local,
        phase: "finished",
        results,
        updatedAt: now,
      });
    }
  }
}

/** Measure true Firestore Cloud RTT in ms (used in Lobby before race starts) */
export async function probeCloudPingMs(code?: string): Promise<number> {
  if (!isFirebaseConfigured) return 1;
  const start = performance.now();
  try {
    const { db, mod } = await getFs();
    if (code && code !== "SOLO") {
      await mod.getDocFromServer(mod.doc(db, COLLECTION, code.trim().toUpperCase()));
    } else {
      await mod.getDocsFromServer(
        mod.query(mod.collection(db, LEADERBOARD), mod.limit(1))
      );
    }
    return Math.max(1, Math.round(performance.now() - start));
  } catch {
    return Math.max(1, Math.round(performance.now() - start));
  }
}

/** Per-player coalescing Firestore writer — guarantees max 1 in-flight write */
const syncQueues = new Map<
  string,
  {
    inFlight: boolean;
    pending: Partial<RacePlayer> | null;
    lastRttMs: number | null;
  }
>();

export function getLastCloudRttMs(code: string, playerId: string): number | null {
  return syncQueues.get(`${code}:${playerId}`)?.lastRttMs ?? null;
}

export async function updatePlayerState(
  code: string,
  playerId: string,
  state: Partial<RacePlayer>,
  onRttSample?: (ms: number) => void
) {
  const upper = code.trim().toUpperCase();
  if (!upper || upper === "SOLO") return;

  if (!isFirebaseConfigured) {
    const local = readLocalRoom();
    if (local && local.code === upper && local.players[playerId]) {
      const players = { ...local.players };
      players[playerId] = { ...players[playerId]!, ...state };
      writeLocalRoom({ ...local, players, updatedAt: Date.now() });
      onRttSample?.(1);
    }
    return;
  }

  const qKey = `${upper}:${playerId}`;
  let entry = syncQueues.get(qKey);
  if (!entry) {
    entry = { inFlight: false, pending: null, lastRttMs: null };
    syncQueues.set(qKey, entry);
  }

  // Coalesce latest state if a Firestore write is currently in flight
  if (entry.inFlight) {
    entry.pending = { ...(entry.pending ?? {}), ...state };
    return;
  }

  const flush = async (payload: Partial<RacePlayer>) => {
    entry!.inFlight = true;
    const t0 = performance.now();
    try {
      const { db, mod } = await getFs();
      const updates: Record<string, unknown> = { updatedAt: Date.now() };
      for (const [key, value] of Object.entries(payload)) {
        if (value === undefined) continue;
        updates[`players.${playerId}.${key}`] = clean(value);
      }
      await mod.updateDoc(mod.doc(db, COLLECTION, upper), updates);
      const rtt = Math.max(1, Math.round(performance.now() - t0));
      entry!.lastRttMs = rtt;
      onRttSample?.(rtt);
    } catch {
      // Drop transient frame sync error gracefully
    } finally {
      entry!.inFlight = false;
      const nextPayload = entry!.pending;
      entry!.pending = null;
      if (nextPayload) {
        void flush(nextPayload);
      }
    }
  };

  void flush(state);
}

/** Update WebRTC signal edge stored cleanly on the room document */
export async function writeRtcSignalEdge(
  code: string,
  edgeKey: string,
  patch: Partial<RtcSignalEdge>
) {
  const upper = code.trim().toUpperCase();
  if (!isFirebaseConfigured || !upper || upper === "SOLO") return;
  try {
    const { db, mod } = await getFs();
    const updates: Record<string, unknown> = {
      [`rtcSignals.${edgeKey}.updatedAt`]: Date.now(),
    };
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) continue;
      updates[`rtcSignals.${edgeKey}.${k}`] = clean(v);
    }
    await mod.updateDoc(mod.doc(db, COLLECTION, upper), updates);
  } catch {
    // Non-fatal if signaling fails; cloud sync continues automatically
  }
}

export function subscribeRaceRoom(
  code: string,
  onRoom: (room: RaceRoom | null) => void
): () => void {
  const upper = code.trim().toUpperCase();
  let disposed = false;

  if (isFirebaseConfigured) {
    let unsub: (() => void) | null = null;
    (async () => {
      try {
        const { db, mod } = await getFs();
        if (disposed) return;
        unsub = mod.onSnapshot(mod.doc(db, COLLECTION, upper), (snap) => {
          if (disposed) return;
          if (!snap.exists()) {
            onRoom(null);
            return;
          }
          onRoom(sanitizeRoom(snap.data() as RaceRoom));
        });
      } catch {
        if (!disposed) onRoom(null);
      }
    })();
    return () => {
      disposed = true;
      unsub?.();
    };
  }

  let bc: BroadcastChannel | null = null;
  const emitLocal = () => {
    if (disposed) return;
    const local = readLocalRoom();
    if (!local || local.code !== upper) {
      onRoom(null);
      return;
    }
    onRoom(local);
  };

  if (typeof BroadcastChannel !== "undefined") {
    try {
      bc = new BroadcastChannel(`race-room-${upper}`);
      bc.onmessage = emitLocal;
    } catch {}
  }

  const interval = window.setInterval(emitLocal, 120);
  emitLocal();

  return () => {
    disposed = true;
    bc?.close();
    window.clearInterval(interval);
  };
}

const LS_LEADERBOARD = "race-leaderboard-local";

function readLocalRaceResults(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_LEADERBOARD);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalRaceResult(result: any) {
  if (typeof window === "undefined") return;
  try {
    const list = readLocalRaceResults();
    list.unshift({ ...result, createdAt: Date.now() });
    localStorage.setItem(LS_LEADERBOARD, JSON.stringify(list.slice(0, 50)));
  } catch {}
}

export async function submitRaceResult(result: {
  playerId: string;
  name: string;
  handle: string;
  totalTime: number;
  bestLap: number;
  laps: number;
}) {
  saveLocalRaceResult(result);
  if (isFirebaseConfigured) {
    try {
      const { db, mod } = await getFs();
      const id = `${result.playerId}-${Date.now()}`;
      await mod.setDoc(mod.doc(db, LEADERBOARD, id), {
        ...clean(result),
        createdAt: Date.now(),
      });
    } catch (e) {
      console.warn("[Firebase submitRaceResult]:", e);
    }
  }
}

export function useRaceRoom(code: string | undefined) {
  const [room, setRoom] = useState<RaceRoom | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) {
      setRoom(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeRaceRoom(code, (r) => {
      setRoom(r);
      setLoading(false);
    });
    return unsub;
  }, [code]);

  return { room, loading };
}

export function useGlobalRaceLeaderboard() {
  return useQuery({
    queryKey: ["race", "leaderboard"],
    queryFn: async () => {
      const local = readLocalRaceResults();
      if (!isFirebaseConfigured) return local;
      try {
        const { db, mod } = await getFs();
        const snap = await mod.getDocs(
          mod.query(
            mod.collection(db, LEADERBOARD),
            mod.orderBy("bestLap", "asc"),
            mod.limit(100)
          )
        );
        const remote = snap.docs.map((d) => d.data() as any);
        const remoteIds = new Set(remote.map((r) => r.playerId));
        const merged = [...remote];
        for (const l of local) {
          if (!remoteIds.has(l.playerId)) {
            merged.push(l);
          }
        }
        return merged.sort(
          (a, b) => (a.bestLap ?? Infinity) - (b.bestLap ?? Infinity)
        );
      } catch (e) {
        console.warn("[Firebase useGlobalRaceLeaderboard]:", e);
        return local;
      }
    },
    staleTime: 5000,
  });
}

export function useCountdown(room: RaceRoom | null) {
  const [count, setCount] = useState(3);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!room || room.phase !== "countdown" || !room.countdownStartedAt) {
      setCount(3);
      return;
    }

    const tick = () => {
      const elapsed = Date.now() - room.countdownStartedAt!;
      const remaining = Math.max(0, 3000 - elapsed);
      const display = Math.ceil(remaining / 1000);
      setCount(display);
      if (remaining <= 0 && timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };

    tick();
    timerRef.current = window.setInterval(tick, 100);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [room]);

  return count;
}
