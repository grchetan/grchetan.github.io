import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { About, Services, TechStack } from "@/components/site/about";
import { EntryShowcase } from "@/components/site/catalog";
import { Hero } from "@/components/site/hero";
import { LeetCodeCard } from "@/components/site/leetcode";
import { Section, SectionHeading } from "@/components/site/primitives";
import { SiteShell } from "@/components/site/shell";
import { Process, Testimonials } from "@/components/site/showcase";
import { useEntries } from "@/lib/content";
import { profile } from "@/data/portfolio";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: "Full Stack Web Developer",
  description: profile.tagline,
  email: `mailto:${profile.email}`,
  knowsAbout: ["React", "Next.js", "TypeScript", "Node.js", "Firebase", "React Native"],
  sameAs: [profile.socials.github, profile.socials.linkedin, profile.socials.twitter],
};

const title = "Chetan Prajapat — Full Stack Web Developer & Startup Founder";
const description =
  "Chetan Prajapat builds fast, scalable websites, web apps and mobile apps — founder of the SiteReadyPro startup (2025).";

export const Route = createFileRoute("/")({
  component: Home,
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
    scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
  }),
});

function Home() {
  const projectsQuery = useEntries("project");
  const appsQuery = useEntries("app");
  const freelanceQuery = useEntries("freelance");

  const projects = projectsQuery.data ?? [];
  const apps = appsQuery.data ?? [];
  const freelance = freelanceQuery.data ?? [];

  const pick = (list: typeof projects = []) => {
    const arr = list ?? [];
    return arr.filter((e) => Boolean(e?.featured));
  };

  return (
    <SiteShell>
      <Hero />

      <About />

      <Section id="leetcode-stats" className="pt-0">
        <SectionHeading
          eyebrow="Problem Solving"
          figure="02b"
          title="LeetCode Live Statistics"
          description="Solved problems, ranking, and activity heatmap synced directly from LeetCode."
        />
        <LeetCodeCard className="mt-10" />
      </Section>

      <TechStack />
      <Services />

      <Section id="work">
        <SectionHeading
          eyebrow="Featured Work"
          figure="05"
          title="Featured Projects"
          description="Full-stack web applications and client projects with complete case studies and live demos."
        />
        <EntryShowcase entries={pick(projects)} isLoading={projectsQuery.isFetching} className="mt-12" />
        <Link to="/projects" className="press-btn mt-10">
          All projects <ArrowRight className="size-3.5" strokeWidth={1.5} />
        </Link>
      </Section>

      <Section id="apps" tint>
        <SectionHeading
          eyebrow="Applications"
          figure="06"
          title="Mobile & Web Applications"
          description="Cross-platform mobile apps and utilities built for seamless usability and performance."
        />
        <EntryShowcase entries={pick(apps)} isLoading={appsQuery.isFetching} className="mt-12" />
        <Link to="/apps" className="press-btn mt-10">
          All apps <ArrowRight className="size-3.5" strokeWidth={1.5} />
        </Link>
      </Section>

      <Section id="freelance">
        <SectionHeading
          eyebrow="Client Work"
          figure="07"
          title="Freelance Client Projects"
          description="Production web applications and business solutions delivered for freelance clients."
        />
        <EntryShowcase entries={pick(freelance)} isLoading={freelanceQuery.isFetching} className="mt-12" />
        <Link to="/freelance" className="press-btn mt-10">
          All freelance work <ArrowRight className="size-3.5" strokeWidth={1.5} />
        </Link>
      </Section>

      <Testimonials />
      <Process />

      <Section id="cta" tint>
        <div className="plate p-8 sm:p-12">
          <span className="label">Get in Touch</span>
          <h2 className="mt-5 max-w-2xl text-[clamp(2rem,5vw,3.4rem)]">
            Have a project in mind? <span className="chrome-text">Let's build it.</span>
          </h2>
          <p className="mt-5 max-w-xl text-[1rem] leading-[1.8] text-ink-soft">
            Whether you need a full-stack web application, a modern website, or technical consulting, I am available to help.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/contact" className="press-btn">
              Get in Touch <ArrowRight className="size-3.5" strokeWidth={1.5} />
            </Link>
            <Link to="/about" className="press-btn-outline">
              About Me
            </Link>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}
