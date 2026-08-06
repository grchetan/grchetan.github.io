import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Home, Mail, RefreshCw, ShieldAlert } from "lucide-react";

import { SiteShell } from "@/components/site/shell";
import { Reveal } from "@/components/site/primitives";

const GLYPHS = "▚▞░▒▓/\\<>{}[]#*+=—|01";

/** scrambles a word letter-by-letter, then settles into place */
function Scramble({ text, className }: { text: string; className?: string }) {
  const [out, setOut] = useState(text);

  useEffect(() => {
    let frame = 0;
    const total = 26;
    const id = window.setInterval(() => {
      frame += 1;
      const settled = Math.floor((frame / total) * text.length);
      setOut(
        text
          .split("")
          .map((ch, i) => {
            if (i < settled || ch === " ") return ch;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? ch;
          })
          .join(""),
      );
      if (frame >= total) {
        setOut(text);
        window.clearInterval(id);
      }
    }, 42);
    return () => window.clearInterval(id);
  }, [text]);

  return <span className={className}>{out}</span>;
}

/** oversized glitching status code with iridescent split layers */
function GlitchCode({ code }: { code: string }) {
  return (
    <div className="relative w-fit select-none leading-[0.85] pointer-events-none">
      <motion.span
        aria-hidden
        className="absolute inset-0 font-display text-[clamp(4rem,11vw,7.5rem)] font-extrabold text-[color:var(--prism-pink)] opacity-60 blur-[1px]"
        animate={{ x: [0, -6, 3, -2, 0], y: [0, 2, -3, 1, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {code}
      </motion.span>
      <motion.span
        aria-hidden
        className="absolute inset-0 font-display text-[clamp(4rem,11vw,7.5rem)] font-extrabold text-[color:var(--prism-blue)] opacity-60 blur-[1px]"
        animate={{ x: [0, 6, -3, 2, 0], y: [0, -2, 3, -1, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {code}
      </motion.span>
      <span className="chrome-text relative font-display text-[clamp(4rem,11vw,7.5rem)] font-extrabold">
        {code}
      </span>
    </div>
  );
}

function Shards() {
  const shards = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        id: i,
        left: `${8 + ((i * 11) % 84)}%`,
        top: `${12 + ((i * 27) % 70)}%`,
        size: 26 + ((i * 13) % 46),
        delay: i * 0.35,
      })),
    [],
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {shards.map((s) => (
        <motion.span
          key={s.id}
          className="absolute block rounded-[4px] border border-rule/70"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size }}
          animate={{ y: [0, -18, 0], rotate: [0, 28, 0], opacity: [0.15, 0.45, 0.15] }}
          transition={{ duration: 9 + s.delay, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
        />
      ))}
    </div>
  );
}

export type ErrorAction = {
  label: string;
  to?: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  primary?: boolean;
};

const actionClass = (primary?: boolean) =>
  primary
    ? "group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-xs uppercase tracking-[0.2em] text-background transition hover:opacity-90"
    : "group inline-flex items-center gap-2 rounded-full border border-rule px-5 py-3 text-xs uppercase tracking-[0.2em] text-foreground/80 transition hover:border-foreground/40 hover:text-foreground";

function Action({ action }: { action: ErrorAction }) {
  const body = (
    <>
      {action.icon}
      {action.label}
    </>
  );
  if (action.to) {
    return (
      <Link to={action.to} className={actionClass(action.primary)}>
        {body}
      </Link>
    );
  }
  if (action.href) {
    return (
      <a href={action.href} className={actionClass(action.primary)}>
        {body}
      </a>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={actionClass(action.primary)}>
      {body}
    </button>
  );
}

/** shared creative layout for every error surface */
export function ErrorScape({
  code,
  status,
  title,
  message,
  readout,
  actions,
  bare = false,
}: {
  code: string;
  status: string;
  title: string;
  message: string;
  readout: { key: string; value: string }[];
  actions: ErrorAction[];
  /** render without the site chrome (used inside route error boundaries) */
  bare?: boolean;
}) {
  const content = (
    <section className="relative mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col justify-center px-5 py-24 sm:px-8">
      <div aria-hidden className="board pointer-events-none absolute inset-0" />
      <Shards />

      <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <Reveal>
            <p className="label flex items-center gap-2">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-[color:var(--prism-red)]" />
              {status}
            </p>
          </Reveal>

          <div className="mt-3 overflow-hidden">
            <GlitchCode code={code} />
          </div>

          <Reveal delay={0.12}>
            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              <Scramble text={title} />
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {message}
            </p>
          </Reveal>

          <Reveal delay={0.28}>
            <div className="mt-8 flex flex-wrap gap-3">
              {actions.map((action) => (
                <Action key={action.label} action={action} />
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.2} className="relative z-10 lg:col-span-5">
          <div className="plate p-5 sm:p-6">
            <p className="label">diagnostics</p>
            <dl className="mt-4 divide-y divide-rule/70">
              {readout.map((row) => (
                <div key={row.key} className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="caption">{row.key}</dt>
                  <dd className="font-mono text-[11px] text-foreground/85">{row.value}</dd>
                </div>
              ))}
            </dl>
            <motion.div
              aria-hidden
              className="mt-5 h-px w-full origin-left bg-gradient-to-r from-[color:var(--prism-red)] via-[color:var(--prism-pink)] to-[color:var(--prism-blue)]"
              animate={{ scaleX: [0.2, 1, 0.2] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <p className="caption mt-4">
              Whatever broke — start fresh from home, or drop me a mail directly.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );

  return <SiteShell>{content}</SiteShell>;
}

export function NotFoundScape({ bare = false }: { bare?: boolean }) {
  return (
    <ErrorScape
      bare={bare}
      code="404"
      status="signal lost / route not found"
      title="This page has gone missing."
      message="The URL you opened doesn't exist, or it may have moved. Get back on track below — projects, apps and the blog are all live."
      readout={[
        { key: "status", value: "404 NOT_FOUND" },
        { key: "path", value: typeof window === "undefined" ? "/" : window.location.pathname },
        { key: "cause", value: "unmatched route" },
        { key: "fix", value: "navigate home" },
      ]}
      actions={[
        { label: "Go home", to: "/", primary: true, icon: <Home className="size-3.5" /> },
        { label: "Projects", to: "/projects", icon: <ArrowLeft className="size-3.5" /> },
        { label: "Contact", to: "/contact", icon: <Mail className="size-3.5" /> },
      ]}
    />
  );
}

export function ForbiddenScape({ bare = false }: { bare?: boolean }) {
  return (
    <ErrorScape
      bare={bare}
      code="403"
      status="access denied / forbidden"
      title="You don't have the key to this door."
      message="This area is protected — only an authorised session can unlock it. If you need access, send a mail, otherwise the public pages are wide open."
      readout={[
        { key: "status", value: "403 FORBIDDEN" },
        { key: "guard", value: "auth required" },
        { key: "session", value: "unauthenticated" },
        { key: "fix", value: "sign in / request access" },
      ]}
      actions={[
        { label: "Go home", to: "/", primary: true, icon: <Home className="size-3.5" /> },
        { label: "Request access", to: "/contact", icon: <ShieldAlert className="size-3.5" /> },
      ]}
    />
  );
}

export function ServerErrorScape({
  bare = false,
  onRetry,
  detail,
}: {
  bare?: boolean;
  onRetry?: () => void;
  detail?: string;
}) {
  const actions: ErrorAction[] = [];
  if (onRetry) {
    actions.push({
      label: "Try again",
      onClick: onRetry,
      primary: true,
      icon: <RefreshCw className="size-3.5" />,
    });
  }
  actions.push({ label: "Go home", href: "/", icon: <Home className="size-3.5" /> });
  actions.push({ label: "Report it", href: "mailto:contact.chetanprajapat@gmail.com", icon: <Mail className="size-3.5" /> });

  return (
    <ErrorScape
      bare={bare}
      code="500"
      status="system fault / internal error"
      title="Something broke on this end."
      message="An error occurred while loading the page. Give it a retry — if it still doesn't work, send me a report directly."
      readout={[
        { key: "status", value: "500 INTERNAL_ERROR" },
        { key: "detail", value: (detail ?? "unexpected exception").slice(0, 42) },
        { key: "retry", value: onRetry ? "available" : "reload page" },
        { key: "fix", value: "retry / report" },
      ]}
      actions={actions}
    />
  );
}
