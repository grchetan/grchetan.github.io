/**
 * Arcade backend — "Signal Rush" players, scores and leaderboard.
 *
 * Uses Firestore when Firebase is configured (collections `arcadePlayers`
 * and `arcadeScores`); otherwise everything falls back to localStorage so the
 * game is fully playable in preview / demo mode.
 */

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import { isProfane, sanitizeName } from "@/lib/profanity";

const PLAYERS = "players";
const SCORES = "scores";
const LS_PLAYER = "arcade-player";
const LS_STORE = "arcade-store";

let lastFirebaseError: string | null = null;
export function getLastFirebaseError() { return lastFirebaseError; }
export function setLastFirebaseError(err: string | null) { lastFirebaseError = err; }

export type Player = {
  id: string;
  name: string;
  handle: string;
  createdAt: number;
  /** Secret access code — shown once at creation, then used to resume. */
  code?: string;
};

export type ScoreRow = {
  id: string;
  playerId: string;
  name: string;
  handle: string;
  score: number;
  accuracy: number;
  combo: number;
  createdAt: number;
};

export type RankedRow = ScoreRow & { rank: number; plays: number };

export const MAX_NAME = 22;
export const MIN_NAME = 2;

/** Trim + collapse whitespace, strip anything that isn't a sane name char. */
export function cleanName(raw: string) {
  return raw
    .replace(/[^\p{L}\p{N} .'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME);
}

export const DEFAULT_FORBIDDEN_WORDS = [
  "admin",
  "mod",
  "moderator",
  "system",
  "staff",
  "hack",
  "hacker",
  "fuck",
  "fucker",
  "fucking",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "dick",
  "pussy",
  "cunt",
  "slut",
  "whore",
  "nigga",
  "nigger",
  "mc",
  "bc",
  "bsdk",
  "gandu",
  "gaand",
  "gand",
  "madarchod",
  "bhenchod",
  "behenchod",
  "chutiya",
  "chutya",
  "harami",
  "haramkhor",
  "lodu",
  "loda",
  "lauda",
  "lund",
  "saala",
  "saali",
  "kamina",
  "nazi",
  "hitler",
  "bhosdike",
  "bhosdi",
  "randi",
  "raand",
  "terrorist",
];

export function containsProfanity(name: string, customWords?: string[]): boolean {
  return isProfane(name);
}

export function validateName(raw: string, customWords?: string[]): string | null {
  const name = cleanName(raw);
  if (name.length < MIN_NAME) return `Name needs at least ${MIN_NAME} characters.`;
  if (name.length > MAX_NAME) return `Keep the name under ${MAX_NAME} characters.`;
  if (containsProfanity(name, customWords)) {
    return "Profanity or offensive names are not allowed! Please choose a respectful player name.";
  }
  return null;
}

export function validateScore(run: { score: number; accuracy: number; combo: number }): boolean {
  if (typeof run.score !== "number" || isNaN(run.score) || run.score < 0) return false;
  if (typeof run.accuracy !== "number" || isNaN(run.accuracy) || run.accuracy < 0 || run.accuracy > 100) return false;
  if (typeof run.combo !== "number" || isNaN(run.combo) || run.combo < 0 || run.combo > 12) return false;
  // Anti-Cheat Hard Cap: A 45-second round score cannot mathematically exceed 25,000 points.
  if (run.score > 25000) return false;
  return true;
}

function makeHandle(name: string) {
  const slug =
    cleanName(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 12) || "player";
  return `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/** Case/space-insensitive key used to keep one name = one player. */
export function nameKey(name: string) {
  return cleanName(name).toLowerCase().replace(/\s+/g, " ");
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Secret code like `CP-7K4M-9QX2` — the player's only key back into their ID. */
function makeCode() {
  const block = (n: number) =>
    Array.from({ length: n }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");
  return `CP-${block(4)}-${block(4)}`;
}

/** Normalises whatever the player pastes into the resume field. */
export function cleanCode(raw: string) {
  const body = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/^CP/, "")
    .slice(0, 8);
  if (!body) return "";
  return body.length > 4 ? `CP-${body.slice(0, 4)}-${body.slice(4)}` : `CP-${body}`;
}

export function isCompleteCode(raw: string) {
  return /^CP-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cleanCode(raw));
}

/* ------------------------------- local store ------------------------------ */

type LocalStore = { players: Player[]; scores: ScoreRow[] };

function readLocal(): LocalStore {
  if (typeof localStorage === "undefined") return { players: [], scores: [] };
  try {
    const raw = localStorage.getItem(LS_STORE);
    const parsed = raw ? (JSON.parse(raw) as LocalStore) : null;
    return { players: parsed?.players ?? [], scores: parsed?.scores ?? [] };
  } catch {
    return { players: [], scores: [] };
  }
}

function writeLocal(store: LocalStore) {
  try {
    localStorage.setItem(LS_STORE, JSON.stringify(store));
  } catch {
    /* ignore quota errors */
  }
}

/* ------------------------------ session player ---------------------------- */

export function readSessionPlayer(): Player | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_PLAYER);
    return raw ? (JSON.parse(raw) as Player) : null;
  } catch {
    return null;
  }
}

export function writeSessionPlayer(player: Player | null) {
  try {
    if (player) localStorage.setItem(LS_PLAYER, JSON.stringify(player));
    else localStorage.removeItem(LS_PLAYER);
  } catch {
    /* ignore */
  }
}

/* --------------------------------- writes --------------------------------- */

export class NameTakenError extends Error {
  constructor(name: string) {
    super(`"${name}" is already claimed. Pick another name, or enter that player's ID to continue.`);
    this.name = "NameTakenError";
  }
}

/**
 * Claims a name — one name = one player, forever. The returned `code` is the
 * player's secret ID and is shown exactly once; nobody can claim the same name
 * again, so no one else can play on this player's board entry.
 */
export async function createPlayer(rawName: string): Promise<Player> {
  const problem = validateName(rawName);
  if (problem) throw new Error(problem);
  const name = cleanName(rawName);
  const key = nameKey(name);
  const handle = makeHandle(name);
  const createdAt = Date.now();
  const code = makeCode();

  if (isFirebaseConfigured) {
    try {
      const db = await getDb();
      const { doc, getDoc, setDoc, serverTimestamp } = await import("firebase/firestore");
      const ref = doc(db, PLAYERS, key);
      const existing = await getDoc(ref);
      if (existing.exists()) throw new NameTakenError(name);
      await setDoc(ref, {
        name,
        nameKey: key,
        handle,
        code,
        best: 0,
        plays: 0,
        createdAt: serverTimestamp(),
      });
      const player: Player = { id: ref.id, name, handle, createdAt, code };
      writeSessionPlayer(player);
      return player;
    } catch (err) {
      if (err instanceof NameTakenError) throw err;
      console.error("[Firebase createPlayer Error]:", err);
      setLastFirebaseError(err instanceof Error ? err.message : String(err));
      /* network/permission issue — fall through to local */
    }
  }

  const store = readLocal();
  if (store.players.some((p) => nameKey(p.name) === key)) throw new NameTakenError(name);
  const player: Player = { id: `local-${key}`, name, handle, createdAt, code };
  store.players.push(player);
  writeLocal(store);
  writeSessionPlayer(player);
  return player;
}

/** Resumes an existing player from their secret code. */
export async function resumePlayer(rawCode: string): Promise<Player> {
  const code = cleanCode(rawCode);
  if (!isCompleteCode(code)) throw new Error("That ID doesn't look right — format is CP-XXXX-XXXX.");

  if (isFirebaseConfigured) {
    try {
      const db = await getDb();
      const { collection, getDocs, query, where, limit } = await import("firebase/firestore");
      const snap = await getDocs(query(collection(db, PLAYERS), where("code", "==", code), limit(1)));
      const found = snap.docs[0];
      if (found) {
        const raw = found.data() as Record<string, unknown>;
        const player: Player = {
          id: found.id,
          name: (raw["name"] as string) || "Player",
          handle: (raw["handle"] as string) || "player",
          createdAt: Date.now(),
          code,
        };
        writeSessionPlayer(player);
        return player;
      }
    } catch (err) {
      console.error("[Firebase resumePlayer Error]:", err);
      setLastFirebaseError(err instanceof Error ? err.message : String(err));
      /* fall through to local lookup */
    }
  }

  const local = readLocal().players.find((p) => p.code === code);
  if (!local) throw new Error("No player found for that ID. Check the code and try again.");
  writeSessionPlayer(local);
  return local;
}


/** Saves one finished run. */
export async function submitScore(input: {
  player: Player;
  score: number;
  accuracy: number;
  combo: number;
}): Promise<void> {
  const { player } = input;
  const score = Math.max(0, Math.round(input.score));
  const accuracy = Math.max(0, Math.min(100, Math.round(input.accuracy)));
  const combo = Math.max(0, Math.round(input.combo));

  if (!validateScore({ score, accuracy, combo })) {
    console.warn("[Anti-Cheat] Score submission rejected due to invalid score values:", { score, accuracy, combo });
    throw new Error("Score submission rejected by Anti-Cheat verification.");
  }

  const createdAt = Date.now();

  // Always save to local store as instant backup
  const store = readLocal();
  store.scores.push({
    id: `s-${createdAt}-${Math.random().toString(36).slice(2, 7)}`,
    playerId: player.id,
    name: player.name,
    handle: player.handle,
    score,
    accuracy,
    combo,
    createdAt,
  });
  if (!store.players.some((p) => p.id === player.id)) store.players.push(player);
  writeLocal(store);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("arcade:scores"));

  if (isFirebaseConfigured) {
    try {
      const db = await getDb();
      const { collection, addDoc, doc, getDoc, updateDoc, setDoc, serverTimestamp } = await import("firebase/firestore");
      await addDoc(collection(db, SCORES), {
        playerId: player.id,
        name: player.name,
        handle: player.handle,
        score,
        accuracy,
        combo,
        createdAt: serverTimestamp(),
      });
      const pRef = doc(db, PLAYERS, player.id.startsWith("local-") ? player.id.replace("local-", "") : player.id);
      const snap = await getDoc(pRef);
      if (snap.exists()) {
        const prev = (snap.data()?.["best"] as number | undefined) ?? 0;
        const plays = ((snap.data()?.["plays"] as number | undefined) ?? 0) + 1;
        await updateDoc(pRef, { best: Math.max(prev, score), plays, lastPlayedAt: serverTimestamp() });
      } else {
        await setDoc(pRef, {
          name: player.name,
          handle: player.handle,
          best: score,
          plays: 1,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.warn("[Arcade Firestore Write Failed - local backup active]:", err);
    }
  }
}


/* --------------------------------- reads ---------------------------------- */

/** One row per player (their best run), ranked A→Z by rank, top 100. */
export function rank(rows: ScoreRow[]): RankedRow[] {
  const best = new Map<string, { row: ScoreRow; plays: number }>();
  for (const row of rows) {
    const found = best.get(row.playerId);
    if (!found) best.set(row.playerId, { row, plays: 1 });
    else {
      found.plays += 1;
      const better =
        row.score > found.row.score ||
        (row.score === found.row.score && row.createdAt < found.row.createdAt);
      if (better) found.row = row;
    }
  }
  return [...best.values()]
    .sort((a, b) =>
      b.row.score - a.row.score ||
      b.row.accuracy - a.row.accuracy ||
      a.row.createdAt - b.row.createdAt,
    )
    .slice(0, 100)
    .map((entry, i) => ({
      ...entry.row,
      name: sanitizeName(entry.row.name),
      plays: entry.plays,
      rank: i + 1,
    }));
}

/**
 * Re-rank an already-filtered subset of RankedRows so that rank #1 is
 * the top scorer within the subset, not the global rank.
 */
export function reRankFiltered(rows: RankedRow[]): RankedRow[] {
  return rows
    .slice()
    .sort((a, b) => b.score - a.score || b.accuracy - a.accuracy || a.createdAt - b.createdAt)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

function mergeRawScores(remoteRows: ScoreRow[], localRows: ScoreRow[]): ScoreRow[] {
  // Start with local rows as a base
  const map = new Map<string, ScoreRow>();
  for (const l of localRows) {
    map.set(l.id, l);
  }
  // Remote rows overwrite local for same doc ID (Firestore is source of truth)
  for (const r of remoteRows) {
    map.set(r.id, r);
  }
  return Array.from(map.values());
}

export async function fetchLeaderboard(): Promise<ScoreRow[]> {
  const localRows = readLocal().scores;
  if (isFirebaseConfigured) {
    try {
      const db = await getDb();
      const { collection, getDocs, query, orderBy, limit, doc, setDoc } = await import("firebase/firestore");
      const snap = await getDocs(query(collection(db, SCORES), orderBy("score", "desc"), limit(600)));
      const remoteRows: ScoreRow[] = snap.docs.map((d) => {
        const raw = d.data() as Record<string, unknown>;
        const ts = raw["createdAt"] as { toMillis?: () => number } | undefined;
        return {
          id: d.id,
          playerId: (raw["playerId"] as string) || d.id,
          name: sanitizeName((raw["name"] as string) || "Anonymous"),
          handle: (raw["handle"] as string) || "player",
          score: Number(raw["score"] ?? 0),
          accuracy: Number(raw["accuracy"] ?? 0),
          combo: Number(raw["combo"] ?? 0),
          createdAt: ts?.toMillis?.() ?? Date.now(),
        };
      });

      // Background Sync: Upload local offline scores to Firestore
      const remoteIds = new Set(remoteRows.map((r) => r.id));
      for (const local of localRows) {
        if (!remoteIds.has(local.id)) {
          try {
            await setDoc(doc(db, SCORES, local.id), {
              playerId: local.playerId,
              name: local.name,
              handle: local.handle,
              score: local.score,
              accuracy: local.accuracy,
              combo: local.combo,
              createdAt: new Date(local.createdAt),
            });
            const pId = local.playerId.startsWith("local-") ? local.playerId.replace("local-", "") : local.playerId;
            await setDoc(doc(db, PLAYERS, pId), {
              name: local.name,
              handle: local.handle,
              best: local.score,
              plays: 1,
              createdAt: new Date(local.createdAt),
            }, { merge: true });
          } catch (syncErr) {
            console.warn("[Offline score sync failed]:", syncErr);
          }
        }
      }

      return mergeRawScores(remoteRows, localRows);
    } catch (err) {
      console.error("[Firebase fetchLeaderboard Error]:", err);
      setLastFirebaseError(err instanceof Error ? err.message : String(err));
      /* fall through */
    }
  }
  return localRows;
}

/**
 * Live leaderboard stream. Uses Firestore `onSnapshot` when configured, and
 * falls back to local storage events + light polling in demo mode.
 * Returns an unsubscribe function.
 */
export function subscribeLeaderboard(onRows: (rows: ScoreRow[]) => void): () => void {
  let stop: (() => void) | null = null;
  let cancelled = false;

  if (isFirebaseConfigured) {
    void (async () => {
      try {
        const db = await getDb();
        const { collection, onSnapshot, query, orderBy, limit } = await import("firebase/firestore");
        if (cancelled) return;
        stop = onSnapshot(
          query(collection(db, SCORES), orderBy("score", "desc"), limit(600)),
          (snap) => {
            const remoteRows: ScoreRow[] = snap.docs.map((d) => {
              const raw = d.data() as Record<string, unknown>;
              const ts = raw["createdAt"] as { toMillis?: () => number } | undefined;
              return {
                id: d.id,
                playerId: (raw["playerId"] as string) || d.id,
                name: sanitizeName((raw["name"] as string) || "Anonymous"),
                handle: (raw["handle"] as string) || "player",
                score: Number(raw["score"] ?? 0),
                accuracy: Number(raw["accuracy"] ?? 0),
                combo: Number(raw["combo"] ?? 0),
                createdAt: ts?.toMillis?.() ?? Date.now(),
              };
            });
            onRows(mergeRawScores(remoteRows, readLocal().scores));
          },
          (err) => {
            console.error("[Firebase subscribeLeaderboard Snapshot Error]:", err);
            setLastFirebaseError(err.message);
            onRows(readLocal().scores);
          },
        );
      } catch (err) {
        console.error("[Firebase subscribeLeaderboard Init Error]:", err);
        setLastFirebaseError(err instanceof Error ? err.message : String(err));
        /* fall through to local mode below */
      }
    })();
  }

  const pushLocal = () => onRows(readLocal().scores);
  const onEvt = () => pushLocal();
  if (typeof window !== "undefined") {
    window.addEventListener("arcade:scores", onEvt);
    window.addEventListener("storage", onEvt);
  }
  const timer = isFirebaseConfigured ? null : setInterval(pushLocal, 6_000);

  return () => {
    cancelled = true;
    stop?.();
    if (timer) clearInterval(timer);
    if (typeof window !== "undefined") {
      window.removeEventListener("arcade:scores", onEvt);
      window.removeEventListener("storage", onEvt);
    }
  };
}

export function useLeaderboard() {
  const queryClient = useQueryClient();
  const result = useQuery({
    queryKey: ["arcade", "leaderboard"],
    queryFn: fetchLeaderboard,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    return subscribeLeaderboard((rows) => {
      queryClient.setQueryData<ScoreRow[]>(["arcade", "leaderboard"], rows);
    });
  }, [queryClient]);

  return result;
}

export function usePlayersCodes() {
  return useQuery({
    queryKey: ["arcade", "players-codes"],
    queryFn: async () => {
      if (!isFirebaseConfigured) {
        const localPlayers = readLocal().players;
        const map = new Map<string, string>();
        for (const p of localPlayers) {
          map.set(p.id, p.code);
        }
        return map;
      }
      try {
        const db = await getDb();
        const { collection, getDocs } = await import("firebase/firestore");
        const snap = await getDocs(collection(db, PLAYERS));
        const map = new Map<string, string>();
        snap.docs.forEach((d) => {
          const raw = d.data();
          if (raw["code"]) {
            map.set(d.id, raw["code"] as string);
          }
        });
        return map;
      } catch (err) {
        console.error("[usePlayersCodes Error]:", err);
        return new Map<string, string>();
      }
    },
    staleTime: 60 * 1000,
  });
}

/** Certificate tier for a rank — automatic, top 100 only. */
export function tierFor(rank: number) {
  if (rank === 1) return { label: "Champion", note: "1st place" } as const;
  if (rank === 2) return { label: "Runner-up", note: "2nd place" } as const;
  if (rank === 3) return { label: "Third place", note: "3rd place" } as const;
  if (rank <= 10) return { label: "Top 10", note: `Rank #${rank}` } as const;
  if (rank <= 50) return { label: "Top 50", note: `Rank #${rank}` } as const;
  if (rank <= 100) return { label: "Top 100", note: `Rank #${rank}` } as const;
  return null;
}

/* ------------------------------- Arcade Config & Anti-Cheat ------------------------------- */

export type ArcadeAnnouncement = {
  active: boolean;
  title: string;
  message: string;
  dateText?: string | undefined;
};

export type ArcadeContest = {
  id: string;
  version: string;
  title: string;
  description?: string | undefined;
  startAt: number;
  endAt: number;
  active: boolean;
  registrations?: string[] | undefined;
};

export type ContestWinner = {
  rank: number;
  name: string;
  handle: string;
  score: number;
  accuracy: number;
};

export type ContestResultArchive = {
  version: string;
  title: string;
  endedAt: number;
  totalRegistrations: number;
  winners: ContestWinner[];
};

export type ArcadeConfig = {
  mode: ArcadeMode;
  timerEndAt?: number | undefined;
  offlineMessage?: string | undefined;
  bannedPlayers?: string[] | undefined;
  forbiddenWords?: string[] | undefined;
  weeklyResetAt?: number | undefined;
  announcement?: ArcadeAnnouncement | undefined;
  contest?: ArcadeContest | undefined;
  contestArchives?: ContestResultArchive[] | undefined;
};

export const defaultArcadeConfig: ArcadeConfig = {
  mode: "always_on",
  offlineMessage: "The Arcade has been temporarily closed by the administrator. Please check back later!",
  bannedPlayers: [],
  forbiddenWords: DEFAULT_FORBIDDEN_WORDS,
  weeklyResetAt: 0,
  announcement: {
    active: false,
    title: "Upcoming Contest!",
    message: "Get ready for the next Signal Rush Tournament version v1.0!",
    dateText: "This Weekend @ 8:00 PM",
  },
  contest: {
    id: "contest-v1",
    version: "v1.0",
    title: "Signal Rush Championship v1.0",
    description: "Compete against top players for the v1.0 Gold Crown!",
    startAt: Date.now(),
    endAt: Date.now() + 7 * 86400 * 1000,
    active: false,
    registrations: [],
  },
};

const LS_CONFIG = "arcade-config";
const CONFIG_DOC = "arcadeConfig";

export function ensureConfigDefaults(config: ArcadeConfig): ArcadeConfig {
  const words = Array.isArray(config.forbiddenWords) && config.forbiddenWords.length > 0
    ? config.forbiddenWords
    : DEFAULT_FORBIDDEN_WORDS;

  // Only merge local registrations if the local stored version matches the incoming version
  // This prevents old version registrations from polluting new contest version counts
  let localRegs: string[] = [];
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem("arcade-config");
      if (raw) {
        const parsed = JSON.parse(raw) as ArcadeConfig;
        const localVersion = parsed?.contest?.version;
        const incomingVersion = config.contest?.version;
        // Only carry over local regs if same version
        if (
          localVersion &&
          incomingVersion &&
          localVersion === incomingVersion &&
          Array.isArray(parsed?.contest?.registrations)
        ) {
          localRegs = parsed.contest.registrations;
        }
      }
    } catch {
      /* ignore */
    }
  }

  const incomingRegs = Array.isArray(config.contest?.registrations) ? config.contest!.registrations! : [];
  const mergedRegs = Array.from(new Set([...incomingRegs, ...localRegs]));

  const contest = config.contest
    ? {
        ...defaultArcadeConfig.contest!,
        ...config.contest,
        registrations: mergedRegs,
      }
    : defaultArcadeConfig.contest;

  const announcement = config.announcement
    ? { ...defaultArcadeConfig.announcement!, ...config.announcement }
    : defaultArcadeConfig.announcement;

  const contestArchives = Array.isArray(config.contestArchives) ? config.contestArchives : [];

  const weeklyResetAt = typeof config.weeklyResetAt === "number" && config.weeklyResetAt > Date.now()
    ? 0
    : config.weeklyResetAt ?? 0;

  return {
    ...defaultArcadeConfig,
    ...config,
    weeklyResetAt,
    forbiddenWords: words,
    contest,
    announcement,
    contestArchives,
  };
}

export function readLocalConfig(): ArcadeConfig {
  if (typeof localStorage === "undefined") return defaultArcadeConfig;
  try {
    const raw = localStorage.getItem(LS_CONFIG);
    return raw ? ensureConfigDefaults(JSON.parse(raw) as ArcadeConfig) : defaultArcadeConfig;
  } catch {
    return defaultArcadeConfig;
  }
}

export function writeLocalConfig(config: ArcadeConfig) {
  try {
    localStorage.setItem(LS_CONFIG, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

export async function fetchArcadeConfig(): Promise<ArcadeConfig> {
  const local = readLocalConfig();
  if (!isFirebaseConfigured) return local;
  try {
    const db = await getDb();
    const { doc, getDoc } = await import("firebase/firestore");
    const snap = await getDoc(doc(db, "site", CONFIG_DOC));
    if (snap.exists()) {
      const data = ensureConfigDefaults(snap.data() as ArcadeConfig);
      writeLocalConfig(data);
      return data;
    }
  } catch (err) {
    console.error("[Firebase fetchArcadeConfig Error]:", err);
    setLastFirebaseError(err instanceof Error ? err.message : String(err));
    /* fall back to local */
  }
  return local;
}

export async function updateArcadeConfig(config: ArcadeConfig): Promise<void> {
  const safeConfig = ensureConfigDefaults(config);
  writeLocalConfig(safeConfig);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("arcade:config"));
  if (isFirebaseConfigured) {
    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "site", CONFIG_DOC), safeConfig);
    } catch (err) {
      console.warn("[Arcade Config Update Failed]:", err);
    }
  }
}

export function subscribeArcadeConfig(onConfig: (cfg: ArcadeConfig) => void): () => void {
  let stop: (() => void) | null = null;
  let cancelled = false;

  if (isFirebaseConfigured) {
    void (async () => {
      try {
        const db = await getDb();
        const { doc, onSnapshot } = await import("firebase/firestore");
        if (cancelled) return;
        stop = onSnapshot(doc(db, "site", CONFIG_DOC), (snap) => {
          if (snap.exists()) {
            const data = ensureConfigDefaults(snap.data() as ArcadeConfig);
            writeLocalConfig(data);
            onConfig(data);
          }
        });
      } catch (err) {
        console.error("[Firebase subscribeArcadeConfig Error]:", err);
        setLastFirebaseError(err instanceof Error ? err.message : String(err));
        /* fall back */
      }
    })();
  }

  const pushLocal = () => onConfig(readLocalConfig());
  const onEvt = () => pushLocal();
  if (typeof window !== "undefined") {
    window.addEventListener("arcade:config", onEvt);
    window.addEventListener("storage", onEvt);
  }
  pushLocal();

  return () => {
    cancelled = true;
    stop?.();
    if (typeof window !== "undefined") {
      window.removeEventListener("arcade:config", onEvt);
      window.removeEventListener("storage", onEvt);
    }
  };
}

export function useArcadeConfig() {
  const queryClient = useQueryClient();
  const result = useQuery({
    queryKey: ["arcade", "config"],
    queryFn: fetchArcadeConfig,
    initialData: readLocalConfig,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    return subscribeArcadeConfig((cfg) => {
      queryClient.setQueryData<ArcadeConfig>(["arcade", "config"], cfg);
    });
  }, [queryClient]);

  return result;
}

export async function deleteScore(scoreId: string): Promise<void> {
  const store = readLocal();
  store.scores = store.scores.filter((s) => s.id !== scoreId && s.playerId !== scoreId);
  writeLocal(store);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("arcade:scores"));

  if (isFirebaseConfigured) {
    try {
      const db = await getDb();
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, SCORES, scoreId));
    } catch (err) {
      console.warn("[Delete Score Failed]:", err);
    }
  }
}

