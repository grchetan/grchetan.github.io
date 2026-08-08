import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import plate01 from '@/assets/plate-01.jpg';
import plate02 from '@/assets/plate-02.jpg';
import plateMobile from '@/assets/plate-mobile.jpg';
import {
  Plate,
  Reveal,
  Rule,
  Section,
  SectionHeading,
} from '@/components/site/primitives';
import { projectCategories, projects } from '@/data/portfolio';
import { cn } from '@/lib/utils';

const plates = [plate01, plate02, plateMobile];

export function Projects() {
  const [active, setActive] =
    useState<(typeof projectCategories)[number]>('All');

  const featured = useMemo(
    () => projects.filter((p) => p.featured).slice(0, 4),
    [],
  );
  const rest = useMemo(
    () =>
      projects
        .filter((p) => !featured.includes(p))
        .filter((p) => active === 'All' || p.category === active),
    [active, featured],
  );

  return (
    <Section id="projects">
      <SectionHeading
        eyebrow="Selected work"
        figure="05"
        title="Plates from the working board."
        description="Four builds pulled out and mounted. The rest are indexed below, catalogue style."
      />

      {/* featured plates — staggered, never a uniform grid */}
      <div className="mt-16 space-y-24 md:mt-24 md:space-y-32">
        {featured.map((p, i) => {
          const flip = i % 2 === 1;
          return (
            <article
              key={p.title}
              className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10"
            >
              <div
                className={cn(
                  'lg:col-span-7',
                  flip ? 'lg:order-2 lg:col-start-6' : '',
                  i === 1 ? 'lg:pt-10' : '',
                  i === 3 ? 'lg:pt-6' : '',
                )}
              >
                <Plate
                  src={plates[i % plates.length] ?? plate01}
                  alt={`${p.title} interface plate`}
                  caption={p.title}
                  figure={`Pl. ${String(i + 1).padStart(2, '0')}`}
                  tilt={flip ? 1.1 : -1.2}
                  width={1280}
                  height={960}
                  className={flip ? 'lg:-mr-10' : 'lg:-ml-6'}
                />
              </div>

              <div
                className={cn(
                  'lg:col-span-5 lg:pt-4',
                  flip ? 'lg:order-1 lg:col-start-1' : '',
                )}
              >
                <span className="label">{p.category}</span>
                <Rule className="mt-3" />
                <Reveal delay={0.05}>
                  <h3 className="mt-5 text-[clamp(1.9rem,3.4vw,2.8rem)] leading-[1.02]">
                    {p.title}
                  </h3>
                </Reveal>
                <Reveal delay={0.1}>
                  <p className="mt-4 text-[0.95rem] leading-[1.8] text-ink-soft">
                    {p.description}
                  </p>
                </Reveal>

                <dl className="mt-7 space-y-3">
                  <div className="flex gap-6 border-t border-ink/10 pt-3">
                    <dt className="label w-20 shrink-0 pt-1">Stack</dt>
                    <dd className="caption text-ink">{p.tech.join(' · ')}</dd>
                  </div>
                  <div className="flex gap-6 border-t border-ink/10 pt-3">
                    <dt className="label w-20 shrink-0 pt-1">Built</dt>
                    <dd className="caption text-ink">
                      {p.features.join(' · ')}
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          );
        })}
      </div>

      {/* catalogue index */}
      <div className="mt-28">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <span className="label">Full catalogue</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {projectCategories.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={cn(
                  'label transition-colors',
                  active === c
                    ? 'text-ink underline underline-offset-4'
                    : 'hover:text-ink',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <Rule className="mt-3" />

        <ul>
          {rest.map((p, i) => (
            <motion.li
              key={p.title}
              layout
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: (i % 5) * 0.04 }}
              className="group grid grid-cols-[2.4rem_minmax(0,1fr)_auto] items-baseline gap-x-4 border-b border-ink/10 py-4 transition-colors hover:bg-ink/[0.035] sm:grid-cols-[3rem_minmax(0,15rem)_minmax(0,1fr)_auto] sm:gap-x-6"
            >
              <span className="caption tracking-[0.2em]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h4 className="text-[1.15rem] leading-snug text-ink">
                {p.title}
              </h4>
              <p className="col-span-2 mt-1 text-[0.82rem] leading-relaxed text-muted-foreground sm:col-span-1 sm:mt-0">
                {p.tech.join(' · ')}
              </p>
              <ArrowUpRight
                className="size-3.5 translate-y-[-1px] text-ink/30 transition-all group-hover:translate-x-0.5 group-hover:text-ink"
                strokeWidth={1.5}
              />
            </motion.li>
          ))}
        </ul>
        {rest.length === 0 ? (
          <p className="caption py-8">No entries filed under this heading.</p>
        ) : null}
      </div>
    </Section>
  );
}
