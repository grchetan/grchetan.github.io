import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Download, Github } from "lucide-react";
import AnimatedBorderTrail from "@/components/ui/animated-border-trail";
import { ShinyButton } from "@/components/ui/shiny-button";
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton";
import { Rule } from "@/components/site/primitives";
import { fallbackImages, type Entry } from "@/data/catalog";
import { trackDownload } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useCssReveal, useCssRevealCallback } from "@/hooks/use-css-reveal";
import { useMotionPreference } from "@/hooks/use-motion-preference";

const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768;

const routeFor: Record<Entry["kind"], string> = {
  project: "/projects/$slug",
  app: "/apps/$slug",
  freelance: "/freelance/$slug",
};


export function EntryCard({ entry, index = 0 }: { entry: Entry; index?: number }) {
  const { reduced } = useMotionPreference();
  const cover = entry.images[0] ?? fallbackImages[index % fallbackImages.length]!;
  const staggerDelay = reduced ? 0 : (index % 3) * 0.1;
  const cssRef = useCssReveal<HTMLElement>();

  // On mobile: plain article + CSS animation — no JS motion overhead
  if (IS_MOBILE) {
    return (
      <article
        ref={cssRef}
        data-reveal=""
        data-delay={String(Math.min((index % 3) + 1, 4)) as "1" | "2" | "3" | "4"}
        className="group flex h-full flex-col rounded-[var(--radius-lg)]"
      >
        <Link
          to={routeFor[entry.kind]}
          params={{ slug: entry.slug }}
          className="flex h-full flex-col"
          aria-label={`Open ${entry.title}`}
        >
          <AnimatedBorderTrail
            duration={`${9 + (index % 3)}s`}
            trailSize="md"
            trailColor={index % 2 ? "var(--chrome-3)" : "var(--chrome-2)"}
            className="h-full rounded-[var(--radius-lg)]"
            contentClassName="plate flex h-full flex-col overflow-hidden"
          >
            <div className="overflow-hidden rounded-t-[inherit] bg-paper-tint/30">
              <ImageWithSkeleton
                src={cover}
                alt={`${entry.title} preview`}
                className="w-full h-auto object-contain"
                skeletonHeight="min-h-[220px]"
              />
            </div>
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="label">{entry.tag}</span>
                <span className="caption">{entry.year}</span>
              </div>
              <h3 className="mt-3 text-[1.4rem] leading-tight text-ink">{entry.title}</h3>
              <p className="mt-3 flex-1 text-[0.92rem] leading-[1.75] text-ink-soft">{entry.summary}</p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {entry.tech.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-ink/15 px-2.5 py-1 font-mono text-[0.65rem] tracking-[0.08em] text-ink-soft"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <span className="mt-6 inline-flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-ink">
                Read case
                <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1.5" strokeWidth={1.5} />
              </span>
            </div>
          </AnimatedBorderTrail>
        </Link>
        <EntryLinks entry={entry} className="px-5 pt-4 sm:px-6" />
      </article>
    );
  }

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 30, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-30px", amount: 0.05 }}
      transition={{
        duration: reduced ? 0 : 0.6,
        delay: staggerDelay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group flex h-full flex-col rounded-[var(--radius-lg)]"
    >
      <Link
        to={routeFor[entry.kind]}
        params={{ slug: entry.slug }}
        className="flex h-full flex-col"
        aria-label={`Open ${entry.title}`}
      >
        <AnimatedBorderTrail
          duration={`${9 + (index % 3)}s`}
          trailSize="md"
          trailColor={index % 2 ? "var(--chrome-3)" : "var(--chrome-2)"}
          className="h-full rounded-[var(--radius-lg)]"
          contentClassName="plate flex h-full flex-col overflow-hidden"
        >
          {/* Image — plain div, card article handles the entrance animation */}
          <div className="overflow-hidden rounded-t-[inherit] bg-paper-tint/30">
            <ImageWithSkeleton
              src={cover}
              alt={`${entry.title} preview`}
              className="w-full h-auto object-contain transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              skeletonHeight="min-h-[220px]"
            />
          </div>

          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="label">{entry.tag}</span>
              <span className="caption">{entry.year}</span>
            </div>
            <h3 className="mt-3 text-[1.4rem] leading-tight text-ink">{entry.title}</h3>
            <p className="mt-3 flex-1 text-[0.92rem] leading-[1.75] text-ink-soft">{entry.summary}</p>

            {/* Tech tags — staggered reveal only on desktop */}
            <div className="mt-5 flex flex-wrap gap-1.5">
              {entry.tech.slice(0, 4).map((t, ti) => (
                <motion.span
                  key={t}
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: reduced ? 0 : 0.4,
                    delay: reduced ? 0 : staggerDelay + 0.3 + ti * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="rounded-full border border-ink/15 px-2.5 py-1 font-mono text-[0.65rem] tracking-[0.08em] text-ink-soft"
                >
                  {t}
                </motion.span>
              ))}
            </div>

            <span className="mt-6 inline-flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-ink">
              Read case
              <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1.5" strokeWidth={1.5} />
            </span>
          </div>
        </AnimatedBorderTrail>
      </Link>

      <EntryLinks entry={entry} className="px-5 pt-4 sm:px-6" />
    </motion.article>
  );
}

/** Live / repo / download buttons — shown wherever an entry is listed. */
export function EntryLinks({
  entry,
  className,
  solidFirst = false,
}: {
  entry: Entry;
  className?: string;
  solidFirst?: boolean;
}) {
  const download = entry.kind === "app" ? entry.downloadUrl : undefined;
  if (!entry.liveUrl && !entry.repoUrl && !download) return null;
  const primary = solidFirst ? "press-btn" : "press-btn-outline";

  return (
    <div className={cn("flex flex-row flex-wrap items-center gap-2", className)}>
      {download ? (
        <a
          href={download}
          target="_blank"
          rel="noreferrer noopener"
          download
          onClick={() => {
            void trackDownload({
              slug: entry.slug,
              title: entry.title,
              kind: entry.kind,
              label: entry.downloadLabel || "Download app",
              url: download,
            });
          }}
          className="press-btn"
        >
          {entry.downloadLabel || "Download app"} <Download className="size-3.5" strokeWidth={1.5} />
        </a>
      ) : null}

      {entry.liveUrl ? (
        <ShinyButton as="a" href={entry.liveUrl} target="_blank" rel="noreferrer noopener" variant="cyan">
          Live preview <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
        </ShinyButton>
      ) : null}
      {entry.repoUrl ? (
        <a href={entry.repoUrl} target="_blank" rel="noreferrer noopener" className="press-btn-outline">
          <Github className="size-3.5" strokeWidth={1.5} /> GitHub repo
        </a>
      ) : null}
    </div>
  );
}

export function EntryGrid({ entries, isLoading, className }: { entries: Entry[]; isLoading?: boolean; className?: string }) {
  if (isLoading) {
    return (
      <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {[1, 2, 3].map((n) => (
          <div key={n} className="plate flex h-72 flex-col justify-between p-6 animate-pulse border border-ink/10">
            <div className="h-40 w-full rounded-xl bg-paper-tint/60" />
            <div className="space-y-2 pt-4">
              <div className="h-4 w-1/3 rounded bg-paper-tint/60" />
              <div className="h-3 w-2/3 rounded bg-paper-tint/40" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (!entries.length) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-ink/15 bg-paper-tint/20 px-6 py-20 text-center", className)}>
        <span className="text-3xl">📂</span>
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-ink-soft">Nothing published yet</p>
        <p className="max-w-xs text-[0.88rem] leading-relaxed text-ink-soft/70">Check back soon — new work is added regularly.</p>
      </div>
    );
  }
  return (
    <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {entries.map((e, i) => (
        <EntryCard key={`${e.kind}-${e.slug}`} entry={e} index={i} />
      ))}
    </div>
  );
}

/* ---------------- alternating left/right showcase ---------------- */

export function EntryShowcase({ entries, isLoading, className }: { entries: Entry[]; isLoading?: boolean; className?: string }) {
  const { reduced } = useMotionPreference();
  if (isLoading) {
    return (
      <div className={cn("space-y-12", className)}>
        {[1, 2].map((n) => (
          <div key={n} className="grid gap-8 lg:grid-cols-12 animate-pulse plate p-8 border border-ink/10">
            <div className="lg:col-span-7 h-64 rounded-2xl bg-paper-tint/60" />
            <div className="lg:col-span-5 space-y-4 pt-4">
              <div className="h-4 w-1/4 rounded bg-paper-tint/60" />
              <div className="h-8 w-3/4 rounded bg-paper-tint/80" />
              <div className="h-16 w-full rounded bg-paper-tint/40" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (!entries.length) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-ink/15 bg-paper-tint/20 px-6 py-24 text-center", className)}>
        <span className="text-4xl">📂</span>
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-ink-soft">Nothing published yet</p>
        <p className="max-w-sm text-[0.9rem] leading-relaxed text-ink-soft/70">No entries in this section yet — check back soon, new work is added regularly.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-20 md:space-y-28", className)}>
      {entries.map((entry, i) => {
        const flip = i % 2 === 1;
        const cover = entry.images[0] ?? fallbackImages[i % fallbackImages.length]!;
        const isApp = entry.kind === "app";

        return (
          <motion.article
            key={`${entry.kind}-${entry.slug}`}
            initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: reduced ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12"
          >
            {/* Image plate */}
            <div className={cn(isApp ? "lg:col-span-5 flex justify-center" : "lg:col-span-7", flip ? "lg:order-2" : "")}>
              <motion.div
                initial={reduced ? { opacity: 1, y: 0, rotate: flip ? -2.2 : 2.2, scale: 1 } : { opacity: 0, y: 40, rotate: flip ? 4.5 : -4.5, scale: 0.94 }}
                whileInView={{ opacity: 1, y: 0, rotate: flip ? -2.2 : 2.2, scale: 1 }}
                viewport={{ once: true, margin: "-70px" }}
                transition={{ duration: reduced ? 0 : 1, ease: [0.16, 1, 0.3, 1] }}
                className={cn("will-change-transform", isApp ? "max-w-[340px] w-full" : "w-full")}
                {...(reduced ? {} : { whileHover: { rotate: 0, y: -6 } })}
              >
                <Link
                  to={routeFor[entry.kind]}
                  params={{ slug: entry.slug }}
                  aria-label={`Open ${entry.title}`}
                  className="group block rounded-[var(--radius-lg)]"
                >
                  <AnimatedBorderTrail
                    duration={flip ? "9s" : "7s"}
                    trailSize="lg"
                    trailColor={flip ? "var(--chrome-3)" : "var(--chrome-2)"}
                    className="overflow-hidden rounded-[var(--radius-lg)]"
                    contentClassName="plate overflow-hidden p-2 flex justify-center items-center"
                  >
                    <ImageWithSkeleton
                      src={cover}
                      alt={`${entry.title} preview`}
                      className={cn(
                        "mx-auto rounded-[calc(var(--radius-lg)-0.35rem)] object-contain transition-transform duration-700 ease-out",
                        isApp ? "max-h-[560px] aspect-[9/18.5] w-auto" : "max-h-[480px] w-auto"
                      )}
                      skeletonHeight={isApp ? "min-h-[400px]" : "min-h-[300px]"}
                    />
                  </AnimatedBorderTrail>
                </Link>
              </motion.div>
            </div>

            {/* Text panel */}
            <motion.div
              className={cn("min-w-0", isApp ? "lg:col-span-7" : "lg:col-span-5", flip ? "lg:order-1" : "")}
              initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-70px" }}
              transition={{ duration: reduced ? 0 : 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="label">{entry.tag}</span>
                <span className="caption">{entry.year}</span>
                {entry.status ? <span className="caption">{entry.status}</span> : null}
              </div>
              <Rule className="mt-3" />
              <h3 className="mt-5 text-[clamp(1.7rem,3.2vw,2.5rem)] leading-[1.05] text-ink">{entry.title}</h3>
              <p className="mt-4 text-[0.95rem] leading-[1.8] text-ink-soft">{entry.summary}</p>
              {entry.tech.length > 0 || entry.features.length > 0 ? (
                <dl className="mt-6 space-y-3">
                  {entry.tech.length > 0 ? (
                    <div className="flex gap-5 border-t border-ink/10 pt-3">
                      <dt className="label w-16 shrink-0 pt-1">Tech</dt>
                      <dd className="caption min-w-0 text-ink">{entry.tech.join(" · ")}</dd>
                    </div>
                  ) : null}
                  {entry.features.length > 0 ? (
                    <div className="flex gap-5 border-t border-ink/10 pt-3">
                      <dt className="label w-16 shrink-0 pt-1">Built</dt>
                      <dd className="caption min-w-0 text-ink">{entry.features.slice(0, 4).join(" · ")}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <ShinyButton as={Link} to={routeFor[entry.kind]} params={{ slug: entry.slug }} variant="purple">
                  Read case <ArrowRight className="size-3.5" strokeWidth={1.5} />
                </ShinyButton>
                <EntryLinks entry={entry} />
              </div>
            </motion.div>
          </motion.article>
        );
      })}
    </div>
  );
}

/* ---------------- detail page body ---------------- */

export function EntryDetail({ entry, backTo, backLabel }: { entry: Entry; backTo: string; backLabel: string }) {
  const { reduced } = useMotionPreference();
  const images = entry.images.length ? entry.images : [fallbackImages[0]!];

  const hasTech = entry.tech && entry.tech.length > 0;
  const hasFeatures = entry.features && entry.features.length > 0;
  const hasLinks = !!(entry.liveUrl || entry.repoUrl || (entry.kind === "app" ? entry.downloadUrl : undefined));
  const hasSidebarCard = hasTech || hasFeatures || hasLinks;

  return (
    <div className="relative z-10 px-5 pb-24 sm:px-8 lg:px-14">
      <div className="mx-auto w-full max-w-[84rem]">
        <Link
          to={backTo}
          className="caption inline-flex items-center gap-2 text-ink transition-opacity hover:opacity-60"
        >
          ← {backLabel}
        </Link>

        <div className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-2">
          <span className="label">{entry.tag}</span>
          <span className="caption">{entry.year}</span>
          {entry.client ? <span className="caption">Client — {entry.client}</span> : null}
          {entry.status ? (
            <span className="rounded-full border border-chrome-1/50 bg-chrome-1/10 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-ink">
              {entry.status}
            </span>
          ) : null}
        </div>

        <h1 className="mt-5 max-w-4xl text-[clamp(2.4rem,6vw,4.4rem)]">{entry.title}</h1>
        <p className="mt-6 max-w-2xl text-[1.05rem] leading-[1.85] text-ink-soft">{entry.summary}</p>

        {/* gallery */}
        <div className={cn("mt-12 grid gap-8 justify-items-center", entry.kind === "app" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto" : "grid-cols-1")}>
          {images.map((src, i) => (
            <motion.figure
              key={`${src}-${i}`}
              initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: reduced ? 0 : 0.8, delay: i * 0.08 }}
              className={cn("plate overflow-hidden p-2 flex justify-center items-center", entry.kind === "app" ? "max-w-[320px] w-full" : "w-full")}
            >
              <ImageWithSkeleton
                src={src}
                alt={`${entry.title} screen ${i + 1}`}
                className={cn(
                  "mx-auto h-auto rounded-[calc(var(--radius-lg)-0.35rem)] object-contain",
                  entry.kind === "app" ? "max-h-[580px] aspect-[9/18.5] w-full" : "max-h-[640px] w-auto"
                )}
                skeletonHeight={entry.kind === "app" ? "min-h-[420px]" : "min-h-[320px]"}
              />
            </motion.figure>
          ))}
        </div>

        {/* narrative */}
        <div className="mt-16 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {entry.about?.trim() ? (
              <section>
                <span className="label">About this build</span>
                <Rule className="mt-3" />
                <p className="mt-5 text-[1rem] leading-[1.9] text-ink-soft">{entry.about}</p>
              </section>
            ) : null}

            {entry.problem?.trim() ? (
              <section className={cn(entry.about?.trim() ? "mt-12" : "")}>
                <span className="label">The problem</span>
                <Rule className="mt-3" />
                <p className="mt-5 text-[1rem] leading-[1.9] text-ink-soft">{entry.problem}</p>
              </section>
            ) : null}

            {entry.solution?.trim() ? (
              <section className={cn((entry.about?.trim() || entry.problem?.trim()) ? "mt-12" : "")}>
                <span className="label">What I built</span>
                <Rule className="mt-3" />
                <p className="mt-5 text-[1rem] leading-[1.9] text-ink-soft">{entry.solution}</p>
              </section>
            ) : null}

            {entry.result?.trim() ? (
              <section className={cn((entry.about?.trim() || entry.problem?.trim() || entry.solution?.trim()) ? "mt-12" : "")}>
                <span className="label">Result</span>
                <Rule className="mt-3" />
                <p className="mt-5 text-[1rem] leading-[1.9] text-ink">{entry.result}</p>
              </section>
            ) : null}
          </div>

          <aside className="lg:col-span-5">
            {hasSidebarCard ? (
              <div className="plate-tint p-6">
                {hasTech ? (
                  <>
                    <span className="label">Tech used</span>
                    <Rule className="mt-3" />
                    <div className="mt-4 flex flex-wrap gap-2">
                      {entry.tech.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-ink/15 bg-ink/[0.04] px-3 py-1.5 font-mono text-[0.68rem] tracking-[0.06em] text-ink"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </>
                ) : null}

                {hasFeatures ? (
                  <>
                    <span className={cn("label block", hasTech ? "mt-8" : "")}>Features</span>
                    <Rule className="mt-3" />
                    <ul className="mt-3">
                      {entry.features.map((f) => (
                        <li key={f} className="border-b border-ink/10 py-3 text-[0.92rem] text-ink-soft last:border-b-0">
                          {f}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}

                {hasLinks ? (
                  <EntryLinks entry={entry} className={cn(hasTech || hasFeatures ? "mt-7" : "")} solidFirst />
                ) : null}
              </div>
            ) : null}

            <div className="plate-tint mt-6 p-6">
              <span className="label">Want something like this?</span>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Tell me the scope and timeline — you'll get a plan, not a sales call.
              </p>
              <Link to="/contact" className="press-btn mt-5">
                Start a project <ArrowRight className="size-3.5" strokeWidth={1.5} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
