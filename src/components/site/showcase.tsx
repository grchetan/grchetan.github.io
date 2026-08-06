import { motion } from "motion/react";
import { ArrowUpRight, Quote } from "lucide-react";
import plateMobile from "@/assets/plate-mobile.jpg";
import inkTexture from "@/assets/texture-ink.jpg";
import {
  Counter,
  Plate,
  RegMark,
  Reveal,
  Rule,
  Section,
  SectionHeading,
} from "@/components/site/primitives";
import {
  achievements,
  certificates,
  codingProfiles,
  experience,
  freelanceWork,
  githubActivity,
  githubLanguages,
  mobileApps,
  pinnedRepos,
  processSteps,
  testimonials,
  whyHireMe,
} from "@/data/portfolio";

/* ---------------- Freelance: case-study spreads ---------------- */

export function Freelance() {
  return (
    <Section id="freelance" tint>
      <SectionHeading
        eyebrow="Freelance"
        figure="06"
        title="Client problems, solved end to end."
        description="Three commissions, documented the way a printer documents a job: brief, method, result."
      />

      <div className="mt-16 space-y-16">
        {freelanceWork.map((w, i) => (
          <article key={w.client} className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-4">
              <span className="caption tracking-[0.2em]">Case {String(i + 1).padStart(2, "0")}</span>
              <Reveal>
                <h3 className="mt-3 text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.05]">{w.client}</h3>
              </Reveal>
              <p className="caption mt-3">{w.project}</p>
              <p className="caption mt-6 text-ink">{w.tech.join(" · ")}</p>
            </div>

            <div className="lg:col-span-8">
              <Rule />
              {[
                { k: "Brief", v: w.problem },
                { k: "Method", v: w.solution },
                { k: "Result", v: w.result },
              ].map((row, ri) => (
                <motion.div
                  key={row.k}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, delay: ri * 0.07 }}
                  className="grid gap-x-8 gap-y-1.5 border-b border-ink/10 py-5 sm:grid-cols-[7rem_minmax(0,1fr)]"
                >
                  <span className="label pt-1">{row.k}</span>
                  <p className="text-[0.95rem] leading-[1.75] text-ink-soft">{row.v}</p>
                </motion.div>
              ))}

              <blockquote className="mt-6 max-w-2xl font-display text-[1.35rem] leading-[1.35] italic text-ink">
                “{w.testimonial}”
              </blockquote>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ---------------- Mobile apps ---------------- */

export function MobileAppsSection() {
  return (
    <Section id="apps">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <SectionHeading
            eyebrow="Mobile"
            figure="07"
            title="Apps that fit in a hand."
            description="Cross-platform builds in React Native — offline-first, small bundles, honest interfaces."
          />

          <div className="mt-10">
            <Rule />
            {mobileApps.map((a, i) => (
              <motion.div
                key={a.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.07 }}
                className="border-b border-ink/10 py-5"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-[1.3rem] leading-tight text-ink">{a.name}</h3>
                  <span className="caption tracking-[0.2em]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-muted-foreground">{a.desc}</p>
                <p className="caption mt-2 text-ink">{a.tech.join(" · ")}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 lg:pl-8 lg:pt-16">
          <Plate
            src={plateMobile}
            alt="Mobile application screens printed as paper plates"
            caption="Screens, trimmed and laid out"
            figure="Pl. 05"
            tilt={-1.4}
            width={1280}
            height={960}
            className="lg:-mr-10"
          />
        </div>
      </div>
    </Section>
  );
}

/* ---------------- Certificates ---------------- */

export function Certificates() {
  return (
    <Section id="certificates" tint>
      <SectionHeading eyebrow="Credentials" figure="08" title="Learning, verified." />

      <div className="mt-14">
        <Rule />
        {certificates.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.55, delay: (i % 5) * 0.04 }}
            className="grid grid-cols-[3rem_minmax(0,1fr)] items-baseline gap-x-4 border-b border-ink/10 py-4 sm:grid-cols-[3rem_minmax(0,22rem)_minmax(0,1fr)_5rem] sm:gap-x-6"
          >
            <span className="caption tracking-[0.2em]">{c.year}</span>
            <h3 className="text-[1.1rem] leading-snug text-ink">{c.title}</h3>
            <p className="caption col-span-2 mt-1 sm:col-span-1 sm:mt-0">{c.issuer}</p>
            <p className="caption col-span-2 sm:col-span-1 sm:text-right">{c.category}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ---------------- Experience ---------------- */

export function Experience() {
  return (
    <Section id="experience">
      <img
        loading="lazy"
        decoding="async"
        aria-hidden
        src={inkTexture}
        alt=""
        width={1280}
        height={912}
        className="pointer-events-none absolute -left-52 bottom-0 hidden w-[36rem] rotate-[186deg] opacity-[0.12] mix-blend-screen [filter:invert(1)_hue-rotate(240deg)_saturate(1.6)_blur(1px)] lg:block"
      />
      <div className="relative">
        <SectionHeading eyebrow="Record" figure="09" title="The road so far." />

        <div className="mt-14 space-y-0">
          {experience.map((e, i) => (
            <motion.article
              key={e.role}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.65, delay: i * 0.05 }}
              className="grid gap-4 border-t border-ink/15 py-8 lg:grid-cols-12 lg:gap-10"
            >
              <div className="lg:col-span-3">
                <span className="caption tracking-[0.2em] text-ink">{e.period}</span>
                <p className="label mt-2">{e.kind}</p>
              </div>
              <div className="lg:col-span-4">
                <h3 className="text-[1.5rem] leading-tight text-ink">{e.role}</h3>
                <p className="caption mt-1.5">{e.org}</p>
              </div>
              <ul className="space-y-2 lg:col-span-5">
                {e.points.map((pt) => (
                  <li key={pt} className="flex gap-3 text-[0.9rem] leading-relaxed text-ink-soft">
                    <span aria-hidden className="mt-2 h-px w-4 shrink-0 bg-ink/40" />
                    {pt}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
          <Rule className="bg-ink/15" />
        </div>
      </div>
    </Section>
  );
}

/* ---------------- Achievements: numerals as art ---------------- */

export function Achievements() {
  return (
    <Section id="achievements" tint>
      <SectionHeading eyebrow="Achievements" figure="10" title="Numbers that keep climbing." />

      <div className="mt-14 grid grid-cols-2 gap-px border border-ink/15 bg-ink/15 md:grid-cols-4">
        {achievements.map((a, i) => (
          <motion.div
            key={a.label}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: i * 0.05 }}
            className="relative overflow-hidden bg-paper-tint px-5 py-9 sm:px-7 sm:py-12"
          >
            <span aria-hidden className="hatch absolute -right-4 -top-6 size-24 rotate-12" />
            <p className="relative font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-none text-ink">
              <Counter to={a.value} suffix={a.suffix} />
            </p>
            <p className="label mt-4">{a.label}</p>
          </motion.div>
        ))}
        <div className="hidden bg-paper-tint md:block" />
      </div>
    </Section>
  );
}

/* ---------------- Coding profiles ---------------- */

export function CodingProfiles() {
  return (
    <Section id="profiles">
      <SectionHeading
        eyebrow="Practice"
        figure="11"
        title="Where I practise in public."
        description="Consistent problem solving and open contribution, not just portfolio pieces."
      />

      <div className="mt-14 grid gap-px border border-ink/15 bg-ink/15 sm:grid-cols-2 lg:grid-cols-3">
        {codingProfiles.map((p, i) => (
          <motion.a
            key={p.platform}
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
              <h3 className="text-[1.4rem] leading-tight text-ink">{p.platform}</h3>
              <ArrowUpRight
                className="size-3.5 text-ink/30 transition-all group-hover:translate-x-0.5 group-hover:text-ink"
                strokeWidth={1.5}
              />
            </div>
            <p className="caption mt-2">{p.username}</p>
            <p className="mt-6 font-display text-[1.6rem] leading-none text-ink">{p.stat}</p>
            <p className="caption mt-2">{p.meta}</p>
            <p className="label mt-5">{p.badges.join(" / ")}</p>
          </motion.a>
        ))}
      </div>
    </Section>
  );
}

/* ---------------- GitHub ---------------- */

export function GitHubSection() {
  return (
    <Section id="github" tint>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <SectionHeading eyebrow="GitHub" figure="12" title="Committed, most days." />

          <div className="mt-10">
            <span className="label">Language distribution</span>
            <Rule className="mt-3" />
            {githubLanguages.map((l, i) => (
              <div key={l.name} className="border-b border-ink/10 py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[0.95rem] text-ink">{l.name}</span>
                  <span className="caption tabular-nums">{l.pct}%</span>
                </div>
                <div className="mt-2.5 h-px w-full bg-ink/10">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: l.pct / 100 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 1.1, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: "left" }}
                    className="h-[3px] -translate-y-[1px] bg-ink"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 lg:pt-6">
          <div className="plate relative p-6 sm:p-8">
            <RegMark className="absolute right-4 top-4" />
            <span className="label">Pinned repositories</span>
            <Rule className="mt-3" />
            {pinnedRepos.map((r) => (
              <a
                key={r.name}
                href={`https://github.com/grchetan/${r.name}`}
                target="_blank"
                rel="noreferrer noopener"
                className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 border-b border-ink/10 py-4 last:border-b-0 transition-opacity hover:opacity-80"
              >
                <div className="min-w-0">
                  <h3 className="truncate font-mono text-[0.9rem] text-ink group-hover:underline">
                    {r.name}
                  </h3>
                  <p className="caption mt-1">{r.desc}</p>
                </div>
                <p className="caption tabular-nums">
                  {r.lang}
                </p>
              </a>
            ))}
          </div>

          <div className="mt-8">
            <span className="label">Recent activity</span>
            <Rule className="mt-3" />
            <ul className="mt-1">
              {githubActivity.map((a) => (
                <li key={a} className="caption border-b border-ink/10 py-3 text-ink">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------------- Testimonials ---------------- */

export function Testimonials() {
  const [lead, ...others] = testimonials;
  if (!lead) return null;

  return (
    <Section id="testimonials">
      <SectionHeading eyebrow="Testimony" figure="13" title="In their words." />

      <div className="mt-14 grid gap-10 lg:grid-cols-12">
        <figure className="lg:col-span-7">
          <Quote className="size-6 text-ink/30" strokeWidth={1} />
          <blockquote className="mt-5 font-display text-[clamp(1.7rem,3.4vw,2.7rem)] leading-[1.2] italic text-ink">
            “{lead.quote}”
          </blockquote>
          <figcaption className="caption mt-6">
            {lead.name} — {lead.role}
          </figcaption>
        </figure>

        <div className="lg:col-span-5 lg:pt-10">
          <Rule />
          {others.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.07 }}
              className="border-b border-ink/10 py-5"
            >
              <blockquote className="text-[0.92rem] leading-relaxed text-ink-soft">
                “{t.quote}”
              </blockquote>
              <figcaption className="caption mt-3">
                {t.name} — {t.role}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---------------- Process ---------------- */

export function Process() {
  return (
    <Section id="process" tint>
      <SectionHeading
        eyebrow="Method"
        figure="14"
        title="Seven steps, every time."
        description="No mystery, no drift. You always know which plate is on the press."
      />

      <div className="mt-14 grid gap-x-10 md:grid-cols-2">
        {processSteps.map((s, i) => (
          <motion.div
            key={s.step}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: (i % 2) * 0.06 }}
            className="grid grid-cols-[3.6rem_minmax(0,1fr)] items-baseline gap-x-5 border-b border-ink/10 py-6"
          >
            <span className="font-display text-[2.2rem] leading-none text-ink/35">{s.step}</span>
            <div>
              <h3 className="text-[1.35rem] leading-tight text-ink">{s.title}</h3>
              <p className="mt-2 text-[0.88rem] leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ---------------- Why hire me ---------------- */

export function WhyHireMe() {
  return (
    <Section id="why">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading eyebrow="Standards" figure="15" title="How I work." />
        </div>
        <ul className="lg:col-span-8 lg:pt-6">
          <Rule />
          {whyHireMe.map((w, i) => (
            <motion.li
              key={w.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.55, delay: (i % 4) * 0.05 }}
              className="grid items-baseline gap-x-8 gap-y-1 border-b border-ink/10 py-5 sm:grid-cols-[14rem_minmax(0,1fr)]"
            >
              <h3 className="text-[1.15rem] leading-snug text-ink">{w.title}</h3>
              <p className="text-[0.88rem] leading-relaxed text-muted-foreground">{w.desc}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
