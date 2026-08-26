import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowUpRight, Flame } from "lucide-react";
import { RegMark, Rule } from "@/components/site/primitives";
import { getLeetCodeStats, type LeetCodeStats } from "@/lib/leetcode.functions";
import { profile } from "@/data/portfolio";
import { cn } from "@/lib/utils";

const LEETCODE_USERNAME = "chetanprajapat07";

function Bar({
  label,
  value,
  total,
  className,
  delay,
}: {
  label: string;
  value: number;
  total: number;
  className: string;
  delay: number;
}) {
  const pct = total ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="label">{label}</span>
        <span className="font-mono text-[0.8rem] text-ink">
          {value}
          <span className="text-ink-soft">/{total}</span>
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

function Heatmap({ calendar }: { calendar: LeetCodeStats["calendar"] }) {
  const weeks: LeetCodeStats["calendar"][] = [];
  for (let i = 0; i < calendar.length; i += 7) weeks.push(calendar.slice(i, i + 7));

  const level = (c: number) => (c === 0 ? 0 : c < 2 ? 1 : c < 4 ? 2 : c < 8 ? 3 : 4);

  const toneStyle = (lvl: number, isFuture?: boolean): React.CSSProperties => {
    if (isFuture) {
      return {
        background: "color-mix(in oklab, var(--ink) 4%, transparent)",
        opacity: 0.25,
      };
    }
    if (lvl === 0) {
      return {
        background: "color-mix(in oklab, var(--ink) 8%, transparent)",
      };
    }
    if (lvl === 1) {
      return {
        background: "var(--chrome-3, #06b6d4)",
        boxShadow: "0 0 5px color-mix(in oklab, var(--chrome-3) 40%, transparent)",
      };
    }
    if (lvl === 2) {
      return {
        background: "var(--chrome-2, #3b82f6)",
        boxShadow: "0 0 7px color-mix(in oklab, var(--chrome-2) 45%, transparent)",
      };
    }
    if (lvl === 3) {
      return {
        background: "var(--chrome-1, #8b5cf6)",
        boxShadow: "0 0 9px color-mix(in oklab, var(--chrome-1) 50%, transparent)",
      };
    }
    return {
      background: "#ec4899",
      boxShadow: "0 0 10px rgba(236,72,153,0.6)",
    };
  };

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <span
                key={day.date}
                title={
                  day.isFuture
                    ? `${day.date} (Upcoming)`
                    : `${day.date} — ${day.count} ${day.count === 1 ? "submission" : "submissions"}`
                }
                className="size-[10px] rounded-[2px] transition-all duration-300 hover:scale-125 hover:z-10 cursor-pointer"
                style={toneStyle(level(day.count), day.isFuture)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}


export function LeetCodeCard({ className }: { className?: string }) {
  const { data } = useQuery({
    queryKey: ["leetcode", LEETCODE_USERNAME],
    queryFn: () => getLeetCodeStats(LEETCODE_USERNAME),
    staleTime: 30_000,
  });

  const s = data;
  const solvedTotal = (s?.easyTotal ?? 0) + (s?.mediumTotal ?? 0) + (s?.hardTotal ?? 0);
  const pct = s && solvedTotal ? (s.total / solvedTotal) * 100 : 0;
  const circumference = 2 * Math.PI * 54;

  return (
    <section id="leetcode" className={cn("plate relative p-6 sm:p-8", className)}>
      <RegMark className="absolute right-4 top-4" />

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="label">LeetCode — live</span>
        <a
          href={`https://leetcode.com/u/${LEETCODE_USERNAME}/`}
          target="_blank"
          rel="noreferrer noopener"
          className="caption inline-flex items-center gap-1 text-ink hover:opacity-70"
        >
          @{LEETCODE_USERNAME}
          <ArrowUpRight className="size-3" strokeWidth={1.5} />
        </a>
      </div>
      <Rule className="mt-3" />

      <div className="mt-7 grid gap-8 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
        {/* solved dial */}
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
              stroke="url(#lcGrad)"
              initial={{ strokeDashoffset: circumference }}
              whileInView={{ strokeDashoffset: circumference - (pct / 100) * circumference }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              strokeDasharray={circumference}
            />
            <defs>
              <linearGradient id="lcGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--chrome-3)" />
                <stop offset="100%" stopColor="var(--chrome-1)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="font-display text-[2.1rem] leading-none text-ink">{s?.total ?? "—"}</p>
              <p className="label mt-1.5">Solved</p>
            </div>
          </div>
        </div>

        {/* difficulty bars */}
        <div className="grid gap-4">
          <Bar label="Easy" value={s?.easy ?? 0} total={s?.easyTotal ?? 1} className="bg-chrome-3" delay={0.1} />
          <Bar label="Medium" value={s?.medium ?? 0} total={s?.mediumTotal ?? 1} className="bg-chrome-2" delay={0.2} />
          <Bar label="Hard" value={s?.hard ?? 0} total={s?.hardTotal ?? 1} className="bg-chrome-1" delay={0.3} />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 border-t border-ink/10 pt-5 sm:grid-cols-4">
        {[
          { k: "Ranking", v: s?.ranking ? `#${s.ranking.toLocaleString()}` : "—" },
          { k: "Active days", v: s?.activeDays ?? "—" },
          { k: "Max streak", v: s?.streak ?? "—" },
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
            <Flame className="size-3" strokeWidth={1.5} /> {s?.activeDays ?? 0} active days
          </span>
        </div>
        <div className="mt-3">{s ? <Heatmap calendar={s.calendar} /> : <div className="h-[86px]" />}</div>
      </div>

      <p className="caption mt-5">
        Pulled straight from LeetCode for {profile.name.split(" ")[0]} — updates on its own, nothing typed by hand.
      </p>
    </section>
  );
}
