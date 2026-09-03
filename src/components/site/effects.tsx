import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import { cn } from '@/lib/utils';

/* ---------------- Aurora / blob background ---------------- */

export function AuroraBackground() {
  return null;
}

/* ---------------- Interactive dot grid ---------------- */

export function DotGrid() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { reduced } = useMotionPreference();

  useEffect(() => {
    if (reduced) return;
    if ((navigator.hardwareConcurrency || 8) <= 4) return; // low-power device: skip
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const pointer = { x: -9999, y: -9999 };
    const gap = 34;
    const radius = 150;
    let dirty = true;
    let visible = document.visibilityState === 'visible';

    /* static dot layer rendered once per resize */
    const base = document.createElement('canvas');
    const baseCtx = base.getContext('2d');

    const paintBase = () => {
      if (!baseCtx) return;
      base.width = Math.round(w * dpr);
      base.height = Math.round(h * dpr);
      baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      baseCtx.clearRect(0, 0, w, h);
      baseCtx.fillStyle = 'rgba(167, 139, 250, 0.14)';
      for (let x = gap / 2; x < w; x += gap) {
        for (let y = gap / 2; y < h; y += gap) {
          baseCtx.beginPath();
          baseCtx.arc(x, y, 0.9, 0, Math.PI * 2);
          baseCtx.fill();
        }
      }
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintBase();
      dirty = true;
    };

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      dirty = true;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
      dirty = true;
    };
    const onVisibility = () => {
      visible = document.visibilityState === 'visible';
      dirty = true;
    };

    let last = 0;
    const frameMs = 1000 / 40;
    let isScrolling = false;
    let scrollTimer: ReturnType<typeof setTimeout>;

    const onScroll = () => {
      isScrolling = true;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        isScrolling = false;
        dirty = true;
      }, 120);
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible || !dirty || isScrolling || now - last < frameMs) return;
      last = now;
      dirty = false;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(base, 0, 0, w, h);

      /* only the dots inside the pointer halo need per-frame math */
      if (pointer.x > -1000) {
        const x0 = Math.max(
          gap / 2,
          Math.floor((pointer.x - radius) / gap) * gap + gap / 2,
        );
        const y0 = Math.max(
          gap / 2,
          Math.floor((pointer.y - radius) / gap) * gap + gap / 2,
        );
        for (let x = x0; x < Math.min(w, pointer.x + radius); x += gap) {
          for (let y = y0; y < Math.min(h, pointer.y + radius); y += gap) {
            const dx = x - pointer.x;
            const dy = y - pointer.y;
            const dist = Math.hypot(dx, dy);
            if (dist >= radius) continue;
            const near = 1 - dist / radius;
            const push = near * 10;
            const ang = Math.atan2(dy, dx);
            ctx.beginPath();
            ctx.arc(
              x + Math.cos(ang) * push,
              y + Math.sin(ang) * push,
              0.9 + near * 1.6,
              0,
              Math.PI * 2,
            );
            ctx.fillStyle = `rgba(167, 139, 250, ${0.14 + near * 0.6})`;
            ctx.fill();
          }
        }
      }
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(scrollTimer);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 hidden opacity-70 md:block"
    />
  );
}

/* ---------------- Silk ribbon cursor trail (native cursor kept) ---------------- */

