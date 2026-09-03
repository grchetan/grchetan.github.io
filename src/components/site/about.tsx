import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import AnimatedBorderTrail from "@/components/ui/animated-border-trail";
import inkTexture from "@/assets/texture-ink.jpg";
import { Counter, RegMark, Reveal, Rule, Section, SectionHeading } from "@/components/site/primitives";
import { aboutParagraphs, aboutStats, education, services, techStack, workExperiences } from "@/data/portfolio";
import { TechIconCloud } from "@/components/mage-ui/icon/icon-cloud";
import { getLeetCodeStats } from "@/lib/leetcode.functions";

/* ---------------- About: editorial column set ---------------- */

export function About() {
  const { data: leetcodeData } = useQuery({
    queryKey: ["leetcode", "chetanprajapat07"],
    queryFn: () => getLeetCodeStats("chetanprajapat07"),
    staleTime: 30_000,
  });

  const stats = aboutStats.map((s) =>
    s.label === "LeetCode Solved" && leetcodeData?.total
      ? { ...s, value: leetcodeData.total }
      : s
  );

  return (
    <Section id="about">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <SectionHeading
            eyebrow="About"
            figure="02"
            title="Engineering calm interfaces over complex problems."
          />

          <div className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {aboutParagraphs.map((p, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <p className="text-[0.98rem] leading-[1.8] text-ink-soft">
                  {p}
                </p>
              </Reveal>
            ))}
          </div>
        </div>

        {/* measurements table — breaks the margin on large screens */}
        <div className="lg:col-span-5 lg:-mr-6 lg:pt-24">
          <AnimatedBorderTrail
            duration="7s"
            trailSize="lg"
            trailColor="var(--chrome-2)"
            className="rounded-[var(--radius-lg)]"
            contentClassName="plate-tint relative p-6 sm:p-8"
          >
            <RegMark className="absolute right-4 top-4" />
            <span className="label">Measurements</span>
            <Rule className="mt-3" />
            <dl>
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className="flex items-baseline justify-between gap-4 border-b border-ink/10 py-3.5 last:border-b-0"
                >
                  <dt className="caption">{s.label}</dt>
                  <dd className="font-display text-[1.6rem] leading-none text-ink">
                    <Counter to={s.value} suffix={s.suffix} />
                  </dd>
                </motion.div>
              ))}
            </dl>
          </AnimatedBorderTrail>
          <p className="caption mt-3 pl-1">Tbl. 01 — self-reported, verifiable on request.</p>
        </div>
      </div>
    </Section>
  );
}

/* ---------------- Tech stack: type specimen ---------------- */

