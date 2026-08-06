import { createFileRoute } from "@tanstack/react-router";
import { Contact } from "@/components/site/contact";
import { PageHero, SiteShell } from "@/components/site/shell";
import { profile } from "@/data/portfolio";

const title = "Contact Chetan Prajapat — Hire a Full Stack Developer";
const description =
  "Send a project brief to Chetan Prajapat — full stack developer for websites, web apps, dashboards and mobile apps. Replies within a day.";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
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

function ContactPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Contact"
        title="Let's scope your build."
        lead="Send the scope, timeline and budget range. Every message lands in my inbox and I reply within a day."
        meta={[profile.email, "Available 24/7 (Anytime)"]}
      />
      <Contact />
    </SiteShell>
  );
}
