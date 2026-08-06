import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Mail, MapPin, Link2 } from "lucide-react";
import { Rule, Section, SectionHeading } from "@/components/site/primitives";
import { PageHero, SiteShell } from "@/components/site/shell";
import { useResume } from "@/lib/resume";
import { downloadResumePdf } from "@/lib/resume-pdf";
import type { ResumeSection } from "@/data/resume";
import { cn } from "@/lib/utils";

const title = "Resume — Chetan Prajapat, Full Stack Developer";
const description =
  "Resume of Chetan Prajapat — full stack developer and video editor: experience, projects, skills, certifications and education. Download as PDF.";

export const Route = createFileRoute("/resume")({
  component: ResumePage,
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

const ease = [0.16, 1, 0.3, 1] as const;

function href(link: string) {
  return link.startsWith("http") ? link : `https://${link}`;
}

function SectionBlock({ section, index }: { section: ResumeSection; index: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.7, ease }}
      className="grid gap-6 lg:grid-cols-12"
    >
      <div className="lg:col-span-3">
        <span className="label">{String(index + 1).padStart(2, "0")}</span>
        <h2 className="mt-3 text-[clamp(1.5rem,2.6vw,2.1rem)] leading-[1.05]">{section.heading}</h2>
        <Rule className="mt-4" />
      </div>

      <div className="lg:col-span-9">
        {section.kind === "groups" ? (
          <dl className="grid gap-x-10 gap-y-0 sm:grid-cols-2">
            {(section.groups ?? []).map((g, i) => (
              <motion.div
                key={`${g.label}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05, ease }}
                className="group border-b border-ink/10 py-4"
              >
                <dt className="label transition-colors group-hover:text-ink">{g.label}</dt>
                <dd className="mt-2 text-[0.95rem] leading-[1.7] text-ink-soft">
                  {g.value}
                  {g.link ? (
                    <a
                      href={href(g.link)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="ml-2 inline-flex items-center gap-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink underline-offset-4 hover:underline"
                    >
                      <Link2 className="size-3" strokeWidth={1.5} /> Verify
                    </a>
                  ) : null}
                </dd>
              </motion.div>
            ))}
          </dl>
        ) : (
          <ol className="relative border-l border-ink/12 pl-6 sm:pl-8">
            {(section.items ?? []).map((item, i) => (
              <motion.li
                key={`${item.title}-${i}`}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.06, ease }}
                className="group relative pb-8 last:pb-0"
              >
                <span className="absolute -left-[calc(1.5rem+5px)] top-2 size-[9px] rounded-full bg-gradient-to-br from-chrome-1 to-chrome-3 transition-transform duration-500 group-hover:scale-150 sm:-left-[calc(2rem+5px)]" />
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h3 className="text-[1.15rem] leading-snug text-ink">{item.title}</h3>
                  {item.meta ? <span className="caption">{item.meta}</span> : null}
                </div>
                {item.subtitle ? (
                  item.link ? (
                    <a
                      href={href(item.link)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
                    >
                      <Link2 className="size-3" strokeWidth={1.5} /> {item.subtitle}
                    </a>
                  ) : (
                    <p className="mt-1.5 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-ink-soft">
                      {item.subtitle}
                    </p>
                  )
                ) : null}
                {item.bullets.filter((b) => b.trim()).length ? (
                  <ul className="mt-3 space-y-2">
                    {item.bullets
                      .filter((b) => b.trim())
                      .map((b, bi) => (
                        <li key={bi} className="flex gap-3 text-[0.95rem] leading-[1.8] text-ink-soft">
                          <span className="mt-[0.65em] size-1 shrink-0 rounded-full bg-ink/30" />
                          <span>{b}</span>
                        </li>
                      ))}
                  </ul>
                ) : null}
              </motion.li>
            ))}
          </ol>
        )}
      </div>
    </motion.section>
  );
}

function ResumePage() {
  const { data } = useResume();
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      await downloadResumePdf(data);
      toast.success("Resume PDF downloaded.");
    } catch {
      toast.error("Could not build the PDF. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <PageHero
        eyebrow="Resume"
        title={data.role}
        lead={data.summary}
        meta={[data.email, data.location]}
      />

      <Section className="pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="plate flex flex-wrap items-center justify-between gap-x-8 gap-y-5 p-6 sm:p-8"
        >
          <div className="min-w-0">
            <span className="label">Contact</span>
            <h2 className="mt-3 text-[clamp(1.8rem,4vw,2.8rem)] leading-none">
              <span className="chrome-text">{data.name}</span>
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              <a
                href={`mailto:${data.email}`}
                className="inline-flex items-center gap-2 text-[0.9rem] text-ink-soft transition-colors hover:text-ink"
              >
                <Mail className="size-3.5" strokeWidth={1.5} /> {data.email}
              </a>
              <span className="inline-flex items-center gap-2 text-[0.9rem] text-ink-soft">
                <MapPin className="size-3.5" strokeWidth={1.5} /> {data.location}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {data.links.map((l) => (
                <a
                  key={l}
                  href={href(l)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  {l}
                </a>
              ))}
            </div>
          </div>

          <button
            onClick={() => void download()}
            disabled={busy}
            className={cn("press-btn group shrink-0 disabled:opacity-60")}
          >
            <Download
              className="size-3.5 transition-transform duration-500 group-hover:translate-y-0.5"
              strokeWidth={1.5}
            />
            {busy ? "Building PDF…" : "Download resume (PDF)"}
          </button>
        </motion.div>
      </Section>

      <Section className="pt-0">
        <SectionHeading
          eyebrow="The document"
          figure="01"
          title="Everything, on one page."
          description="Experience, builds, skills, certifications and education — kept in sync from the admin panel."
        />
        <div className="mt-14 space-y-16 md:space-y-20">
          {data.sections.map((section, i) => (
            <SectionBlock key={section.id} section={section} index={i} />
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center gap-4 border-t border-ink/10 pt-8">
          <button onClick={() => void download()} disabled={busy} className="press-btn disabled:opacity-60">
            <Download className="size-3.5" strokeWidth={1.5} />
            {busy ? "Building PDF…" : "Download resume (PDF)"}
          </button>
          <a href={`mailto:${data.email}`} className="press-btn-outline">
            Email me
          </a>
        </div>
      </Section>
    </SiteShell>
  );
}
