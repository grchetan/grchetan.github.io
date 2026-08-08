import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bug, Play, RotateCcw, Sparkles, Zap } from "lucide-react";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { cn } from "@/lib/utils";

const GRID = 16; // 4 x 4
const ROUND_SECONDS = 45;

type Cell = {
  id: number;
  index: number;
  kind: "signal" | "bug";
  bornAt: number;
  life: number;
};

export type RunResult = { score: number; accuracy: number; combo: number };

type Phase = "idle" | "playing" | "done";

/**
 * "Signal Rush" — tap the glowing prism signals, avoid the red bugs.
 * Combo multiplier grows on every clean hit and resets on a miss.
 */
export function SignalRush({
  onFinish,
  disabled,
  onDisabledClick,
}: {
  onFinish: (result: RunResult) => void;
  disabled?: boolean;
  onDisabledClick?: () => void;
}) {
  const { reduced } = useMotionPreference();
  const [phase, setPhase] = useState<Phase>("idle");
  const [left, setLeft] = useState(ROUND_SECONDS);
  const [cells, setCells] = useState<Cell[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [bestCombo, setBestCombo] = useState(1);
  const [hits, setHits] = useState(0);
  const [taps, setTaps] = useState(0);
  const [flash, setFlash] = useState<{ id: number; index: number; value: string; good: boolean } | null>(null);

  const seq = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  const reset = useCallback(() => {
    seq.current = 0;
    setCells([]);
    setScore(0);
    setCombo(1);
    setBestCombo(1);
    setHits(0);
    setTaps(0);
    setLeft(ROUND_SECONDS);
    setFlash(null);
  }, []);

  const start = useCallback(() => {
    reset();
    setPhase("playing");
  }, [reset]);

  /* countdown */
  useEffect(() => {
    if (phase !== "playing") return;
    const t = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          setPhase("done");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  /* spawner + expiry — difficulty ramps as the clock runs down */
  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    let lastSpawn = 0;

    const loop = (now: number) => {
      const progress = 1 - left / ROUND_SECONDS;
      const gap = 780 - progress * 380; // 780ms -> 400ms
      if (now - lastSpawn > gap) {
        lastSpawn = now;
        setCells((prev) => {
          if (prev.length >= 5) return prev;
          const taken = new Set(prev.map((c) => c.index));
          const free = Array.from({ length: GRID }, (_, i) => i).filter((i) => !taken.has(i));
          if (!free.length) return prev;
          const index = free[Math.floor(Math.random() * free.length)] as number;
          const bug = Math.random() < 0.22 + progress * 0.12;
          seq.current += 1;
          return [
            ...prev,
            {
              id: seq.current,
              index,
              kind: bug ? "bug" : "signal",
              bornAt: performance.now(),
              life: bug ? 1100 : 1500 - progress * 550,
            },
          ];
        });
      }

      setCells((prev) => {
        const alive = prev.filter((c) => performance.now() - c.bornAt < c.life);
        if (alive.length !== prev.length) {
          const missedSignal = prev.some(
            (c) => c.kind === "signal" && !alive.includes(c),
          );
          if (missedSignal) setCombo(1);
        }
        return alive;
      });

      if (phaseRef.current === "playing") raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, left]);

  /* report the finished run once */
  const reported = useRef(false);
  useEffect(() => {
    if (phase !== "done" || reported.current) return;
    reported.current = true;
    onFinish({
      score,
      accuracy: taps ? (hits / taps) * 100 : 0,
      combo: bestCombo,
    });
  }, [phase, score, taps, hits, bestCombo, onFinish]);
  useEffect(() => {
    if (phase === "playing") reported.current = false;
  }, [phase]);

  const tap = (cell: Cell) => {
    if (phase !== "playing") return;
    setTaps((t) => t + 1);
    setCells((prev) => prev.filter((c) => c.id !== cell.id));

    if (cell.kind === "bug") {
      setCombo(1);
      setScore((s) => Math.max(0, s - 40));
      setFlash({ id: cell.id, index: cell.index, value: "-40", good: false });
      return;
    }

    const gained = 25 * combo;
    setHits((h) => h + 1);
    setScore((s) => s + gained);
    setCombo((c) => {
      const next = Math.min(c + 1, 12);
      setBestCombo((b) => Math.max(b, next));
      return next;
    });
    setFlash({ id: cell.id, index: cell.index, value: `+${gained}`, good: true });
  };

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 480);
    return () => window.clearTimeout(t);
  }, [flash]);

  const accuracy = taps ? Math.round((hits / taps) * 100) : 0;
  const tiles = useMemo(() => Array.from({ length: GRID }, (_, i) => i), []);

  return (
    <div className="rounded-[1.75rem] border border-ink/10 bg-paper-tint/60 p-4 backdrop-blur-xl sm:p-6">
      {/* hud */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Score", value: score.toLocaleString(), icon: Sparkles },
          { label: "Combo", value: `x${combo}`, icon: Zap },
          { label: "Accuracy", value: `${accuracy}%`, icon: null },
          { label: "Time", value: `${left}s`, icon: null },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-ink/10 bg-paper/70 px-3 py-2">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-soft">{s.label}</p>
            <p className="font-display text-xl leading-tight text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {/* board */}
      <div className="relative">
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {tiles.map((i) => {
            const cell = cells.find((c) => c.index === i);
            const hit = flash?.index === i ? flash : null;
            return (
              <button
                key={i}
                type="button"
                disabled={phase !== "playing" || !cell}
                onPointerDown={(e) => {
                  if (cell && phase === "playing") {
                    e.preventDefault();
                    tap(cell);
                  }
                }}
                onClick={(e) => {
                  if (cell && phase === "playing" && e.detail === 0) {
                    tap(cell);
                  }
                }}
                aria-label={cell ? (cell.kind === "bug" ? "Bug — avoid" : "Signal — tap") : "Empty tile"}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-2xl border transition-colors touch-none select-none active:scale-95",
                  cell
                    ? cell.kind === "bug"
                      ? "border-[var(--prism-red)]/50 bg-[var(--prism-red)]/15"
                      : "border-[var(--prism-blue)]/50 bg-[var(--prism-blue)]/12"
                    : "border-ink/10 bg-paper/50",
                )}
              >
                <AnimatePresence>
                  {cell && (
                    <motion.span
                      key={cell.id}
                      initial={reduced ? { opacity: 1 } : { scale: 0.5, opacity: 0 }}
                      animate={reduced ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                      exit={reduced ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="absolute inset-1.5 grid place-items-center rounded-xl"
                      style={{
                        backgroundImage:
                          cell.kind === "bug"
                            ? "linear-gradient(140deg, var(--prism-red), var(--prism-pink))"
                            : "linear-gradient(140deg, var(--prism-yellow), var(--prism-pink) 45%, var(--prism-blue))",
                      }}
                    >
                      {cell.kind === "bug" ? (
                        <Bug className="size-5 text-paper" strokeWidth={2.2} />
                      ) : (
                        <Sparkles className="size-5 text-paper" strokeWidth={2.2} />
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {hit && (
                    <motion.span
                      key={hit.id}
                      initial={{ y: 6, opacity: 0 }}
                      animate={{ y: -10, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        "pointer-events-none absolute inset-0 grid place-items-center font-mono text-sm font-bold",
                        hit.good ? "text-ink" : "text-[var(--prism-red)]",
                      )}
                    >
                      {hit.value}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        {/* overlays */}
        {phase !== "playing" && (
          <div className="absolute inset-0 grid place-items-center rounded-2xl bg-paper/85 backdrop-blur-sm">
            <div className="max-w-xs px-4 text-center">
              {phase === "idle" ? (
                <>
                  <h3 className="font-display text-2xl text-ink">Signal Rush</h3>
                  <p className="mt-2 text-sm text-ink-soft">
                    Tap the prism signals, dodge the red bugs. {ROUND_SECONDS} seconds, combo multiplier up to x12.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-display text-2xl text-ink">Run complete</h3>
                  <p className="mt-2 text-sm text-ink-soft">
                    {score.toLocaleString()} points · {accuracy}% accuracy · best combo x{bestCombo}
                  </p>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  if (disabled && onDisabledClick) {
                    onDisabledClick();
                  } else {
                    start();
                  }
                }}
                className={cn(
                  "mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-paper transition hover:opacity-90 active:scale-95",
                  disabled
                    ? "bg-ink/75 border border-ink/20 shadow-md cursor-pointer"
                    : "bg-ink"
                )}
              >
                {phase === "idle" ? <Play className="size-3.5" /> : <RotateCcw className="size-3.5" />}
                {phase === "idle" ? "Start run" : "Play again"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
