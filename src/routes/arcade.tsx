import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SiteShell } from "@/components/site/shell";
import { ArcadeStage } from "@/components/site/arcade";

const title = "Arcade — Signal Rush game & leaderboard | Chetan Prajapat";
const description =
  "Play Signal Rush: create a player ID with just your name, chase a high score, climb the live top-100 leaderboard and download an automatic ranking certificate.";

export const Route = createFileRoute("/arcade")({
  component: ArcadePage,
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

function ArcadePage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Arcade"
        title="Fun activity, ranked."
        lead="Name in, player ID out. Play Signal Rush, save your score, and watch the leaderboard sort everyone from 1st to 100th — certificates generated automatically."
        meta={["Name-only player IDs", "Live top-100 ranking", "Auto certificates for 1st, 2nd, 3rd & top 100"]}
      />

      <ArcadeStage />
    </SiteShell>
  );
}
