import { createFileRoute } from "@tanstack/react-router";

import { ForbiddenScape } from "@/components/site/error-pages";

export const Route = createFileRoute("/403")({
  head: () => ({
    meta: [
      { title: "403 — Access forbidden | Chetan Prajapat" },
      {
        name: "description",
        content: "This area is protected. Request access or head back to the public pages.",
      },
      { property: "og:title", content: "403 — Access forbidden" },
      { property: "og:description", content: "Protected area of Chetan Prajapat's portfolio." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ForbiddenScape />,
});
