import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { EntryShowcase } from "@/components/site/catalog";
import { Section } from "@/components/site/primitives";
import { PageHero, SiteShell } from "@/components/site/shell";
import { useEntries } from "@/lib/content";
import { cn } from "@/lib/utils";

const title = "Projects — Chetan Prajapat, Full Stack Developer";
const description =
  "Full case studies of the products Chetan Prajapat has built: SiteReadyPro startup, learning platforms, commerce, dashboards and auth systems.";

export const Route = createFileRoute("/projects/")({
  component: ProjectsPage,
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

function ProjectsPage() {
  const { data, isLoading } = useEntries("project");
  const entries = data ?? [];
  const [tag, setTag] = useState("All");

  const tags = useMemo(() => ["All", ...new Set((entries ?? []).map((e) => e.tag))], [entries]);
  const filtered = useMemo(() => (tag === "All" ? entries : (entries ?? []).filter((e) => e.tag === tag)), [entries, tag]);

  return (
    <SiteShell>
      <PageHero
        eyebrow="Catalogue 01"
        title="Projects, opened up."
        lead="Every card links to a full case: the problem, what I actually built, the tech used, the features and the screens."
        meta={[`${entries.length} builds published`, "Product & personal work", "Case pages with screens"]}
      />

      <Section>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={cn(
                "rounded-full border px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] transition-colors",
                tag === t
                  ? "border-chrome-1/60 bg-chrome-1/20 text-ink"
                  : "border-ink/15 text-ink-soft hover:text-ink",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <EntryShowcase entries={filtered} isLoading={isLoading} className="mt-10" />
      </Section>
    </SiteShell>
  );
}
