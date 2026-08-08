import React, { useEffect, useRef, useState } from "react";

interface Icon {
  x: number;
  y: number;
  z: number;
  id: number;
}

interface IconCloudProps {
  images: string[];
  /** human readable label per image (same order) — used for the fallback tooltip */
  labels?: string[];
  className?: string | undefined;
  /** min / max px the sphere may occupy */
  min?: number;
  max?: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function IconCloud({ images, labels, className, min = 220, max = 520 }: IconCloudProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(0);
  const [iconPositions, setIconPositions] = useState<Icon[]>([]);
  const [failedCount, setFailedCount] = useState(0);
  const [hover, setHover] = useState<{ x: number; y: number; label: string; failed: boolean } | null>(
    null,
  );

  const draggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0, inside: false });
  const targetRotationRef = useRef<{
    x: number;
    y: number;
    startX: number;
    startY: number;
    startTime: number;
    duration: number;
  } | null>(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const sizeRef = useRef(0);
  const iconCanvasesRef = useRef<HTMLCanvasElement[]>([]);
  const imagesLoadedRef = useRef<boolean[]>([]);
  const failedRef = useRef<boolean[]>([]);
  const visibleRef = useRef(true);

  const labelAt = (i: number) => labels?.[i] ?? `Logo ${i + 1}`;

  /* ------- auto-fit to container (ResizeObserver) with crisp 1:1 scaling ------- */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const apply = (w: number) => {
      const next = Math.max(min, Math.min(max, Math.floor(w)));
      if (next !== sizeRef.current) {
        sizeRef.current = next;
        setSize(next);
      }
    };

    apply(el.getBoundingClientRect().width || min);
    const ro = new ResizeObserver((entries) => {
      const box = entries[0];
      if (!box) return;
      apply(box.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [min, max]);

  /* ------- keep backing store in sync with DPR so logos never blur ------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sync = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const px = Math.round(size * dpr);
      if (canvas.width !== px || canvas.height !== px) {
        canvas.width = px;
        canvas.height = px;
      }
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    sync();
    const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mq.addEventListener?.("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      mq.removeEventListener?.("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, [size]);

  /* ------- pre-render each image into a circular offscreen canvas (hi-dpi) ------- */
  useEffect(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const S = Math.round(40 * dpr);
    imagesLoadedRef.current = new Array(images.length).fill(false);
    failedRef.current = new Array(images.length).fill(false);
    setFailedCount(0);
    iconCanvasesRef.current = images.map((src, index) => {
      const offscreen = document.createElement("canvas");
      offscreen.width = S;
      offscreen.height = S;
      const offCtx = offscreen.getContext("2d");
      if (offCtx) {
        /* dim placeholder chip: dashed ring + initial letter, clearly "not loaded" */
        const fallback = () => {
          const label = labelAt(index);
          offCtx.clearRect(0, 0, S, S);
          offCtx.save();
          offCtx.beginPath();
          offCtx.arc(S / 2, S / 2, S * 0.38, 0, Math.PI * 2);
          offCtx.fillStyle = "rgba(140,150,190,0.16)";
          offCtx.fill();
          offCtx.setLineDash([S * 0.09, S * 0.07]);
          offCtx.lineWidth = Math.max(1, S * 0.045);
          offCtx.strokeStyle = "rgba(170,180,225,0.7)";
          offCtx.stroke();
          offCtx.setLineDash([]);
          offCtx.fillStyle = "rgba(225,230,255,0.85)";
          offCtx.font = `600 ${Math.round(S * 0.38)}px ui-sans-serif, system-ui, sans-serif`;
          offCtx.textAlign = "center";
          offCtx.textBaseline = "middle";
          offCtx.fillText((label[0] ?? "?").toUpperCase(), S / 2, S / 2 + S * 0.02);
          offCtx.restore();
          imagesLoadedRef.current[index] = true;
          if (!failedRef.current[index]) {
            failedRef.current[index] = true;
            setFailedCount((n) => n + 1);
          }
        };
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.decoding = "async";
        img.onload = () => {
          offCtx.clearRect(0, 0, S, S);
          offCtx.save();
          offCtx.beginPath();
          offCtx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
          offCtx.closePath();
          offCtx.clip();
          offCtx.drawImage(img, S * 0.1, S * 0.1, S * 0.8, S * 0.8);
          offCtx.restore();
          imagesLoadedRef.current[index] = true;
        };
        img.onerror = fallback;
        img.src = src;
      }
      return offscreen;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, labels]);

  /* ------- fibonacci sphere positions ------- */
  useEffect(() => {
    const numIcons = images.length || 20;
    const offset = 2 / numIcons;
    const increment = Math.PI * (3 - Math.sqrt(5));
    const next: Icon[] = [];
    for (let i = 0; i < numIcons; i++) {
      const y = i * offset - 1 + offset / 2;
      const r = Math.sqrt(1 - y * y);
      const phi = i * increment;
      next.push({ x: Math.cos(phi) * r * 100, y: y * 100, z: Math.sin(phi) * r * 100, id: i });
    }
    setIconPositions(next);
  }, [images]);

  /* ------- pause the loop when off-screen or tab hidden ------- */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        visibleRef.current = entries[0]?.isIntersecting ?? true;
      },
      { rootMargin: "120px" },
    );
    io.observe(el);
    const onVis = () => {
      visibleRef.current = document.visibilityState === "visible" && visibleRef.current;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!rect || !canvas) return;
    const s = sizeRef.current || size;
    const radiusScale = s / 400;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const icon of iconPositions) {
      const cosX = Math.cos(rotationRef.current.x);
      const sinX = Math.sin(rotationRef.current.x);
      const cosY = Math.cos(rotationRef.current.y);
      const sinY = Math.sin(rotationRef.current.y);
      const rotatedX = icon.x * cosY - icon.z * sinY;
      const rotatedZ = icon.x * sinY + icon.z * cosY;
      const rotatedY = icon.y * cosX + rotatedZ * sinX;
      const screenX = s / 2 + rotatedX * radiusScale;
      const screenY = s / 2 + rotatedY * radiusScale;
      const scale = (rotatedZ + 200) / 300;
      const radius = 20 * scale * radiusScale;
      const dx = x - screenX;
      const dy = y - screenY;
      if (dx * dx + dy * dy < radius * radius) {
        const targetX = -Math.atan2(icon.y, Math.sqrt(icon.x * icon.x + icon.z * icon.z));
        const targetY = Math.atan2(icon.x, icon.z);
        const currentX = rotationRef.current.x;
        const currentY = rotationRef.current.y;
        const distance = Math.hypot(targetX - currentX, targetY - currentY);
        targetRotationRef.current = {
          x: targetX,
          y: targetY,
          startX: currentX,
          startY: currentY,
          startTime: performance.now(),
          duration: Math.min(2000, Math.max(800, distance * 1000)),
        };
        return;
      }
    }

    draggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const hitTest = (x: number, y: number) => {
    const s = sizeRef.current || size;
    const radiusScale = s / 400;
    const cosX = Math.cos(rotationRef.current.x);
    const sinX = Math.sin(rotationRef.current.x);
    const cosY = Math.cos(rotationRef.current.y);
    const sinY = Math.sin(rotationRef.current.y);
    let best: { index: number; z: number; sx: number; sy: number } | null = null;
    for (const icon of iconPositions) {
      const rotatedX = icon.x * cosY - icon.z * sinY;
      const rotatedZ = icon.x * sinY + icon.z * cosY;
      const rotatedY = icon.y * cosX + rotatedZ * sinX;
      const screenX = s / 2 + rotatedX * radiusScale;
      const screenY = s / 2 + rotatedY * radiusScale;
      const scale = (rotatedZ + 200) / 300;
      const radius = 20 * scale * radiusScale;
      const dx = x - screenX;
      const dy = y - screenY;
      if (dx * dx + dy * dy < radius * radius && (!best || rotatedZ > best.z)) {
        best = { index: icon.id, z: rotatedZ, sx: screenX, sy: screenY };
      }
    }
    return best;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseRef.current = { x, y, inside: true };
      if (!draggingRef.current) {
        const hit = hitTest(x, y);
        if (hit) {
          setHover({
            x: hit.sx,
            y: hit.sy,
            label: labelAt(hit.index),
            failed: !!failedRef.current[hit.index],
          });
        } else {
          setHover(null);
        }
      }
    }
    if (draggingRef.current) {
      const deltaX = e.clientX - lastMouseRef.current.x;
      const deltaY = e.clientY - lastMouseRef.current.y;
      rotationRef.current = {
        x: rotationRef.current.x + deltaY * 0.002,
        y: rotationRef.current.y + deltaX * 0.002,
      };
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    draggingRef.current = false;
  };
  const handleMouseLeave = () => {
    draggingRef.current = false;
    mouseRef.current.inside = false;
    setHover(null);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!rect || !canvas) return;
    const s = sizeRef.current || size;
    const radiusScale = s / 400;
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    for (const icon of iconPositions) {
      const cosX = Math.cos(rotationRef.current.x);
      const sinX = Math.sin(rotationRef.current.x);
      const cosY = Math.cos(rotationRef.current.y);
      const sinY = Math.sin(rotationRef.current.y);
      const rotatedX = icon.x * cosY - icon.z * sinY;
      const rotatedZ = icon.x * sinY + icon.z * cosY;
      const rotatedY = icon.y * cosX + rotatedZ * sinX;
      const screenX = s / 2 + rotatedX * radiusScale;
      const screenY = s / 2 + rotatedY * radiusScale;
      const scale = (rotatedZ + 200) / 300;
      const radius = 20 * scale * radiusScale;
      const dx = x - screenX;
      const dy = y - screenY;
      if (dx * dx + dy * dy < radius * radius) {
        const targetX = -Math.atan2(icon.y, Math.sqrt(icon.x * icon.x + icon.z * icon.z));
        const targetY = Math.atan2(icon.x, icon.z);
        const currentX = rotationRef.current.x;
        const currentY = rotationRef.current.y;
        const distance = Math.hypot(targetX - currentX, targetY - currentY);
        targetRotationRef.current = {
          x: targetX,
          y: targetY,
          startX: currentX,
          startY: currentY,
          startTime: performance.now(),
          duration: Math.min(2000, Math.max(800, distance * 1000)),
        };
        return;
      }
    }

    draggingRef.current = true;
    lastMouseRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    if (!touch || !draggingRef.current) return;

    const deltaX = touch.clientX - lastMouseRef.current.x;
    const deltaY = touch.clientY - lastMouseRef.current.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      rotationRef.current = {
        x: rotationRef.current.x,
        y: rotationRef.current.y + deltaX * 0.003,
      };
    }

    lastMouseRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    draggingRef.current = false;
  };

  /* ------- single stable render loop (no restart on pointer move) ------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !size || iconPositions.length === 0) return;

    let raf = 0;
    let last = 0;
    const frameMs = 1000 / 45;

    const animate = (now: number) => {
      raf = requestAnimationFrame(animate);
      if (!visibleRef.current) return;
      if (now - last < frameMs) return;
      last = now;

      const s = sizeRef.current || size;
      const radiusScale = s / 400;
      ctx.clearRect(0, 0, s, s);
      const centerX = s / 2;
      const centerY = s / 2;
      const maxDistance = Math.hypot(centerX, centerY);
      const dx = mouseRef.current.inside ? mouseRef.current.x - centerX : centerX * 0.35;
      const dy = mouseRef.current.inside ? mouseRef.current.y - centerY : -centerY * 0.1;
      const speed = 0.05 + (Math.hypot(dx, dy) / maxDistance) * 0.12;

      const target = targetRotationRef.current;
      if (target) {
        const elapsed = performance.now() - target.startTime;
        const progress = Math.min(1, elapsed / target.duration);
        const eased = easeOutCubic(progress);
        rotationRef.current = {
          x: target.startX + (target.x - target.startX) * eased,
          y: target.startY + (target.y - target.startY) * eased,
        };
        if (progress >= 1) targetRotationRef.current = null;
      } else if (!draggingRef.current) {
        rotationRef.current = {
          x: rotationRef.current.x + (dy / s) * speed,
          y: rotationRef.current.y + (dx / s) * speed,
        };
      }

      const cosX = Math.cos(rotationRef.current.x);
      const sinX = Math.sin(rotationRef.current.x);
      const cosY = Math.cos(rotationRef.current.y);
      const sinY = Math.sin(rotationRef.current.y);

      for (let index = 0; index < iconPositions.length; index++) {
        const icon = iconPositions[index]!;
        const rotatedX = icon.x * cosY - icon.z * sinY;
        const rotatedZ = icon.x * sinY + icon.z * cosY;
        const rotatedY = icon.y * cosX + rotatedZ * sinX;
        const scale = ((rotatedZ + 200) / 300) * radiusScale;
        const base = Math.max(0.2, Math.min(1, (rotatedZ + 150) / 200));
        const opacity = failedRef.current[index] ? base * 0.5 : base;
        const sprite = iconCanvasesRef.current[index];
        if (!sprite || !imagesLoadedRef.current[index]) continue;

        ctx.save();
        ctx.translate(centerX + rotatedX * radiusScale, centerY + rotatedY * radiusScale);
        ctx.scale(scale, scale);
        ctx.globalAlpha = opacity;
        ctx.drawImage(sprite, -20, -20, 40, 40);
        ctx.restore();
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [iconPositions, size]);

  return (
    <div ref={wrapRef} className={`relative ${className ?? ""}`}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ width: size || undefined, height: size || undefined, touchAction: "pan-y" }}
        className="mx-auto block max-w-full cursor-grab active:cursor-grabbing"
        aria-label="Interactive 3D cloud of technology logos"
        role="img"
      />

      {hover ? (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full border border-white/15 bg-black/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/90 backdrop-blur-md"
          style={{
            left: `calc(50% - ${(sizeRef.current || size) / 2}px + ${hover.x}px)`,
            top: hover.y - 12,
          }}
        >
          {hover.label}
          {hover.failed ? <span className="ml-1.5 text-white/55">logo failed to load</span> : null}
        </div>
      ) : null}

      {failedCount > 0 ? (
        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.2em] text-ink/45">
          {failedCount} logo{failedCount > 1 ? "s" : ""} unavailable — hover a dim chip to see which
        </p>
      ) : null}
    </div>
  );
}

export const techCloudSlugs = [
  "typescript",
  "javascript",
  "react",
  "html5",
  "css",
  "tailwindcss",
  "nodedotjs",
  "express",
  "mongodb",
  "mysql",
  "firebase",
  "supabase",
  "git",
  "github",
  "postman",
  "figma",
  "vercel",
  "netlify",
  "flutter",
  "dart",
  "python",
  "docker",
];

const prettyLabel = (slug: string) =>
  ({
    nextdotjs: "Next.js",
    nodedotjs: "Node.js",
    html5: "HTML5",
    css: "CSS",
    tailwindcss: "Tailwind CSS",
    mysql: "MySQL",
    mongodb: "MongoDB",
    typescript: "TypeScript",
    javascript: "JavaScript",
    github: "GitHub",
  })[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);

export function TechIconCloud({ className }: { className?: string }) {
  const images = React.useMemo(
    () => techCloudSlugs.map((slug) => `https://cdn.simpleicons.org/${slug}`),
    [],
  );
  const labels = React.useMemo(() => techCloudSlugs.map(prettyLabel), []);
  return <IconCloud images={images} labels={labels} className={className} />;
}

export default IconCloud;
