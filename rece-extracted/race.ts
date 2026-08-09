/**
 * Chrome Circuit — multiplayer mini race backend.
 *
 * Uses Firestore room documents for real-time lobby + race state sync.
 * Falls back to localStorage when Firebase is unavailable.
 */

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import { readSessionPlayer, writeSessionPlayer, type Player } from "@/lib/arcade";

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
  lap: number;
  checkpoint: number;
  finishedAt: number | null;
  bestLap: number | null;
  connectedAt: number;
};

export type RoomSettings = {
  laps: number;
  maxPlayers: number;
};

export type RaceRoom = {
  code: string;
  hostId: string;
  phase: RacePhase;
  settings: RoomSettings;
  players: Record<string, RacePlayer>;
  countdownStartedAt?: number;
  raceStartedAt?: number;
  results?: RaceResult[];
  createdAt: number;
  updatedAt: number;
};

export type RaceResult = {
  playerId: string;
  name: string;
  handle: string;
  totalTime?: number;
  bestLap?: number;
  rank: number;
};

const COLLECTION = "raceRooms";
const LEADERBOARD = "raceLeaderboard";
const LS_ROOM = "race-room";
const LS_PLAYER = "race-player";

const COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#eab308", // yellow
  "#a855f7", // purple
  "#22c55e", // green
  "#f97316", // orange
  "#06b6d4", // cyan
  "#ec4899", // pink
];

/** Firestore rejects `undefined`; strip it recursively before writing. */
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

/** Turn raw Firestore errors into player-friendly messages. */
export function raceError(e: unknown): string {
  const code = (e as { code?: string } | null)?.code ?? "";
  const message = (e as { message?: string } | null)?.message ?? "";
  if (code.includes("permission-denied") || /insufficient permissions/i.test(message)) {
    return "Multiplayer is locked: Firestore rules don't allow the raceRooms collection yet. Add rules for raceRooms + raceLeaderboard in the Firebase console.";
  }
  if (code.includes("unavailable") || /network/i.test(message)) {
    return "Network issue — check your connection and try again.";
  }
  return message || "Something went wrong.";
}

export function randomRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function randomCarColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)] ?? "#3b82f6";
}

function readLocalRoom(): RaceRoom | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LS_ROOM);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RaceRoom;
  } catch {
    return null;
  }
}

function writeLocalRoom(room: RaceRoom) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_ROOM, JSON.stringify(room));
}

function removeLocalRoom() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS_ROOM);
}

export function getRacePlayer(): Player | null {
  return readSessionPlayer();
}

export function setRacePlayer(player: Player) {
  writeSessionPlayer(player);
}

