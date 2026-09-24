import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { About, Education, TechStack, WorkExperienceSection } from "@/components/site/about";
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
        title="Full Stack Web Developer"
        lead="I build fast, scalable, and responsive web applications with clean code and modern architectures."
        meta={["Available for Projects", "Full Stack Engineering", "Freelance & Full-time"]}
      />

      <About />

      <WorkExperienceSection />

      <Section className="pt-0">
        <SectionHeading
          eyebrow="Activity"
          figure="02b"
          title="Live Coding & Open Source Activity"
          description="Live statistics, problem-solving counts, streaks, and repository activity synced from LeetCode and GitHub."
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
