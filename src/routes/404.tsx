import { createFileRoute } from "@tanstack/react-router";

import { NotFoundScape } from "@/components/site/error-pages";

export const Route = createFileRoute("/404")({
  head: () => ({
    meta: [
      { title: "404 — Page not found | Chetan Prajapat" },
      {
        name: "description",
        content: "This page does not exist. Jump back to projects, apps or the blog.",
      },
      { property: "og:title", content: "404 — Page not found" },
      { property: "og:description", content: "This page does not exist on Chetan Prajapat's portfolio." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <NotFoundScape />,
});
