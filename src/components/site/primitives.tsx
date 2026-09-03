import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import { useCssReveal } from '@/hooks/use-css-reveal';

const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768;

/* ---------------- motion primitives ---------------- */

export function Reveal({
  children,
  delay = 0,
  y = 16,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const { reduced } = useMotionPreference();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (isInView) setRevealed(true);
    // Guaranteed fallback: content NEVER stays invisible
    const timer = setTimeout(() => setRevealed(true), 700);
    return () => clearTimeout(timer);
  }, [isInView]);

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={revealed ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: 0.65,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** cursor-magnetic wrapper — element leans toward the pointer, springs back on exit with cached rect */
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
  const rectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);

  // Skip spring physics on touch devices — pointer tracking is useless on mobile
  const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  const x = useSpring(useMotionValue(0), {
    stiffness: 240,
    damping: 20,
    mass: 0.4,
  });
  const y = useSpring(useMotionValue(0), {
    stiffness: 240,
    damping: 20,
    mass: 0.4,
  });

  if (reduced || isTouch) return <span className={className}>{children}</span>;

  return (
    <motion.span
      ref={ref}
      style={{ x, y }}
      className={cn('inline-block', className)}
      onPointerEnter={() => {
        if (ref.current) {
          const r = ref.current.getBoundingClientRect();
          rectRef.current = { left: r.left, top: r.top, width: r.width, height: r.height };
        }
      }}
      onPointerMove={(e) => {
        let r = rectRef.current;
        if (!r && ref.current) {
          const rect = ref.current.getBoundingClientRect();
          r = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
          rectRef.current = r;
        }
        if (!r || r.width === 0 || r.height === 0) return;
        x.set(((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * strength);
        y.set(((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        rectRef.current = null;
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

/** hairline that draws itself in, like a rule pulled across a board */
export function Rule({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  const { reduced } = useMotionPreference();
  if (IS_MOBILE) {
    return (
      <div
        aria-hidden
        className={cn('rule-in h-px w-full bg-ink/20', className)}
      />
    );
  }
  return (
    <motion.div
      aria-hidden
      initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: reduced ? 0 : 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformOrigin: 'left' }}
      className={cn('h-px w-full bg-ink/20', className)}
    />
  );
}

/** TextReveal component with safe inline rendering */
export function TextReveal({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return <span className={className}>{text}</span>;
}

/** registration crosshair — printer's alignment mark */
export function RegMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn('size-4 text-ink/35', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.75"
    >
      <circle cx="12" cy="12" r="6.5" />
      <path d="M12 0v24M0 12h24" />
    </svg>
  );
}

/* ---------------- section furniture: guaranteed visible & butter smooth ---------------- */

export function SectionHeading({
  eyebrow,
  figure,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow: string;
  figure?: string;
  title: React.ReactNode;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  const { reduced } = useMotionPreference();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px -50px 0px' });
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (isInView) setRevealed(true);
    // Deterministic fallback: Guaranteed to reveal after 500ms so text is NEVER hidden
    const timer = setTimeout(() => setRevealed(true), 500);
    return () => clearTimeout(timer);
  }, [isInView]);

  return (
    <div
      ref={ref}
      className={cn(
        'relative z-10',
        align === 'center' ? 'text-center' : 'text-left',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-baseline gap-4',
          align === 'center' ? 'justify-center' : 'justify-start',
        )}
      >
        <span className="label">{eyebrow}</span>
        {figure ? (
          <span className="caption tracking-[0.2em]">Fig. {figure}</span>
        ) : null}
      </div>
      <Rule className="mt-3" />
      <motion.h2
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={revealed ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6 text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.98] text-ink font-display"
      >
        {title}
      </motion.h2>
      {description ? (
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={revealed ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.65, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'mt-5 max-w-xl text-[0.98rem] leading-relaxed text-muted-foreground',
            align === 'center' ? 'mx-auto' : '',
          )}
        >
          {description}
        </motion.p>
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
        'relative z-10 overflow-hidden px-5 py-24 sm:px-8 md:py-32 lg:px-14',
        tint ? 'bg-paper-tint/70 backdrop-blur-[2px]' : 'bg-transparent',
        className,
      )}
    >
      <div className="relative mx-auto w-full max-w-[84rem]">{children}</div>
    </section>
  );
}

/* ---------------- data display ---------------- */

export function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const { reduced } = useMotionPreference();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const mv = useMotionValue(0);
  const spring = useSpring(
    mv,
    reduced
      ? { stiffness: 1000, damping: 100 }
      : { stiffness: 55, damping: 20 },
  );
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, mv, to]);

  useEffect(() => {
    const unsub = spring.on('change', (v) => setDisplay(Math.round(v)));
    return () => unsub();
  }, [spring]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

/** photograph mounted as a trimmed plate, set slightly askew with smooth card depth */
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
  const isInView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (isInView) setRevealed(true);
    const timer = setTimeout(() => setRevealed(true), 800);
    return () => clearTimeout(timer);
  }, [isInView]);

  return (
    <motion.figure
      ref={ref}
      initial={
        reduced
          ? { opacity: 1, y: 0, rotate: tilt }
          : { opacity: 0, y: 22, rotate: tilt * 1.4 }
      }
      animate={revealed ? { opacity: 1, y: 0, rotate: tilt } : undefined}
      transition={{ duration: reduced ? 0 : 0.85, ease: [0.16, 1, 0.3, 1] }}
      className={cn('plate card-depth group/plate p-2.5 overflow-hidden', className)}
    >
      <div className="overflow-hidden rounded-[calc(var(--radius-lg)-6px)]">
        <img
          loading="lazy"
          decoding="async"
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            'w-full h-auto object-contain transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/plate:scale-[1.03]',
            imgClassName,
          )}
        />
      </div>
      {caption || figure ? (
        <figcaption className="mt-2.5 flex items-baseline justify-between gap-4 px-1 pb-1">
          <span className="caption">{caption}</span>
          {figure ? (
            <span className="caption tracking-[0.2em]">{figure}</span>
          ) : null}
        </figcaption>
      ) : null}
    </motion.figure>
  );
}
