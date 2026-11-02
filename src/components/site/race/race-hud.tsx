/**
 * Cyber Circuit — High-Performance Futuristic Heads-Up Display (HUD)
 * Features:
 * - Screen Rotate / Fullscreen Landscape mode toggle for mobile & tablet
 * - Auto-Drive (Auto Gas: ON/OFF) toggle for effortless 1-handed driving
 * - Ergonomic, high-comfort touch controls (Large Left/Right steering + Big Nitro & Brake)
 * - 2D Grand Prix Radar Minimap rendering the full 732m winding circuit with real-time blips
 * - Haptic feedback support on touch
 */

import { useMemo } from "react";
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
  Bot,
  Zap,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { CIRCUIT_SAMPLES, SAMPLE_COUNT } from "./race-physics";
import type { AIRival } from "./race-ai";

export interface HUDProps {
  speedKmh: number;
  gear: string;
  nitroPercent: number;
  lap: number;
  maxLaps: number;
  totalTimeMs: number;
  bestLapMs: number | null;
  lapSplitText: string | null;
  rank: number;
  totalRacers: number;
  isWrongWay: boolean;
  cameraMode: "chase" | "bumper" | "top";
  isMuted: boolean;
  controlsMode: "keyboard" | "touch";
  hasAI: boolean;
  autoDrive: boolean;
  isLandscape: boolean;
  isTiltEnabled?: boolean;
  driftScore?: number;
  playerPos: { x: number; z: number };
  remoteRacers: { id: string; color: string; x: number; z: number }[];
  aiBots: AIRival[];
  onToggleCamera: () => void;
  onToggleMute: () => void;
  onResetCar: () => void;
  onToggleAI: () => void;
  onToggleAutoDrive: () => void;
  onToggleTilt?: () => void;
  onToggleRotateScreen: () => void;
  onTouchGasStart: () => void;
  onTouchGasEnd: () => void;
  onTouchBrakeStart: () => void;
  onTouchBrakeEnd: () => void;
  onTouchLeftStart: () => void;
  onTouchLeftEnd: () => void;
  onTouchRightStart: () => void;
  onTouchRightEnd: () => void;
  onTouchDriftStart: () => void;
  onTouchDriftEnd: () => void;
  onTouchNitroStart: () => void;
  onTouchNitroEnd: () => void;
}

