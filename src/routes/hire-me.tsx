import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, Code2, Cpu, Palette, Video } from "lucide-react";
import { RegMark, Reveal, Rule, Section, SectionHeading } from "@/components/site/primitives";
import { SiteShell } from "@/components/site/shell";
import { profile } from "@/data/portfolio";

const title = "Hire Chetan Prajapat — Full Stack Developer & Video Editor";
const description =
  "Available for freelance, internship or full-time work: full stack web development, UI/UX design, video editing and AI-assisted delivery.";

export const Route = createFileRoute("/hire-me")({
  component: HireMePage,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
  }),
});

const offers = [
  {
    icon: Code2,
    title: "Web Development",
    body: "Full-stack web apps using React.js, Node.js and MongoDB. Responsive, fast and production-ready.",
  },
  {
    icon: Palette,
    title: "UI/UX Design",
    body: "Clean, modern interfaces that users love. Pixel-perfect layouts with attention to detail.",
  },
  {
    icon: Video,
    title: "Video Editing",
    body: "Creative video editing for social media, YouTube, ads and brand content. Cinematic quality.",
  },
  {
    icon: Cpu,
    title: "AI-Assisted Dev",
    body: "Faster delivery using AI tools like Cursor AI for rapid prototyping and code generation.",
  },
];

const reasons = [
  { n: "01", title: "Fast Delivery", body: "I ship quickly without compromising on quality." },
  { n: "02", title: "Clean Code", body: "Readable, maintainable and well-structured codebase." },
  { n: "03", title: "Communication", body: "Regular updates and full transparency about progress." },
  { n: "04", title: "Passionate", body: "I genuinely love building things that work beautifully." },
];

function HireMePage() {
  return (
    <SiteShell>
      {/* hero */}
      <header className="relative z-10 px-5 pb-6 pt-32 sm:px-8 md:pt-40 lg:px-14">
        <div className="mx-auto w-full max-w-[84rem]">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-3 py-1.5 font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink-soft"
          >
            <span className="relative grid size-2 place-items-center">
              <span className="absolute size-2 animate-ping rounded-full bg-chrome-1/70" />
              <span className="size-1.5 rounded-full bg-chrome-1" />
            </span>
            Available for work
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-4xl text-[clamp(3.2rem,12vw,8rem)] leading-[0.86]"
          >
            Hire
            <br />
            <span className="chrome-text">me.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="mt-8 max-w-2xl text-[1.05rem] leading-[1.8] text-ink-soft"
          >
            Looking for a Full Stack Developer or Video Editor who delivers results? I build fast, modern web apps and
            create compelling digital content.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <Link to="/contact" className="press-btn">
              Let&rsquo;s talk <ArrowRight className="size-3.5" strokeWidth={1.5} />
            </Link>
            <Link to="/resume" className="press-btn-outline">
              View resume
            </Link>
          </motion.div>
        </div>
      </header>

      {/* what I offer */}
      <Section>
        <SectionHeading eyebrow="What I offer" figure="01" title="Four things I do properly." />

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {offers.map((o, i) => (
            <motion.article
              key={o.title}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="plate group relative p-7 transition-transform duration-500 hover:-translate-y-1"
            >
              <RegMark className="absolute right-4 top-4" />
              <o.icon className="size-6 text-ink" strokeWidth={1.4} />
              <h3 className="mt-6 text-[1.4rem] leading-tight text-ink">{o.title}</h3>
              <Rule className="mt-4" />
              <p className="mt-4 text-[0.94rem] leading-[1.8] text-ink-soft">{o.body}</p>
            </motion.article>
          ))}
        </div>
      </Section>

      {/* why choose me */}
      <Section tint>
        <SectionHeading eyebrow="Why choose me" figure="02" title="How the work actually feels." />

        <div className="mt-12 grid gap-x-10 gap-y-0 md:grid-cols-2">
          {reasons.map((r, i) => (
            <Reveal key={r.n} delay={i * 0.06}>
              <div className="flex items-start gap-6 border-b border-ink/10 py-7">
                <span className="font-display text-[2.4rem] leading-none text-ink/25">{r.n}</span>
                <div>
                  <h3 className="text-[1.25rem] leading-tight text-ink">{r.title}</h3>
                  <p className="mt-2 text-[0.92rem] leading-[1.75] text-ink-soft">{r.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* closing CTA */}
      <Section>
        <div className="plate relative overflow-hidden p-8 sm:p-12">
          <RegMark className="absolute right-6 top-6" />
          <span className="label">Let&rsquo;s build something great</span>
          <h2 className="mt-5 max-w-3xl text-[clamp(2rem,5.4vw,3.6rem)] leading-[1.02]">
            Freelance project, internship or full-time role — <span className="chrome-text">I&rsquo;m ready.</span>
          </h2>
          <p className="mt-6 max-w-xl text-[1rem] leading-[1.8] text-ink-soft">
            Let&rsquo;s create something that slaps.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link to="/contact" className="press-btn">
              Contact me <ArrowRight className="size-3.5" strokeWidth={1.5} />
            </Link>
            <a href={`mailto:${profile.email}`} className="caption underline decoration-ink/25 underline-offset-4">
              Or email directly: {profile.email}
            </a>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}