export async function registerForContest(playerId: string): Promise<ArcadeConfig> {
  const current = await fetchArcadeConfig();
  if (!current.contest) return current;

  const existingRegs = current.contest.registrations ?? [];
  if (existingRegs.includes(playerId)) return current;

  const updatedRegs = Array.from(new Set([...existingRegs, playerId]));
  const updatedContest: ArcadeContest = {
    ...current.contest,
    registrations: updatedRegs,
  };

  const updatedConfig: ArcadeConfig = {
    ...current,
    contest: updatedContest,
  };

  await updateArcadeConfig(updatedConfig);
  return updatedConfig;
}

export async function resetWeeklyLeaderboard(): Promise<ArcadeConfig> {
  const current = await fetchArcadeConfig();
  const updatedConfig: ArcadeConfig = {
    ...current,
    weeklyResetAt: Date.now(),
  };
  await updateArcadeConfig(updatedConfig);
  return updatedConfig;
}

/** Delete ALL scores from leaderboard (lifetime reset). */
export async function deleteAllScores(): Promise<void> {
  const store = readLocal();
  store.scores = [];
  writeLocal(store);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("arcade:scores"));

  if (isFirebaseConfigured) {
    try {
      const db = await getDb();
      const { collection, getDocs, deleteDoc, writeBatch } = await import("firebase/firestore");
      const snap = await getDocs(collection(db, SCORES));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      console.warn("[Delete All Scores Failed]:", err);
    }
  }
}

