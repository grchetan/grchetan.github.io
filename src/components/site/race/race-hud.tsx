/**
 * Horizon Grand Prix — Pro Responsive HUD & Multi-Mode Mobile Controls
 * Features:
 * - Live Multiplayer Ping indicator (`XX ms` + `P2P`/`CLOUD`/`LOCAL` signal badge)
 * - 3 Selectable Mobile Control Modes:
 *   1. Slide-Enabled Dual Touch Pad (drag seamlessly between Left <-> Right without lifting thumb)
 *   2. Interactive Virtual Steering Wheel (proportional analog steering -1..+1)
 *   3. Analog Gyroscope Tilt Steering (with iOS permission & baseline calibration)
 * - Isolated Multi-Touch Pedals (`NITRO`, `DRIFT`, `BRAKE`, optional `GAS` when Auto-Gas OFF)
 * - Responsive Fullscreen / Landscape toggle & clean In-Game Exit button
 * - High-Speed Radial Vignette, Drift Score Popups, Overtake Alerts, and 1,920m Radar Minimap
 */

import { useMemo, useRef, useState, type TouchEvent } from "react";
import {
  Flag,
  Trophy,
  Camera,
  Volume2,
  VolumeX,
  RotateCcw,
  Flame,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Zap,
  Maximize2,
  Minimize2,
  LogOut,
  Wifi,
  Gauge,
  Compass,
  Gamepad2,
} from "lucide-react";
import { CIRCUIT_SAMPLES, SAMPLE_COUNT } from "./race-physics";
import type { AIRival } from "./race-ai";
import type { TransportKind } from "@/lib/race-net";

export type MobileControlType = "pad" | "wheel" | "tilt";

export interface HUDProps {
  speedKmh: number;
  gear: string;
  nitroPercent: number;
  lap: number;
  maxLaps: number;
  totalTimeMs: number;
  bestLapMs: number | null;
  bannerText: string | null;
  rank: number;
  totalRacers: number;
  isWrongWay: boolean;
  cameraMode: "chase" | "bumper" | "top";
  isMuted: boolean;
  controlsMode: "keyboard" | "touch";
  mobileControlType: MobileControlType;
  autoDrive: boolean;
  isLandscape: boolean;
  driftScore: number;
  pingMs: number | null;
  transport: TransportKind;
  isMultiplayer: boolean;
  playerPos: { x: number; z: number; rotation: number };
  remoteRacers: { id: string; color: string; x: number; z: number }[];
  aiBots: AIRival[];
  onExitRace: () => void;
  onToggleCamera: () => void;
  onToggleMute: () => void;
  onResetCar: () => void;
  onToggleAutoDrive: () => void;
  onCycleMobileControl: () => void;
  onToggleRotateScreen: () => void;
  onAnalogSteer: (value: number | undefined) => void;
  onTouchGasChange: (active: boolean) => void;
  onTouchBrakeChange: (active: boolean) => void;
  onTouchLeftChange: (active: boolean) => void;
  onTouchRightChange: (active: boolean) => void;
  onTouchDriftChange: (active: boolean) => void;
  onTouchNitroChange: (active: boolean) => void;
}

function triggerHaptic(ms = 12) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch {}
  }
}

/** Multi-touch safe pedal button tracking its own touch identifier */
function MultiTouchPedal({
  label,
  className,
  activeClassName,
  onActiveChange,
  children,
}: {
  label: string;
  className: string;
  activeClassName: string;
  onActiveChange: (active: boolean) => void;
  children: React.ReactNode;
}) {
  const [pressed, setPressed] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const activate = () => {
    if (!pressed) {
      setPressed(true);
      triggerHaptic(14);
      onActiveChange(true);
    }
  };

  const deactivate = () => {
    setPressed(false);
    touchIdRef.current = null;
    onActiveChange(false);
  };

  return (
    <button
      type="button"
      aria-label={label}
      className={`${className} touch-none select-none transition-transform duration-75 ${
        pressed ? `${activeClassName} scale-92` : ""
      }`}
      onTouchStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const t = e.changedTouches[0];
        if (t) {
          touchIdRef.current = t.identifier;
          activate();
        }
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        e.stopPropagation();
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i]?.identifier === touchIdRef.current) {
            deactivate();
            return;
          }
        }
        if (e.targetTouches.length === 0) deactivate();
      }}
      onTouchCancel={(e) => {
        e.preventDefault();
        deactivate();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        activate();
      }}
      onMouseUp={() => deactivate()}
      onMouseLeave={() => {
        if (pressed && touchIdRef.current === null) deactivate();
      }}
    >
      {children}
    </button>
  );
}

