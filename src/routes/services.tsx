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
    heading: "Core Development",
    body: "Full-stack web applications and modern websites using React, Node.js, Express, and cloud databases. Built for speed, responsiveness, and scale.",
  },
  {
    heading: "Dashboards & Data Tools",
    body: "Interactive dashboards, administrative consoles, and data management systems designed for clear visualization and daily workflow efficiency.",
  },
  {
    heading: "Mobile Apps & Integrations",
    body: "Cross-platform mobile apps in React Native, REST API integrations, user authentication, and website redesigns with SEO preservation.",
  },
  {
    heading: "Pricing & Milestones",
    body: "Transparent pricing with defined deliverables and milestone-based timelines. Clear requirements and regular progress updates throughout.",
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
        title="Development Services"
        lead="Comprehensive full-stack web development services, from initial UI/UX design to robust backend engineering and production deployment."
        meta={["Fixed Scope & Timeline", "Regular Progress Demos", "Post-Launch Support"]}
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
        <SectionHeading eyebrow="Next Steps" figure="09" title="Start Your Project" />
        <Link to="/contact" className="press-btn mt-8">
          Get in Touch <ArrowRight className="size-3.5" strokeWidth={1.5} />
        </Link>
      </Section>
    </SiteShell>
  );
}
