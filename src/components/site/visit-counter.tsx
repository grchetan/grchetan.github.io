import { motion } from "motion/react";
import { Eye } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { fetchSheetStats } from "@/lib/site-analytics";

/** Live "Portfolio views" counter, powered by the Google Sheet analytics endpoint. */
export function VisitCounter({ className = "" }: { className?: string }) {
  const [total, setTotal] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const frame = useRef<number>(0);

  useEffect(() => {
    let alive = true;
    fetchSheetStats()
      .then((s) => {
        if (alive) setTotal(s.total);
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  useEffect(() => {
    if (total === null) return;
    const duration = 1500;
    let start: number | null = null;
    const step = (t: number) => {
      if (start === null) start = t;
      const progress = Math.min((t - start) / duration, 1);
      setShown(Math.floor(progress * total));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  }, [total]);

  // Render a same-size skeleton while loading to prevent Cumulative Layout Shift (CLS).
  // Returning null causes a 0→~40px height jump when the counter appears, which shifts
  // all content below it upward — exactly the scroll-glitch the user reported.
  if (total === null) {
    return (
      <span
        aria-hidden
        className={`inline-flex items-center gap-2 rounded-full border border-ink/8 bg-paper/50 px-3.5 py-1.5 opacity-0 select-none pointer-events-none ${className}`}
      >
        <span className="size-3.5" />
        <span className="label !tracking-[0.18em]">Portfolio views</span>
        <span className="font-mono text-[0.8rem] font-bold">0</span>
      </span>
    );
  }

  return (
    <motion.span
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`inline-flex items-center gap-2 rounded-full border border-ink/12 bg-paper/70 px-3.5 py-1.5 backdrop-blur ${className}`}
    >
      <Eye className="size-3.5 text-ink-soft" strokeWidth={1.5} />
      <span className="label !tracking-[0.18em]">Portfolio views</span>
      <span className="font-mono text-[0.8rem] font-bold text-ink">{shown.toLocaleString()}</span>
    </motion.span>
  );
}