/** Slide-Enabled Left/Right Touch Zone: slide finger smoothly between Left & Right */
function SlideSteerPad({
  onLeftChange,
  onRightChange,
  onAnalogSteer,
}: {
  onLeftChange: (v: boolean) => void;
  onRightChange: (v: boolean) => void;
  onAnalogSteer: (v: number | undefined) => void;
}) {
  const padRef = useRef<HTMLDivElement>(null);
  const activeTouchId = useRef<number | null>(null);
  const [steerSide, setSteerSide] = useState<"left" | "right" | null>(null);

  const resolveTouch = (clientX: number) => {
    const el = padRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = (clientX - rect.left) / (rect.width || 1);
    const norm = Math.max(-1, Math.min(1, (relX - 0.5) * 2.2));
    if (norm < -0.1) {
      if (steerSide !== "left") triggerHaptic(10);
      setSteerSide("left");
      onLeftChange(true);
      onRightChange(false);
      onAnalogSteer(norm);
    } else if (norm > 0.1) {
      if (steerSide !== "right") triggerHaptic(10);
      setSteerSide("right");
      onLeftChange(false);
      onRightChange(true);
      onAnalogSteer(norm);
    } else {
      setSteerSide(null);
      onLeftChange(false);
      onRightChange(false);
      onAnalogSteer(0);
    }
  };

  const clearSteer = () => {
    activeTouchId.current = null;
    setSteerSide(null);
    onLeftChange(false);
    onRightChange(false);
    onAnalogSteer(undefined);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i]!;
      if (t.identifier === activeTouchId.current) {
        resolveTouch(t.clientX);
        return;
      }
    }
  };

  return (
    <div
      ref={padRef}
      className="pointer-events-auto flex items-center gap-1.5 rounded-3xl border border-white/15 bg-slate-950/80 p-1.5 shadow-2xl backdrop-blur-xl touch-none select-none"
      onTouchStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const t = e.changedTouches[0];
        if (t) {
          activeTouchId.current = t.identifier;
          resolveTouch(t.clientX);
        }
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={(e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i]?.identifier === activeTouchId.current) {
            clearSteer();
            return;
          }
        }
        if (e.targetTouches.length === 0) clearSteer();
      }}
      onTouchCancel={() => clearSteer()}
      onMouseDown={(e) => resolveTouch(e.clientX)}
      onMouseMove={(e) => {
        if (e.buttons === 1) resolveTouch(e.clientX);
      }}
      onMouseUp={() => clearSteer()}
      onMouseLeave={() => clearSteer()}
    >
      <div
        className={`flex size-14 sm:size-16 items-center justify-center rounded-2xl border-2 transition-all duration-75 ${
          steerSide === "left"
            ? "scale-92 border-cyan-300 bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.65)]"
            : "border-cyan-500/35 bg-slate-900/90 text-white"
        }`}
      >
        <ArrowLeft className="size-7 sm:size-8" strokeWidth={3} />
      </div>
      <div
        className={`flex size-14 sm:size-16 items-center justify-center rounded-2xl border-2 transition-all duration-75 ${
          steerSide === "right"
            ? "scale-92 border-cyan-300 bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.65)]"
            : "border-cyan-500/35 bg-slate-900/90 text-white"
        }`}
      >
        <ArrowRight className="size-7 sm:size-8" strokeWidth={3} />
      </div>
    </div>
  );
}

