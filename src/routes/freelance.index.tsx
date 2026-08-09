import { createFileRoute } from "@tanstack/react-router";
import { EntryShowcase } from "@/components/site/catalog";
import { Section, SectionHeading } from "@/components/site/primitives";
import { PageHero, SiteShell } from "@/components/site/shell";
import { useEntries } from "@/lib/content";
import { testimonials } from "@/data/portfolio";

const title = "Freelance Work — Client Projects by Chetan Prajapat";
const description =
  "Paid client work by Chetan Prajapat: food ordering, interior studio, coaching institute and restaurant websites — with the problem, the build and the result.";

export const Route = createFileRoute("/freelance/")({
  component: FreelancePage,
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

function FreelancePage() {
  const { data, isLoading } = useEntries("freelance");
  const entries = data ?? [];

  return (
    <SiteShell>
      <PageHero
        eyebrow="Catalogue 03"
        title="Freelance work, kept separate."
        lead="These are paid client builds — different constraints from my own projects. Each case names the client, the problem and the measured result."
        meta={[`${entries.length} client builds`, "Fixed scope, fixed timeline", "Post-launch support included"]}
      />

      <Section>
        <EntryShowcase entries={entries} isLoading={isLoading} />
      </Section>

      <Section tint>
        <SectionHeading eyebrow="In their words" figure="08" title="What clients said afterwards." />
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {testimonials.map((t) => (
            <figure key={t.name} className="plate p-6">
              <blockquote className="text-[1rem] leading-[1.8] text-ink-soft">“{t.quote}”</blockquote>
              <figcaption className="mt-5 border-t border-ink/10 pt-4">
                <span className="block text-[0.95rem] text-ink">{t.name}</span>
                <span className="caption">{t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>
    </SiteShell>
  );
}
