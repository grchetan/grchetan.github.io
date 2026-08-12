import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { LiquidImageShader } from "./LiquidImageShader";
import type { LiquidImageProps } from "./LiquidImage.types";
import { cn } from "@/lib/utils";

export function LiquidImage({
  src,
  alt = "",
  className,
  intensity = 0.85,
  hoverStrength = 1.6,
  rippleStrength = 1.3,
  skeletonHeight = "min-h-[260px]",
  onLoad,
  onError,
}: LiquidImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);

  // Mouse / Pointer tracking refs to avoid React state re-renders
  const mousePosRef = useRef({ x: 0.5, y: 0.5 });
  const prevMousePosRef = useRef({ x: 0.5, y: 0.5 });
  const mouseVelRef = useRef({ x: 0, y: 0 });
  const targetMouseVelRef = useRef({ x: 0, y: 0 });

  // Mobile / Touch / Reduced Motion detection — COMPLETELY DISABLE WebGL on mobile devices
  const isMobileOrReducedMotion =
    typeof window !== "undefined" &&
    (window.matchMedia("(max-width: 767px)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.innerWidth < 768);

  useEffect(() => {
    // If mobile or reduced motion: do not initialize WebGL at all
    if (isMobileOrReducedMotion) {
      setIsWebGLSupported(false);
      onLoad?.();
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.OrthographicCamera | null = null;
    let material: THREE.ShaderMaterial | null = null;
    let mesh: THREE.Mesh | null = null;
    let texture: THREE.Texture | null = null;
    let animationFrameId: number | null = null;
    let observer: IntersectionObserver | null = null;
    let isVisible = false;

    try {
      // 1. Three.js Scene Setup
      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
      camera.position.z = 1;

      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // 2. Texture Loading (Supports .avif, .webp, .png, .jpg)
      const loader = new THREE.TextureLoader();
      loader.load(
        src,
        (loadedTexture) => {
          texture = loadedTexture;
          texture.generateMipmaps = true;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;

          // Shader Material creation with pointer-driven fluid uniforms (NO SCROLL UNIFORMS)
          material = new THREE.ShaderMaterial({
            uniforms: {
              uTexture: { value: texture },
              uTime: { value: 0 },
              uStrength: { value: intensity },
              uHoverStrength: { value: hoverStrength },
              uRippleStrength: { value: rippleStrength },
              uMouse: { value: new THREE.Vector2(0.5, 0.5) },
              uPreviousMouse: { value: new THREE.Vector2(0.5, 0.5) },
              uMouseVelocity: { value: new THREE.Vector2(0, 0) },
              uHover: { value: 0 },
              uResolution: { value: new THREE.Vector2(1, 1) },
              uImageBounds: { value: new THREE.Vector2(texture.image.width, texture.image.height) },
            },
            vertexShader: LiquidImageShader.vertexShader,
            fragmentShader: LiquidImageShader.fragmentShader,
            transparent: true,
          });

          const geometry = new THREE.PlaneGeometry(1, 1, 32, 32);
          mesh = new THREE.Mesh(geometry, material);
          scene?.add(mesh);

          updateSize();
          setIsLoaded(true);
          onLoad?.();
        },
        undefined,
        () => {
          setHasError(true);
          setIsWebGLSupported(false);
          onError?.();
        }
      );

      // 3. Responsive Container Size Handler (Sync Canvas with Image bounds)
      const updateSize = () => {
        if (!container || !renderer || !material) return;
        const rect = container.getBoundingClientRect();
        const width = rect.width || 300;
        const height = rect.height || 200;

        renderer.setSize(width, height, false);
        material.uniforms.uResolution.value.set(width, height);
      };

      const resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(container);

      // 4. Pointer Movement & Velocity Injection (NO SCROLL LISTENER)
      const updatePointerPosition = (clientX: number, clientY: number) => {
        if (!container || !material) return;
        const rect = container.getBoundingClientRect();
        const x = (clientX - rect.left) / rect.width;
        const y = 1.0 - (clientY - rect.top) / rect.height;

        prevMousePosRef.current = { ...mousePosRef.current };
        mousePosRef.current = { x, y };

        // Calculate cursor movement vector (dx, dy)
        const dx = x - prevMousePosRef.current.x;
        const dy = y - prevMousePosRef.current.y;
        targetMouseVelRef.current = { x: dx * 4.5, y: dy * 4.5 };

        material.uniforms.uPreviousMouse.value.set(
          prevMousePosRef.current.x,
          prevMousePosRef.current.y
        );

        gsap.to(material.uniforms.uMouse.value, {
          x,
          y,
          duration: 0.1,
          ease: "power1.out",
        });
      };

      const handlePointerMove = (e: PointerEvent) => {
        updatePointerPosition(e.clientX, e.clientY);
      };

      const handlePointerEnter = () => {
        if (!material) return;
        gsap.to(material.uniforms.uHover, {
          value: 1,
          duration: 0.4,
          ease: "power2.out",
        });
      };

      const handlePointerLeave = () => {
        if (!material) return;
        targetMouseVelRef.current = { x: 0, y: 0 };
        gsap.to(material.uniforms.uHover, {
          value: 0,
          duration: 0.6,
          ease: "power2.out",
        });
      };

      container.addEventListener("pointermove", handlePointerMove);
      container.addEventListener("pointerenter", handlePointerEnter);
      container.addEventListener("pointerleave", handlePointerLeave);

      // 5. Animation Loop with Exponential Fluid Dissipation
      const clock = new THREE.Clock();

      const render = () => {
        if (isVisible && renderer && scene && camera && material) {
          material.uniforms.uTime.value = clock.getElapsedTime();

          // Smooth lerp mouse velocity & dissipate energy gradually when pointer stops
          mouseVelRef.current.x += (targetMouseVelRef.current.x - mouseVelRef.current.x) * 0.2;
          mouseVelRef.current.y += (targetMouseVelRef.current.y - mouseVelRef.current.y) * 0.2;
          
          // Exponential velocity decay / dissipation
          targetMouseVelRef.current.x *= 0.84;
          targetMouseVelRef.current.y *= 0.84;

          material.uniforms.uMouseVelocity.value.set(
            mouseVelRef.current.x,
            mouseVelRef.current.y
          );

          renderer.render(scene, camera);
        }
        animationFrameId = requestAnimationFrame(render);
      };

      // 6. IntersectionObserver: Pause rendering loop for off-screen images
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isVisible = entry.isIntersecting;
          });
        },
        { threshold: 0.05 }
      );
      observer.observe(container);

      render();

      // Cleanup WebGL resources on unmount
      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        resizeObserver.disconnect();
        if (observer) observer.disconnect();

        container.removeEventListener("pointermove", handlePointerMove);
        container.removeEventListener("pointerenter", handlePointerEnter);
        container.removeEventListener("pointerleave", handlePointerLeave);

        if (texture) texture.dispose();
        if (material) material.dispose();
        if (mesh) {
          mesh.geometry.dispose();
        }
        if (renderer) renderer.dispose();
      };
    } catch {
      setIsWebGLSupported(false);
    }
  }, [src, intensity, hoverStrength, rippleStrength, isMobileOrReducedMotion]);

  // ON MOBILE / TABLET OR REDUCED MOTION: Render standard responsive <img> tag ONLY (NO WEBGL, NO CROPPING)
  if (!isWebGLSupported || hasError || isMobileOrReducedMotion) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("w-full h-auto object-contain block mx-auto rounded-[inherit]", className)}
        loading="lazy"
        decoding="async"
        onLoad={onLoad}
        onError={onError}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden w-full h-full cursor-pointer", className)}
    >
      {!isLoaded && (
        <div
          className={cn(
            "w-full rounded-[var(--radius-lg)] bg-paper-tint/40 animate-pulse",
            skeletonHeight
          )}
        />
      )}
      <canvas
        ref={canvasRef}
        className={cn(
          "w-full h-full block transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
