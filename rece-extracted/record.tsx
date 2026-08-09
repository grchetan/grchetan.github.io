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
        eyebrow="The record"
        title="Experience, proof and numbers."
        lead="Everything checkable in one place: where I've worked, what I've earned, what I've solved and where the code lives."
        meta={["Verifiable on request", "Live LeetCode sync", "Updated continuously"]}
      />

      <Experience />

      <Section className="pt-0">
        <SectionHeading
          eyebrow="Problem solving"
          figure="11"
          title="LeetCode, live."
          description="Difficulty split, ranking and 52 weeks of submission activity, straight from my profile."
        />
        <LeetCodeCard className="mt-10" />
      </Section>

      <CodingProfiles />

      <GitHubSection />
    </SiteShell>
  );
}
