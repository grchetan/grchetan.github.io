import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

interface SwapTextProps {
  initialText: React.ReactNode;
  swappedText: React.ReactNode;
  className?: string;
  initialClassName?: string;
  swappedClassName?: string;
  mode?: "hover" | "click" | "both";
}

export function SwapText({
  initialText,
  swappedText,
  className,
  initialClassName,
  swappedClassName,
  mode = "hover",
}: SwapTextProps) {
  const [isSwapped, setIsSwapped] = useState(false);

  const handleMouseEnter = () => {
    if (mode === "hover" || mode === "both") setIsSwapped(true);
  };

  const handleMouseLeave = () => {
    if (mode === "hover" || mode === "both") setIsSwapped(false);
  };

  const handleClick = () => {
    if (mode === "click" || mode === "both") setIsSwapped((prev) => !prev);
  };

  return (
    <span
      className={cn(
        "relative inline-block cursor-pointer overflow-hidden py-1 transition-all select-none",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <AnimatePresence mode="wait" initial={false}>
        {!isSwapped ? (
          <motion.span
            key="initial"
            initial={{ y: 22, opacity: 0, filter: "blur(6px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -22, opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={cn("block", initialClassName)}
          >
            {initialText}
          </motion.span>
        ) : (
          <motion.span
            key="swapped"
            initial={{ y: 22, opacity: 0, filter: "blur(6px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -22, opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={cn("block", swappedClassName)}
          >
            {swappedText}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export default SwapText;