/** Interactive Virtual Cyber Steering Wheel with analog precision */
function VirtualSteeringWheel({
  onAnalogSteer,
}: {
  onAnalogSteer: (v: number | undefined) => void;
}) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const [steerVal, setSteerVal] = useState(0);

  const updateFromX = (clientX: number) => {
    const deltaX = clientX - startXRef.current;
    const clamped = Math.max(-1, Math.min(1, deltaX / 58));
    setSteerVal(clamped);
    onAnalogSteer(clamped);
  };

  const resetWheel = () => {
    touchIdRef.current = null;
    setSteerVal(0);
    onAnalogSteer(undefined);
  };

  const deg = steerVal * 68;

  return (
    <div
      ref={wheelRef}
      aria-label="Virtual Steering Wheel"
      className="pointer-events-auto relative flex size-28 sm:size-32 items-center justify-center rounded-full border-2 border-cyan-400/50 bg-slate-950/75 shadow-[0_0_30px_rgba(6,182,212,0.25)] backdrop-blur-xl touch-none select-none cursor-grab active:cursor-grabbing"
      onTouchStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const t = e.changedTouches[0];
        if (t) {
          touchIdRef.current = t.identifier;
    const rect = wheelRef.current?.getBoundingClientRect();
    startXRef.current = rect ? rect.left + rect.width / 2 : t.clientX;
          triggerHaptic(10);
          updateFromX(t.clientX);
        }
      }}
      onTouchMove={(e) => {
        e.preventDefault();
        e.stopPropagation();
        for (let i = 0; i < e.touches.length; i++) {
          const t = e.touches[i]!;
          if (t.identifier === touchIdRef.current) {
            updateFromX(t.clientX);
            return;
          }
        }
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i]?.identifier === touchIdRef.current) {
            resetWheel();
            return;
          }
        }
        if (e.targetTouches.length === 0) resetWheel();
      }}
      onTouchCancel={() => resetWheel()}
      onMouseDown={(e) => {
        startXRef.current =
          (wheelRef.current?.getBoundingClientRect().left ?? 0) +
          (wheelRef.current?.getBoundingClientRect().width ?? 112) / 2;
        updateFromX(e.clientX);
      }}
      onMouseMove={(e) => {
        if (e.buttons === 1) updateFromX(e.clientX);
      }}
      onMouseUp={() => resetWheel()}
      onMouseLeave={() => resetWheel()}
    >
      {/* Rotating F1 Steering Rim */}
      <div
        className="relative flex size-22 sm:size-26 items-center justify-center rounded-full border-4 border-slate-700 bg-slate-900/90 transition-transform duration-75"
        style={{ transform: `rotate(${deg}deg)` }}
      >
        {/* Top center stripe */}
        <div className="absolute top-0 h-2.5 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
        {/* Horizontal spoke */}
        <div className="h-2.5 w-full bg-slate-700/90" />
        {/* Vertical center spoke */}
        <div className="absolute bottom-2 h-9 w-2.5 bg-slate-700/90 rounded-b" />
        {/* Hub */}
        <div className="absolute size-7 rounded-full border-2 border-cyan-400/70 bg-slate-950 flex items-center justify-center">
          <div className="size-2 rounded-full bg-cyan-400" />
        </div>
      </div>
      <span className="pointer-events-none absolute -top-2 rounded-full bg-slate-900/90 border border-cyan-500/40 px-2 py-0.5 font-mono text-[0.52rem] font-bold uppercase tracking-widest text-cyan-300">
        Steer
      </span>
    </div>
  );
}

