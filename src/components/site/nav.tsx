import { AnimatePresence, motion } from "motion/react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Menu, Moon, Sun, X, Zap, ZapOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { profile } from "@/data/portfolio";
import { cn } from "@/lib/utils";

/** Links shown directly in the desktop bar — kept short on purpose. */
const primary = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Projects", to: "/projects" },
  { label: "Apps", to: "/apps" },
  { label: "Freelance", to: "/freelance" },
] as const;

/** Secondary links, folded into the “More” menu. */
const secondary = [
  { label: "Arcade", to: "/arcade" },
  { label: "Blog", to: "/blog" },
  { label: "Services", to: "/services" },
  { label: "Certificates", to: "/certificates" },
  { label: "Record", to: "/record" },
  { label: "Resume", to: "/resume" },
] as const;

export const pages = [...primary, ...secondary, { label: "Contact", to: "/contact" }] as const;

function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem("press-theme") === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = useCallback(() => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("press-theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return { dark, toggle };
}

const linkBase =
  "relative rounded-full px-3 py-2 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-ink";

function NavLink({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={linkBase}
      activeProps={{ className: "text-ink bg-ink/[0.07]" }}
      activeOptions={{ exact: to === "/" }}
    >
      {label}
    </Link>
  );
}

export function Navbar({ onOpenCommand }: { onOpenCommand: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const { dark, toggle } = useTheme();
  const { reduced, toggle: toggleMotion } = useMotionPreference();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
  }, [path]);

  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [moreOpen]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const secondaryActive = secondary.some((s) => path.startsWith(s.to));

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[65] px-3 pt-3 sm:px-5 sm:pt-4">
        <nav
          className={cn(
            "mx-auto flex w-full max-w-[80rem] items-center justify-between gap-4 rounded-full border px-3 py-2 transition-all duration-500 sm:px-4",
            scrolled
              ? "border-ink/10 bg-paper/75 shadow-[0_10px_40px_-24px_rgb(0_0_0/0.35)] backdrop-blur-xl"
              : "border-transparent bg-transparent",
          )}
        >
          <Link
            to="/"
            className="min-w-0 shrink px-2 font-display text-[1.15rem] leading-none text-ink sm:text-[1.25rem]"
          >
            Chetan <span className="chrome-text">Prajapat</span>
          </Link>

          <div className="hidden items-center gap-0.5 xl:flex">
            {primary.map((p) => (
              <NavLink key={p.to} {...p} />
            ))}

            <div ref={moreRef} className="relative">
              <button
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                className={cn(
                  linkBase,
                  "inline-flex items-center gap-1",
                  (moreOpen || secondaryActive) && "bg-ink/[0.07] text-ink",
                )}
              >
                More
                <ChevronDown
                  className={cn("size-3 transition-transform duration-300", moreOpen && "rotate-180")}
                  strokeWidth={1.6}
                />
              </button>

              <AnimatePresence>
                {moreOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-[calc(100%+0.6rem)] w-48 overflow-hidden rounded-2xl border border-ink/10 bg-paper/95 p-1.5 shadow-[0_20px_60px_-30px_rgb(0_0_0/0.5)] backdrop-blur-xl"
                  >
                    {secondary.map((s) => (
                      <Link
                        key={s.to}
                        to={s.to}
                        onClick={() => setMoreOpen(false)}
                        className="block rounded-xl px-3 py-2.5 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-ink-soft transition-colors hover:bg-ink/[0.06] hover:text-ink"
                        activeProps={{ className: "bg-ink/[0.07] text-ink" }}
                      >
                        {s.label}
                      </Link>
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={onOpenCommand}
              aria-label="Open search"
              className="hidden rounded-full border border-ink/15 px-2.5 py-1.5 font-mono text-[0.62rem] tracking-[0.12em] text-ink-soft transition-colors hover:border-ink/30 hover:text-ink sm:inline-flex"
            >
              ⌘K
            </button>
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="grid size-8 place-items-center rounded-full border border-ink/15 text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
            >
              {dark ? <Sun className="size-3.5" strokeWidth={1.5} /> : <Moon className="size-3.5" strokeWidth={1.5} />}
            </button>
            <button
              onClick={toggleMotion}
              aria-label={reduced ? "Enable motion" : "Reduce motion"}
              aria-pressed={reduced}
              className={cn(
                "grid size-8 place-items-center rounded-full border text-ink-soft transition-colors hover:border-ink/30 hover:text-ink",
                reduced ? "border-chrome-2/40 bg-chrome-2/10" : "border-ink/15",
              )}
              title={reduced ? "Motion reduced" : "Reduce motion"}
            >
              {reduced ? <ZapOff className="size-3.5" strokeWidth={1.5} /> : <Zap className="size-3.5" strokeWidth={1.5} />}
            </button>
            <Link
              to="/contact"
              className="hidden rounded-full bg-ink px-4 py-2 font-mono text-[0.64rem] uppercase tracking-[0.16em] text-paper transition-opacity hover:opacity-85 xl:inline-flex"
            >
              Contact
            </Link>
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="grid size-8 place-items-center rounded-full border border-ink/15 text-ink transition-colors hover:border-ink/30 xl:hidden"
            >
              <Menu className="size-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[75] flex flex-col bg-paper/95 px-5 py-4 backdrop-blur-2xl sm:px-8"
          >
            <div className="flex items-center justify-between">
              <span className="label">Menu</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid size-9 place-items-center rounded-full border border-ink/25 text-ink"
              >
                <X className="size-4" strokeWidth={1.5} />
              </button>
            </div>

            <ul className="mt-10 flex-1 overflow-y-auto">
              {pages.map((p, i) => (
                <motion.li
                  key={p.to}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  className="border-b border-ink/10"
                >
                  <Link
                    to={p.to}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline justify-between gap-4 py-4"
                  >
                    <span className="font-display text-[1.75rem] leading-none text-ink">{p.label}</span>
                    <span className="caption tracking-[0.2em]">{String(i + 1).padStart(2, "0")}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>

            <p className="caption pb-2 pt-6">{profile.email}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export function CommandMenu({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const [target, setTarget] = useState<string | null>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    setTarget(null);
  }, [path]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to a page…" />
      <CommandList>
        <CommandEmpty>Nothing filed under that name.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((p) => (
            <CommandItem key={p.to} value={p.label} onSelect={() => setTarget(p.to)} asChild>
              <Link to={p.to} onClick={() => setOpen(false)}>
                {p.label}
              </Link>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      {target ? <span className="sr-only">{target}</span> : null}
    </CommandDialog>
  );
}
