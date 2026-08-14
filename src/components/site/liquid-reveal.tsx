import React, { useEffect, useRef, useState } from "react";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { cn } from "@/lib/utils";

export function LiquidVideoReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const { reduced } = useMotionPreference();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check viewport size for mobile bypass
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Physics & Animation Loop (Direct DOM mutations for zero React re-renders)
  useEffect(() => {
    if (reduced || isMobile) return;

    let animFrameId: number;
    let time = 0;

    // Physics State
    const mouse = { x: -500, y: -500, targetX: -500, targetY: -500 };
    const velocity = { x: 0, y: 0 };
    let currentRadius = 0;
    let targetRadius = 0;

    const numPoints = 8;
    const baseRadius = 160; // Desired blob radius on desktop

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      targetRadius = baseRadius;
    };

    const handleMouseEnter = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.x = mouse.targetX;
      mouse.y = mouse.targetY;
      targetRadius = baseRadius;
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      targetRadius = 0;
      setIsHovered(false);
    };

    const containerEl = containerRef.current;
    if (containerEl) {
      containerEl.addEventListener("mousemove", handleMouseMove);
      containerEl.addEventListener("mouseenter", handleMouseEnter);
      containerEl.addEventListener("mouseleave", handleMouseLeave);
    }

    const render = () => {
      time += 0.03;

      // Smooth Lerp for Cursor Position
      const prevX = mouse.x;
      const prevY = mouse.y;

      mouse.x += (mouse.targetX - mouse.x) * 0.12;
      mouse.y += (mouse.targetY - mouse.y) * 0.12;

      // Velocity & Speed
      velocity.x = mouse.x - prevX;
      velocity.y = mouse.y - prevY;
      const speed = Math.hypot(velocity.x, velocity.y);
      const angle = Math.atan2(velocity.y, velocity.x);

      // Smooth Radius Lerp
      currentRadius += (targetRadius - currentRadius) * 0.08;

      if (pathRef.current && currentRadius > 0.5) {
        // Organic Deforming Blob Spline
        const points: { x: number; y: number }[] = [];
        const stretch = Math.min(speed * 1.5, 60);

        for (let i = 0; i < numPoints; i++) {
          const ptAngle = (i / numPoints) * Math.PI * 2;
          
          // Deform along movement direction
          const angleDiff = Math.cos(ptAngle - angle);
          const dirDeform = angleDiff * stretch;

          // Organic water surface noise ripple
          const noise = Math.sin(time * 3 + i * 2.1) * 14 + Math.cos(time * 2 + i * 1.4) * 8;
          
          const r = Math.max(20, currentRadius + dirDeform + noise);
          const px = mouse.x + Math.cos(ptAngle) * r;
          const py = mouse.y + Math.sin(ptAngle) * r;

          points.push({ x: px, y: py });
        }

        // Generate smooth cubic Bezier path string
        let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
        for (let i = 0; i < numPoints; i++) {
          const p0 = points[(i - 1 + numPoints) % numPoints];
          const p1 = points[i];
          const p2 = points[(i + 1) % numPoints];
          const p3 = points[(i + 2) % numPoints];

          const cp1x = p1.x + (p2.x - p0.x) / 6;
          const cp1y = p1.y + (p2.y - p0.y) / 6;
          const cp2x = p2.x - (p3.x - p1.x) / 6;
          const cp2y = p2.y - (p3.y - p1.y) / 6;

          d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
        }
        d += " Z";

        pathRef.current.setAttribute("d", d);
      } else if (pathRef.current) {
        pathRef.current.setAttribute("d", "");
      }

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
      if (containerEl) {
        containerEl.removeEventListener("mousemove", handleMouseMove);
        containerEl.removeEventListener("mouseenter", handleMouseEnter);
        containerEl.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [reduced, isMobile]);

  return (
    <section
      id="closing-thought"
      ref={containerRef}
      className={cn(
        "relative w-full min-h-[85vh] lg:min-h-screen flex flex-col justify-between py-12 px-6 sm:px-12 lg:px-16 overflow-hidden select-none border-t border-ink/10 bg-background transition-colors duration-500"
      )}
    >
      {/* SVG ClipPath Definition */}
      <svg className="absolute size-0 pointer-events-none aria-hidden:true">
        <defs>
          <clipPath id="siteready-liquid-clip" clipPathUnits="userSpaceOnUse">
            <path ref={pathRef} d="" />
          </clipPath>
        </defs>
      </svg>

      {/* TOP HEADER */}
      <div className="relative z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-chrome-2 animate-pulse" />
          <span className="label text-[0.75rem] tracking-[0.22em] uppercase text-ink">
            ABOUT / CLOSING THOUGHT
          </span>
        </div>
        <span className="caption font-mono text-ink-soft text-xs">FIG. 05</span>
      </div>

      {/* CENTER STATEMENT — LAYER 1: BASE NORMAL TYPOGRAPHY */}
      <div className="relative z-10 my-auto py-12 max-w-7xl mx-auto w-full pointer-events-none">
        <h2 className="font-display text-[clamp(2.5rem,7vw,6.8rem)] uppercase tracking-[-0.03em] leading-[0.94] text-ink font-bold">
          I DON'T JUST BUILD <br />
          <span className="italic font-serif font-normal text-ink-soft">WEBSITES.</span> <br />
          I BUILD DIGITAL <br />
          <span className="underline decoration-ink/20 underline-offset-8">EXPERIENCES.</span>
        </h2>
      </div>

      {/* REVEAL LAYER 2: CLIPPED LIQUID VIDEO & TRANSFORMED INVERTED TEXT */}
      {(!reduced && !isMobile) ? (
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{ clipPath: "url(#siteready-liquid-clip)" }}
        >
          {/* Cinematic Background Video */}
          <video
            src="/videos/about-reveal.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 size-full object-cover brightness-110 saturate-125 scale-105"
          />
          {/* Subtle Dark Glass Tint */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

          {/* Duplicated Transformed Text Layer inside Liquid Window */}
          <div className="absolute inset-0 flex flex-col justify-between py-12 px-6 sm:px-12 lg:px-16">
            <div className="flex items-center justify-between">
              <span className="label text-[0.75rem] tracking-[0.22em] uppercase text-white font-semibold">
                ABOUT / CLOSING THOUGHT
              </span>
              <span className="caption font-mono text-white/80 text-xs">FIG. 05</span>
            </div>

            <div className="my-auto py-12 max-w-7xl mx-auto w-full">
              <h2
                aria-hidden="true"
                className="font-display text-[clamp(2.5rem,7vw,6.8rem)] uppercase tracking-[-0.03em] leading-[0.94] text-white font-bold drop-shadow-2xl"
              >
                I DON'T JUST BUILD <br />
                <span className="italic font-serif font-normal text-white/90">WEBSITES.</span> <br />
                I BUILD DIGITAL <br />
                <span className="underline decoration-white/50 underline-offset-8">EXPERIENCES.</span>
              </h2>
            </div>

            <div className="max-w-md">
              <p className="caption text-white/90 font-mono text-xs tracking-wider uppercase">
                Designing, developing and shipping digital experiences from idea to production.
              </p>
            </div>
          </div>
        </div>
      ) : isMobile ? (
        /* Mobile Fallback: Subtle static background video element without mouse tracking */
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <video
            src="/videos/about-reveal.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="size-full object-cover grayscale"
          />
        </div>
      ) : null}

      {/* BOTTOM SUPPORTING TEXT */}
      <div className="relative z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pointer-events-none">
        <p className="caption text-ink-soft font-mono text-xs max-w-md leading-relaxed tracking-wide">
          "Designing, developing and shipping digital experiences from idea to production."
        </p>

        <div className="hidden sm:flex items-center gap-2 caption font-mono text-[0.7rem] text-ink-soft uppercase tracking-widest">
          <span>MOVE CURSOR TO REVEAL</span>
          <span className="inline-block size-1.5 rounded-full bg-chrome-3" />
        </div>
      </div>
    </section>
  );
}
