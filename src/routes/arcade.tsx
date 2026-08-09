import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SiteShell } from "@/components/site/shell";
import { ArcadeStage } from "@/components/site/arcade";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { GlitchText } from "@/components/ui/glitch-text";
import { Section } from "@/components/site/primitives";
import { Flag, Zap, Users } from "lucide-react";

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
        <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#0a0a1a] via-[#0d1a2e] to-[#0a0f1a] p-0.5 shadow-2xl">
          <div className="relative rounded-[calc(1.5rem-2px)] bg-gradient-to-br from-[#060d1f] via-[#091626] to-[#04080f] px-6 py-8 sm:px-10 sm:py-10 overflow-hidden">

            {/* Animated grid background */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage: "linear-gradient(rgba(34,211,238,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.8) 1px, transparent 1px)",
                backgroundSize: "40px 40px"
              }}
            />

            {/* Speed lines */}
            <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none overflow-hidden opacity-10">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                  style={{ top: `${15 + i * 14}%`, left: "-20%", right: 0, animationDelay: `${i * 0.3}s` }}
                />
              ))}
            </div>

            <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 shadow-lg shadow-cyan-500/10">
                  <Flag className="size-7 text-cyan-400" strokeWidth={1.5} />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-cyan-400/70">Catalogue 03 · Multiplayer</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest text-cyan-300">
                      <Zap className="size-2.5" />
                      New
                    </span>
                  </div>
                  <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Race <span className="text-cyan-400">—</span> Multiplayer Racing
                  </h2>
                  <p className="mt-2 max-w-md text-[0.88rem] leading-relaxed text-slate-400">
                    Real-time multiplayer car racing. Create a room, share the code, race live against other visitors. Leaderboard tracks fastest times.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1.5 font-mono text-[0.68rem] text-slate-500">
                      <Users className="size-3" /> Multiplayer · Real-time
                    </span>
                    <span className="h-3 w-px bg-slate-700" />
                    <span className="font-mono text-[0.68rem] text-slate-500">Live Leaderboard</span>
                    <span className="h-3 w-px bg-slate-700" />
                    <span className="font-mono text-[0.68rem] text-slate-500">Mobile + Desktop</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="shrink-0">
                <Link
                  to="/race"
                  className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-7 py-3.5 font-mono text-[0.72rem] font-bold uppercase tracking-[0.16em] text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/40 hover:shadow-xl active:scale-95"
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
        </div>
      </Section>
    </SiteShell>
  );
}
