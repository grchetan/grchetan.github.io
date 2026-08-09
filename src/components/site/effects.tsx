import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { cn } from "@/lib/utils";

/* ---------------- Aurora / blob background ---------------- */

export function AuroraBackground() {
  const { reduced } = useMotionPreference();
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "24%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "-18%"]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div {...(reduced ? {} : { style: { y: y1 } })} className="absolute inset-0">
        <span
          className="blob left-[-10%] top-[-8%] size-[38rem] opacity-45"
          style={{ background: "radial-gradient(circle, var(--chrome-2), transparent 70%)", animationPlayState: reduced ? "paused" : "running" }}
        />
        <span
          className="blob right-[-8%] top-[28%] size-[32rem] opacity-40"
          style={{
            background: "radial-gradient(circle, var(--chrome-3), transparent 70%)",
            animationDelay: "-7s",
            animationPlayState: reduced ? "paused" : "running",
          }}
        />
      </motion.div>
      <motion.div {...(reduced ? {} : { style: { y: y2 } })} className="absolute inset-0">
        <span
          className="blob left-[22%] bottom-[-12%] size-[36rem] opacity-35"
          style={{
            background: "radial-gradient(circle, var(--chrome-1), transparent 70%)",
            animationDelay: "-14s",
            animationPlayState: reduced ? "paused" : "running",
          }}
        />
      </motion.div>
    </div>
  );
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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const pointer = { x: -9999, y: -9999 };
    const gap = 34;
    const radius = 150;
    let dirty = true;
    let visible = document.visibilityState === "visible";

    /* static dot layer rendered once per resize */
    const base = document.createElement("canvas");
    const baseCtx = base.getContext("2d");

    const paintBase = () => {
      if (!baseCtx) return;
      base.width = Math.round(w * dpr);
      base.height = Math.round(h * dpr);
      baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      baseCtx.clearRect(0, 0, w, h);
      baseCtx.fillStyle = "rgba(167, 139, 250, 0.14)";
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
      visible = document.visibilityState === "visible";
      dirty = true;
    };

    let last = 0;
    const frameMs = 1000 / 40;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible || !dirty || now - last < frameMs) return;
      last = now;
      dirty = false;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(base, 0, 0, w, h);

      /* only the dots inside the pointer halo need per-frame math */
      if (pointer.x > -1000) {
        const x0 = Math.max(gap / 2, Math.floor((pointer.x - radius) / gap) * gap + gap / 2);
        const y0 = Math.max(gap / 2, Math.floor((pointer.y - radius) / gap) * gap + gap / 2);
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
            ctx.arc(x + Math.cos(ang) * push, y + Math.sin(ang) * push, 0.9 + near * 1.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(167, 139, 250, ${0.14 + near * 0.6})`;
            ctx.fill();
          }
        }
      }
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
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
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const mouse = useRef({ x: -9999, y: -9999 });
  const ringPos = useRef({ x: -9999, y: -9999 });
  const initialized = useRef(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

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
      setVisible(true);
      startAnimation();
    };

    const onPointerMove = (e: PointerEvent) => {
      updatePos(e);

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.closest("button") ||
          target.closest("a") ||
          target.getAttribute("role") === "button" ||
          target.classList.contains("cursor-pointer"))
      ) {
        setHovered(true);
      } else {
        setHovered(false);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      updatePos(e);
      setClicked(true);
    };
    const onPointerUp = (e: PointerEvent) => {
      updatePos(e);
      setClicked(false);
    };
    const onPointerLeave = () => setVisible(false);
    const onPointerEnter = () => setVisible(true);

    const loop = () => {
      if (initialized.current) {
        const lerp = 0.25;
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

        // If we are extremely close, stop the loop to save CPU/GPU cycles
        if (Math.abs(dx) < 0.08 && Math.abs(dy) < 0.08) {
          animating = false;
          return;
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    document.documentElement.addEventListener("pointerenter", onPointerEnter);

    // Initial trigger to position the cursor
    startAnimation();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.documentElement.removeEventListener("pointerenter", onPointerEnter);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-[200] hidden overflow-hidden md:block transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Outer fluid aura ring */}
      <div
        ref={ringRef}
        className="absolute top-0 left-0 will-change-transform"
        style={{ transition: "none" }}
      >
        <div
          className={cn(
            "-translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-200 ease-out",
            hovered
              ? "size-14 border-chrome-1/80 bg-chrome-1/15 backdrop-blur-[1px] shadow-[0_0_20px_rgba(167,139,250,0.4)] scale-110"
              : "size-9 border-chrome-2/50 bg-chrome-2/5 shadow-[0_0_10px_rgba(129,140,248,0.2)]",
            clicked ? "scale-75 opacity-90" : "",
          )}
        />
      </div>

      {/* Inner glowing pointer dot */}
      <div
        ref={dotRef}
        className="absolute top-0 left-0 will-change-transform"
        style={{ transition: "none" }}
      >
        <div
          className={cn(
            "-translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-chrome-1 to-chrome-3 transition-all duration-150 ease-out",
            hovered ? "size-2.5 shadow-[0_0_10px_#fff]" : "size-2 shadow-[0_0_6px_rgba(255,255,255,0.8)]",
            clicked ? "scale-150" : "",
          )}
        />
      </div>
    </div>
  );
}


/* ---------------- Magnetic wrapper ---------------- */

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
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 20 });
  const sy = useSpring(y, { stiffness: 260, damping: 20 });

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      className={className}
      onPointerMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set(((e.clientX - (r.left + r.width / 2)) / r.width) * strength * 2);
        y.set(((e.clientY - (r.top + r.height / 2)) / r.height) * strength * 2);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
