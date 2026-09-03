import * as React from "react";
import { cn } from "@/lib/utils";
import { useMotionPreference } from "@/hooks/use-motion-preference";

interface AnimatedTrailProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Duration of one full lap around the border. @default "10s" */
  duration?: string;
  /** Class applied to the inner content shell (give it a background). */
  contentClassName?: string;
  /** Any CSS colour or gradient stop colour for the trail head. */
  trailColor?: string;
  /** Length of the glowing arc. */
  trailSize?: "sm" | "md" | "lg";
  /** Thickness of the border ring in px. @default 1.5 */
  borderWidth?: number;
}

const arc = { sm: 24, md: 60, lg: 120 } as const;

export default function AnimatedBorderTrail({
  children,
  className,
  duration = "10s",
  trailColor = "var(--chrome-2)",
  trailSize = "md",
  contentClassName,
  borderWidth = 1.5,
  style,
  ...props
}: AnimatedTrailProps) {
  const { reduced } = useMotionPreference();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [inView, setInView] = React.useState(true);
  const deg = arc[trailSize];
  const showAnimation = !reduced;

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { rootMargin: "160px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-2xl", className)}
      style={{ padding: borderWidth, ...style }}
      {...props}
    >
      {showAnimation ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[-120%] will-change-transform translate-z-0 motion-safe:animate-[trailSpin_var(--trail-duration)_linear_infinite]"
          style={
            {
              "--trail-duration": duration,
              animationPlayState: inView ? "running" : "paused",
              background: `conic-gradient(from 0deg, transparent 0 ${360 - deg}deg, ${trailColor} 360deg)`,
            } as React.CSSProperties
          }
        />
      ) : (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ border: `1px solid color-mix(in oklab, ${trailColor} 35%, transparent)` }}
        />
      )}
      <div className={cn("relative h-full w-full rounded-[inherit]", contentClassName)}>{children}</div>
    </div>
  );
}
