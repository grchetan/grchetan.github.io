import { createFileRoute } from "@tanstack/react-router";

import { ServerErrorScape } from "@/components/site/error-pages";

export const Route = createFileRoute("/500")({
  head: () => ({
    meta: [
      { title: "500 — Something broke | Chetan Prajapat" },
      {
        name: "description",
        content: "An unexpected error occurred. Retry the page or report the issue.",
      },
      { property: "og:title", content: "500 — Something broke" },
      { property: "og:description", content: "An unexpected error on Chetan Prajapat's portfolio." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ServerErrorScape onRetry={() => window.location.reload()} />,
});