export function CustomCursor() {
  const { reduced } = useMotionPreference();
  const rootRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const mouse = useRef({ x: -9999, y: -9999 });
  const ringPos = useRef({ x: -9999, y: -9999 });
  const initialized = useRef(false);
  const rafRef = useRef<number>(0);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let animating = false;

    const startAnimation = () => {
      if (!animating) {
        animating = true;
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    const updatePos = (e: PointerEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      if (!initialized.current) {
        ringPos.current.x = e.clientX;
        ringPos.current.y = e.clientY;
        initialized.current = true;
      }
      if (rootRef.current && rootRef.current.style.opacity !== "1") {
        rootRef.current.style.opacity = "1";
      }
      startAnimation();
    };

    const onPointerMove = (e: PointerEvent) => {
      updatePos(e);

      const target = e.target as HTMLElement | null;
      const isInteractive = Boolean(
        target &&
          (target.tagName === 'BUTTON' ||
            target.tagName === 'A' ||
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.closest('button') ||
            target.closest('a') ||
            target.getAttribute('role') === 'button' ||
            target.classList.contains('cursor-pointer'))
      );

      if (isInteractive !== isHoveredRef.current) {
        isHoveredRef.current = isInteractive;
        // Direct DOM update — ZERO React component re-renders!
        if (ringRef.current) ringRef.current.dataset.hover = isInteractive ? "true" : "false";
        if (dotRef.current) dotRef.current.dataset.hover = isInteractive ? "true" : "false";
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      updatePos(e);
      if (ringRef.current) ringRef.current.dataset.click = "true";
      if (dotRef.current) dotRef.current.dataset.click = "true";
    };
    const onPointerUp = (e: PointerEvent) => {
      updatePos(e);
      if (ringRef.current) ringRef.current.dataset.click = "false";
      if (dotRef.current) dotRef.current.dataset.click = "false";
    };
    const onPointerLeave = () => {
      if (rootRef.current) rootRef.current.style.opacity = "0";
    };
    const onPointerEnter = () => {
      if (rootRef.current) rootRef.current.style.opacity = "1";
    };

    const loop = () => {
      if (initialized.current) {
        const lerp = 0.22;
        const dx = mouse.current.x - ringPos.current.x;
        const dy = mouse.current.y - ringPos.current.y;

        ringPos.current.x += dx * lerp;
        ringPos.current.y += dy * lerp;

        if (dotRef.current) {
          dotRef.current.style.transform = `translate3d(${mouse.current.x}px, ${mouse.current.y}px, 0)`;
        }
        if (ringRef.current) {
          ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
        }

        // If cursor has caught up and stopped moving, pause loop to save CPU
        if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
          animating = false;
          return;
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.documentElement.addEventListener('pointerenter', onPointerEnter);

    startAnimation();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.documentElement.removeEventListener('pointerenter', onPointerEnter);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden
      style={{ opacity: 0 }}
      className="pointer-events-none fixed inset-0 z-[200] hidden overflow-hidden md:block transition-opacity duration-300"
    >
      {/* Outer fluid aura ring */}
      <div
        ref={ringRef}
        data-hover="false"
        data-click="false"
        className="group/ring absolute top-0 left-0"
        style={{ transition: 'none' }}
      >
        <div
          className="size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-chrome-2/50 bg-chrome-2/5 shadow-[0_0_10px_rgba(129,140,248,0.2)] transition-all duration-200 ease-out group-data-[hover=true]/ring:size-14 group-data-[hover=true]/ring:border-chrome-1/80 group-data-[hover=true]/ring:bg-chrome-1/15 group-data-[hover=true]/ring:shadow-[0_0_20px_rgba(167,139,250,0.4)] group-data-[hover=true]/ring:scale-110 group-data-[click=true]/ring:scale-75 group-data-[click=true]/ring:opacity-90"
        />
      </div>

      {/* Inner glowing pointer dot */}
      <div
        ref={dotRef}
        data-hover="false"
        data-click="false"
        className="group/dot absolute top-0 left-0"
        style={{ transition: 'none' }}
      >
        <div
          className="size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-chrome-1 to-chrome-3 shadow-[0_0_6px_rgba(255,255,255,0.8)] transition-all duration-150 ease-out group-data-[hover=true]/dot:size-2.5 group-data-[hover=true]/dot:shadow-[0_0_10px_#fff] group-data-[click=true]/dot:scale-150"
        />
      </div>
    </div>
  );
}

/* ---------------- Magnetic wrapper with cached rect ---------------- */

export function Magnetic({
  children,
  strength = 14,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 240, damping: 20 });
  const sy = useSpring(y, { stiffness: 240, damping: 20 });

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      className={className}
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
        x.set(((e.clientX - (r.left + r.width / 2)) / r.width) * strength * 2);
        y.set(((e.clientY - (r.top + r.height / 2)) / r.height) * strength * 2);
      }}
      onPointerLeave={() => {
        rectRef.current = null;
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
