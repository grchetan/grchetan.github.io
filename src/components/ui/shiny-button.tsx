import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "solid" | "outline" | "cyan" | "purple";
  as?: React.ElementType;
  to?: string;
  params?: Record<string, string>;
  href?: string;
  target?: string;
  rel?: string;
  download?: boolean;
}

export const ShinyButton = React.forwardRef<any, ShinyButtonProps>(
  ({ children, className, variant = "solid", as: Component = "button", ...props }, ref) => {
    const isOutline = variant === "outline";
    const isCyan = variant === "cyan";

    const MotionComponent = React.useMemo(() => motion.create(Component), [Component]);

    return (
      <MotionComponent
        ref={ref}
        initial={{ "--x": "100%" } as any}
        animate={{ "--x": "-100%" } as any}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        transition={{
          "--x": {
            repeat: Infinity,
            repeatType: "loop",
            repeatDelay: 1,
            duration: 2.2,
            ease: "linear",
          },
          scale: {
            type: "spring",
            stiffness: 300,
            damping: 18,
          },
        }}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] font-bold backdrop-blur-xl transition-all duration-300 select-none cursor-pointer border no-underline",
          isOutline
            ? "border-indigo-500/30 bg-paper/70 text-ink shadow-sm hover:border-indigo-500/60 dark:hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            : isCyan
            ? "border-cyan-400/40 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white shadow-md hover:shadow-[0_0_22px_rgba(34,211,238,0.5)]"
            : "border-purple-400/40 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 text-white shadow-md hover:shadow-[0_0_22px_rgba(168,85,247,0.5)]",
          className
        )}
        {...props}
      >
        <span
          className="relative z-10 inline-flex items-center gap-2"
          style={{
            maskImage:
              "linear-gradient(-75deg, rgba(255,255,255,1) calc(var(--x) + 20%), rgba(255,255,255,0.3) calc(var(--x) + 30%), rgba(255,255,255,1) calc(var(--x) + 100%))",
            WebkitMaskImage:
              "linear-gradient(-75deg, rgba(255,255,255,1) calc(var(--x) + 20%), rgba(255,255,255,0.3) calc(var(--x) + 30%), rgba(255,255,255,1) calc(var(--x) + 100%))",
          }}
        >
          {children}
        </span>
        <span
          style={{
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
          }}
          className="absolute inset-0 z-20 pointer-events-none block rounded-[inherit] bg-[linear-gradient(-75deg,transparent_calc(var(--x)+15%),rgba(255,255,255,0.9)_calc(var(--x)+25%),transparent_calc(var(--x)+100%))] p-px"
        />
      </MotionComponent>
    );
  }
);

ShinyButton.displayName = "ShinyButton";

export default ShinyButton;
