/**
 * useCssReveal — attaches a single shared IntersectionObserver that adds
 * [data-visible] to elements that scroll into view. This triggers a pure CSS
 * animation on the compositor thread with ZERO React re-renders.
 *
 * Usage:
 *   const ref = useCssReveal();
 *   <div ref={ref} data-reveal data-delay="1">…</div>
 */
import { useCallback, useEffect, useRef } from "react";

// One observer instance shared across all callers
let sharedObserver: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.visible = "true";
            sharedObserver!.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "-30px 0px", threshold: 0.05 }
    );
  }
  return sharedObserver;
}

export function useCssReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = getObserver();
    obs.observe(el);
    return () => obs.unobserve(el);
  }, []);

  return ref;
}

/** Returns a callback ref so you can attach to multiple elements inside a map */
export function useCssRevealCallback() {
  const elements = useRef<Set<Element>>(new Set());

  const refCallback = useCallback((el: Element | null) => {
    if (!el) return;
    if (elements.current.has(el)) return;
    elements.current.add(el);
    const obs = getObserver();
    obs.observe(el);
  }, []);

  useEffect(() => {
    return () => {
      const obs = getObserver();
      elements.current.forEach((el) => obs.unobserve(el));
      elements.current.clear();
    };
  }, []);

  return refCallback;
}
