import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { About, Education, TechStack } from "@/components/site/about";
import { LeetCodeCard } from "@/components/site/leetcode";
import { LiquidVideoReveal } from "@/components/site/liquid-reveal";
import { Section, SectionHeading } from "@/components/site/primitives";
import { PageHero, SiteShell } from "@/components/site/shell";
import { Achievements, WhyHireMe } from "@/components/site/showcase";

const title = "About Chetan Prajapat — Full Stack Developer & Founder";
const description =
  "Who I am, how I work and what I've measured: full stack developer and founder of the SiteReadyPro startup (2025), with live LeetCode stats.";

export const Route = createFileRoute("/about")({
  component: AboutPage,
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

function AboutPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="About"
        title="Full stack developer, startup founder."
        lead="I build fast, readable, durable web products — and in 2025 I turned that into my own startup, SiteReadyPro."
        meta={["Available 24/7 (Anytime)", "Startup founder since 2025", "Freelance & product work"]}
      />

      <About />

      <Section className="pt-0">
        <SectionHeading
          eyebrow="Problem solving"
          figure="02b"
          title="LeetCode stats, pulled live."
          description="Solved counts by difficulty, ranking and a 52-week activity heatmap — synced from my LeetCode profile."
        />
        <LeetCodeCard className="mt-10" />
      </Section>

      <Education />
      <TechStack />
      <Achievements />
      <WhyHireMe />

      <Section tint>
        <div className="plate p-8 sm:p-12">
          <span className="label">Working together</span>
          <h2 className="mt-5 max-w-2xl text-[clamp(1.9rem,4.6vw,3.2rem)]">
            Read the full record, or just send the brief.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/contact" className="press-btn">
              Start a project <ArrowRight className="size-3.5" strokeWidth={1.5} />
            </Link>
            <Link to="/record" className="press-btn-outline">
              Experience & credentials
            </Link>
          </div>
        </div>
      </Section>

      {/* FINAL VISUAL STATEMENT OF THE ABOUT PAGE */}
      <LiquidVideoReveal />
    </SiteShell>
  );
}