export function RaceHUD({
  speedKmh,
  gear,
  nitroPercent,
  lap,
  maxLaps,
  totalTimeMs,
  bestLapMs,
  bannerText,
  rank,
  totalRacers,
  isWrongWay,
  cameraMode,
  isMuted,
  controlsMode,
  mobileControlType,
  autoDrive,
  isLandscape,
  driftScore,
  pingMs,
  transport,
  isMultiplayer,
  playerPos,
  remoteRacers,
  aiBots,
  onExitRace,
  onToggleCamera,
  onToggleMute,
  onResetCar,
  onToggleAutoDrive,
  onCycleMobileControl,
  onToggleRotateScreen,
  onAnalogSteer,
  onTouchGasChange,
  onTouchBrakeChange,
  onTouchLeftChange,
  onTouchRightChange,
  onTouchDriftChange,
  onTouchNitroChange,
}: HUDProps) {
  const formatTimer = (ms: number) => {
    const s = ms / 1000;
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(2).padStart(5, "0");
    return `${m}:${sec}`;
  };

  // Pre-rendered SVG path for the 1,920m Grand Prix circuit
  const radarPath = useMemo(() => {
    const N = SAMPLE_COUNT;
    let d = `M ${CIRCUIT_SAMPLES[0]!.x.toFixed(1)} ${CIRCUIT_SAMPLES[0]!.z.toFixed(1)}`;
    for (let i = 2; i < N; i += 2) {
      const sp = CIRCUIT_SAMPLES[i]!;
      d += ` L ${sp.x.toFixed(1)} ${sp.z.toFixed(1)}`;
    }
    d += " Z";
    return d;
  }, []);

  const pingColorClass =
    pingMs === null
      ? "text-slate-400 border-white/10"
      : pingMs <= 65
        ? "text-emerald-400 border-emerald-500/35"
        : pingMs <= 150
          ? "text-amber-400 border-amber-500/35"
          : "text-rose-400 border-rose-500/35";

  const transportLabel =
    transport === "p2p"
      ? "P2P"
      : transport === "local"
        ? "LOCAL"
        : transport === "cloud"
          ? "CLOUD"
          : "SOLO";

  return (
    <>
      {/* ---------------- HIGH SPEED & NITRO RADIAL WARP OVERLAY ---------------- */}
      {speedKmh > 185 && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          <div
            className="absolute inset-0 transition-opacity duration-200"
            style={{
              opacity: Math.min(0.6, (speedKmh - 185) / 140),
              background:
                "radial-gradient(circle at center, transparent 52%, rgba(6, 182, 212, 0.24) 100%)",
            }}
          />
          <div className="absolute left-4 top-1/4 h-0.5 w-24 bg-cyan-300/70 animate-pulse" />
          <div className="absolute left-8 bottom-1/3 h-0.5 w-36 bg-sky-300/60 animate-pulse delay-75" />
          <div className="absolute right-4 top-1/3 h-0.5 w-28 bg-cyan-300/70 animate-pulse delay-100" />
          <div className="absolute right-8 bottom-1/4 h-0.5 w-32 bg-sky-300/60 animate-pulse delay-150" />
        </div>
      )}

      {/* ---------------- FLOATING EVENT & DRIFT SCORE BADGES ---------------- */}
      <div className="pointer-events-none absolute inset-x-0 top-18 sm:top-20 z-25 flex flex-col items-center gap-2 px-4">
        {isWrongWay && (
          <div className="animate-pulse rounded-full border border-rose-400/70 bg-rose-600/80 px-4 py-1.5 text-center font-mono text-[0.7rem] font-black uppercase tracking-widest text-white shadow-[0_0_25px_rgba(244,63,94,0.75)] backdrop-blur-xl">
            ⚠️ WRONG WAY — TURN AROUND
          </div>
        )}
        {bannerText && (
          <div className="rounded-2xl border border-emerald-400/60 bg-slate-950/85 px-4 py-1.5 font-mono text-xs sm:text-sm font-black tracking-wider text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.4)] backdrop-blur-xl animate-bounce">
            {bannerText}
          </div>
        )}
        {driftScore > 0 && speedKmh > 30 && (
          <div className="flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-slate-950/75 px-3 py-1 font-mono text-[0.65rem] font-black uppercase tracking-wider text-amber-300 backdrop-blur-md">
            <Flame className="size-3.5 text-amber-400" />
            Drift Score: {driftScore.toLocaleString()}
          </div>
        )}
      </div>

      {/* ---------------- TOP HUD STATUS BAR ---------------- */}
      <div className="pointer-events-none absolute inset-x-2.5 top-2.5 sm:inset-x-4 sm:top-3.5 z-30 flex items-start justify-between gap-2">
        {/* Left: Timer, Best Lap & Live Ping (ms) */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <div className="pointer-events-auto rounded-2xl border border-white/15 bg-slate-950/80 px-3 py-1.5 sm:px-3.5 sm:py-2 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-1.5">
              <Flag className="size-3 text-cyan-400" />
              <p className="font-mono text-[0.55rem] font-bold uppercase tracking-widest text-slate-400">
                Time
              </p>
            </div>
            <p className="font-mono text-base sm:text-2xl font-black tracking-tight text-white leading-tight">
              {formatTimer(totalTimeMs)}
            </p>
            {bestLapMs ? (
              <p className="font-mono text-[0.55rem] text-cyan-400 font-semibold">
                Best: {(bestLapMs / 1000).toFixed(2)}s
              </p>
            ) : null}
          </div>

          {isMultiplayer && (
            <div
              className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-xl border bg-slate-950/80 px-2.5 py-1 font-mono text-[0.58rem] font-bold backdrop-blur-xl shadow ${pingColorClass}`}
            >
              <Wifi className="size-3" />
              <span>{pingMs !== null ? `${pingMs} ms` : "... ms"}</span>
              <span className="rounded bg-white/10 px-1 py-0.2 text-[0.5rem] text-slate-300">
                {transportLabel}
              </span>
            </div>
          )}
        </div>

        {/* Center: Live Position, Lap Counter & Mobile Compact Speed */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-950/80 px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-1">
            <Trophy className="size-3.5 text-amber-400" />
            <span className="font-mono text-base sm:text-xl font-black text-white">
              P{rank}
            </span>
            <span className="font-mono text-[0.6rem] text-slate-400">
              /{totalRacers}
            </span>
          </div>

          <div className="h-4 w-px bg-white/15" />

          <div className="font-mono text-[0.68rem] sm:text-xs font-bold text-slate-200">
            LAP{" "}
            <span className="text-cyan-400 font-extrabold">
              {Math.min(lap, maxLaps)}
            </span>
            /{maxLaps}
          </div>

          <div className="flex sm:hidden items-center gap-1 border-l border-white/15 pl-2 font-mono text-xs font-black text-cyan-300">
            {speedKmh}
            <span className="text-[0.5rem] text-slate-400">KMH</span>
          </div>
        </div>

        {/* Right: Clean Compact Action Controls + Mobile Modes + Exit */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Immersive Fullscreen / Landscape Rotate */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onToggleRotateScreen();
              }}
              aria-label="Toggle Fullscreen Landscape"
              title={isLandscape ? "Exit Fullscreen" : "Fullscreen / Rotate"}
              className="flex h-8 sm:h-9 items-center gap-1 rounded-xl border border-cyan-400/45 bg-cyan-950/80 px-2 sm:px-2.5 text-cyan-300 shadow-lg backdrop-blur-xl active:scale-90 transition-all hover:bg-cyan-900"
            >
              {isLandscape ? (
                <Minimize2 className="size-3.5" />
              ) : (
                <Maximize2 className="size-3.5" />
              )}
              <span className="hidden sm:inline font-mono text-[0.6rem] font-bold uppercase">
                {isLandscape ? "Exit Full" : "Full"}
              </span>
            </button>

            {/* Reset Car */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onResetCar();
              }}
              aria-label="Reset Car to Track"
              title="Reset Car (R)"
              className="flex size-8 sm:size-9 items-center justify-center rounded-xl border border-white/15 bg-slate-950/80 text-slate-300 shadow-lg backdrop-blur-xl active:scale-90 transition-all hover:text-white"
            >
              <RotateCcw className="size-3.5" />
            </button>

            {/* Camera View */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onToggleCamera();
              }}
              aria-label={`Camera: ${cameraMode}`}
              title={`Switch Camera (${cameraMode.toUpperCase()})`}
              className="flex size-8 sm:size-9 items-center justify-center rounded-xl border border-white/15 bg-slate-950/80 text-slate-300 shadow-lg backdrop-blur-xl active:scale-90 transition-all hover:text-white"
            >
              <Camera className="size-3.5" />
            </button>

            {/* Audio Mute */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onToggleMute();
              }}
              aria-label="Mute / Unmute Sound"
              title="Toggle Sound (M)"
              className="flex size-8 sm:size-9 items-center justify-center rounded-xl border border-white/15 bg-slate-950/80 text-slate-300 shadow-lg backdrop-blur-xl active:scale-90 transition-all hover:text-white"
            >
              {isMuted ? (
                <VolumeX className="size-3.5 text-rose-400" />
              ) : (
                <Volume2 className="size-3.5 text-cyan-400" />
              )}
            </button>

            {/* Clean Exit Race Button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onExitRace();
              }}
              aria-label="Exit Race"
              title="Exit to Lobby"
              className="flex h-8 sm:h-9 items-center gap-1 rounded-xl border border-rose-500/45 bg-rose-950/85 px-2 sm:px-2.5 text-rose-300 shadow-lg backdrop-blur-xl active:scale-90 transition-all hover:bg-rose-900 hover:text-white"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline font-mono text-[0.6rem] font-bold uppercase">
                Exit
              </span>
            </button>
          </div>

          {/* Mobile Touch Mode Switchers (Compact 2nd Row) */}
          {controlsMode === "touch" && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  onToggleAutoDrive();
                }}
                className={`flex items-center gap-1 rounded-xl border px-2 py-1 font-mono text-[0.55rem] font-bold uppercase backdrop-blur-xl transition-all active:scale-90 ${
                  autoDrive
                    ? "border-emerald-400/50 bg-emerald-950/80 text-emerald-300"
                    : "border-white/15 bg-slate-950/80 text-slate-400"
                }`}
              >
                <Zap className="size-3" />
                <span>Auto: {autoDrive ? "ON" : "OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  onCycleMobileControl();
                }}
                className="flex items-center gap-1 rounded-xl border border-cyan-400/45 bg-slate-950/85 px-2 py-1 font-mono text-[0.55rem] font-bold uppercase text-cyan-300 backdrop-blur-xl transition-all active:scale-90"
              >
                {mobileControlType === "wheel" ? (
                  <Gauge className="size-3" />
                ) : mobileControlType === "tilt" ? (
                  <Compass className="size-3" />
                ) : (
                  <Gamepad2 className="size-3" />
                )}
                <span>Steer: {mobileControlType.toUpperCase()}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- DIGITAL SPEEDOMETER & NITRO GAUGE (BOTTOM RIGHT DESKTOP) ---------------- */}
      <div className="pointer-events-none absolute bottom-4 right-4 z-20 hidden sm:flex items-end gap-3">
        <div className="rounded-3xl border border-white/15 bg-slate-950/85 p-3.5 backdrop-blur-xl shadow-2xl flex items-center gap-3.5">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-4xl font-black tracking-tight text-white">
                {speedKmh}
              </span>
              <span className="font-mono text-[0.65rem] font-bold text-slate-400">
                KM/H
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 font-mono text-[0.62rem] text-slate-400">
              <span>
                GEAR: <b className="text-cyan-400 font-extrabold">{gear}</b>
              </span>
              <span>•</span>
              <span className="text-cyan-300">{cameraMode.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 border-l border-white/10 pl-3">
            <Flame
              className={`size-4 ${
                nitroPercent > 15
                  ? "text-cyan-400 animate-pulse"
                  : "text-slate-600"
              }`}
            />
            <div className="h-10 w-2.5 overflow-hidden rounded-full bg-slate-800 flex flex-col justify-end">
              <div
                className="w-full rounded-full bg-gradient-to-t from-cyan-500 to-sky-300 transition-all duration-75"
                style={{ height: `${nitroPercent}%` }}
              />
            </div>
            <span className="font-mono text-[0.55rem] font-bold text-slate-400">
              {nitroPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- 2D GRAND PRIX RADAR / MINIMAP ---------------- */}
      <div
        className={`pointer-events-none z-20 ${
          controlsMode === "touch"
            ? "hidden sm:block absolute left-4 top-20"
            : "hidden md:block absolute bottom-4 left-4"
        }`}
      >
        <div className="rounded-2xl sm:rounded-3xl border border-white/15 bg-slate-950/80 p-2.5 sm:p-3.5 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-1">
            <p className="font-mono text-[0.52rem] sm:text-[0.58rem] font-bold uppercase tracking-widest text-slate-400">
              Horizon GP · 1.92km
            </p>
            <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <svg
            className="w-36 h-24 sm:w-44 sm:h-30 overflow-visible"
            viewBox="-295 -215 630 470"
          >
            <path
              d={radarPath}
              fill="none"
              stroke="#1e293b"
              strokeWidth="22"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={radarPath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="5"
              strokeOpacity="0.9"
            />
            <line
              x1="0"
              y1="-206"
              x2="0"
              y2="-174"
              stroke="#ffffff"
              strokeWidth="5"
            />

            {remoteRacers.map((rp) => (
              <circle
                key={rp.id}
                cx={rp.x}
                cy={rp.z}
                r="8"
                fill={rp.color}
                stroke="#ffffff"
                strokeWidth="2"
              />
            ))}

            {aiBots.map((bot) => (
              <circle
                key={bot.id}
                cx={bot.x}
                cy={bot.z}
                r="7.5"
                fill={bot.color}
                stroke="#090d16"
                strokeWidth="2"
              />
            ))}

            <circle
              cx={playerPos.x}
              cy={playerPos.z}
              r="10"
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth="3"
            />
          </svg>
        </div>
      </div>

      {/* ---------------- MOBILE TOUCH DRIVE CONTROLS ---------------- */}
      {controlsMode === "touch" && (
        <div
          className="pointer-events-none absolute inset-x-2 sm:inset-x-4 bottom-2 sm:bottom-4 z-30 flex items-end justify-between touch-none select-none"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {/* Left Thumb Steering Mode */}
          <div className="flex items-end">
            {mobileControlType === "wheel" ? (
              <VirtualSteeringWheel onAnalogSteer={onAnalogSteer} />
            ) : mobileControlType === "tilt" ? (
              <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-cyan-400/40 bg-slate-950/80 px-3 py-2 font-mono text-[0.6rem] font-bold uppercase text-cyan-300 backdrop-blur-xl">
                <Compass className="size-4 animate-spin" style={{ animationDuration: "6s" }} />
                <span>Tilt Phone to Steer</span>
              </div>
            ) : (
              <SlideSteerPad
                onLeftChange={onTouchLeftChange}
                onRightChange={onTouchRightChange}
                onAnalogSteer={onAnalogSteer}
              />
            )}
          </div>

          {/* Right Thumb Multi-Touch Action Pedals */}
          <div className="pointer-events-auto flex items-end gap-1.5 sm:gap-2 rounded-3xl border border-white/15 bg-slate-950/80 p-1.5 sm:p-2 shadow-2xl backdrop-blur-xl">
            <MultiTouchPedal
              label="Powerslide Drift"
              className="flex size-12 sm:size-14 items-center justify-center rounded-2xl border border-amber-500/50 bg-amber-500/20 font-mono text-[0.6rem] font-black uppercase text-amber-300 shadow-lg"
              activeClassName="bg-amber-400 text-slate-950 border-amber-300"
              onActiveChange={onTouchDriftChange}
            >
              DRIFT
            </MultiTouchPedal>

            <MultiTouchPedal
              label="Nitro Overdrive"
              className="flex size-14 sm:size-16 items-center justify-center rounded-2xl border-2 border-cyan-400/65 bg-gradient-to-t from-cyan-600/45 to-sky-400/45 font-mono text-[0.58rem] font-black uppercase text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.45)]"
              activeClassName="bg-cyan-400 text-slate-950 border-white"
              onActiveChange={onTouchNitroChange}
            >
              <div className="flex flex-col items-center">
                <Flame className="size-5 text-cyan-200 animate-pulse" />
                <span>{nitroPercent}%</span>
              </div>
            </MultiTouchPedal>

            <MultiTouchPedal
              label="Brake and Reverse"
              className="flex size-13 sm:size-16 items-center justify-center rounded-2xl border-2 border-rose-500/55 bg-gradient-to-t from-rose-700/40 to-rose-500/40 text-rose-200 shadow-lg"
              activeClassName="bg-rose-500 text-white border-rose-300"
              onActiveChange={onTouchBrakeChange}
            >
              <div className="flex flex-col items-center">
                <ArrowDown className="size-5 sm:size-6" strokeWidth={3} />
                <span className="font-mono text-[0.5rem] font-bold">BRK</span>
              </div>
            </MultiTouchPedal>

            {!autoDrive && (
              <MultiTouchPedal
                label="Gas Accelerator"
                className="flex h-16 w-14 sm:h-18 sm:w-16 items-center justify-center rounded-2xl border-2 border-emerald-400/70 bg-gradient-to-t from-emerald-700/50 to-emerald-500/50 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                activeClassName="bg-emerald-400 text-slate-950 border-white"
                onActiveChange={onTouchGasChange}
              >
                <div className="flex flex-col items-center">
                  <ArrowUp className="size-6 sm:size-7" strokeWidth={3} />
                  <span className="font-mono text-[0.52rem] font-black">GAS</span>
                </div>
              </MultiTouchPedal>
            )}
          </div>
        </div>
      )}

      {/* ---------------- DESKTOP KEYBOARD CONTROLS GUIDE ---------------- */}
      {controlsMode === "keyboard" && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-10 hidden sm:flex items-center gap-3 rounded-full border border-white/15 bg-slate-950/85 px-5 py-2 backdrop-blur-xl text-slate-300 text-[0.68rem] font-mono shadow-2xl">
          <span>
            <b className="text-white">WASD / ↑↓←→</b> Drive
          </span>
          <span>•</span>
          <span>
            <b className="text-amber-400">SPACE</b> Drift
          </span>
          <span>•</span>
          <span>
            <b className="text-cyan-400">SHIFT</b> Nitro
          </span>
          <span>•</span>
          <span>
            <b className="text-white">R</b> Reset
          </span>
          <span>•</span>
          <span>
            <b className="text-white">C</b> Cam
          </span>
          <span>•</span>
          <span>
            <b className="text-white">M</b> Mute
          </span>
        </div>
      )}
    </>
  );
}