export function RaceHUD({
  speedKmh,
  gear,
  nitroPercent,
  lap,
  maxLaps,
  totalTimeMs,
  bestLapMs,
  lapSplitText,
  rank,
  totalRacers,
  isWrongWay,
  cameraMode,
  isMuted,
  controlsMode,
  hasAI,
  autoDrive,
  isLandscape,
  isTiltEnabled = false,
  driftScore = 0,
  playerPos,
  remoteRacers,
  aiBots,
  onToggleCamera,
  onToggleMute,
  onResetCar,
  onToggleAI,
  onToggleAutoDrive,
  onToggleTilt,
  onToggleRotateScreen,
  onTouchGasStart,
  onTouchGasEnd,
  onTouchBrakeStart,
  onTouchBrakeEnd,
  onTouchLeftStart,
  onTouchLeftEnd,
  onTouchRightStart,
  onTouchRightEnd,
  onTouchDriftStart,
  onTouchDriftEnd,
  onTouchNitroStart,
  onTouchNitroEnd,
}: HUDProps) {
  const formatTimer = (ms: number) => {
    const s = ms / 1000;
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(2).padStart(5, "0");
    return `${m}:${sec}`;
  };

  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
  };

  // Generate SVG path for the 732m winding Grand Prix circuit radar
  const radarPath = useMemo(() => {
    const N = SAMPLE_COUNT;
    let d = `M ${CIRCUIT_SAMPLES[0]!.x} ${CIRCUIT_SAMPLES[0]!.z}`;
    for (let i = 1; i < N; i += 2) {
      const sp = CIRCUIT_SAMPLES[i]!;
      d += ` L ${sp.x.toFixed(1)} ${sp.z.toFixed(1)}`;
    }
    d += " Z";
    return d;
  }, []);

  return (
    <>
      {/* ---------------- HIGH SPEED & NITRO WARP LINES OVERLAY ---------------- */}
      {speedKmh > 165 && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden opacity-40">
          <div className="absolute left-0 inset-y-0 w-24 bg-gradient-to-r from-cyan-400/20 to-transparent" />
          <div className="absolute right-0 inset-y-0 w-24 bg-gradient-to-l from-cyan-400/20 to-transparent" />
          <div className="absolute left-6 top-1/4 h-0.5 w-32 bg-cyan-300 animate-pulse" />
          <div className="absolute left-10 top-2/3 h-0.5 w-48 bg-cyan-300 animate-pulse delay-75" />
          <div className="absolute right-6 top-1/3 h-0.5 w-36 bg-cyan-300 animate-pulse delay-100" />
          <div className="absolute right-12 top-3/4 h-0.5 w-44 bg-cyan-300 animate-pulse delay-150" />
        </div>
      )}

      {/* ---------------- FLOATING DRIFT SCORE BADGE ---------------- */}
      {driftScore > 0 && (
        <div className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 z-25 flex items-center gap-2 rounded-2xl border border-amber-500/50 bg-amber-500/25 px-4 py-1.5 shadow-[0_0_25px_rgba(245,158,11,0.45)] backdrop-blur-xl animate-bounce">
          <Flame className="size-4 text-amber-400" />
          <span className="font-mono text-sm font-black uppercase tracking-wider text-amber-300">
            DRIFT +{driftScore.toLocaleString()} PTS
          </span>
        </div>
      )}

      {/* ---------------- TOP HUD STATUS BAR ---------------- */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-start justify-between">
        {/* Left: Total Elapsed Time & Sector Split */}
        <div className="flex flex-col gap-1.5">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-slate-900/85 px-3.5 py-2 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-1.5">
              <Flag className="size-3 text-cyan-400" />
              <p className="font-mono text-[0.58rem] font-bold uppercase tracking-widest text-slate-400">
                Time
              </p>
            </div>
            <p className="font-mono text-xl sm:text-2xl font-black tracking-tight text-white">
              {formatTimer(totalTimeMs)}
            </p>
            {bestLapMs && (
              <p className="mt-0.5 font-mono text-[0.58rem] text-cyan-400 font-semibold">
                Best: {(bestLapMs / 1000).toFixed(2)}s
              </p>
            )}
          </div>

          {lapSplitText && (
            <div className="animate-bounce rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 font-mono text-xs font-bold text-emerald-300 backdrop-blur-md">
              {lapSplitText}
            </div>
          )}
        </div>

        {/* Center: Live Standings / Lap Counter */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/85 px-4 py-2 backdrop-blur-xl shadow-xl">
            {/* Live Rank */}
            <div className="flex items-center gap-1">
              <Trophy className="size-3.5 text-amber-400" />
              <span className="font-mono text-lg font-black text-white">
                P{rank}
              </span>
              <span className="font-mono text-[0.62rem] text-slate-400">
                /{totalRacers}
              </span>
            </div>

            <div className="h-4 w-px bg-white/15" />

            {/* Lap Counter */}
            <div className="font-mono text-xs font-bold text-slate-200">
              LAP <span className="text-cyan-400 font-extrabold">{Math.min(lap, maxLaps)}</span>/{maxLaps}
            </div>

            {/* Compact Speed for Mobile Screen */}
            <div className="flex sm:hidden items-center gap-1 border-l border-white/15 pl-2 font-mono text-xs font-black text-cyan-300">
              {speedKmh} <span className="text-[0.55rem] text-slate-400">KMH</span>
            </div>
          </div>

          {/* Wrong Way Warning Banner */}
          {isWrongWay && (
            <div className="animate-pulse rounded-full border border-rose-500/60 bg-rose-600/35 px-4 py-1 text-center font-mono text-[0.68rem] font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(244,63,94,0.6)] backdrop-blur-xl">
              ⚠️ WRONG WAY! TURN AROUND
            </div>
          )}
        </div>

        {/* Right: Quick Action Buttons (Rotate Screen, Auto-Drive, Audio, Cam, Reset) */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5 max-w-[200px] sm:max-w-none">
          {/* Rotate Screen / Landscape Mode Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onToggleRotateScreen();
            }}
            aria-label="Rotate Screen to Landscape"
            className="flex items-center gap-1.5 rounded-2xl border border-cyan-400/50 bg-cyan-950/80 px-2.5 py-1.5 text-cyan-300 shadow-xl backdrop-blur-xl active:scale-90 transition-all hover:bg-cyan-900"
          >
            {isLandscape ? (
              <Minimize2 className="size-3.5 text-cyan-300" />
            ) : (
              <RotateCcw className="size-3.5 text-cyan-300" />
            )}
            <span className="font-mono text-[0.6rem] font-bold uppercase tracking-wider">
              {isLandscape ? "Exit Full" : "Rotate"}
            </span>
          </button>

          {/* Auto Gas Toggle (Mobile & Tablet) */}
          {controlsMode === "touch" && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onToggleAutoDrive();
              }}
              aria-label="Toggle Auto Drive"
              className={`flex items-center gap-1 rounded-2xl border px-2.5 py-1.5 font-mono text-[0.58rem] font-bold uppercase tracking-wider shadow-xl backdrop-blur-xl active:scale-90 transition-all ${
                autoDrive
                  ? "border-emerald-400/50 bg-emerald-950/80 text-emerald-300"
                  : "border-slate-700 bg-slate-900/80 text-slate-400"
              }`}
            >
              <Zap className="size-3 text-emerald-400" />
              <span>Auto Gas: {autoDrive ? "ON" : "OFF"}</span>
            </button>
          )}

          {/* Tilt Gyro Steering Toggle (Mobile only) */}
          {controlsMode === "touch" && onToggleTilt && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onToggleTilt();
              }}
              aria-label="Toggle Gyroscope Steering"
              className={`flex items-center gap-1 rounded-2xl border px-2.5 py-1.5 font-mono text-[0.58rem] font-bold uppercase tracking-wider shadow-xl backdrop-blur-xl active:scale-90 transition-all ${
                isTiltEnabled
                  ? "border-cyan-400/50 bg-cyan-950/80 text-cyan-300"
                  : "border-slate-700 bg-slate-900/80 text-slate-400"
              }`}
            >
              <span>Tilt: {isTiltEnabled ? "ON" : "OFF"}</span>
            </button>
          )}

          {/* Reset Car Facing Forward */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onResetCar();
            }}
            aria-label="Reset Car on Track"
            className="flex size-9 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/85 text-slate-300 shadow-xl backdrop-blur-xl active:scale-90 transition-all hover:text-white"
          >
            <RotateCcw className="size-3.5" />
          </button>

          {/* Toggle Camera Perspective */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onToggleCamera();
            }}
            aria-label="Toggle Camera View"
            className="flex size-9 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/85 text-slate-300 shadow-xl backdrop-blur-xl active:scale-90 transition-all hover:text-white"
          >
            <Camera className="size-3.5" />
          </button>

          {/* Toggle Sound Mute */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onToggleMute();
            }}
            aria-label="Toggle Audio Mute"
            className="flex size-9 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/85 text-slate-300 shadow-xl backdrop-blur-xl active:scale-90 transition-all hover:text-white"
          >
            {isMuted ? (
              <VolumeX className="size-3.5 text-rose-400" />
            ) : (
              <Volume2 className="size-3.5 text-cyan-400" />
            )}
          </button>
        </div>
      </div>

      {/* ---------------- DIGITAL SPEEDOMETER & NITRO GAUGE (BOTTOM RIGHT) ---------------- */}
      <div className="pointer-events-none absolute bottom-4 right-4 z-20 hidden sm:flex items-end gap-3">
        <div className="rounded-3xl border border-white/10 bg-slate-950/85 p-3.5 backdrop-blur-xl shadow-2xl flex items-center gap-3.5">
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
              <span>GEAR: <b className="text-cyan-400 font-extrabold">{gear}</b></span>
            </div>
          </div>

          {/* Nitro Tank Meter */}
          <div className="flex flex-col items-center gap-1 border-l border-white/10 pl-3">
            <Flame
              className={`size-4 ${
                nitroPercent > 20 ? "text-cyan-400 animate-pulse" : "text-slate-600"
              }`}
            />
            <div className="h-10 w-2.5 overflow-hidden rounded-full bg-slate-800 flex flex-col justify-end">
              <div
                className="w-full rounded-full bg-gradient-to-t from-cyan-500 to-blue-400 transition-all duration-75"
                style={{ height: `${nitroPercent}%` }}
              />
            </div>
            <span className="font-mono text-[0.55rem] font-bold text-slate-400">
              {nitroPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- 2D GRAND PRIX RADAR / MINIMAP (BOTTOM LEFT) ---------------- */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-20 hidden md:block">
        <div className="rounded-3xl border border-white/10 bg-slate-950/85 p-3.5 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <p className="font-mono text-[0.58rem] font-bold uppercase tracking-widest text-slate-400">
              Grand Prix Circuit Radar
            </p>
            <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <svg className="w-44 h-28 overflow-visible" viewBox="-185 -115 350 195">
            {/* Asphalt Track Outline */}
            <path
              d={radarPath}
              fill="none"
              stroke="#1e293b"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Neon Cyan Circuit Line */}
            <path
              d={radarPath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="3.5"
              strokeOpacity="0.85"
            />
            {/* Checkered Start Line */}
            <line x1="0" y1="-95" x2="0" y2="-75" stroke="#ffffff" strokeWidth="3" />

            {/* Remote Players */}
            {remoteRacers.map((rp) => (
              <circle
                key={rp.id}
                cx={rp.x}
                cy={rp.z}
                r="4.5"
                fill={rp.color}
                stroke="#ffffff"
                strokeWidth="1.2"
              />
            ))}

            {/* AI Bot Rivals */}
            {aiBots.map((bot) => (
              <circle
                key={bot.id}
                cx={bot.x}
                cy={bot.z}
                r="4.2"
                fill={bot.color}
                stroke="#090d16"
                strokeWidth="1.2"
              />
            ))}

            {/* Local Player Blip */}
            <circle
              cx={playerPos.x}
              cy={playerPos.z}
              r="5.5"
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth="2.0"
            />
          </svg>
        </div>
      </div>

      {/* ---------------- TOUCH SCREEN DRIVE CONTROLS (EASY & ERGONOMIC) ---------------- */}
      {controlsMode === "touch" && (
        <div className="pointer-events-none absolute inset-x-2 bottom-3 z-30 flex items-end justify-between select-none">
          {/* Left Thumb: Extra Large Steering D-Pad */}
          <div className="pointer-events-auto flex items-center gap-2 rounded-3xl border border-white/10 bg-slate-950/85 p-2 shadow-2xl backdrop-blur-xl">
            <button
              type="button"
              aria-label="Steer Left"
              className="flex size-18 sm:size-20 items-center justify-center rounded-2xl border-2 border-cyan-500/40 bg-slate-900/90 text-white shadow-xl active:scale-90 active:bg-cyan-500 active:text-black transition-all"
              onTouchStart={(e) => {
                e.preventDefault();
                triggerHaptic();
                onTouchLeftStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onTouchLeftEnd();
              }}
              onTouchCancel={() => onTouchLeftEnd()}
              onMouseDown={() => {
                triggerHaptic();
                onTouchLeftStart();
              }}
              onMouseUp={() => onTouchLeftEnd()}
              onMouseLeave={() => onTouchLeftEnd()}
            >
              <ArrowLeft className="size-9" strokeWidth={3} />
            </button>
            <button
              type="button"
              aria-label="Steer Right"
              className="flex size-18 sm:size-20 items-center justify-center rounded-2xl border-2 border-cyan-500/40 bg-slate-900/90 text-white shadow-xl active:scale-90 active:bg-cyan-500 active:text-black transition-all"
              onTouchStart={(e) => {
                e.preventDefault();
                triggerHaptic();
                onTouchRightStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onTouchRightEnd();
              }}
              onTouchCancel={() => onTouchRightEnd()}
              onMouseDown={() => {
                triggerHaptic();
                onTouchRightStart();
              }}
              onMouseUp={() => onTouchRightEnd()}
              onMouseLeave={() => onTouchRightEnd()}
            >
              <ArrowRight className="size-9" strokeWidth={3} />
            </button>
          </div>

          {/* Right Thumb: Easy Action Buttons (Big Nitro, Brake & Drift) */}
          <div className="pointer-events-auto flex items-end gap-2.5 rounded-3xl border border-white/10 bg-slate-950/85 p-2 shadow-2xl backdrop-blur-xl">
            {/* Powerslide Drift Button */}
            <button
              type="button"
              aria-label="Powerslide Drift"
              className="flex size-14 items-center justify-center rounded-2xl border border-amber-500/50 bg-amber-500/20 font-mono text-[0.68rem] font-black uppercase text-amber-300 shadow-lg active:scale-90 active:bg-amber-400 active:text-black transition-all"
              onTouchStart={(e) => {
                e.preventDefault();
                triggerHaptic();
                onTouchDriftStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onTouchDriftEnd();
              }}
              onTouchCancel={() => onTouchDriftEnd()}
              onMouseDown={() => {
                triggerHaptic();
                onTouchDriftStart();
              }}
              onMouseUp={() => onTouchDriftEnd()}
              onMouseLeave={() => onTouchDriftEnd()}
            >
              DRIFT
            </button>

            {/* BIG NITRO BUTTON */}
            <button
              type="button"
              aria-label="Nitro Turbo Boost"
              className="flex size-18 sm:size-20 items-center justify-center rounded-2xl border-2 border-cyan-400/60 bg-gradient-to-t from-cyan-600/40 to-cyan-500/40 font-mono text-xs font-black uppercase text-cyan-200 shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-90 active:bg-cyan-400 active:text-black transition-all"
              onTouchStart={(e) => {
                e.preventDefault();
                triggerHaptic();
                onTouchNitroStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onTouchNitroEnd();
              }}
              onTouchCancel={() => onTouchNitroEnd()}
              onMouseDown={() => {
                triggerHaptic();
                onTouchNitroStart();
              }}
              onMouseUp={() => onTouchNitroEnd()}
              onMouseLeave={() => onTouchNitroEnd()}
            >
              <div className="flex flex-col items-center">
                <Flame className="size-6 text-cyan-300 animate-pulse" />
                <span className="mt-0.5 text-[0.62rem]">NITRO</span>
              </div>
            </button>

            {/* BRAKE & REVERSE BUTTON */}
            <button
              type="button"
              aria-label="Brake and Reverse"
              className="flex size-18 sm:size-20 items-center justify-center rounded-2xl border-2 border-rose-500/50 bg-gradient-to-t from-rose-600/35 to-rose-500/35 text-rose-300 shadow-xl active:scale-90 active:bg-rose-500 active:text-white transition-all"
              onTouchStart={(e) => {
                e.preventDefault();
                triggerHaptic();
                onTouchBrakeStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onTouchBrakeEnd();
              }}
              onTouchCancel={() => onTouchBrakeEnd()}
              onMouseDown={() => {
                triggerHaptic();
                onTouchBrakeStart();
              }}
              onMouseUp={() => onTouchBrakeEnd()}
              onMouseLeave={() => onTouchBrakeEnd()}
            >
              <ArrowDown className="size-8" strokeWidth={3} />
            </button>

            {/* MANUAL GAS PEDAL (Only displayed if Auto-Drive is turned OFF) */}
            {!autoDrive && (
              <button
                type="button"
                aria-label="Gas Accelerator"
                className="flex size-18 sm:size-20 items-center justify-center rounded-2xl border-2 border-emerald-400/60 bg-gradient-to-t from-emerald-600/45 to-emerald-500/45 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.35)] active:scale-90 active:bg-emerald-400 active:text-black transition-all"
                onTouchStart={(e) => {
                  e.preventDefault();
                  triggerHaptic();
                  onTouchGasStart();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  onTouchGasEnd();
                }}
                onTouchCancel={() => onTouchGasEnd()}
                onMouseDown={() => {
                  triggerHaptic();
                  onTouchGasStart();
                }}
                onMouseUp={() => onTouchGasEnd()}
                onMouseLeave={() => onTouchGasEnd()}
              >
                <ArrowUp className="size-9" strokeWidth={3} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ---------------- DESKTOP KEYBOARD CONTROLS GUIDE ---------------- */}
      {controlsMode === "keyboard" && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-10 hidden sm:flex items-center gap-3 rounded-full border border-white/10 bg-slate-900/85 px-5 py-2 backdrop-blur-xl text-slate-300 text-[0.7rem] font-mono shadow-2xl">
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
            <b className="text-white">C</b> Camera
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
