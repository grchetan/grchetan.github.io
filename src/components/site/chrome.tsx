import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { ArrowUp, Menu, Moon, Sun, X, Zap, ZapOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { profile } from "@/data/portfolio";
import { cn } from "@/lib/utils";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import loaderChrome from "@/assets/window-loader.jpg";



export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Stack", href: "#stack" },
  { label: "Services", href: "#services" },
  { label: "Work", href: "#projects" },
  { label: "Freelance", href: "#freelance" },
  { label: "Record", href: "#experience" },
  { label: "Contact", href: "#contact" },
];

const commandTargets = [
  ...navLinks,
  { label: "Mobile Apps", href: "#apps" },
  { label: "Credentials", href: "#certificates" },
  { label: "Achievements", href: "#achievements" },
  { label: "Coding Profiles", href: "#profiles" },
  { label: "GitHub", href: "#github" },
  { label: "Testimony", href: "#testimonials" },
  { label: "Method", href: "#process" },
  { label: "Standards", href: "#why" },
];

function scrollTo(href: string) {
  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------------- Smooth scroll (Lenis) ---------------- */

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let cancelled = false;

    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1.1,
        touchMultiplier: 1.5,
        infinite: false,
      });
      const loop = (t: number) => {
        lenis?.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, []);
  return null;
}

/* ---------------- Loading screen: chrome image over solid void ---------------- */

