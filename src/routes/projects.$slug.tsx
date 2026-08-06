import { createFileRoute } from "@tanstack/react-router";
import { EntryDetail } from "@/components/site/catalog";
import { SiteShell } from "@/components/site/shell";
import { fetchEntries, useEntry } from "@/lib/content";

export const Route = createFileRoute("/projects/$slug")({
  component: ProjectDetail,
  loader: async ({ params }) => {
    try {
      const entries = await fetchEntries("project");
      const entry = entries.find((e) => e.slug === params.slug);
      return { title: entry?.title ?? "Project Detail", summary: entry?.summary ?? "Project case study" };
    } catch {
      return { title: "Project Detail", summary: "Project case study" };
    }
  },
  head: ({ loaderData }) => {
    const title = `${loaderData?.title ?? "Project Detail"} — Project by Chetan Prajapat`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData?.summary ?? "Project case study" },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData?.summary ?? "Project case study" },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: loaderData?.summary ?? "Project case study" },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="px-5 pb-24 pt-40 text-center">
        <h1 className="text-4xl">Project not found</h1>
        <p className="caption mt-4">It may have been renamed. Try the projects catalogue.</p>
      </div>
    </SiteShell>
  ),
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="px-5 pb-24 pt-40 text-center">
        <h1 className="text-3xl">This page didn't load</h1>
        <p className="caption mt-4">{error.message}</p>
      </div>
    </SiteShell>
  ),
});

function ProjectDetail() {
  const { slug } = Route.useParams();
  const { data: entry, isLoading } = useEntry("project", slug);

  if (isLoading) {
    return (
      <SiteShell>
        <div className="px-5 pb-24 pt-40 text-center">
          <p className="caption">Loading project details…</p>
        </div>
      </SiteShell>
    );
  }

  if (!entry) {
    return (
      <SiteShell>
        <div className="px-5 pb-24 pt-40 text-center">
          <h1 className="text-4xl">Project not found</h1>
          <p className="caption mt-4">It may have been renamed or removed.</p>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="pt-32 md:pt-40" />
      <EntryDetail entry={entry} backTo="/projects" backLabel="All projects" />
    </SiteShell>
  );
}
