import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Award, BadgeCheck, ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";
import AnimatedBorderTrail from "@/components/ui/animated-border-trail";
import { Counter, RegMark, Rule, Section, SectionHeading } from "@/components/site/primitives";
import { useCredentials } from "@/lib/credentials";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Types ─────────────────────────────── */
interface Cert {
  title: string;
  issuer: string;
  category?: string;
  year?: string | number;
  image?: string;
  link?: string;
}

/* ── Lightbox Modal ─────────────────────── */

function CertificateImageDisplay({
  cert,
  inLightbox = false,
}: {
  cert: Certificate;
  inLightbox?: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [cert.image, cert.title]);

  const showImage = Boolean(cert.image && !imgError);

  if (showImage) {
    return (
      <img
        loading="lazy"
        decoding="async"
        src={cert.image}
        alt={`${cert.title} certificate issued by ${cert.issuer}`}
        width={800}
        height={560}
        onError={() => setImgError(true)}
        className={cn(
          inLightbox
            ? "w-full object-contain max-h-[55vh]"
            : "aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        )}
        style={{ display: "block" }}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center justify-center p-6 text-center select-none overflow-hidden",
        inLightbox
          ? "aspect-video min-h-[280px] max-h-[55vh] bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 text-white"
          : "aspect-[4/3] bg-gradient-to-br from-paper via-paper-tint to-paper text-ink"
      )}
    >
      <div className="absolute inset-2 rounded-xl border border-dashed border-ink/15 dark:border-white/10 pointer-events-none" />
      <div className="absolute inset-3 rounded-lg border border-ink/5 dark:border-white/5 pointer-events-none" />

      <div className="relative mb-2.5 flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-md">
        <Award className="size-5" strokeWidth={2} />
      </div>

      <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft dark:text-white/60">
        {cert.issuer || "Official Academy"}
      </span>
      <h4 className="mt-1 max-w-[90%] font-display text-sm font-bold leading-snug text-ink dark:text-white sm:text-base">
        {cert.title}
      </h4>

      <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[0.55rem] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Verified Credential · {cert.year}
      </div>
    </div>
  );
}

function CertificateLightbox({
  certs,
  index,
  onClose,
}: {
  certs: Cert[];
  index: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);
  const cert = certs[current]!;
  const total = certs.length;

  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);

  /* keyboard navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  /* lock scroll */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ duration: 0.35, ease }}
        className="relative z-10 w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/95 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl">

          {/* Top bar */}
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-white/60">
                {current + 1} / {total}
              </span>
              {cert.category && (
                <span className="hidden font-mono text-[0.65rem] uppercase tracking-[0.14em] text-white/40 sm:block">
                  {cert.category}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-all hover:border-white/30 hover:bg-white/15 hover:text-white"
              aria-label="Close"
            >
              <X className="size-4" strokeWidth={1.6} />
            </button>
          </div>

          {/* Image area */}
          <div className="relative bg-zinc-900">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
              >
                <CertificateImageDisplay cert={cert} inLightbox />
              </motion.div>
            </AnimatePresence>

            {/* Left / Right nav overlays */}
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 grid size-10 place-items-center rounded-full border border-white/10 bg-black/50 text-white/70 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-black/70 hover:text-white disabled:opacity-30"
              aria-label="Previous certificate"
            >
              <ChevronLeft className="size-5" strokeWidth={1.8} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 grid size-10 place-items-center rounded-full border border-white/10 bg-black/50 text-white/70 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-black/70 hover:text-white disabled:opacity-30"
              aria-label="Next certificate"
            >
              <ChevronRight className="size-5" strokeWidth={1.8} />
            </button>
          </div>

          {/* Bottom info + actions */}
          <div className="flex flex-col gap-4 border-t border-white/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="truncate text-[1rem] font-semibold leading-snug text-white sm:text-[1.1rem]">
                    {cert.title}
                  </h3>
                  <p className="mt-1 text-[0.8rem] text-white/50">{cert.issuer}{cert.year ? ` · ${cert.year}` : ""}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {/* Dot indicators */}
              <div className="flex items-center gap-1.5">
                {certs.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={cn(
                      "size-1.5 rounded-full transition-all duration-300",
                      i === current
                        ? "w-4 bg-white"
                        : "bg-white/25 hover:bg-white/50"
                    )}
                    aria-label={`Go to certificate ${i + 1}`}
                  />
                ))}
              </div>

              {cert.link && (
                <a
                  href={cert.link}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-zinc-900 transition-opacity hover:opacity-85"
                >
                  Verify
                  <ArrowUpRight className="size-3" strokeWidth={2} />
                </a>
              )}
            </div>
          </div>

          {/* Bottom nav bar (mobile friendly) */}
          <div className="flex items-center justify-between border-t border-white/8 px-5 py-3 sm:hidden">
            <button
              onClick={prev}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[0.75rem] font-medium text-white/60 transition-all hover:border-white/25 hover:text-white"
            >
              <ChevronLeft className="size-4" strokeWidth={1.8} /> Prev
            </button>
            <button
              onClick={next}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[0.75rem] font-medium text-white/60 transition-all hover:border-white/25 hover:text-white"
            >
              Next <ChevronRight className="size-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CertificateSkeleton() {
  return (
    <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="plate h-full overflow-hidden p-3">
          <div className="aspect-[4/3] w-full rounded-xl bg-zinc-200 dark:bg-zinc-700 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[skeletonShimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent" />
          </div>
          <div className="px-2 pb-2 pt-4 space-y-2.5">
            <div className="h-2.5 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-3 w-1/2 rounded bg-zinc-200/70 dark:bg-zinc-700/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Certificate wall — click to open lightbox, verify link inside modal. */
export function CertificateWall() {
  const { data, isLoading } = useCredentials();
  const certs = data?.certificates ?? [];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <Section id="certificates">
      <SectionHeading
        eyebrow="Credentials"
        figure="08"
        title="Every certificate, on the wall."
        description="Courses, hackathons and internships — click any card to view it full size."
      />

      {isLoading && !certs.length ? (
        <CertificateSkeleton />
      ) : (
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certs.map((c, i) => {
            const tilt = i % 3 === 1 ? 1.1 : i % 3 === 2 ? -1.4 : 0.6;
            return (
              <motion.button
                key={`${c.title}-${i}`}
                onClick={() => setLightboxIndex(i)}
                initial={{ opacity: 0, y: 22, rotate: tilt }}
                whileInView={{ opacity: 1, y: 0, rotate: tilt }}
                whileHover={{ rotate: 0, y: -6 }}
                viewport={{ once: true, amount: 0.05 }}
                transition={{ duration: 0.7, delay: (i % 3) * 0.07, ease }}
                className="group block rounded-[var(--radius-lg)] will-change-transform text-left w-full cursor-pointer"
              >
                <AnimatedBorderTrail
                  duration={`${8 + (i % 3) * 2}s`}
                  trailSize="md"
                  trailColor={i % 2 ? "var(--chrome-3)" : "var(--chrome-2)"}
                  className="h-full rounded-[var(--radius-lg)]"
                  contentClassName="plate h-full overflow-hidden p-3"
                >
                  <div className="relative overflow-hidden rounded-xl border border-ink/10 bg-paper-tint">
                    <CertificateImageDisplay cert={c} />
                    <span className="absolute left-3 top-3 rounded-full bg-paper/85 px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink backdrop-blur">
                      {c.year}
                    </span>
                    {/* View hint on hover */}
                    <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/25 group-hover:opacity-100">
                      <span className="scale-75 rounded-full border border-white/30 bg-black/60 px-4 py-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-white backdrop-blur transition-all duration-300 group-hover:scale-100">
                        View
                      </span>
                    </span>
                  </div>

                  <div className="px-2 pb-2 pt-4">
                    <p className="label">{c.category}</p>
                    <h3 className="mt-2 text-[1.1rem] leading-snug text-ink">{c.title}</h3>
                    <div className="mt-3 flex items-baseline justify-between gap-3">
                      <p className="caption">{c.issuer}</p>
                      {c.link ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink">
                          Verify
                          <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
                        </span>
                      ) : null}
                    </div>
                  </div>
                </AnimatedBorderTrail>
              </motion.button>
            );
          })}
        </div>
      )}
      {!isLoading && !certs.length ? <p className="caption mt-10">No certificates uploaded yet.</p> : null}

      {/* Lightbox Portal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <CertificateLightbox
            certs={certs}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </Section>
  );
}


/** Achievements — counters plus optional proof images. */
export function AchievementWall() {
  const { data, isLoading } = useCredentials();
  const list = data?.achievements ?? credentialsDefault.achievements;
  const proofs = list.filter((a) => Boolean(a.image));

  return (
    <Section id="achievements" tint>
      <SectionHeading
        eyebrow="Achievements — Live"
        figure="09"
        title="Numbers, badges and proof."
        description="Counted from real shipped work — with verified proof certificates synced live from the admin studio."
      />

      {isLoading && !list.length ? (
        <div className="mt-14 grid grid-cols-2 gap-px border border-ink/15 bg-ink/15 md:grid-cols-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-paper-tint px-5 py-9 sm:px-7 sm:py-12 space-y-3">
              <div className="h-8 w-16 rounded bg-ink/[0.08]" />
              <div className="h-3 w-28 rounded bg-ink/[0.05]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-14 grid grid-cols-2 gap-px border border-ink/15 bg-ink/15 md:grid-cols-4">
          {list.map((a, i) => (
            <motion.div
              key={`${a.label}-${i}`}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="relative overflow-hidden bg-paper-tint px-5 py-9 sm:px-7 sm:py-12"
            >
              <span aria-hidden className="hatch absolute -right-4 -top-6 size-24 rotate-12" />
              <p className="relative font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-none text-ink">
                <Counter to={a.value} suffix={a.suffix ?? ""} />
              </p>
              <p className="label mt-4">{a.label}</p>
              {a.note ? <p className="caption mt-2 text-ink-soft">{a.note}</p> : null}
            </motion.div>
          ))}
        </div>
      )}

      {proofs.length ? (
        <div className="mt-16">
          <div className="flex items-baseline justify-between gap-3">
            <span className="label">Achievement Proofs & Badges</span>
            <span className="caption">{proofs.length} verified {proofs.length === 1 ? "proof" : "proofs"}</span>
          </div>
          <Rule className="mt-3" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {proofs.map((a, i) => {
              const Wrapper = a.link ? motion.a : motion.div;
              return (
                <Wrapper
                  key={`${a.label}-proof-${i}`}
                  {...(a.link ? { href: a.link, target: "_blank", rel: "noreferrer noopener" } : {})}
                  initial={{ opacity: 0, y: 18, rotate: i % 2 ? -1.2 : 1 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ rotate: 0, y: -5 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.7, delay: i * 0.06, ease }}
                  className="group block rounded-[var(--radius-lg)] will-change-transform"
                >
                  <AnimatedBorderTrail
                    duration={`${9 + (i % 3) * 2}s`}
                    trailSize="md"
                    trailColor={i % 2 ? "var(--chrome-2)" : "var(--chrome-1)"}
                    className="h-full rounded-[var(--radius-lg)]"
                    contentClassName="plate h-full overflow-hidden p-3"
                  >
                    <RegMark className="absolute right-4 top-4 z-10" />
                    <div className="relative overflow-hidden rounded-xl border border-ink/10 bg-paper-tint">
                      <img
                        loading="lazy"
                        decoding="async"
                        src={a.image}
                        alt={`${a.label} achievement certificate`}
                        width={800}
                        height={560}
                        className="duotone aspect-[4/3] w-full rounded-xl object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="px-2 pb-2 pt-4 flex items-center justify-between gap-3">
                      <p className="inline-flex items-center gap-2 text-[1rem] font-medium text-ink">
                        <Award className="size-4 shrink-0 text-chrome-2" strokeWidth={1.5} /> {a.label}
                      </p>
                      {a.link ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink">
                          Verify
                          <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
                        </span>
                      ) : null}
                    </div>
                  </AnimatedBorderTrail>
                </Wrapper>
              );
            })}
          </div>
        </div>
      ) : null}
    </Section>
  );
}

