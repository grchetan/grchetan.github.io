import { motion } from "motion/react";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { FloatingActions, LoadingScreen, ScrollProgress, SmoothScroll } from "@/components/site/chrome";
import { Footer } from "@/components/site/contact";
import { AuroraBackground, CustomCursor, DotGrid } from "@/components/site/effects";
import { CommandMenu, Navbar } from "@/components/site/nav";
import { VersionWatcher } from "@/components/site/version-watcher";
import { NetworkStatusWatcher } from "@/components/site/network-status";
import { trackVisit } from "@/lib/content";
import { MotionPreferenceProvider, useMotionPreference } from "@/hooks/use-motion-preference";

function SiteShellInner({ children }: { children: ReactNode }) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { reduced } = useMotionPreference();

  useEffect(() => {
    void trackVisit(path);
  }, [path]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [path]);

  return (
    <div className="relative min-h-screen">
      <VersionWatcher />
      <NetworkStatusWatcher />
      <AuroraBackground />
      <DotGrid />
      <CustomCursor />
      <LoadingScreen />
      <SmoothScroll />
      <ScrollProgress />
      <Navbar onOpenCommand={() => setCmdOpen(true)} />
      <CommandMenu open={cmdOpen} setOpen={setCmdOpen} />
      <FloatingActions />

      <motion.main
        key={path}
        initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.main>

      <Footer />
    </div>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <MotionPreferenceProvider>
      <SiteShellInner>{children}</SiteShellInner>
    </MotionPreferenceProvider>
  );
}

/** page header used by every inner page */
export function PageHero({
  eyebrow,
  title,
  lead,
  meta,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
  meta?: string[];
}) {
  const { reduced } = useMotionPreference();
  return (
    <header className="relative z-10 px-5 pb-6 pt-32 sm:px-8 md:pt-40 lg:px-14">
      <div className="mx-auto w-full max-w-[84rem]">
        <span className="label">{eyebrow}</span>
        <motion.h1
          initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 max-w-4xl text-[clamp(2.6rem,7vw,5rem)]"
        >
          {title}
        </motion.h1>
        {lead ? (
          <motion.p
            initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.7, delay: 0.1 }}
            className="mt-6 max-w-2xl text-[1.05rem] leading-[1.8] text-ink-soft"
          >
            {lead}
          </motion.p>
        ) : null}
        {meta?.length ? (
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink/10 pt-5">
            {meta.map((m) => (
              <span key={m} className="caption">
                {m}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
