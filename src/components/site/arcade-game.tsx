import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bug, Play, RotateCcw, Sparkles, Zap } from "lucide-react";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { cn } from "@/lib/utils";
import bugImg from "@/assets/bug.png";
import tilesImg from "@/assets/tiles.png";

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
}: {
  onFinish: (result: RunResult) => void;
  disabled?: boolean;
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
  const [popups, setPopups] = useState<{ id: number; index: number; value: string; good: boolean }[]>([]);

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
    setPopups([]);
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

    const popupId = cell.id;

    if (cell.kind === "bug") {
      setCombo(1);
      setScore((s) => Math.max(0, s - 40));
      setPopups((prev) => [...prev, { id: popupId, index: cell.index, value: "-40", good: false }]);
      setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== popupId));
      }, 600);
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
    setPopups((prev) => [...prev, { id: popupId, index: cell.index, value: `+${gained}`, good: true }]);
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== popupId));
    }, 600);
  };

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
            const cellPopups = popups.filter((p) => p.index === i);
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
                  "relative aspect-square rounded-2xl border transition-all duration-300 touch-none select-none active:scale-95 shadow-md",
                  cell
                    ? cell.kind === "bug"
                      ? "border-[var(--prism-red)]/70 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                      : "border-[var(--prism-blue)]/70 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                    : "border-ink/10 bg-paper/50"
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
                            ? "linear-gradient(140deg, rgba(239,68,68,0.3), rgba(244,63,94,0.3))"
                            : "linear-gradient(140deg, rgba(59,130,246,0.25), rgba(16,185,129,0.25))",
                      }}
                    >
                      {cell.kind === "bug" ? (
                        <motion.img
                          src={bugImg}
                          alt="Bug"
                          className="w-[72%] h-[72%] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                          animate={{ y: [0, -2, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                        />
                      ) : (
                        <motion.img
                          src={tilesImg}
                          alt="Signal"
                          className="w-[72%] h-[72%] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                          animate={{ scale: [1, 1.06, 1] }}
                          transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {cellPopups.map((hit) => (
                    <div key={hit.id} className="pointer-events-none absolute inset-0 z-30">
                      {/* Shockwave Ring */}
                      <motion.span
                        initial={{ scale: 0.6, opacity: 0.8 }}
                        animate={{ scale: 2.2, opacity: 0 }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                        className={cn(
                          "absolute inset-0 rounded-2xl border-2",
                          hit.good ? "border-emerald-400" : "border-rose-500"
                        )}
                      />
                      {/* Floating Text */}
                      <motion.span
                        initial={{ y: 12, scale: 0.5, rotate: -10, opacity: 0 }}
                        animate={{ y: -30, scale: 1.35, rotate: 8, opacity: 1 }}
                        exit={{ y: -50, scale: 1.6, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 240,
                          damping: 11
                        }}
                        className="absolute inset-0 grid place-items-center font-display text-[1.15rem] font-black"
                        style={{
                          color: hit.good ? "#10B981" : "#EF4444",
                          textShadow: hit.good
                            ? "0 0 10px rgba(16,185,129,0.9), 0 0 20px rgba(16,185,129,0.5), 0 2px 4px rgba(0,0,0,0.6)"
                            : "0 0 10px rgba(239,68,68,0.9), 0 0 20px rgba(239,68,68,0.5), 0 2px 4px rgba(0,0,0,0.6)",
                        }}
                      >
                        {hit.value}
                      </motion.span>
                    </div>
                  ))}
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
                onClick={start}
                disabled={disabled}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-paper transition hover:opacity-90 disabled:opacity-50"
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
