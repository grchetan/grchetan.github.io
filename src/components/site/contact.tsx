import { Link } from "@tanstack/react-router";
import { pages } from "@/components/site/nav";
import { motion } from "motion/react";

import {
  ArrowUpRight,
  Code2,
  Facebook,
  Github,
  Instagram,
  Linkedin,
  Mail,
  Send,
  Terminal,
  Twitter,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { RegMark, Rule, Section, SectionHeading } from "@/components/site/primitives";
import { profile } from "@/data/portfolio";
import { submitMessage } from "@/lib/content";
import RippleButton from "@/components/mage-ui/button/ripple-button";


const purposes = [
  "Hiring (HR)",
  "Freelance Project",
  "Collaboration",
  "Internship",
  "Other",
] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(30).optional(),
  purpose: z.string().trim().min(2, "Please pick a purpose").max(60),
  budget: z.string().trim().max(60).optional(),
  message: z.string().trim().min(10, "Tell me a little more").max(1000),
});


const socialEntries = [
  { label: "GitHub", href: profile.socials.github, Icon: Github },
  { label: "LinkedIn", href: profile.socials.linkedin, Icon: Linkedin },
  { label: "Instagram", href: profile.socials.instagram, Icon: Instagram },
  { label: "Facebook", href: profile.socials.facebook, Icon: Facebook },
  { label: "Twitter / X", href: profile.socials.twitter, Icon: Twitter },
  { label: "LeetCode", href: profile.socials.leetcode, Icon: Code2 },
  { label: "HackerRank", href: profile.socials.hackerrank, Icon: Terminal },
  { label: "Email", href: `mailto:${profile.email}`, Icon: Mail },
];

const SHEETS_URL = import.meta.env.VITE_SHEETS_URL as string | undefined;

/** Send form data to Google Sheets via Apps Script (fire-and-forget, no-cors). */
async function submitToSheets(data: {
  name: string;
  email: string;
  phone?: string;
  purpose: string;
  budget?: string;
  message: string;
}) {
  if (!SHEETS_URL) return;
  try {
    await fetch(SHEETS_URL, {
      method: "POST",
      mode: "no-cors",
      body: new URLSearchParams({
        name: data.name,
        email: data.email,
        purpose: data.purpose,
        budget: data.budget ?? "",
        message: data.message,
        ...(data.phone ? { phone: data.phone } : {}),
      }),
    });
  } catch {
    /* silent — Sheets is secondary backup */
  }
}

