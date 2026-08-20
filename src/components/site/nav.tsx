import { AnimatePresence, motion } from 'motion/react';
import { Link, useRouterState } from '@tanstack/react-router';
import { ChevronDown, Menu, X, Zap, ZapOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import { profile } from '@/data/portfolio';
import { cn } from '@/lib/utils';

/** Links shown directly in the desktop bar — kept short on purpose. */
const primary = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Projects', to: '/projects' },
  { label: 'Apps', to: '/apps' },
  { label: 'Freelance', to: '/freelance' },
] as const;

/** Secondary links, folded into the "More" menu. */
const secondary = [
  { label: 'Arcade', to: '/arcade' },
  { label: 'Blog', to: '/blog' },
  { label: 'Services', to: '/services' },
  { label: 'Certificates', to: '/certificates' },
  { label: 'Record', to: '/record' },
  { label: 'Resume', to: '/resume' },
] as const;

export const pages = [
  ...primary,
  ...secondary,
  { label: 'Contact', to: '/contact' },
] as const;

function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('press-theme') === 'dark';
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = useCallback(() => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('press-theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return { dark, toggle };
}

/** Pill-shaped animated theme toggle */
function ThemeToggle({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      title={dark ? 'Switch to Light' : 'Switch to Dark'}
      className={cn(
        'relative flex h-7 w-[3.25rem] shrink-0 items-center rounded-full border p-0.5 transition-all duration-500',
        dark
          ? 'border-ink/30 bg-ink/15'
          : 'border-ink/20 bg-ink/[0.06]',
      )}
    >
      {/* Track label: moon / sun */}
      <span
        className={cn(
          'absolute text-[0.48rem] font-mono uppercase tracking-[0.12em] transition-all duration-300 select-none',
          dark ? 'right-1.5 text-ink/50' : 'left-1.5 text-ink/40',
        )}
      >
        {dark ? '☽' : '☀'}
      </span>

      {/* Sliding knob */}
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className={cn(
          'relative z-10 flex size-5.5 items-center justify-center rounded-full shadow-sm',
          dark ? 'ml-auto bg-ink text-paper' : 'mr-auto bg-paper text-ink border border-ink/15',
        )}
      >
        <motion.span
          key={dark ? 'moon' : 'sun'}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="text-[0.6rem]"
        >
          {dark ? '☽' : '☀'}
        </motion.span>
      </motion.span>
    </button>
  );
}

function NavLink({
  to,
  label,
  onClick,
}: {
  to: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="group relative px-3.5 py-2 font-sans text-[0.82rem] font-medium tracking-wide text-ink-soft transition-colors duration-200 hover:text-ink"
      activeProps={{ className: 'text-ink' }}
      activeOptions={{ exact: to === '/' }}
    >
      {label}
      {/* Animated underline indicator */}
      <span className="absolute inset-x-3 bottom-1 h-px scale-x-0 rounded-full bg-ink transition-transform duration-300 group-hover:scale-x-100 group-[.active]:scale-x-100" />
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
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [moreOpen]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const secondaryActive = secondary.some((s) => path.startsWith(s.to));

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-[65] w-full transition-all duration-300',
          scrolled
            ? 'border-b border-ink/10 bg-paper/90 shadow-sm backdrop-blur-2xl'
            : 'border-b border-transparent bg-paper/60 backdrop-blur-xl',
        )}
      >
        <nav className="mx-auto flex w-full max-w-[84rem] items-center justify-between px-5 py-3 sm:px-8 lg:px-12">

          {/* ── Logo ─────────────────────────────────── */}
          <Link
            to="/"
            className="shrink-0 font-display text-[1.2rem] leading-none text-ink sm:text-[1.35rem]"
          >
            Chetan <span className="chrome-text">Prajapat</span>
          </Link>

          {/* ── Desktop Nav Links ─────────────────────── */}
          <div className="hidden items-center xl:flex">
            {/* Pill container */}
            <div className="flex items-center gap-0 rounded-full border border-ink/10 bg-paper-tint/60 px-1 py-1 backdrop-blur-sm">
              {primary.map((p) => (
                <NavLink key={p.to} {...p} />
              ))}

              {/* More dropdown */}
              <div ref={moreRef} className="relative">
                <button
                  onClick={() => setMoreOpen((v) => !v)}
                  aria-expanded={moreOpen}
                  className={cn(
                    'group relative flex items-center gap-1 px-3.5 py-2 font-sans text-[0.82rem] font-medium tracking-wide transition-colors duration-200',
                    moreOpen || secondaryActive
                      ? 'text-ink'
                      : 'text-ink-soft hover:text-ink',
                  )}
                >
                  More
                  <ChevronDown
                    className={cn(
                      'size-3.5 transition-transform duration-300',
                      moreOpen && 'rotate-180',
                    )}
                    strokeWidth={1.8}
                  />
                </button>

                <AnimatePresence>
                  {moreOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 top-[calc(100%+0.5rem)] w-52 overflow-hidden rounded-2xl border border-ink/10 bg-paper/98 p-2 shadow-[0_24px_64px_-20px_rgb(0_0_0/0.4)] backdrop-blur-2xl"
                    >
                      <div className="mb-1.5 px-2 pt-0.5">
                        <span className="text-[0.6rem] font-mono uppercase tracking-[0.22em] text-ink-soft">
                          More pages
                        </span>
                      </div>
                      {secondary.map((s) => (
                        <Link
                          key={s.to}
                          to={s.to}
                          onClick={() => setMoreOpen(false)}
                          className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-[0.82rem] font-medium text-ink-soft transition-all duration-150 hover:bg-ink/[0.05] hover:text-ink"
                          activeProps={{ className: 'bg-ink/[0.07] text-ink' }}
                        >
                          {s.label}
                          <span className="text-[0.6rem] font-mono text-ink-soft/40 group-hover:text-ink-soft/70 transition-colors">
                            →
                          </span>
                        </Link>
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ── Right Controls ────────────────────────── */}
          <div className="flex shrink-0 items-center gap-2">
            {/* ⌘K Search */}
            <button
              onClick={onOpenCommand}
              aria-label="Open search"
              className="hidden items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 font-mono text-[0.65rem] tracking-[0.1em] text-ink-soft transition-all duration-200 hover:border-ink/30 hover:text-ink sm:inline-flex"
            >
              <span className="opacity-60">⌘</span>K
            </button>

            {/* Theme Toggle — pill style */}
            <ThemeToggle dark={dark} toggle={toggle} />

            {/* Motion toggle */}
            <button
              onClick={toggleMotion}
              aria-label={reduced ? 'Enable motion' : 'Reduce motion'}
              aria-pressed={reduced}
              title={reduced ? 'Motion reduced — click to enable' : 'Reduce motion'}
              className={cn(
                'grid size-8 place-items-center rounded-full border transition-all duration-200',
                reduced
                  ? 'border-chrome-2/50 bg-chrome-2/10 text-chrome-2'
                  : 'border-ink/15 text-ink-soft hover:border-ink/30 hover:text-ink',
              )}
            >
              {reduced ? (
                <ZapOff className="size-3.5" strokeWidth={1.6} />
              ) : (
                <Zap className="size-3.5" strokeWidth={1.6} />
              )}
            </button>

            {/* Contact CTA */}
            <Link
              to="/contact"
              className="hidden items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-sans text-[0.78rem] font-medium tracking-wide text-paper transition-opacity hover:opacity-85 xl:inline-flex"
            >
              Contact
            </Link>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="grid size-8 place-items-center rounded-full border border-ink/15 text-ink transition-all duration-200 hover:border-ink/30 xl:hidden"
            >
              <Menu className="size-4" strokeWidth={1.6} />
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile Full-screen Menu ─────────────────── */}
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
            exit={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[75] flex flex-col bg-paper/98 px-5 py-4 backdrop-blur-2xl sm:px-8"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-[1.1rem] text-ink">Navigation</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid size-9 place-items-center rounded-full border border-ink/20 text-ink transition-all hover:border-ink/40"
              >
                <X className="size-4" strokeWidth={1.6} />
              </button>
            </div>

            <ul className="mt-8 flex-1 overflow-y-auto">
              {pages.map((p, i) => (
                <motion.li
                  key={p.to}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.025, ease: 'easeOut' }}
                  className="border-b border-ink/8"
                >
                  <Link
                    to={p.to}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline justify-between gap-4 py-4 pr-2"
                    activeProps={{ className: '!text-ink' }}
                    activeOptions={{ exact: p.to === '/' }}
                  >
                    <span className="font-display text-[1.9rem] leading-none text-ink-soft transition-colors hover:text-ink">
                      {p.label}
                    </span>
                    <span className="font-mono text-[0.65rem] tracking-[0.2em] text-ink-soft/40">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-ink/10 pt-5 pb-2">
              <p className="caption text-ink-soft">{profile.email}</p>
              <ThemeToggle dark={dark} toggle={toggle} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export function CommandMenu({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const [target, setTarget] = useState<string | null>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
            <CommandItem
              key={p.to}
              value={p.label}
              onSelect={() => setTarget(p.to)}
              asChild
            >
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
