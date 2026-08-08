import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
  text: string;
  className?: string;
  starCount?: number;
}

export function GlitchText({
  text = "Interactive Arena, Ranked.",
  className,
  starCount = 45,
}: GlitchTextProps) {
  return (
    <div className="relative inline-flex w-full max-w-full items-center justify-center overflow-hidden rounded-2xl border border-purple-500/40 bg-gradient-to-b from-[#4B0082] via-[#3B0066] to-[#2B004A] px-4 py-5 sm:px-8 sm:py-7 shadow-2xl backdrop-blur-xl">
      {/* Background Starfield */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        {Array.from({ length: starCount }).map((_, i) => (
          <div
            key={i}
            className="absolute aspect-square rounded-full bg-white opacity-85 animate-twinkle"
            style={{
              width: `${(i % 3) + 1.5}px`,
              left: `${(i * 13) % 100}%`,
              top: `${(i * 19) % 100}%`,
              animationDelay: `${(i * 0.2) % 4}s`,
              animationDuration: `${2.5 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      {/* Infinite Seamless Marquee Slider Container */}
      <div className="relative z-10 w-full max-w-full select-none overflow-hidden py-1">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
            duration: 14,
          }}
          className="flex w-max items-center whitespace-nowrap"
        >
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="flex items-center shrink-0 pr-8">
              <h1
                className={cn(
                  "glitch-arcade-text relative inline-block font-mono text-[clamp(1.1rem,4vw,3.2rem)] font-black uppercase tracking-tight text-white",
                  className
                )}
                data-text={text}
              >
                {text}
              </h1>
              <span className="ml-8 font-mono text-purple-400/70 opacity-80 text-lg">★</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default GlitchText;