/** Coding profile IDs — LeetCode, GitHub, CodeChef and friends. */
export function ProfileIds({ className }: { className?: string }) {
  const { data } = useCredentials();
  const profiles = data?.profiles ?? credentialsDefault.profiles;

  return (
    <Section id="profiles" className={cn(className)}>
      <SectionHeading
        eyebrow="Profiles"
        figure="10"
        title="Where I practise in public."
        description="Handles and live stats across the platforms I actually use."
      />

      <div className="mt-14 grid gap-px border border-ink/15 bg-ink/15 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p, i) => (
          <motion.a
            key={`${p.platform}-${i}`}
            href={p.url}
            target="_blank"
            rel="noreferrer noopener"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, delay: i * 0.05 }}
            className="group relative bg-paper p-6 transition-colors hover:bg-paper-tint sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-[1.35rem] leading-tight text-ink">{p.platform}</h3>
              <ArrowUpRight
                className="size-3.5 text-ink/30 transition-all group-hover:translate-x-0.5 group-hover:text-ink"
                strokeWidth={1.5}
              />
            </div>
            <p className="caption mt-2 inline-flex items-center gap-1.5">
              <BadgeCheck className="size-3" strokeWidth={1.5} /> {p.username}
            </p>
            <p className="mt-6 font-display text-[1.5rem] leading-none text-ink">{p.stat}</p>
            <p className="caption mt-2">{p.meta}</p>
            {p.badges.length ? <p className="label mt-5">{p.badges.join(" / ")}</p> : null}
          </motion.a>
        ))}
      </div>
    </Section>
  );
}
