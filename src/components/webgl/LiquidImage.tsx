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
  intensity = 0.65,
  hoverStrength = 1.2,
  scrollStrength = 0.55,
  rippleStrength = 1.0,
  skeletonHeight = "min-h-[300px]",
  onLoad,
  onError,
}: LiquidImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);

  // Mouse tracking refs to avoid React state re-renders
  const mousePosRef = useRef({ x: 0.5, y: 0.5 });
  const prevMousePosRef = useRef({ x: 0.5, y: 0.5 });
  const mouseVelRef = useRef({ x: 0, y: 0 });
  const targetMouseVelRef = useRef({ x: 0, y: 0 });

  // Check prefers-reduced-motion
  const isReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (isReducedMotion) {
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
      // 1. Scene, Camera, Renderer Setup
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

      // 2. Texture Preload
      const loader = new THREE.TextureLoader();
      loader.load(
        src,
        (loadedTexture) => {
          texture = loadedTexture;
          texture.generateMipmaps = true;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;

          // Shader Material creation with customizable strength uniforms
          material = new THREE.ShaderMaterial({
            uniforms: {
              uTexture: { value: texture },
              uTime: { value: 0 },
              uProgress: { value: 0 },
              uStrength: { value: intensity },
              uHoverStrength: { value: hoverStrength },
              uScrollStrength: { value: scrollStrength },
              uRippleStrength: { value: rippleStrength },
              uVelocity: { value: 0 },
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

      // 3. Resize Handler
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

      // 4. Scroll Velocity Tracking using Lenis / Scroll listener
      let lastScrollY = window.scrollY;
      let scrollVelocity = 0;

      const handleScroll = () => {
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY;
        lastScrollY = currentScrollY;
        scrollVelocity = delta * 0.05;

        if (material) {
          gsap.to(material.uniforms.uVelocity, {
            value: scrollVelocity,
            duration: 0.4,
            ease: "power2.out",
            overwrite: true,
          });
        }
      };

      window.addEventListener("scroll", handleScroll, { passive: true });

      // 5. Mouse & Touch Velocity Tracking
      const updatePointerPosition = (clientX: number, clientY: number) => {
        if (!container || !material) return;
        const rect = container.getBoundingClientRect();
        const x = (clientX - rect.left) / rect.width;
        const y = 1.0 - (clientY - rect.top) / rect.height;

        prevMousePosRef.current = { ...mousePosRef.current };
        mousePosRef.current = { x, y };

        // Calculate cursor movement direction & velocity vector
        const dx = x - prevMousePosRef.current.x;
        const dy = y - prevMousePosRef.current.y;
        targetMouseVelRef.current = { x: dx * 3.5, y: dy * 3.5 };

        material.uniforms.uPreviousMouse.value.set(
          prevMousePosRef.current.x,
          prevMousePosRef.current.y
        );

        gsap.to(material.uniforms.uMouse.value, {
          x,
          y,
          duration: 0.15,
          ease: "power1.out",
        });
      };

      const handleMouseMove = (e: MouseEvent) => {
        updatePointerPosition(e.clientX, e.clientY);
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          updatePointerPosition(touch.clientX, touch.clientY);
        }
      };

      const handleMouseEnter = () => {
        if (!material) return;
        gsap.to(material.uniforms.uHover, {
          value: 1,
          duration: 0.5,
          ease: "power2.out",
        });
      };

      const handleMouseLeave = () => {
        if (!material) return;
        targetMouseVelRef.current = { x: 0, y: 0 };
        gsap.to(material.uniforms.uHover, {
          value: 0,
          duration: 0.7,
          ease: "power2.out",
        });
      };

      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);
      container.addEventListener("touchmove", handleTouchMove, { passive: true });
      container.addEventListener("touchstart", handleMouseEnter, { passive: true });
      container.addEventListener("touchend", handleMouseLeave, { passive: true });

      // 6. Animation Loop with IntersectionObserver
      const clock = new THREE.Clock();

      const render = () => {
        if (isVisible && renderer && scene && camera && material) {
          material.uniforms.uTime.value = clock.getElapsedTime();

          // Smoothly lerp mouse velocity vector & decay back to 0 when cursor stops
          mouseVelRef.current.x += (targetMouseVelRef.current.x - mouseVelRef.current.x) * 0.15;
          mouseVelRef.current.y += (targetMouseVelRef.current.y - mouseVelRef.current.y) * 0.15;
          targetMouseVelRef.current.x *= 0.88;
          targetMouseVelRef.current.y *= 0.88;

          material.uniforms.uMouseVelocity.value.set(
            mouseVelRef.current.x,
            mouseVelRef.current.y
          );

          renderer.render(scene, camera);
        }
        animationFrameId = requestAnimationFrame(render);
      };

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

      // Cleanup
      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        window.removeEventListener("scroll", handleScroll);
        resizeObserver.disconnect();
        if (observer) observer.disconnect();

        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
        container.removeEventListener("touchmove", handleTouchMove);
        container.removeEventListener("touchstart", handleMouseEnter);
        container.removeEventListener("touchend", handleMouseLeave);

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
  }, [src, intensity, hoverStrength, scrollStrength, rippleStrength, isReducedMotion]);

  // Fallback to standard optimized image if WebGL fails or reduced-motion is enabled
  if (!isWebGLSupported || hasError || isReducedMotion) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("w-full h-auto object-contain", className)}
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
