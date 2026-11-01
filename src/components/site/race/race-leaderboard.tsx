import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Zap,
  Flag,
  Search,
  RefreshCw,
} from "lucide-react";
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

function rankBadge(rank: number) {
  if (rank === 1) return { icon: Crown, tone: "var(--prism-yellow)", label: "Champion" };
  if (rank === 2) return { icon: Medal, tone: "var(--prism-blue)", label: "Runner-up" };
  if (rank === 3) return { icon: Award, tone: "var(--prism-pink)", label: "Podium" };
  return null;
}

/** Animated Mini Cyber Race Car SVG with spinning wheels and dual nitro exhausts */
function AnimatedMiniCar({
  color = "#38bdf8",
  isLeader = false,
  isHovered = false,
}: {
  color?: string;
  isLeader?: boolean;
  isHovered?: boolean;
}) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Dynamic Speed Lines when hovered or #1 */}
      {(isLeader || isHovered) && (
        <div className="pointer-events-none absolute -left-5 flex flex-col gap-0.5 opacity-80">
          <span className="h-[1.5px] w-4 animate-pulse rounded-full bg-cyan-400" />
          <span className="h-[1.5px] w-6 animate-pulse rounded-full bg-pink-400 delay-75" />
          <span className="h-[1.5px] w-3 animate-pulse rounded-full bg-amber-400 delay-150" />
        </div>
      )}

      <motion.svg
        viewBox="0 0 64 32"
        className={cn("h-6 w-12 transition-transform duration-300", isHovered && "scale-115")}
        animate={isHovered ? { x: [0, 2, -1, 0] } : {}}
        transition={{ repeat: Infinity, duration: 0.3 }}
      >
        <defs>
          <linearGradient id={`car-grad-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={isLeader ? "#fbbf24" : color} />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Dual Nitro Exhaust Flames */}
        {(isLeader || isHovered) && (
          <g className="animate-pulse">
            <polygon points="12,12 2,13 12,14" fill="#38bdf8" opacity="0.9" filter="url(#glow)" />
            <polygon points="10,12.5 4,13 10,13.5" fill="#ffffff" />
            <polygon points="12,18 2,19 12,20" fill="#38bdf8" opacity="0.9" filter="url(#glow)" />
            <polygon points="10,18.5 4,19 10,19.5" fill="#ffffff" />
          </g>
        )}

        {/* 4 Wheels */}
        <rect x="42" y="3" width="9" height="4.5" rx="2" fill="#090d16" />
        <line x1="44" y1="5.25" x2="49" y2="5.25" stroke="#94a3b8" strokeWidth="1" />
        <rect x="42" y="24.5" width="9" height="4.5" rx="2" fill="#090d16" />
        <line x1="44" y1="26.75" x2="49" y2="26.75" stroke="#94a3b8" strokeWidth="1" />
        <rect x="15" y="3" width="9.5" height="5" rx="2" fill="#090d16" />
        <line x1="17" y1="5.5" x2="22" y2="5.5" stroke="#94a3b8" strokeWidth="1" />
        <rect x="15" y="24" width="9.5" height="5" rx="2" fill="#090d16" />
        <line x1="17" y1="26.5" x2="22" y2="26.5" stroke="#94a3b8" strokeWidth="1" />

        {/* Rear Wing / Spoiler */}
        <rect x="10" y="6" width="3" height="20" rx="1" fill="#0f172a" />
        <rect x="8" y="7" width="2" height="18" rx="0.5" fill={color} />

        {/* Main Aerodynamic Monocoque Chassis */}
        <path
          d="M 12,9 Q 32,8 54,12 Q 58,16 54,20 Q 32,24 12,23 Z"
          fill={`url(#car-grad-${color})`}
          stroke="#090d16"
          strokeWidth="0.8"
        />

        {/* Cockpit Canopy */}
        <path
          d="M 28,11 Q 38,10.5 44,13 Q 46,16 44,19 Q 38,21.5 28,21 Z"
          fill="#090d16"
        />
        {/* Windshield Glass Reflection */}
        <path
          d="M 33,12 Q 40,11.5 43,13 Q 44,16 43,19 Q 40,20.5 33,20 Z"
          fill="#38bdf8"
          opacity="0.85"
        />

        {/* LED Headlights */}
        <circle cx="53" cy="13" r="1.5" fill="#38bdf8" filter="url(#glow)" />
        <circle cx="53" cy="19" r="1.5" fill="#38bdf8" filter="url(#glow)" />

        {/* Number #1 on Champion Car */}
        {isLeader && (
          <text
            x="24"
            y="18"
            fontSize="7"
            fontWeight="bold"
            fill="#ffffff"
            textAnchor="middle"
            fontFamily="monospace"
          >
            1
          </text>
        )}
      </motion.svg>
    </div>
  );
}