export function TechStack() {
  const marquee = techStack.flatMap((g) => g.items);

  return (
    <Section id="stack" tint className="py-20 md:py-28">
      <SectionHeading eyebrow="Instruments" figure="03" title="The tools, set as a specimen." />

      <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="space-y-10 lg:col-span-8">
          {techStack.map((group, gi) => (
            <div key={group.category} className="grid gap-4 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-4">
                <span className="label">{`0${gi + 1} / ${group.category}`}</span>
                <Rule className="mt-3 lg:mt-4" />
              </div>
              <div className="lg:col-span-8">
                <ul className="flex flex-wrap gap-2.5 items-center">
                  {group.items.map((item, i) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.55, delay: i * 0.025 }}
                      whileHover={{ scale: 1.04, y: -2 }}
                      className="rounded-xl border border-ink/10 bg-ink/[0.03] px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-ink/80 transition-all duration-300 hover:border-violet-500/30 hover:bg-violet-500/5 hover:text-violet-600 dark:hover:text-violet-400 shadow-sm"
                    >
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-4"
        >
          <div className="sticky top-28">
            <span className="label">Orbit / drag to spin</span>
            <Rule className="mt-3" />
            <TechIconCloud className="mt-6 flex w-full items-center justify-center" />
          </div>
        </motion.div>
      </div>


      {/* running foot: the same words, small, endless */}
      <div className="relative mt-16 overflow-hidden border-y border-ink/15 py-3">
        <div className="marquee-track flex w-max gap-8 whitespace-nowrap">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex gap-8">
              {marquee.map((m) => (
                <span key={`${dup}-${m}`} className="label">
                  {m}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---------------- Services: numbered index ---------------- */

export function Services() {
  return (
    <Section id="services">
      <img
        loading="lazy"
        decoding="async"
        aria-hidden
        src={inkTexture}
        alt=""
        width={1280}
        height={912}
        className="pointer-events-none absolute -right-48 top-8 hidden w-[38rem] rotate-[172deg] opacity-[0.12] mix-blend-screen [filter:invert(1)_hue-rotate(190deg)_saturate(1.6)_blur(1px)] lg:block"
      />

      <div className="relative grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading
            eyebrow="Services"
            figure="04"
            title="What I can build for you."
            description="Sixteen ways to hire the same discipline. Scope is agreed before a line of code is written."
          />
        </div>

        <div className="lg:col-span-8 lg:pt-6">
          <Rule />
          <ul>
            {services.map((s, i) => (
              <motion.li
                key={s.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: (i % 4) * 0.04 }}
                className="group grid grid-cols-[2.6rem_minmax(0,1fr)] items-baseline gap-x-4 border-b border-ink/10 py-5 transition-colors hover:bg-ink/[0.035] sm:grid-cols-[3.4rem_minmax(0,18rem)_minmax(0,1fr)] sm:gap-x-6"
              >
                <span className="caption tracking-[0.2em]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-[1.35rem] leading-tight text-ink">{s.title}</h3>
                <p className="col-span-2 mt-1.5 text-[0.86rem] leading-relaxed text-muted-foreground sm:col-span-1 sm:mt-0">
                  {s.desc}
                </p>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

/* ---------------- Education: timeline of schooling ---------------- */

export function Education() {
  return (
    <Section id="education" className="pt-0">
      <SectionHeading
        eyebrow="Education"
        figure="04"
        title="Where the training came from."
        description="Formal study running in parallel with real client work since school."
      />

      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        {education.map((e, i) => (
          <motion.article
            key={e.degree}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            className="plate-tint relative p-6 sm:p-7"
          >
            <RegMark className="absolute right-4 top-4" />
            <span className="label">{e.years}</span>
            <h3 className="mt-4 text-[1.25rem] leading-tight text-ink">{e.degree}</h3>
            <p className="mt-2 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-ink-soft">{e.school}</p>
            <Rule className="mt-4" />
            <p className="mt-4 text-[0.9rem] leading-[1.75] text-ink-soft">{e.note}</p>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}

/* ---------------- Work Experience: structured production timeline ---------------- */

export function WorkExperienceSection() {
  return (
    <Section id="experience" className="pt-0">
      <SectionHeading
        eyebrow="Work Experience"
        figure="02c"
        title="Production experience & real-world shipping."
        description="Internships, freelance client shipping and early web design workflows."
      />

      <div className="mt-12 space-y-6">
        {workExperiences.map((exp, i) => {
          const isCurrent = Boolean(exp.current);
          return (
            <motion.article
              key={exp.company}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group relative"
            >
              {isCurrent ? (
                <AnimatedBorderTrail
                  duration="8s"
                  trailSize="md"
                  trailColor="var(--chrome-2)"
                  className="rounded-[var(--radius-lg)]"
                  contentClassName="plate-tint card-depth relative p-6 sm:p-8"
                >
                  <RegMark className="absolute right-4 top-4" />

                  {/* Header Row */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="label font-mono text-chrome-2 uppercase tracking-[0.16em]">
                          {exp.badge ?? "Experience"}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[0.62rem] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Current
                        </span>
                      </div>
                      <h3 className="mt-2.5 text-[clamp(1.25rem,2.5vw,1.65rem)] font-bold leading-tight text-ink">
                        {exp.company}
                      </h3>
                      <p className="mt-1 font-mono text-[0.82rem] font-medium tracking-[0.06em] text-ink-soft">
                        {exp.role}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-paper/80 px-3.5 py-1.5 font-mono text-[0.72rem] font-medium uppercase tracking-[0.12em] text-ink backdrop-blur shadow-sm">
                        {exp.duration}
                      </span>
                    </div>
                  </div>

                  <Rule className="my-5" />

                  {/* Description */}
                  <p className="max-w-[72ch] text-[0.96rem] leading-[1.8] text-ink-soft">
                    {exp.description}
                  </p>

                  {/* Technologies */}
                  <div className="mt-6">
                    <span className="caption block font-mono text-[0.66rem] uppercase tracking-[0.18em] text-ink-soft/80">
                      Technologies & Focus
                    </span>
                    <ul className="mt-3 flex flex-wrap items-center gap-2">
                      {exp.technologies.map((tech) => (
                        <li
                          key={tech}
                          className="rounded-lg border border-ink/10 bg-ink/[0.04] px-3 py-1 font-mono text-[0.72rem] font-semibold tracking-wider text-ink/85 transition-all duration-300 group-hover:border-chrome-2/30"
                        >
                          {tech}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AnimatedBorderTrail>
              ) : (
                <div className="plate card-depth relative p-6 sm:p-8">
                  <RegMark className="absolute right-4 top-4" />

                  {/* Header Row */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
                    <div>
                      {exp.badge ? (
                        <span className="label font-mono uppercase tracking-[0.16em]">
                          {exp.badge}
                        </span>
                      ) : null}
                      <h3 className="mt-2 text-[clamp(1.2rem,2.3vw,1.55rem)] font-bold leading-tight text-ink">
                        {exp.company}
                      </h3>
                      <p className="mt-1 font-mono text-[0.82rem] font-medium tracking-[0.06em] text-ink-soft">
                        {exp.role}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-paper/60 px-3.5 py-1.5 font-mono text-[0.72rem] uppercase tracking-[0.12em] text-ink-soft backdrop-blur">
                        {exp.duration}
                      </span>
                    </div>
                  </div>

                  <Rule className="my-5" />

                  {/* Description */}
                  <p className="max-w-[72ch] text-[0.96rem] leading-[1.8] text-ink-soft">
                    {exp.description}
                  </p>

                  {/* Technologies */}
                  <div className="mt-6">
                    <span className="caption block font-mono text-[0.66rem] uppercase tracking-[0.18em] text-ink-soft/80">
                      Technologies & Focus
                    </span>
                    <ul className="mt-3 flex flex-wrap items-center gap-2">
                      {exp.technologies.map((tech) => (
                        <li
                          key={tech}
                          className="rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-1 font-mono text-[0.72rem] font-medium tracking-wider text-ink/80 transition-colors hover:border-ink/20 hover:text-ink"
                        >
                          {tech}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </motion.article>
          );
        })}
      </div>
    </Section>
  );
}
