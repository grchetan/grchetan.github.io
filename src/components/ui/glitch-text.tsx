import React from "react";
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
    <div className="relative inline-flex w-full max-w-full items-center justify-center overflow-hidden rounded-2xl border border-purple-500/40 bg-gradient-to-b from-[#4B0082] via-[#3B0066] to-[#2B004A] px-4 py-6 sm:px-8 sm:py-10 shadow-2xl backdrop-blur-xl">
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

      {/* Single-line Mobile-Responsive Glitch Heading */}
      <div className="relative z-10 w-full max-w-full select-none text-center overflow-hidden">
        <h1
          className={cn(
            "glitch-arcade-text relative inline-block whitespace-nowrap font-mono text-[clamp(0.95rem,3.8vw,4.2rem)] font-black uppercase tracking-tight text-white",
            className
          )}
          data-text={text}
        >
          {text}
        </h1>
      </div>
    </div>
  );
}

export default GlitchText;
