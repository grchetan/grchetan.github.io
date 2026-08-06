import { motion, useInView, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useMotionPreference } from "@/hooks/use-motion-preference";

/* ---------------- motion primitives ---------------- */

export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const { reduced } = useMotionPreference();
  return (
    <motion.div
      initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduced ? 0 : 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}

/** cursor-magnetic wrapper — element leans toward the pointer, springs back on exit */
export function Magnetic({
  children,
  strength = 14,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const { reduced } = useMotionPreference();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.5 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.5 });

  if (reduced) return <span className={className}>{children}</span>;

  return (
    <motion.span
      ref={ref}
      style={{ x, y }}
      className={cn("inline-block will-change-transform", className)}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        x.set(((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * strength);
        y.set(((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

/** hairline that draws itself in, like a rule pulled across a board */
export function Rule({ className, delay = 0 }: { className?: string; delay?: number }) {
  const { reduced } = useMotionPreference();
  return (
    <motion.div
      aria-hidden
      initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: reduced ? 0 : 1, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformOrigin: "left" }}
      className={cn("h-px w-full bg-ink/20 will-change-transform", className)}
    />
  );
}


export function TextReveal({ text, className }: { text: string; className?: string }) {
  const { reduced } = useMotionPreference();
  const words = text.split(" ");
  return (
    <span className={cn("inline", className)}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block will-change-transform"
          initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: "0.3em", rotate: 2 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reduced ? 0 : 0.7, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </span>
  );
}


/** registration crosshair — printer's alignment mark */
export function RegMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("size-4 text-ink/35", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.75"
    >
      <circle cx="12" cy="12" r="6.5" />
      <path d="M12 0v24M0 12h24" />
    </svg>
  );
}

/* ---------------- section furniture ---------------- */

export function SectionHeading({
  eyebrow,
  title,
  description,
  figure,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  figure?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl", className)}>
      <div
        className={cn(
          "flex items-baseline gap-4",
          align === "center" ? "justify-center" : "justify-start",
        )}
      >
        <span className="label">{eyebrow}</span>
        {figure ? <span className="caption tracking-[0.2em]">Fig. {figure}</span> : null}
      </div>
      <Rule className="mt-3" />
      <Reveal delay={0.05}>
        <h2 className="mt-6 text-[clamp(2.4rem,6vw,4.5rem)]">
          <TextReveal text={title} />
        </h2>
      </Reveal>
      {description ? (
        <Reveal delay={0.12}>
          <p
            className={cn(
              "mt-5 max-w-xl text-[0.98rem] leading-relaxed text-muted-foreground",
              align === "center" ? "mx-auto" : "",
            )}
          >
            {description}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}

/** the section shell: paper margins, hairline board, one figure marker */
export function Section({
  id,
  children,
  className,
  tint = false,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tint?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative z-10 overflow-hidden px-5 py-24 sm:px-8 md:py-32 lg:px-14",
        tint ? "bg-paper-tint/70 backdrop-blur-[2px]" : "bg-transparent",
        className,
      )}
    >
      <div className="relative mx-auto w-full max-w-[84rem]">{children}</div>
    </section>
  );
}

/* ---------------- data display ---------------- */

export function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const { reduced } = useMotionPreference();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, reduced ? { stiffness: 1000, damping: 100 } : { stiffness: 55, damping: 20 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, mv, to]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => setDisplay(Math.round(v)));
    return () => unsub();
  }, [spring]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

/** photograph mounted as a trimmed plate, set slightly askew */
export function Plate({
  src,
  alt,
  caption,
  figure,
  tilt = 0,
  className,
  imgClassName,
  priority = false,
  width,
  height,
}: {
  src: string;
  alt: string;
  caption?: string;
  figure?: string;
  tilt?: number;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}) {
  const { reduced } = useMotionPreference();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const parallax = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [22, -22]);

  return (
    <motion.figure
      ref={ref}
      initial={reduced ? { opacity: 1, y: 0, rotate: tilt } : { opacity: 0, y: 26, rotate: tilt * 1.8 }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt }}
      {...(reduced ? {} : { whileHover: { rotate: 0, scale: 1.015 } })}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduced ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
      className={cn("plate group/plate p-2", className)}
    >
      <motion.div {...(reduced ? {} : { style: { y: parallax } })} className="overflow-hidden">
        <img
          loading="lazy"
          decoding="async"
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            "w-full h-auto object-contain transition-[transform,filter] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/plate:scale-[1.03] group-hover/plate:saturate-125",
            imgClassName,
          )}
        />
      </motion.div>
      {caption || figure ? (
        <figcaption className="mt-2 flex items-baseline justify-between gap-4 px-1 pb-1">
          <span className="caption">{caption}</span>
          {figure ? <span className="caption tracking-[0.2em]">{figure}</span> : null}
        </figcaption>
      ) : null}
    </motion.figure>
  );
}

