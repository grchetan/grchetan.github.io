import { createFileRoute } from "@tanstack/react-router";
import { LeetCodeCard } from "@/components/site/leetcode";
import { Section, SectionHeading } from "@/components/site/primitives";
import { PageHero, SiteShell } from "@/components/site/shell";
import { CodingProfiles, Experience, GitHubSection } from "@/components/site/showcase";

const title = "Record — Experience & Coding Profiles | Chetan Prajapat";
const description =
  "The verifiable record: experience timeline, certificates, achievements, GitHub activity, coding profiles and live LeetCode statistics.";

export const Route = createFileRoute("/record")({
  component: RecordPage,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
  }),
});

function RecordPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Background"
        title="Experience & Track Record"
        lead="A comprehensive summary of work experience, technical milestones, problem-solving profiles, and open-source contributions."
        meta={["Verified Experience", "Live LeetCode Stats", "Active Open Source"]}
      />

      <Experience />

      <Section className="pt-0">
        <SectionHeading
          eyebrow="Problem Solving"
          figure="11"
          title="LeetCode Problem Solving"
          description="Difficulty breakdown, global ranking, and 52-week activity heatmap synced live."
        />
        <LeetCodeCard className="mt-10" />
      </Section>

      <CodingProfiles />

      <GitHubSection />
    </SiteShell>
  );
}
