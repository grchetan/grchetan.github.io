import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowUpRight, Flame, GitCommit, GitFork, Trophy } from "lucide-react";
import { RegMark, Rule } from "@/components/site/primitives";
import { getGitHubStats, type GitHubStats } from "@/lib/github.functions";
import { profile } from "@/data/portfolio";
import { cn } from "@/lib/utils";

const GITHUB_USERNAME = "grchetan";

function Bar({
  label,
  value,
  total,
  className,
  delay,
  suffix = "",
}: {
  label: string;
  value: number;
  total: number;
  className: string;
  delay: number;
  suffix?: string;
}) {
  const pct = total ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="label">{label}</span>
        <span className="font-mono text-[0.8rem] text-ink">
          {value}
          <span className="text-ink-soft">{suffix || `/${total}`}</span>
        </span>
      </div>
      <div className="mt-2 h-[5px] w-full overflow-hidden rounded-full bg-ink/10">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "left", width: `${pct}%` }}
          className={cn("h-full rounded-full", className)}
        />
      </div>
    </div>
  );
}

function Heatmap({ calendar }: { calendar: GitHubStats["calendar"] }) {
  const weeks: GitHubStats["calendar"][] = [];
  for (let i = 0; i < calendar.length; i += 7) weeks.push(calendar.slice(i, i + 7));

  const toneStyle = (lvl: number): React.CSSProperties => {
    if (lvl === 0) return { background: "color-mix(in oklab, var(--chrome-2) 10%, transparent)" };
    if (lvl === 1) return { background: "color-mix(in oklab, var(--chrome-3) 40%, transparent)" };
    if (lvl === 2) return { background: "color-mix(in oklab, var(--chrome-3) 70%, transparent)" };
    if (lvl === 3) return { background: "color-mix(in oklab, var(--chrome-2) 85%, transparent)" };
    return { background: "var(--chrome-1)" };
  };

  return (
    <div className="scrollbar-none overflow-x-auto pb-1">
      <div className="flex gap-[3px] min-w-[580px]">
        {weeks.map((w, wi) => (
          <div key={wi} className="grid grid-rows-7 gap-[3px]">
            {w.map((d, di) => (
              <span
                key={`${wi}-${di}`}
                style={toneStyle(d.level)}
                className="size-[9px] rounded-[1.5px] transition-transform duration-200 hover:scale-125"
                title={`${d.date}: ${d.count} contributions`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function GitHubCard({ className }: { className?: string }) {
  const { data } = useQuery({
    queryKey: ["github", GITHUB_USERNAME],
    queryFn: () => getGitHubStats(GITHUB_USERNAME),
    staleTime: 60_000,
  });

  const s = data;
  const circumference = 2 * Math.PI * 54;
  const maxBenchmark = 1200;
  const pct = s ? Math.min(100, (s.totalContributions / maxBenchmark) * 100) : 0;

  return (
    <section id="github-stats" className={cn("plate relative p-6 sm:p-8", className)}>
      <RegMark className="absolute right-4 top-4" />

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="label">GitHub — Live Activity</span>
        <a
          href={`https://github.com/${GITHUB_USERNAME}`}
          target="_blank"
          rel="noreferrer noopener"
          className="caption inline-flex items-center gap-1 text-ink hover:opacity-70"
        >
          @{GITHUB_USERNAME}
          <ArrowUpRight className="size-3" strokeWidth={1.5} />
        </a>
      </div>
      <Rule className="mt-3" />

      <div className="mt-7 grid gap-8 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
        {/* contributions dial */}
        <div className="relative mx-auto size-[136px] shrink-0">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" strokeWidth="7" className="stroke-ink/10" />
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              stroke="url(#ghGrad)"
              initial={{ strokeDashoffset: circumference }}
              whileInView={{ strokeDashoffset: circumference - (pct / 100) * circumference }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              strokeDasharray={circumference}
            />
            <defs>
              <linearGradient id="ghGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--chrome-2)" />
                <stop offset="100%" stopColor="var(--chrome-3)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="font-display text-[1.95rem] leading-none text-ink">{s?.totalContributions ?? "—"}</p>
              <p className="label mt-1.5">Contributions</p>
            </div>
          </div>
        </div>

        {/* metric bars */}
        <div className="grid gap-4">
          <Bar
            label="Current Streak"
            value={s?.currentStreak ?? 0}
            total={Math.max(30, (s?.longestStreak ?? 30))}
            className="bg-chrome-2"
            delay={0.1}
            suffix=" days"
          />
          <Bar
            label="Longest Streak"
            value={s?.longestStreak ?? 0}
            total={60}
            className="bg-chrome-1"
            delay={0.2}
            suffix=" days"
          />
          <Bar
            label="Public Repositories"
            value={s?.publicRepos ?? 0}
            total={100}
            className="bg-chrome-3"
            delay={0.3}
            suffix=" repos"
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 border-t border-ink/10 pt-5 sm:grid-cols-4">
        {[
          { k: "Public Repos", v: s?.publicRepos ?? "—" },
          { k: "Active days", v: s?.activeDays ? `${s.activeDays} days` : "—" },
          { k: "Max streak", v: s?.longestStreak ? `${s.longestStreak} days` : "—" },
          { k: "Profile", v: s?.live ? "Live sync" : "Cached" },
        ].map((row) => (
          <div key={row.k}>
            <span className="label">{row.k}</span>
            <p className="mt-1.5 font-mono text-[0.9rem] text-ink">{row.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-baseline justify-between gap-3">
          <span className="label">Last 52 weeks</span>
          <span className="caption inline-flex items-center gap-1.5">
            <Flame className="size-3 text-chrome-2" strokeWidth={1.5} /> {s?.totalContributions ?? 0} total contributions
          </span>
        </div>
        <div className="mt-3">
          {s?.calendar?.length ? <Heatmap calendar={s.calendar} /> : <div className="h-[86px]" />}
        </div>
      </div>

      <p className="caption mt-5">
        Pulled straight from GitHub for {profile.name.split(" ")[0]} — updates on its own, nothing typed by hand.
      </p>
    </section>
  );
}
