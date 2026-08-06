import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { EntryShowcase } from "@/components/site/catalog";
import { Section } from "@/components/site/primitives";
import { PageHero, SiteShell } from "@/components/site/shell";
import { useEntries } from "@/lib/content";
import { cn } from "@/lib/utils";

const title = "Apps — Mobile & Mini Apps by Chetan Prajapat";
const description =
  "Mobile and mini apps built by Chetan Prajapat: TaskFlow, SpendWise, FitTrack and more — with the problem, the build, the tech and screens for each.";

export const Route = createFileRoute("/apps/")({
  component: AppsPage,
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

function AppsPage() {
  const entries = useEntries("app").data ?? [];
  const [tag, setTag] = useState("All");
  const tags = useMemo(() => ["All", ...new Set((entries ?? []).map((e) => e.tag))], [entries]);
  const filtered = useMemo(() => (tag === "All" ? entries : (entries ?? []).filter((e) => e.tag === tag)), [entries, tag]);

  return (
    <SiteShell>
      <PageHero
        eyebrow="Catalogue 02"
        title="Apps I built, screen by screen."
        lead="Mobile apps and small tools. Open any one to read what it's about, the problem it solved, the tech behind it and the features shipped."
        meta={[`${entries.length} apps published`, "React Native & web", "Offline-first where it matters"]}
      />

      <Section>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={cn(
                "rounded-full border px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] transition-colors",
                tag === t ? "border-chrome-1/60 bg-chrome-1/20 text-ink" : "border-ink/15 text-ink-soft hover:text-ink",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <EntryShowcase entries={filtered} className="mt-10" />
      </Section>
    </SiteShell>
  );
}
