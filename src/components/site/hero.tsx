import { motion, useScroll, useTransform } from "motion/react";
import { ArrowDownRight, ArrowUpRight, Gamepad2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import portrait from "@/assets/portrait-main.jpg";
import inkTexture from "@/assets/texture-ink.jpg";
import { Magnetic, RegMark, Rule } from "@/components/site/primitives";
import { profile } from "@/data/portfolio";
import { VisitCounter } from "@/components/site/visit-counter";
import HeroSectionTextHover from "@/components/mage-ui/hero/hero-section-text-hover";
import { SwapText } from "@/components/ui/swap-text";
import versionData from "../../../version.json";

const index = [
  { k: "Discipline", v: "Full stack engineering" },
  { k: "Availability", v: "Available 24/7 (Anytime)" },
  { k: "Shipped", v: "40+ projects · 14 clients" },
  { k: "Status", v: "Open for commissions" },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const portraitY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const typeY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  return (
    <header ref={ref} id="top" className="relative z-10 overflow-hidden pb-20 pt-28 md:pb-28 md:pt-36">
      <div aria-hidden className="board pointer-events-none absolute inset-0" />

      {/* torn ink strip, bleeding off the left margin */}
      <img
        aria-hidden
        src={inkTexture}
        alt=""
        width={1280}
        height={912}
        className="pointer-events-none absolute -left-40 top-[42%] hidden w-[34rem] rotate-[-8deg] opacity-[0.14] mix-blend-screen [filter:invert(1)_hue-rotate(210deg)_saturate(1.6)_blur(1px)] lg:block"
      />

      <div className="relative mx-auto w-full max-w-[84rem] px-5 sm:px-8 lg:px-14">
        {/* masthead line */}
        <div className="flex items-baseline justify-between gap-6">
          <span className="label">Portfolio · Edition MMXXVI · v{versionData.version}</span>
          <span className="caption hidden tracking-[0.2em] sm:block">No. 001 — Paste-up</span>
        </div>
        <Rule className="mt-3" />

        <div className="relative mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-6">
          {/* colossal name */}
          <motion.div style={{ y: typeY }} className="lg:col-span-8">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="label"
            >
              Full stack developer · UI engineer
            </motion.p>

            <h1 className="mt-5 text-[clamp(3.4rem,13vw,10.5rem)] leading-[0.86]">
              <HeroSectionTextHover
                first={
                  <motion.span
                    initial={{ opacity: 0, y: "0.2em" }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="block"
                  >
                    Chetan
                  </motion.span>
                }
                second={
                  <motion.span
                    initial={{ opacity: 0, y: "0.2em" }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                    className="chrome-text -ml-[0.02em] block italic"
                  >
                    Prajapat
                  </motion.span>
                }
              />
            </h1>


            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.35 }}
              className="mt-9 max-w-md lg:mt-12"
            >
              <p className="text-[1.02rem] leading-[1.75] text-ink-soft">
                I build fast, scalable websites and web applications — from the type on the page to
                the query on the server. Quiet interfaces, careful engineering.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Magnetic strength={10}>
                  <Link to="/contact" className="press-btn">
                    Commission a build <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
                  </Link>
                </Magnetic>
                <Magnetic strength={10}>
                  <a href="#work" className="press-btn-outline">
                    Selected work <ArrowDownRight className="size-3.5" strokeWidth={1.5} />
                  </a>
                </Magnetic>
                <Magnetic strength={10}>
                  <Link to="/arcade" className="press-btn-outline border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2">
                    Play Arcade <Gamepad2 className="size-3.5 animate-pulse text-rose-500 dark:text-rose-400" strokeWidth={1.5} />
                  </Link>
                </Magnetic>
              </div>
            </motion.div>
          </motion.div>

          {/* portrait plate, mounted askew and breaking the column */}
          <motion.div style={{ y: portraitY }} className="relative lg:col-span-4">
            <motion.figure
              initial={{ opacity: 0, y: 30, rotate: 3.4 }}
              animate={{ opacity: 1, y: 0, rotate: 1.6 }}
              transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="plate relative mx-auto max-w-[19rem] p-2.5 lg:absolute lg:top-4 lg:right-0 lg:mx-0 lg:max-w-none lg:w-[21rem]"
            >
              <img
                src={portrait}
                alt="Portrait of Chetan Prajapat, full stack developer"
                width={1024}
                height={1280}
                className="duotone w-full object-cover"
              />
              <figcaption className="mt-2.5 flex items-baseline justify-between gap-3 px-0.5 pb-0.5">
                <span className="caption">Chetan, at the desk</span>
                <span className="caption tracking-[0.2em]">Fig. 01</span>
              </figcaption>
            </motion.figure>

            <RegMark className="absolute -left-6 top-1/2 hidden lg:block" />
          </motion.div>
        </div>

        {/* colophon index */}
        <div className="mt-16 lg:mt-24">
          <Rule />
          <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
            {index.map((row, i) => (
              <motion.div
                key={row.k}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 + i * 0.08 }}
                className="border-b border-ink/10 py-4 sm:border-b-0 sm:py-5"
              >
                <dt className="label">{row.k}</dt>
                <dd className="mt-2 font-mono text-[0.78rem] tracking-tight text-ink">{row.v}</dd>
              </motion.div>
            ))}
          </dl>
          <Rule delay={0.2} />
        </div>

        <div className="mt-6">
          <VisitCounter />
        </div>

        <p className="caption mt-4">
          Available for freelance and contract work · {profile.email}
        </p>
      </div>
    </header>
  );
}
