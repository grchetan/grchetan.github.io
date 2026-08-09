import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Flag, RefreshCw, Trophy, Users, Clock, Trash2, Ban } from "lucide-react";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import { type RaceRoom, type RaceResult } from "@/lib/race";
import { cn } from "@/lib/utils";

function fmt(ms?: number) {
  if (!ms) return "—";
  const s = ms / 1000;
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(2).padStart(5, "0");
  return `${m}:${sec}`;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="plate p-5">
      <span className="label">{label}</span>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
      {sub && <p className="caption mt-1">{sub}</p>}
    </div>
  );
}

/* ─── Active Rooms Panel ─── */
function ActiveRoomsPanel() {
  const [rooms, setRooms] = useState<(RaceRoom & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    if (!isFirebaseConfigured) { setLoading(false); return; }
    try {
      const db = await getDb();
      const { collection, getDocs, orderBy, query } = await import("firebase/firestore");
      const snap = await getDocs(query(collection(db, "raceRooms"), orderBy("createdAt", "desc")));
      setRooms(snap.docs.map((d) => ({ id: d.id, ...(d.data() as RaceRoom) })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load race rooms.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function deleteRoom(code: string) {
    if (!isFirebaseConfigured) return;
    if (!confirm(`Delete room ${code}? This is irreversible.`)) return;
    try {
      const db = await getDb();
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "raceRooms", code));
      toast.success(`Room ${code} deleted.`);
      void load();
    } catch (err) {
      console.error(err);
      toast.error("Could not delete room.");
    }
  }

  const phaseColor: Record<string, string> = {
    lobby: "bg-amber-400/15 text-amber-400 border-amber-400/30",
    countdown: "bg-orange-400/15 text-orange-400 border-orange-400/30",
    racing: "bg-emerald-400/15 text-emerald-400 border-emerald-400/30",
    finished: "bg-slate-400/15 text-slate-400 border-slate-400/30",
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <span className="label">Active Race Rooms</span>
        <button onClick={() => void load()} disabled={loading} className="press-btn-outline">
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} strokeWidth={1.5} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1,2,3].map(n => (
            <div key={n} className="plate h-20 animate-pulse p-4">
              <div className="h-4 w-1/4 rounded bg-paper-tint/60" />
              <div className="mt-2 h-3 w-1/2 rounded bg-paper-tint/40" />
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <p className="caption mt-6 py-8 text-center">No active race rooms right now.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rooms.map((room) => (
            <div key={room.id} className="plate flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-xl tracking-[0.1em] text-ink">{room.code}</span>
                  <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-widest", phaseColor[room.phase] ?? phaseColor.finished)}>
                    {room.phase}
                  </span>
                </div>
                <p className="caption mt-1">
                  {Object.keys(room.players).length}/{room.settings.maxPlayers} players ·{" "}
                  {room.settings.laps} laps ·{" "}
                  Created {new Date(room.createdAt).toLocaleTimeString()}
                </p>
                {Object.keys(room.players).length > 0 && (
                  <p className="mt-1 font-mono text-[0.68rem] text-ink-soft">
                    {Object.values(room.players).map(p => p.name).join(", ")}
                  </p>
                )}
              </div>
              <button
                onClick={() => void deleteRoom(room.code)}
                className="press-btn-outline flex items-center gap-1.5 text-rose-500 hover:border-rose-500/40"
              >
                <Trash2 className="size-3.5" strokeWidth={1.5} /> Delete Room
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Leaderboard Panel ─── */
function RaceLeaderboardPanel() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    if (!isFirebaseConfigured) { setLoading(false); return; }
    try {
      const db = await getDb();
      const { collection, getDocs, orderBy, query, limit } = await import("firebase/firestore");
      const snap = await getDocs(query(collection(db, "raceLeaderboard"), orderBy("bestLap", "asc"), limit(100)));
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load race leaderboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function deleteEntry(id: string, name: string) {
    if (!confirm(`Remove ${name}'s record from leaderboard?`)) return;
    try {
      const db = await getDb();
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "raceLeaderboard", id));
      toast.success(`Entry removed.`);
      void load();
    } catch {
      toast.error("Could not remove entry.");
    }
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <span className="label">All-Time Leaderboard (Best Lap)</span>
        <button onClick={() => void load()} disabled={loading} className="press-btn-outline">
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} strokeWidth={1.5} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          {[1,2,3,4,5].map(n => (
            <div key={n} className="plate h-12 animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="caption mt-6 py-8 text-center">No race results yet.</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-paper-tint/40">
                <th className="px-4 py-3 text-left font-mono text-[0.65rem] uppercase tracking-widest text-ink-soft">#</th>
                <th className="px-4 py-3 text-left font-mono text-[0.65rem] uppercase tracking-widest text-ink-soft">Player</th>
                <th className="px-4 py-3 text-left font-mono text-[0.65rem] uppercase tracking-widest text-ink-soft">Best Lap</th>
                <th className="px-4 py-3 text-left font-mono text-[0.65rem] uppercase tracking-widest text-ink-soft">Total</th>
                <th className="px-4 py-3 text-left font-mono text-[0.65rem] uppercase tracking-widest text-ink-soft">Laps</th>
                <th className="px-4 py-3 text-left font-mono text-[0.65rem] uppercase tracking-widest text-ink-soft">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id} className={cn("border-b border-ink/5 transition-colors hover:bg-paper-tint/30", i < 3 && "bg-paper-tint/20")}>
                  <td className="px-4 py-3 font-display text-lg text-ink-soft">
                    {medals[i] ?? `#${i + 1}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-ink">{e.name}</span>
                    <span className="ml-2 font-mono text-[0.65rem] text-ink-soft">{e.handle}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[0.8rem] text-ink">{fmt(e.bestLap)}</td>
                  <td className="px-4 py-3 font-mono text-[0.8rem] text-ink-soft">{fmt(e.totalTime)}</td>
                  <td className="px-4 py-3 font-mono text-[0.8rem] text-ink-soft">{e.laps ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-[0.7rem] text-ink-soft">
                    {e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void deleteEntry(e.id, e.name)}
                      className="rounded-lg p-1.5 text-ink-soft transition hover:bg-rose-500/10 hover:text-rose-500"
                      title="Remove entry"
                    >
                      <Ban className="size-3.5" strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Main Race Control Manager ─── */
export function RaceControlManager() {
  const [allRooms, setAllRooms] = useState<RaceRoom[]>([]);
  const [allEntries, setAllEntries] = useState<any[]>([]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    (async () => {
      const db = await getDb();
      const { collection, getDocs } = await import("firebase/firestore");
      const [roomsSnap, lbSnap] = await Promise.all([
        getDocs(collection(db, "raceRooms")),
        getDocs(collection(db, "raceLeaderboard")),
      ]);
      setAllRooms(roomsSnap.docs.map(d => d.data() as RaceRoom));
      setAllEntries(lbSnap.docs.map(d => d.data()));
    })();
  }, []);

  const stats = useMemo(() => {
    const totalRaces = allRooms.filter(r => r.phase === "finished").length;
    const activeRaces = allRooms.filter(r => r.phase === "racing").length;
    const totalPlayers = new Set(allEntries.map((e: any) => e.playerId)).size;
    const fastestLap = allEntries.reduce((min: number, e: any) => e.bestLap && e.bestLap < min ? e.bestLap : min, Infinity);
    return { totalRaces, activeRaces, totalPlayers, fastestLap };
  }, [allRooms, allEntries]);

  return (
    <div>
      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Races" value={stats.activeRaces} sub="Currently racing" />
        <StatCard label="Finished Races" value={stats.totalRaces} sub="All time" />
        <StatCard label="Unique Players" value={stats.totalPlayers} sub="On leaderboard" />
        <StatCard
          label="Fastest Lap"
          value={stats.fastestLap === Infinity ? "—" : fmt(stats.fastestLap)}
          sub="All-time record"
        />
      </div>

      {!isFirebaseConfigured && (
        <div className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
          <p className="font-mono text-[0.75rem] text-amber-400">
            ⚠ Firebase is not configured — Race data requires Firestore. Connect Firebase to use Race Control.
          </p>
        </div>
      )}

      <ActiveRoomsPanel />
      <RaceLeaderboardPanel />
    </div>
  );
}
