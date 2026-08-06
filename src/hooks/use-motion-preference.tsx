import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "press-motion";

interface MotionPreferenceContextValue {
  /** true when the user prefers reduced motion (auto-detected or manually toggled) */
  reduced: boolean;
  /** flip the current preference and persist it */
  toggle: () => void;
}

const MotionPreferenceContext = createContext<MotionPreferenceContextValue | null>(null);

function getInitialReduced(): boolean {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "reduce") return true;
  if (stored === "no-preference") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function MotionPreferenceProvider({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(getInitialReduced());
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("reduce-motion", reduced);
  }, [reduced]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) setReduced(mq.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    setReduced((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "reduce" : "no-preference");
      return next;
    });
  };

  return (
    <MotionPreferenceContext.Provider value={{ reduced, toggle }}>
      {children}
    </MotionPreferenceContext.Provider>
  );
}

const defaultContext: MotionPreferenceContextValue = {
  reduced: false,
  toggle: () => {},
};

export function useMotionPreference(): MotionPreferenceContextValue {
  const ctx = useContext(MotionPreferenceContext);
  return ctx ?? defaultContext;
}
