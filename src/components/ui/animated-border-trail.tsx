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
  // Disable spinning conic on mobile — each instance is a separate GPU composited layer
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const deg = arc[trailSize];
  const showAnimation = !reduced && !isMobile;

  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl", className)}
      style={{ padding: borderWidth, ...style }}
      {...props}
    >
      {showAnimation ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[-120%] motion-safe:animate-[trailSpin_var(--trail-duration)_linear_infinite] [animation-play-state:paused] group-hover:[animation-play-state:running] hover:[animation-play-state:running]"
          style={
            {
              "--trail-duration": duration,
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
