import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Services } from "@/components/site/about";
import { Section, SectionHeading } from "@/components/site/primitives";
import { PageHero, SiteShell } from "@/components/site/shell";
import { Process } from "@/components/site/showcase";

const title = "Services — Websites, Web Apps & Mobile Apps | Chetan Prajapat";
const description =
  "What I do: business websites, full stack web apps, dashboards, mobile apps, Firebase integrations, redesigns, performance work and long-term maintenance.";

const focus = [
  {
    heading: "Where I spend most of my time",
    body: "Business websites and full stack web apps — React and Next.js on the front, Node or Firebase behind it. If a business needs a site that sells and an admin panel to run it, that's my core work.",
  },
  {
    heading: "What I enjoy most",
    body: "Dashboards and data-heavy interfaces. Turning a messy spreadsheet workflow into a clean, fast console is the part of the job I'd do for free.",
  },
  {
    heading: "What I also ship",
    body: "React Native mobile apps, Firebase auth/storage integrations, redesigns of dated sites without losing SEO, and rescue work on half-finished builds.",
  },
  {
    heading: "How I price it",
    body: "Fixed scope, fixed price, milestone payments. You approve the scope before a line of code is written, and you get weekly demo builds.",
  },
];

export const Route = createFileRoute("/services")({
  component: ServicesPage,
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

function ServicesPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Services"
        title="What I do, and where I'm strongest."
        lead="I'm a full stack developer, so the same person designs the interface, writes the API and ships it. Here's exactly what that covers."
        meta={["Fixed scope & price", "Weekly demo builds", "Support after launch"]}
      />

      <Section className="pt-4">
        <div className="grid gap-6 sm:grid-cols-2">
          {focus.map((f) => (
            <div key={f.heading} className="plate p-6 sm:p-7">
              <h2 className="text-[1.25rem] leading-snug text-ink">{f.heading}</h2>
              <p className="mt-4 text-[0.95rem] leading-[1.8] text-ink-soft">{f.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Services />
      <Process />

      <Section tint>
        <SectionHeading eyebrow="Next step" figure="09" title="Tell me the scope." />
        <Link to="/contact" className="press-btn mt-8">
          Send a brief <ArrowRight className="size-3.5" strokeWidth={1.5} />
        </Link>
      </Section>
    </SiteShell>
  );
}
