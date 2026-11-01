import { useState, useMemo } from "react";
import { Trophy, Clock, Medal, Search, RefreshCw, Zap, Flag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalRaceLeaderboard } from "@/lib/race";

function formatMs(ms: number | undefined): string {
  if (!ms || !isFinite(ms)) return "—";
  const totalSec = ms / 1000;
  const mins = Math.floor(totalSec / 60);
  const secs = (totalSec % 60).toFixed(2);
  if (mins > 0) {
    return `${mins}:${secs.padStart(5, "0")}s`;
  }
  return `${secs}s`;
}

export function RaceLeaderboard({ currentRacerId }: { currentRacerId?: string }) {
  const { data: rows = [], isLoading, refetch, isFetching } = useGlobalRaceLeaderboard();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"bestLap" | "totalTime">("bestLap");

  // Filter and rank
  const sorted = useMemo(() => {
    const list = [...rows];
    if (tab === "bestLap") {
      list.sort((a, b) => (a.bestLap ?? Infinity) - (b.bestLap ?? Infinity));
    } else {
      list.sort((a, b) => (a.totalTime ?? Infinity) - (b.totalTime ?? Infinity));
    }

    // Deduplicate by player so each racer has their best record
    const map = new Map<string, (typeof rows)[0]>();
    for (const r of list) {
      const key = (r.playerId || r.handle || r.name).toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, r);
      }
    }

    const unique = Array.from(map.values());
    if (!search) return unique;
    const q = search.toLowerCase();
    return unique.filter(
      (r) =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.handle && r.handle.toLowerCase().includes(q))
    );
  }, [rows, tab, search]);

  return (
    <div className="mt-16 overflow-hidden rounded-[2.2rem] border border-cyan-500/20 bg-slate-950/80 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-[0.68rem] font-bold uppercase tracking-[0.2em] text-cyan-400">
            <Trophy className="size-3.5 text-amber-400" />
            <span>Grand Prix Hall of Fame</span>
          </div>
          <h2 className="mt-1 font-display text-2xl font-black text-white sm:text-3xl">
            Circuit Standings & Records
          </h2>
          <p className="mt-1 text-xs text-slate-400 font-mono">
            Fastest lap times and tournament circuit finishes across all drivers.
          </p>
        </div>

        {/* Controls: Search, Tab Switcher, Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search racer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-white/10 bg-slate-900/90 py-1.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none font-mono"
            />
          </div>

          <div className="flex rounded-full border border-white/10 bg-slate-900/80 p-1">
            <button
              type="button"
              onClick={() => setTab("bestLap")}
              className={cn(
                "rounded-full px-3.5 py-1 font-mono text-[0.66rem] font-bold uppercase tracking-wider transition-all",
                tab === "bestLap"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Zap className="mr-1 inline-block size-3" /> Fastest Lap
            </button>
            <button
              type="button"
              onClick={() => setTab("totalTime")}
              className={cn(
                "rounded-full px-3.5 py-1 font-mono text-[0.66rem] font-bold uppercase tracking-wider transition-all",
                tab === "totalTime"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Flag className="mr-1 inline-block size-3" /> Full Race
            </button>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin text-cyan-400")} />
          </button>
        </div>
      </div>

      {/* Standings Table */}
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3 py-8">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 w-full animate-pulse rounded-2xl border border-white/5 bg-slate-900/50"
              />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-14 text-center">
            <Trophy className="mx-auto size-10 text-slate-600 animate-bounce" />
            <p className="mt-3 font-display text-lg text-slate-300">No race records logged yet!</p>
            <p className="mt-1 text-xs text-slate-500 font-mono">
              Complete a 3-lap run above to claim your spot on the Grand Prix podium.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-slate-400">
                  <th className="pb-3 pl-3">Rank</th>
                  <th className="pb-3">Racer</th>
                  <th className="pb-3 text-right">Fastest Lap</th>
                  <th className="pb-3 text-right">Race Time</th>
                  <th className="pb-3 pr-3 text-right">Laps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {sorted.map((row, idx) => {
                  const rank = idx + 1;
                  const isCurrent =
                    Boolean(currentRacerId) &&
                    (row.playerId === currentRacerId ||
                      row.playerId?.replace(/^local-/, "") === currentRacerId?.replace(/^local-/, ""));

                  return (
                    <tr
                      key={`${row.playerId}-${idx}`}
                      className={cn(
                        "transition-colors hover:bg-white/[0.03]",
                        isCurrent && "bg-cyan-500/10 border-l-2 border-cyan-400 font-semibold"
                      )}
                    >
                      {/* Rank */}
                      <td className="py-3.5 pl-3">
                        <span className="flex items-center gap-1.5 font-black text-sm">
                          {rank === 1 ? (
                            <span className="flex size-6 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              🥇
                            </span>
                          ) : rank === 2 ? (
                            <span className="flex size-6 items-center justify-center rounded-lg bg-slate-300/20 text-slate-200 border border-slate-300/30">
                              🥈
                            </span>
                          ) : rank === 3 ? (
                            <span className="flex size-6 items-center justify-center rounded-lg bg-amber-700/20 text-amber-400 border border-amber-600/30">
                              🥉
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold ml-1">#{rank}</span>
                          )}
                        </span>
                      </td>

                      {/* Driver Name & Handle */}
                      <td className="py-3.5">
                        <div className="flex flex-col">
                          <span className="font-sans font-bold text-sm text-slate-100 flex items-center gap-1.5">
                            {row.name || "Anonymous Driver"}
                            {isCurrent && (
                              <span className="rounded-full bg-cyan-500/20 border border-cyan-400/40 px-2 py-0.5 text-[0.6rem] font-mono text-cyan-300 font-bold">
                                YOU
                              </span>
                            )}
                          </span>
                          <span className="text-[0.62rem] text-slate-400 uppercase tracking-wider">
                            @{row.handle || "racer"}
                          </span>
                        </div>
                      </td>

                      {/* Best Lap */}
                      <td className="py-3.5 text-right font-black text-cyan-300 text-sm">
                        {formatMs(row.bestLap)}
                      </td>

                      {/* Total Race Time */}
                      <td className="py-3.5 text-right text-slate-300 font-semibold">
                        {formatMs(row.totalTime)}
                      </td>

                      {/* Laps */}
                      <td className="py-3.5 pr-3 text-right text-slate-400">
                        {row.laps || 3} laps
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
