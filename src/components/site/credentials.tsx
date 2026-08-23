import { motion } from "motion/react";
import { ArrowUpRight, Award, BadgeCheck, ImageOff } from "lucide-react";
import AnimatedBorderTrail from "@/components/ui/animated-border-trail";
import { Counter, RegMark, Rule, Section, SectionHeading } from "@/components/site/primitives";
import { useCredentials } from "@/lib/credentials";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

function CertificateSkeleton() {
  return (
    <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="plate h-full overflow-hidden p-3 animate-pulse">
          <div className="aspect-[4/3] w-full rounded-xl bg-ink/[0.06] relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-ink/[0.04] to-transparent" />
          </div>
          <div className="px-2 pb-2 pt-4 space-y-2.5">
            <div className="h-2.5 w-20 rounded bg-ink/[0.06]" />
            <div className="h-4 w-3/4 rounded bg-ink/[0.08]" />
            <div className="h-3 w-1/2 rounded bg-ink/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Certificate wall — uploaded certificate images with verify links. */
export function CertificateWall() {
  const { data, isLoading } = useCredentials();
  const certs = data?.certificates ?? [];

  return (
    <Section id="certificates">
      <SectionHeading
        eyebrow="Credentials"
        figure="08"
        title="Every certificate, on the wall."
        description="Courses, hackathons and internships — each card links to the original credential."
      />

      {isLoading && !certs.length ? (
        <CertificateSkeleton />
      ) : (
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certs.map((c, i) => {
            const tilt = i % 3 === 1 ? 1.1 : i % 3 === 2 ? -1.4 : 0.6;
            const Wrapper = c.link ? motion.a : motion.div;
            return (
              <Wrapper
                key={`${c.title}-${i}`}
                {...(c.link ? { href: c.link, target: "_blank", rel: "noreferrer noopener" } : {})}
                initial={{ opacity: 0, y: 22, rotate: tilt }}
                whileInView={{ opacity: 1, y: 0, rotate: tilt }}
                whileHover={{ rotate: 0, y: -6 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: (i % 3) * 0.07, ease }}
                className="group block rounded-[var(--radius-lg)] will-change-transform"
              >
                <AnimatedBorderTrail
                  duration={`${8 + (i % 3) * 2}s`}
                  trailSize="md"
                  trailColor={i % 2 ? "var(--chrome-3)" : "var(--chrome-2)"}
                  className="h-full rounded-[var(--radius-lg)]"
                  contentClassName="plate h-full overflow-hidden p-3"
                >
                  <div className="relative overflow-hidden rounded-xl border border-ink/10 bg-paper-tint">
                    {c.image ? (
                      <img
                        loading="lazy"
                        decoding="async"
                        src={c.image}
                        alt={`${c.title} certificate issued by ${c.issuer}`}
                        width={800}
                        height={560}
                        className="duotone aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="grid aspect-[4/3] w-full place-items-center">
                        <div className="text-center">
                          <ImageOff className="mx-auto size-5 text-ink/25" strokeWidth={1.5} />
                          <p className="caption mt-3">Verified Credential</p>
                        </div>
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-paper/85 px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink backdrop-blur">
                      {c.year}
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
                          <ArrowUpRight
                            className="size-3 transition-transform group-hover:translate-x-0.5"
                            strokeWidth={1.5}
                          />
                        </span>
                      ) : null}
                    </div>
                  </div>
                </AnimatedBorderTrail>
              </Wrapper>
            );
          })}
        </div>
      )}
      {!isLoading && !certs.length ? <p className="caption mt-10">No certificates uploaded yet.</p> : null}
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
