import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { About, Education, TechStack } from "@/components/site/about";
import { GitHubCard } from "@/components/site/github-card";
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
          eyebrow="Problem solving & Activity"
          figure="02b"
          title="Live Coding & Open Source Records."
          description="Solved counts, rankings, streaks and 52-week activity heatmaps — synced live from LeetCode and GitHub profiles."
        />
        <LeetCodeCard className="mt-10" />
        <GitHubCard className="mt-8" />
      </Section>

      <Education />
      <TechStack />
      <Achievements />
      <WhyHireMe />

      {/* FINAL VISUAL STATEMENT OF THE ABOUT PAGE */}
      <LiquidVideoReveal />
    </SiteShell>
  );
}