export function Contact() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [purpose, setPurpose] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const parsed = schema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone") || undefined,
      purpose: form.get("purpose"),
      budget: form.get("budget") || undefined,
      message: form.get("message"),
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error("Please check the marked fields.");
      return;
    }

    setErrors({});
    setSending(true);

    // Fire both Firebase and Google Sheets in parallel
    const [stored] = await Promise.all([
      submitMessage({
        name: parsed.data.name,
        email: parsed.data.email,
        ...(parsed.data.phone ? { phone: parsed.data.phone } : {}),
        purpose: parsed.data.purpose,
        ...(parsed.data.budget ? { budget: parsed.data.budget } : {}),
        message: parsed.data.message,
      }).catch(() => false),
      submitToSheets({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        purpose: parsed.data.purpose,
        budget: parsed.data.budget,
        message: parsed.data.message,
      }),
    ]);

    setPurpose("");
    formEl.reset();

    if (stored) {
      toast.success("Brief received — it's in my inbox and I reply within a day.");
    } else {
      const body = `Name: ${parsed.data.name}\nEmail: ${parsed.data.email}\nPhone: ${parsed.data.phone ?? "—"}\nPurpose: ${parsed.data.purpose}\nBudget: ${parsed.data.budget ?? "—"}\n\n${parsed.data.message}`;
      window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(
        `Project enquiry — ${parsed.data.name}`,
      )}&body=${encodeURIComponent(body)}`;
      toast.success("Opening your mail client — I reply within a day.");
    }

    setSending(false);
  }



  const field =
    "mt-2 w-full border-b border-ink/25 bg-transparent pb-2.5 font-sans text-[0.95rem] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-ink";

  return (
    <Section id="contact">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <SectionHeading
            eyebrow="Commissions"
            figure="16"
            title="Let's set the next plate."
            description="Tell me the scope, the timeline and the budget range. You'll get a plan, not a sales call."
          />

          <dl className="mt-12">
            <Rule />
            {[
              { k: "Email", v: profile.email, href: `mailto:${profile.email}` },
              { k: "Hours", v: "Available 24/7 (Anytime)" },
            ].map((row) => (
              <div
                key={row.k}
                className="grid grid-cols-[6rem_minmax(0,1fr)] items-baseline gap-4 border-b border-ink/10 py-4"
              >
                <dt className="label">{row.k}</dt>
                <dd className="min-w-0 truncate font-mono text-[0.8rem] text-ink">
                  {row.href ? (
                    <a href={row.href} className="ink-underline">
                      {row.v}
                    </a>
                  ) : (
                    row.v
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap gap-2.5">
            {socialEntries.map((s) => (
              <a
                key={s.label}
                href={s.href}
                {...(s.href.startsWith("mailto:")
                  ? {}
                  : { target: "_blank", rel: "noreferrer noopener" })}
                aria-label={s.label}
                title={s.label}
                className="label inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper-tint/50 px-3 py-1.5 text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/45 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)]"
              >
                <s.Icon className="size-3.5" strokeWidth={1.5} />
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="plate-tint relative p-6 sm:p-9 lg:col-span-7 lg:-mr-6"
        >
          <RegMark className="absolute right-5 top-5" />
          <span className="label">Enquiry form</span>
          <Rule className="mt-3" />

          <div className="mt-7 grid gap-7 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="label">
                Name
              </label>
              <input id="name" name="name" maxLength={100} placeholder="Your full name" className={field} />
              {errors["name"] ? <p className="caption mt-2 text-destructive">{errors["name"]}</p> : null}
            </div>
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                maxLength={255}
                placeholder="you@company.com"
                className={field}
              />
              {errors["email"] ? <p className="caption mt-2 text-destructive">{errors["email"]}</p> : null}
            </div>
          </div>

          <div className="mt-7">
            <label htmlFor="phone" className="label">
              Phone (optional)
            </label>
            <input id="phone" name="phone" maxLength={30} placeholder="+91 00000 00000" className={field} />
          </div>

          <div className="mt-7 grid gap-7 sm:grid-cols-2">
            <div>
              <span className="label">Purpose</span>
              <input type="hidden" name="purpose" value={purpose} />
              <div className="mt-3 flex flex-wrap gap-2">
                {purposes.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPurpose(p)}
                    aria-pressed={purpose === p}
                    className={`rounded-full border px-3.5 py-2 font-mono text-[0.66rem] uppercase tracking-[0.16em] transition-colors ${
                      purpose === p
                        ? "border-chrome-1/60 bg-chrome-1/20 text-ink"
                        : "border-ink/20 text-ink-soft hover:border-ink/40 hover:text-ink"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {errors["purpose"] ? <p className="caption mt-2 text-destructive">{errors["purpose"]}</p> : null}
            </div>
            <div>
              <label htmlFor="budget" className="label">
                Budget (optional)
              </label>
              <input
                id="budget"
                name="budget"
                maxLength={60}
                placeholder="e.g. ₹25,000 / $300 / unpaid"
                className={field}
              />
            </div>
          </div>

          <div className="mt-7">
            <label htmlFor="message" className="label">
              Brief
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              maxLength={1000}
              placeholder="What are you building, and by when?"
              className={`${field} resize-none`}
            />
            {errors["message"] ? (
              <p className="caption mt-2 text-destructive">{errors["message"]}</p>
            ) : null}
          </div>

          <button type="submit" disabled={sending} className="press-btn mt-9 disabled:opacity-50">
            Send brief <Send className="size-3.5" strokeWidth={1.5} />
          </button>
          <p className="caption mt-4">
            Prefer a call? Write “call” in the brief and I'll send a slot.
          </p>
        </motion.form>
      </div>
    </Section>
  );
}

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-ink/15 px-5 py-10 sm:px-8 lg:px-14">
      <div className="mx-auto w-full max-w-[84rem]">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <p className="font-display text-[2rem] leading-none text-ink">
              Chetan <span className="italic">Prajapat</span>
            </p>
            <p className="caption mt-3 max-w-sm">
              Full stack developer and UI engineer. Building quiet, fast, durable products.
            </p>
            <RippleButton
              type="button"
              className="mt-5 text-[0.78rem] uppercase tracking-[0.16em]"
              onClick={() =>
                window.open(profile.socials.github, "_blank", "noopener,noreferrer")
              }
              aria-label="Open GitHub profile"
            >
              <Github className="size-4" strokeWidth={1.6} />
              GitHub Profile
              <ArrowUpRight className="size-3.5" strokeWidth={1.6} />
            </RippleButton>
          </div>

          <div className="lg:col-span-4">
            <span className="label">Pages</span>
            <Rule className="mt-2.5" />
            <ul className="mt-2 grid grid-cols-2 gap-x-6">
              {pages.map((p) => (
                <li key={p.to} className="border-b border-ink/10 py-2">
                  <Link to={p.to} className="caption ink-underline text-ink">
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 lg:col-span-4">
            <span className="label">Elsewhere</span>
            <Rule className="mt-2.5" />
            <ul className="mt-2 grid grid-cols-2 gap-x-6">
              {socialEntries.map((s) => (
                <li key={s.label} className="border-b border-ink/10">
                  <a
                    href={s.href}
                    {...(s.href.startsWith("mailto:")
                      ? {}
                      : { target: "_blank", rel: "noreferrer noopener" })}
                    className="group flex items-center gap-2 py-2 text-ink"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-paper-tint/60 transition-all duration-300 group-hover:scale-110 group-hover:border-ink/40">
                      <s.Icon className="size-3" strokeWidth={1.5} />
                    </span>
                    <span className="caption ink-underline truncate">{s.label}</span>
                    <ArrowUpRight
                      className="ml-auto size-3 shrink-0 opacity-0 transition-opacity duration-300 group-hover:opacity-70"
                      strokeWidth={1.5}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3 border-t border-ink/15 pt-4">
          <span className="caption">© {new Date().getFullYear()} Chetan Prajapat</span>
          <span className="caption tracking-[0.14em]">No. 001 — Paste-up Press</span>
        </div>
      </div>
    </footer>
  );
}