export async function createRaceRoom(
  player: Player,
  settings: RoomSettings = { laps: 3, maxPlayers: 6 },
): Promise<RaceRoom> {
  const code = randomRoomCode();
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
        car: { color: randomCarColor() },
        x: -5,
        z: -20,
        rotation: Math.PI / 2,
        speed: 0,
        lap: 0,
        checkpoint: 0,
        finishedAt: null,
        bestLap: null,
        connectedAt: Date.now(),
      },
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  if (isFirebaseConfigured) {
    const { doc, setDoc } = await import("firebase/firestore");
    const db = await getDb();
    try {
      await setDoc(doc(db, COLLECTION, code), clean(room));
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
    const { doc, getDoc, updateDoc } = await import("firebase/firestore");
    const db = await getDb();
    let snap;
    try {
      snap = await getDoc(doc(db, COLLECTION, upper));
    } catch (e) {
      throw new Error(raceError(e));
    }
    if (!snap.exists()) throw new Error("Room not found. Check the code and try again.");
    const room = snap.data() as RaceRoom;
    if (room.phase !== "lobby") throw new Error("Race already started. Try another room.");
    const playerCount = Object.keys(room.players).length;
    if (playerCount >= room.settings.maxPlayers) throw new Error("Room is full.");

    const entry: RacePlayer = {
      id: player.id,
      name: player.name,
      handle: player.handle,
      car: { color: randomCarColor() },
      x: -5 + Math.min(playerCount, 4) * 2.2,
      z: -20,
      rotation: Math.PI / 2,
      speed: 0,
      lap: 0,
      checkpoint: 0,
      finishedAt: null,
      bestLap: null,
      connectedAt: Date.now(),
    };

    try {
      await updateDoc(doc(db, COLLECTION, upper), {
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
  if (local.phase !== "lobby") throw new Error("Race already started.");
  if (Object.keys(local.players).length >= local.settings.maxPlayers) throw new Error("Room is full.");
  const entry: RacePlayer = {
    id: player.id,
    name: player.name,
    handle: player.handle,
    car: { color: randomCarColor() },
    x: -5 + Math.min(Object.keys(local.players).length, 4) * 2.2,
    z: -20,
    rotation: Math.PI / 2,
    speed: 0,
    lap: 0,
    checkpoint: 0,
    finishedAt: null,
    bestLap: null,
    connectedAt: Date.now(),
  };
  const updated = { ...local, players: { ...local.players, [player.id]: entry }, updatedAt: Date.now() };
  writeLocalRoom(updated);
  return updated;
}

export async function leaveRaceRoom(playerId: string, code: string) {
  const upper = code.trim().toUpperCase();

  if (isFirebaseConfigured) {
    const { doc, getDoc, updateDoc, deleteDoc } = await import("firebase/firestore");
    const db = await getDb();
    const snap = await getDoc(doc(db, COLLECTION, upper));
    if (!snap.exists()) return;
    const room = snap.data() as RaceRoom;
    const players = { ...room.players };
    delete players[playerId];
    if (Object.keys(players).length === 0) {
      await deleteDoc(doc(db, COLLECTION, upper));
    } else {
      const updates: any = {
        [`players.${playerId}`]: null,
        updatedAt: Date.now(),
      };
      if (room.hostId === playerId) {
        const nextHost = Object.values(players)[0];
        if (nextHost) updates.hostId = nextHost.id;
      }
      await updateDoc(doc(db, COLLECTION, upper), updates);
    }
  } else {
    const local = readLocalRoom();
    if (!local || local.code !== upper) return;
    const players = { ...local.players };
    delete players[playerId];
    if (Object.keys(players).length === 0) {
      removeLocalRoom();
    } else {
      const nextHost = Object.values(players)[0];
      writeLocalRoom({
        ...local,
        hostId: local.hostId === playerId ? nextHost?.id ?? local.hostId : local.hostId,
        players,
        updatedAt: Date.now(),
      });
    }
  }
}

export async function startCountdown(code: string) {
  const upper = code.trim().toUpperCase();
  const now = Date.now();

  if (isFirebaseConfigured) {
    const { doc, updateDoc } = await import("firebase/firestore");
    const db = await getDb();
    await updateDoc(doc(db, COLLECTION, upper), {
      phase: "countdown",
      countdownStartedAt: now,
      updatedAt: now,
    });
  } else {
    const local = readLocalRoom();
    if (local && local.code === upper) {
      writeLocalRoom({ ...local, phase: "countdown", countdownStartedAt: now, updatedAt: now });
    }
  }
}

export async function startRace(code: string) {
  const upper = code.trim().toUpperCase();
  const now = Date.now();

  if (isFirebaseConfigured) {
    const { doc, updateDoc } = await import("firebase/firestore");
    const db = await getDb();
    await updateDoc(doc(db, COLLECTION, upper), {
      phase: "racing",
      raceStartedAt: now,
      updatedAt: now,
    });
  } else {
    const local = readLocalRoom();
    if (local && local.code === upper) {
      writeLocalRoom({ ...local, phase: "racing", raceStartedAt: now, updatedAt: now });
    }
  }
}

export async function finishRace(code: string, results: RaceResult[]) {
  const upper = code.trim().toUpperCase();
  const now = Date.now();

  if (isFirebaseConfigured) {
    const { doc, updateDoc } = await import("firebase/firestore");
    const db = await getDb();
    await updateDoc(doc(db, COLLECTION, upper), {
      phase: "finished",
      results: clean(results),
      updatedAt: now,
    });
  } else {
    const local = readLocalRoom();
    if (local && local.code === upper) {
      writeLocalRoom({ ...local, phase: "finished", results, updatedAt: now });
    }
  }
}

export async function updatePlayerState(
  code: string,
  playerId: string,
  state: Partial<RacePlayer>,
) {
  const upper = code.trim().toUpperCase();

  if (isFirebaseConfigured) {
    const { doc, updateDoc } = await import("firebase/firestore");
    const db = await getDb();
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(state)) {
      if (value === undefined) continue;
      updates[`players.${playerId}.${key}`] = clean(value);
    }
    await updateDoc(doc(db, COLLECTION, upper), updates);
  } else {
    const local = readLocalRoom();
    if (local && local.code === upper) {
      const players = { ...local.players };
      players[playerId] = { ...players[playerId]!, ...state };
      writeLocalRoom({ ...local, players, updatedAt: Date.now() });
    }
  }
}

export function subscribeRaceRoom(
  code: string,
  onRoom: (room: RaceRoom | null) => void,
): () => void {
  const upper = code.trim().toUpperCase();

  if (isFirebaseConfigured) {
    let unsub = () => {};
    (async () => {
      const { doc, onSnapshot } = await import("firebase/firestore");
      const db = await getDb();
      unsub = onSnapshot(doc(db, COLLECTION, upper), (snap) => {
        if (!snap.exists()) {
          onRoom(null);
          return;
        }
        onRoom(snap.data() as RaceRoom);
      });
    })();
    return () => unsub();
  }

  const interval = window.setInterval(() => {
    const local = readLocalRoom();
    if (!local || local.code !== upper) {
      onRoom(null);
      return;
    }
    onRoom(local);
  }, 200);
  return () => window.clearInterval(interval);
}

export async function submitRaceResult(result: {
  playerId: string;
  name: string;
  handle: string;
  totalTime: number;
  bestLap: number;
  laps: number;
}) {
  if (isFirebaseConfigured) {
    const { doc, setDoc } = await import("firebase/firestore");
    const db = await getDb();
    const id = `${result.playerId}-${Date.now()}`;
    await setDoc(doc(db, LEADERBOARD, id), {
      ...clean(result),
      createdAt: Date.now(),
    });
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
      if (!isFirebaseConfigured) return [];
      const { collection, getDocs, query, orderBy, limit } = await import("firebase/firestore");
      const db = await getDb();
      const snap = await getDocs(query(collection(db, LEADERBOARD), orderBy("bestLap", "asc"), limit(100)));
      const rows = snap.docs.map((d) => d.data() as any);
      return rows;
    },
    enabled: isFirebaseConfigured,
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
      if (remaining <= 0) {
        if (timerRef.current) window.clearInterval(timerRef.current);
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
