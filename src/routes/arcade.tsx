import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SiteShell } from "@/components/site/shell";
import { ArcadeStage } from "@/components/site/arcade";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { GlitchText } from "@/components/ui/glitch-text";
import { Section } from "@/components/site/primitives";
import { Flag, Zap, Users, Trophy } from "lucide-react";
import AnimatedBorderTrail from "@/components/ui/animated-border-trail";
import { useGlobalRaceLeaderboard } from "@/lib/race";
import raceBg from "@/assets/race-bg.png";

const title = "Arcade — Signal Rush game & leaderboard | Chetan Prajapat";
const description =
  "Play Signal Rush: create a player ID with just your name, chase a high score, climb the live top-100 leaderboard and download an automatic ranking certificate.";

export const Route = createFileRoute("/arcade")({
  component: ArcadePage,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
  }),
});

function ArcadePage() {
  const { data: leaderboard } = useGlobalRaceLeaderboard();
  const topRecord = leaderboard?.[0];
  const topTimeFormatted = topRecord?.bestLap
    ? (() => {
        const s = topRecord.bestLap / 1000;
        const m = Math.floor(s / 60);
        const sec = (s % 60).toFixed(3).padStart(6, "0");
        return `${m}:${sec}`;
      })()
    : "01:23.456";

  return (
    <SiteShell>
      <PageHero
        eyebrow="Arcade"
        title={<GlitchText text="Interactive Arena, Ranked Leaderboards." className="text-3xl sm:text-5xl md:text-6xl" />}
        lead="Name in, player ID out. Play Signal Rush, save your score, and watch the leaderboard sort everyone from 1st to 100th — certificates generated automatically."
        meta={["Name-only player IDs", "Live top-100 ranking", "Auto certificates for 1st, 2nd, 3rd & top 100"]}
      />

      <ErrorBoundary>
        <ArcadeStage />
      </ErrorBoundary>

      {/* Race Multiplayer Game Card */}
      <Section>
        <AnimatedBorderTrail
          duration="5s"
          trailColor="#ef4444"
          trailSize="lg"
          borderWidth={2}
          className="relative overflow-hidden rounded-[2rem] transition-all duration-300 hover:shadow-[0_0_30px_rgba(239,68,68,0.25)] hover:scale-[1.01]"
          contentClassName="relative bg-slate-950 rounded-[calc(2rem-2px)] overflow-hidden"
        >
          {/* Background image of the car */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-right bg-no-repeat opacity-40 sm:opacity-70 md:opacity-85 pointer-events-none"
            style={{
              backgroundImage: `url(${raceBg})`,
              backgroundPosition: "right center",
            }}
          />

          {/* Dark gradient overlay for text readability on left */}
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />

          {/* Inner Content Area */}
          <div className="relative z-20 px-8 py-10 sm:px-12 sm:py-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between min-h-[300px]">
            <div className="flex flex-col md:flex-row items-start gap-5 max-w-2xl">
              {/* Icon Container */}
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 shadow-lg shadow-cyan-500/10">
                <Flag className="size-7 text-cyan-400" strokeWidth={1.5} />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-cyan-400/80">Catalogue 03 · Multiplayer</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest text-cyan-300">
                    <Zap className="size-2.5" />
                    New
                  </span>
                </div>

                <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white leading-tight sm:text-4xl md:text-5xl">
                  Race <span className="text-cyan-400">—</span> <br className="hidden sm:inline" />
                  Multiplayer Racing
                </h2>

                <p className="mt-3 max-w-md text-[0.88rem] leading-relaxed text-slate-300">
                  Real-time multiplayer car racing. Create a room, share the code, race live against other visitors. Leaderboard tracks fastest times.
                </p>

                {/* Badges */}
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[0.65rem] text-slate-300">
                    <Users className="size-3" /> Multiplayer
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[0.65rem] text-slate-300">
                    <Zap className="size-3 text-cyan-400" /> Real-time
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[0.65rem] text-slate-300">
                    <Trophy className="size-3 text-amber-400" /> Live Leaderboard
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[0.65rem] text-slate-300">
                    📱 Mobile + Desktop
                  </span>
                </div>

                {/* Button placed below text on bottom left */}
                <div className="mt-8">
                  <Link
                    to="/race"
                    className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-cyan-500/40 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-8 py-3.5 font-mono text-[0.72rem] font-bold uppercase tracking-[0.16em] text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/40 hover:shadow-xl active:scale-95"
                  >
                    <Flag className="size-3.5 transition-transform duration-300 group-hover:-rotate-12" />
                    Play Race
                    <span className="ml-1 transition-transform duration-300 group-hover:translate-x-1">→</span>
                    {/* Shine effect */}
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Top Right: Top Time info badge */}
            <div className="absolute right-6 top-6 z-20 hidden md:flex items-center gap-3 rounded-2xl border border-white/10 bg-black/60 px-4 py-2.5 backdrop-blur-md">
              <Trophy className="size-5 text-cyan-400" strokeWidth={1.5} />
              <div>
                <p className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-slate-400">Top Time</p>
                <p className="font-mono text-xs font-bold text-white">{topTimeFormatted}</p>
              </div>
            </div>
          </div>
        </AnimatedBorderTrail>
      </Section>
    </SiteShell>
  );
}