export function RaceLeaderboard({ currentRacerId }: { currentRacerId?: string }) {
  const { data: rows = [], isLoading, refetch, isFetching } = useGlobalRaceLeaderboard();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"bestLap" | "totalTime">("bestLap");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Filter, deduplicate, and rank
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

  const champion = sorted[0];

  return (
    <div className="mt-16">
      {/* Section Heading matching Arcade theme */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="label">Leaderboard</span>
            <span className="caption text-ink-soft">· Grand Prix Standings</span>
          </div>
          <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
            Who is fastest.
          </h2>
          <p className="mt-1 text-sm text-ink-soft max-w-xl">
            Live circuit standings ranked by fastest single lap and total endurance time.
          </p>
        </div>

        {/* Top Controls: Live Badge, Search, Tab Switcher, Refresh */}
        <div className="flex flex-col gap-3 sm:items-end w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-3 justify-start sm:justify-end w-full">
            {/* Live Count Badge */}
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 shrink-0">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400 font-semibold">
                Live · {sorted.length} {sorted.length === 1 ? "driver" : "drivers"}
              </span>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-52 relative">
              <input
                type="text"
                placeholder="Search racer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-ink/15 bg-paper/80 px-4 py-1.5 text-xs text-ink outline-none transition focus:border-[var(--prism-blue)] placeholder:text-ink-soft/50 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <div className="inline-flex rounded-2xl border border-ink/12 bg-paper/80 p-1.5 shadow-xs">
              <button
                type="button"
                onClick={() => setTab("bestLap")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] font-semibold transition-all",
                  tab === "bestLap"
                    ? "bg-ink text-paper shadow-xs"
                    : "text-ink-soft hover:text-ink hover:bg-ink/5"
                )}
              >
                <Zap className="size-3" /> Fastest Lap
              </button>

              <button
                type="button"
                onClick={() => setTab("totalTime")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] font-semibold transition-all",
                  tab === "totalTime"
                    ? "bg-ink text-paper shadow-xs"
                    : "text-ink-soft hover:text-ink hover:bg-ink/5"
                )}
              >
                <Flag className="size-3" /> Full Race
              </button>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex size-9 items-center justify-center rounded-2xl border border-ink/12 bg-paper/80 text-ink-soft hover:text-ink hover:bg-ink/5 transition shadow-xs disabled:opacity-50"
              title="Refresh Standings"
            >
              <RefreshCw className={cn("size-3.5", isFetching && "animate-spin text-[var(--prism-blue)]")} />
            </button>
          </div>
        </div>
      </div>

      {/* Creative Champion Paddock Highlight Card */}
      {champion && !search && (
        <div className="mb-6 overflow-hidden rounded-[1.75rem] border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-paper-tint/60 to-cyan-500/10 p-5 backdrop-blur-xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-500 shadow-md">
                <Crown className="size-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 font-mono text-[0.64rem] font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                  <span>🏆 Circuit Record Holder · P1 Champion</span>
                </div>
                <h3 className="font-display text-xl text-ink font-extrabold flex items-center gap-2 mt-0.5">
                  {champion.name || "Anonymous Driver"}
                  <span className="font-mono text-xs text-ink-soft font-normal">
                    @{champion.handle || "champion"}
                  </span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="block font-mono text-[0.6rem] uppercase tracking-wider text-ink-soft">
                  Record Lap Time
                </span>
                <span className="font-mono text-xl font-black text-ink">
                  {formatMs(champion.bestLap)}
                </span>
              </div>
              {/* Animated P1 Champion Car */}
              <div className="hidden sm:block">
                <AnimatedMiniCar color="#f59e0b" isLeader isHovered />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table matching Arcade Leaderboard in Light and Dark mode */}
      <div className="overflow-hidden rounded-[1.75rem] border border-ink/10 bg-paper-tint/50 backdrop-blur-xl">
        {/* Table Header */}
        <div className="hidden grid-cols-[4.5rem_1fr_6rem_6rem_6rem] gap-3 border-b border-ink/10 px-5 py-3 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-soft md:grid">
          <span>Rank</span>
          <span>Driver & Machine</span>
          <span className="text-right">Fastest Lap</span>
          <span className="text-right">Race Time</span>
          <span className="text-right">Laps</span>
        </div>

        {isLoading ? (
          <ul className="divide-y divide-ink/5 p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <li
                key={i}
                className="h-12 w-full animate-pulse rounded-2xl bg-ink/5"
              />
            ))}
          </ul>
        ) : sorted.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-ink/15 bg-paper/50 p-12 text-center flex flex-col items-center justify-center">
            <Trophy className="size-8 text-ink/30 mb-3 animate-pulse" />
            <p className="font-display text-xl text-ink">No race scores yet — take the pole position!</p>
            <p className="mt-2 text-xs text-ink-soft max-w-sm">
              Complete a 3-lap run in Quick Race or Multiplayer above to set your time on the board.
            </p>
          </div>
        ) : (
          <ul>
            <AnimatePresence initial={false}>
              {sorted.map((row, idx) => {
                const rank = idx + 1;
                const badge = rankBadge(rank);
                const isMine =
                  Boolean(currentRacerId) &&
                  (row.playerId === currentRacerId ||
                    row.playerId?.replace(/^local-/, "").toLowerCase() ===
                      currentRacerId?.replace(/^local-/, "").toLowerCase());
                const isHovered = hoveredIdx === idx;

                const carColors = [
                  "#f59e0b", // Gold #1
                  "#38bdf8", // Sky Blue #2
                  "#ec4899", // Magenta #3
                  "#10b981", // Emerald
                  "#a855f7", // Purple
                  "#ef4444", // Red
                ];
                const carColor = row.car?.color || carColors[(rank - 1) % carColors.length];

                return (
                  <motion.li
                    key={`${row.playerId}-${idx}`}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className={cn(
                      "relative grid grid-cols-12 items-center gap-y-2 gap-x-2 border-b border-ink/[0.07] px-4 py-3.5 md:grid-cols-[4.5rem_1fr_6rem_6rem_6rem] transition-colors",
                      isMine
                        ? "bg-cyan-500/[0.08]"
                        : "hover:bg-ink/[0.02]"
                    )}
                  >
                    {/* Rank with Badge matching Arcade */}
                    <span className="col-span-3 flex items-center gap-1.5 font-display text-lg text-ink md:col-span-1 md:text-xl">
                      {badge ? (
                        <badge.icon
                          className="size-4 shrink-0"
                          style={{ color: badge.tone }}
                          strokeWidth={2.4}
                        />
                      ) : null}
                      <span>#{rank}</span>
                    </span>

                    {/* Driver & Animated Car Creativity */}
                    <div className="col-span-9 flex items-center justify-between md:col-span-1 min-w-0 pr-4">
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink md:text-[0.95rem]">
                          {row.name || "Anonymous Driver"}
                          {isMine && (
                            <span className="ml-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 px-2 py-0.5 text-[0.58rem] font-mono text-cyan-600 dark:text-cyan-300 font-bold uppercase">
                              you
                            </span>
                          )}
                        </span>
                        <span className="block truncate font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-soft">
                          @{row.handle || "racer"}
                        </span>
                      </div>

                      {/* Animated Mini Cyber Car */}
                      <div className="shrink-0 pl-2">
                        <AnimatedMiniCar
                          color={carColor}
                          isLeader={rank === 1}
                          isHovered={isHovered}
                        />
                      </div>
                    </div>

                    {/* Fastest Lap */}
                    <span className="col-span-4 font-mono text-sm font-bold text-ink text-right md:col-span-1">
                      <span className={cn(rank === 1 ? "text-amber-500 font-black" : "text-ink")}>
                        {formatMs(row.bestLap)}
                      </span>
                    </span>

                    {/* Total Race Time */}
                    <span className="col-span-4 font-mono text-xs text-ink-soft md:col-span-1 md:text-right">
                      {formatMs(row.totalTime)}
                    </span>

                    {/* Laps */}
                    <span className="col-span-4 font-mono text-xs text-ink-soft md:col-span-1 md:text-right">
                      {row.laps || 3} laps
                    </span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