/** Delete all scores and the player profile account (releasing their username). */
export async function deletePlayerScores(playerId: string): Promise<void> {
  const store = readLocal();
  // Remove scores
  store.scores = store.scores.filter((s) => s.playerId !== playerId && s.handle !== playerId);
  // Remove player profile account
  store.players = store.players.filter((p) => p.id !== playerId && p.handle !== playerId);
  writeLocal(store);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("arcade:scores"));

  if (isFirebaseConfigured) {
    try {
      const db = await getDb();
      const { collection, getDocs, query, where, writeBatch, doc, deleteDoc } = await import("firebase/firestore");
      
      // 1. Delete scores from Firestore
      const snap = await getDocs(query(collection(db, SCORES), where("playerId", "==", playerId)));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      // 2. Delete player account profile from Firestore
      const pId = playerId.startsWith("local-") ? playerId.replace("local-", "") : playerId;
      await deleteDoc(doc(db, PLAYERS, pId));
    } catch (err) {
      console.warn("[Delete Player Scores & Account Failed]:", err);
    }
  }
}

/** Ban a player by handle or playerId. */
export async function banPlayer(handleOrId: string): Promise<void> {
  const current = await fetchArcadeConfig();
  const banned = Array.from(new Set([...(current.bannedPlayers ?? []), handleOrId]));
  await updateArcadeConfig({ ...current, bannedPlayers: banned });
}

/** Unban a player by handle or playerId. */
export async function unbanPlayer(handleOrId: string): Promise<void> {
  const current = await fetchArcadeConfig();
  const banned = (current.bannedPlayers ?? []).filter((b) => b !== handleOrId);
  await updateArcadeConfig({ ...current, bannedPlayers: banned });
}

/** Reset Contest leaderboard by bumping contest startAt to now (scores before this are hidden). */
export async function resetContestLeaderboard(): Promise<ArcadeConfig> {
  const current = await fetchArcadeConfig();
  if (!current.contest) return current;
  const updatedConfig: ArcadeConfig = {
    ...current,
    contest: {
      ...current.contest,
      startAt: Date.now(),
      registrations: [],
    },
  };
  await updateArcadeConfig(updatedConfig);
  return updatedConfig;
}