export function LoadingScreen() {
  const [done, setDone] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { reduced } = useMotionPreference();

  useEffect(() => {
    const img = new Image();
    img.src = loaderChrome;
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true);
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), reduced ? 900 : 1900);
    return () => clearTimeout(t);
  }, [reduced]);

  // Prevent background scrolling while the loading screen is active
  useEffect(() => {
    if (done) return;

    const preventScroll = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [done]);

  const bg = {
    backgroundImage: `url(${loaderChrome})`,
    backgroundPosition: "center",
    backgroundSize: "cover",
  } as const;

  return (
    <AnimatePresence>
      {!done ? (
        <motion.div
          key="loader"
          exit={{ opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[80] flex min-h-screen items-center justify-center overflow-hidden p-6"
        >
          {/* solid void backdrop — website content is never visible behind the loader */}
          <div className="absolute inset-0 z-0 bg-paper" />

          {/* immediate chrome wash while the photo loads */}
          <div
            aria-hidden
            className="absolute inset-0 z-[1]"
            style={{
              background:
                "radial-gradient(26rem 26rem at 30% 30%, color-mix(in oklab, var(--chrome-1) 70%, transparent), transparent 60%), radial-gradient(24rem 24rem at 80% 70%, color-mix(in oklab, var(--chrome-3) 65%, transparent), transparent 60%), radial-gradient(34rem 34rem at 50% 50%, color-mix(in oklab, var(--chrome-2) 50%, transparent), transparent 60%)",
            }}
          />

          {/* full-bleed chrome image — soft breathing blink only */}
          <motion.div
            aria-hidden
            className="absolute inset-0 z-[2]"
            style={bg}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{
              opacity: imageLoaded ? (reduced ? 0.75 : [0.75, 1, 0.75]) : 0,
              scale: 1,
            }}
            transition={{
              opacity: reduced
                ? { duration: 0.6, ease: "easeOut" }
                : { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
            }}
          />

          {/* atmospheric veil: keeps image as an effect, never reveals the page beneath */}
          <div className="absolute inset-0 z-[3] bg-gradient-radial from-transparent via-paper/20 to-paper/80" />

          {/* centered loader card */}
          <div className="relative z-20 flex w-full max-w-xs flex-col items-center justify-center gap-8">

            {/* big glowing dual-ring spinner */}
            <div className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
              {/* outer ring — slow */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "conic-gradient(from 0deg, transparent 0%, var(--chrome-3) 30%, var(--chrome-1) 60%, var(--chrome-2) 85%, transparent 100%)",
                  mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 3px))",
                  WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 3px))",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
              />
              {/* inner ring — fast, opposite direction */}
              <motion.div
                className="absolute inset-[14px] rounded-full"
                style={{
                  background: "conic-gradient(from 180deg, transparent 0%, var(--chrome-2) 40%, var(--chrome-1) 70%, transparent 100%)",
                  mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #fff calc(100% - 2px))",
                  WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #fff calc(100% - 2px))",
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              />
              {/* pulsing center dot */}
              <motion.div
                className="h-4 w-4 rounded-full"
                style={{ background: "radial-gradient(circle, var(--chrome-1), var(--chrome-2))" }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            {/* LOADING letters — each bounces in sequence */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-end gap-[3px]">
                {"LOADING".split("").map((letter, i) => (
                  <motion.span
                    key={i}
                    className="font-display text-2xl font-bold tracking-widest sm:text-3xl"
                    style={{
                      color: "#ffffff",
                      textShadow: "0 0 20px color-mix(in oklab, var(--chrome-1) 80%, transparent), 0 2px 12px rgba(0,0,0,0.8)",
                    }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      duration: 0.7,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.1,
                      repeatDelay: 0.6,
                    }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </div>

              {/* animated fill progress bar */}
              <div
                className="relative h-[3px] w-48 overflow-hidden rounded-full"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <motion.div
                  className="absolute inset-y-0 left-0 w-3/5 rounded-full"
                  style={{
                    background: "linear-gradient(90deg, var(--chrome-2), var(--chrome-1), var(--chrome-3))",
                    boxShadow: "0 0 12px color-mix(in oklab, var(--chrome-1) 80%, transparent)",
                  }}
                  animate={{ x: ["-100%", "220%"] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.1 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}



/* ---------------- Scroll progress: an inked rule ---------------- */

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, { stiffness: 90, damping: 24, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX: width, transformOrigin: "left" }}
      className="fixed inset-x-0 top-0 z-[70] h-[2px] bg-gradient-to-r from-chrome-2 via-chrome-1 to-chrome-3"
    />
  );
}

/* ---------------- Theme toggle ---------------- */

export function useTheme() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("press-theme");
    return stored ? stored === "dark" : true;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const nextDark = !prev;
      localStorage.setItem("press-theme", nextDark ? "dark" : "light");
      return nextDark;
    });
  }, []);

  return { dark, toggle };
}

/* ---------------- Navbar: a running masthead ---------------- */

export function Navbar({ onOpenCommand }: { onOpenCommand: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useTheme();
  const { reduced, toggle: toggleMotion } = useMotionPreference();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[65] transition-colors duration-500",
          scrolled ? "border-b border-ink/10 bg-paper/60 backdrop-blur-xl"  : "bg-transparent",
        )}
      >
        <nav className="mx-auto flex w-full max-w-[84rem] items-center justify-between gap-6 px-5 py-4 sm:px-8 lg:px-14">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="min-w-0 shrink font-display text-[1.35rem] leading-none text-ink"
          >
            Chetan <span className="chrome-text">Prajapat</span>
          </a>

          <div className="hidden items-center gap-7 lg:flex">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(l.href);
                }}
                className="label ink-underline text-ink"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={onOpenCommand}
              aria-label="Open search"
              className="label hidden border border-ink/25 px-3 py-2 text-ink transition-colors hover:bg-ink hover:text-paper sm:inline-flex"
            >
              ⌘K
            </button>
            <button
              onClick={toggleMotion}
              aria-label={reduced ? "Enable animations" : "Reduce motion"}
              title={reduced ? "Motion reduced" : "Reduce motion"}
              className="grid size-9 place-items-center border border-ink/25 text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              {reduced ? <ZapOff className="size-4" strokeWidth={1.5} /> : <Zap className="size-4" strokeWidth={1.5} />}
            </button>
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="grid size-9 place-items-center border border-ink/25 text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              {dark ? <Sun className="size-4" strokeWidth={1.5} /> : <Moon className="size-4" strokeWidth={1.5} />}
            </button>
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="grid size-9 place-items-center border border-ink/25 text-ink transition-colors hover:bg-ink hover:text-paper lg:hidden"
            >
              <Menu className="size-4" strokeWidth={1.5} />
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
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[75] flex flex-col bg-paper/95 backdrop-blur-2xl px-5 py-4 sm:px-8"
          >
            <div className="flex items-center justify-between">
              <span className="label">Index</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid size-9 place-items-center border border-ink/25 text-ink"
              >
                <X className="size-4" strokeWidth={1.5} />
              </button>
            </div>

            <ul className="mt-10 flex-1 overflow-y-auto">
              {commandTargets.map((l, i) => (
                <motion.li
                  key={l.href + l.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.03 }}
                  className="border-b border-ink/10"
                >
                  <a
                    href={l.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(false);
                      setTimeout(() => scrollTo(l.href), 260);
                    }}
                    className="flex items-baseline justify-between gap-4 py-4"
                  >
                    <span className="font-display text-[1.75rem] leading-none text-ink">{l.label}</span>
                    <span className="caption tracking-[0.2em]">{String(i + 1).padStart(2, "0")}</span>
                  </a>
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

/* ---------------- Command menu ---------------- */

export function CommandMenu({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
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

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to a section…" />
      <CommandList>
        <CommandEmpty>Nothing filed under that name.</CommandEmpty>
        <CommandGroup heading="Sections">
          {commandTargets.map((t) => (
            <CommandItem
              key={t.href + t.label}
              value={t.label}
              onSelect={() => {
                setOpen(false);
                setTimeout(() => scrollTo(t.href), 200);
              }}
            >
              {t.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/* ---------------- Back to top ---------------- */

export function FloatingActions() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show ? (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.35 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="plate fixed bottom-6 right-6 z-[66] grid size-12 place-items-center rounded-full text-ink transition-transform hover:scale-110"
        >
          <ArrowUp className="size-4" strokeWidth={1.5} />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
