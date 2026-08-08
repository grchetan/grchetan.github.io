import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

interface MorphingTextProps {
  phrases?: string[];
  interval?: number;
  className?: string;
}

export function MorphingText({
  phrases = [
    "Play a run.",
    "Set a record.",
    "Climb the board.",
    "Claim your glory.",
  ],
  interval = 3200,
  className,
}: MorphingTextProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, interval);

    return () => clearInterval(timer);
  }, [phrases.length, interval]);

  return (
    <div className={cn("inline-block overflow-hidden py-1 min-h-[3rem]", className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={phrases[index]}
          initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -14, filter: "blur(8px)" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl"
        >
          {phrases[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export default MorphingText;
