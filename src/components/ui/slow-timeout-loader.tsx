import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface SlowTimeoutLoaderProps {
  delayMs?: number;
  fallback?: React.ReactNode;
}

export function SlowTimeoutLoader({
  delayMs = 5000,
  fallback,
}: SlowTimeoutLoaderProps) {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWarning(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs]);

  if (!showWarning) return null;

  return (
    <div className="flex items-center justify-center p-3 animate-fade-in">
      {fallback ?? (
        <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
          <Clock className="size-3.5 animate-spin" />
          <span>Your internet seems slow, please wait...</span>
        </div>
      )}
    </div>
  );
}
