import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SiteShell } from "@/components/site/shell";
import { AchievementWall, CertificateWall, ProfileIds } from "@/components/site/credentials";

const title = "Certificates & Achievements | Chetan Prajapat";
const description =
  "Verified certificates, courses and achievement certificates earned by Chetan Prajapat — plus coding profile handles and the numbers behind the work.";

export const Route = createFileRoute("/certificates")({
  component: CertificatesPage,
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

function CertificatesPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Certificates"
        title="Credentials and achievements."
        lead="Every certificate I've earned with its original image and verify link, plus the achievements and profile handles behind the work."
        meta={["Verifiable on request", "Uploaded from the admin panel", "Updated continuously"]}
      />

      <CertificateWall />
      <AchievementWall />
      <ProfileIds />
    </SiteShell>
  );
}
