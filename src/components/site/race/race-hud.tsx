/**
 * Cyber Circuit — High-Performance Futuristic Heads-Up Display (HUD)
 */

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
} from "lucide-react";
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
  playerPos: { x: number; z: number };
  remoteRacers: { id: string; color: string; x: number; z: number }[];
  aiBots: AIRival[];
  onToggleCamera: () => void;
  onToggleMute: () => void;
  onResetCar: () => void;
  onToggleAI: () => void;
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
  playerPos,
  remoteRacers,
  aiBots,
  onToggleCamera,
  onToggleMute,
  onResetCar,
  onToggleAI,
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

  return (
    <>
      {/* ---------------- TOP HUD STATUS BAR ---------------- */}
      <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex items-start justify-between">
        {/* Left: Total Elapsed Time & Sector Split */}
        <div className="flex flex-col gap-2">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-slate-900/85 px-4 py-2.5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-2">
              <Flag className="size-3.5 text-cyan-400" />
              <p className="font-mono text-[0.6rem] font-bold uppercase tracking-widest text-slate-400">
                Total Time
              </p>
            </div>
            <p className="font-mono text-2xl font-black tracking-tight text-white">
              {formatTimer(totalTimeMs)}
            </p>
            {bestLapMs && (
              <p className="mt-0.5 font-mono text-[0.62rem] text-cyan-400 font-semibold">
                Best Lap: {(bestLapMs / 1000).toFixed(2)}s
              </p>
            )}
          </div>

          {/* Lap Split Popup */}
          {lapSplitText && (
            <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/90 px-3.5 py-1.5 font-mono text-xs font-bold text-emerald-300 backdrop-blur-md shadow-lg animate-bounce">
              {lapSplitText}
            </div>
          )}
        </div>

        {/* Center: Live Rank & Wrong Way Warning */}
        <div className="flex flex-col items-center gap-2">
          {isWrongWay && (
            <div className="rounded-2xl border-2 border-rose-500 bg-rose-950/95 px-6 py-2 font-mono text-sm font-black uppercase tracking-widest text-white shadow-[0_0_30px_rgba(244,63,94,0.7)] backdrop-blur-md animate-pulse">
              ⚠ WRONG WAY! TURN AROUND
            </div>
          )}

          {/* Position Badge */}
          <div className="pointer-events-auto flex items-center gap-2.5 rounded-2xl border border-cyan-500/35 bg-slate-900/85 px-4 py-2 backdrop-blur-xl shadow-xl">
            <Trophy className="size-4 text-amber-400" />
            <span className="font-display text-xl font-black text-white">
              {rank === 1 ? "1st" : rank === 2 ? "2nd" : rank === 3 ? "3rd" : `${rank}th`}
            </span>
            <span className="font-mono text-[0.65rem] text-slate-400 font-medium">
              / {totalRacers}
            </span>
          </div>
        </div>

        {/* Right: Lap Counter & Quick Toggles */}
        <div className="flex flex-col items-end gap-2">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-slate-900/85 px-4 py-2.5 backdrop-blur-xl shadow-xl text-right">
            <p className="font-mono text-[0.6rem] font-bold uppercase tracking-widest text-slate-400">
              Lap Progress
            </p>
            <p className="font-display text-2xl font-black text-cyan-400">
              {Math.min(lap, maxLaps)}{" "}
              <span className="text-sm font-normal text-slate-400">/ {maxLaps}</span>
            </p>
          </div>

          {/* Action Quick Buttons */}
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-white/10 bg-slate-900/85 p-1.5 backdrop-blur-xl shadow-xl">
            {/* AI Toggle */}
            <button
              type="button"
              onClick={onToggleAI}
              className={`flex size-8 items-center justify-center rounded-xl transition ${
                hasAI
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  : "bg-white/5 text-slate-400 hover:bg-white/15"
              }`}
              title={hasAI ? "AI Rivals Active (Click to toggle)" : "Add AI Rivals"}
            >
              <Bot className="size-4" />
            </button>

            {/* Camera View Toggle */}
            <button
              type="button"
              onClick={onToggleCamera}
              className="flex size-8 items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white transition"
              title={`Camera: ${cameraMode} (C)`}
            >
              <Camera className="size-4" />
            </button>

            {/* Mute Toggle */}
            <button
              type="button"
              onClick={onToggleMute}
              className="flex size-8 items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white transition"
              title="Toggle Audio (M)"
            >
              {isMuted ? (
                <VolumeX className="size-4 text-rose-400" />
              ) : (
                <Volume2 className="size-4 text-cyan-400" />
              )}
            </button>

            {/* Reset Car */}
            <button
              type="button"
              onClick={onResetCar}
              className="flex size-8 items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white transition"
              title="Reset Car on Track (R)"
            >
              <RotateCcw className="size-4 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- SPEEDOMETER & NITRO GAUGE (BOTTOM RIGHT) ---------------- */}
      <div className="pointer-events-none absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2">
        <div className="pointer-events-auto flex items-center gap-4 rounded-3xl border border-cyan-500/30 bg-slate-950/90 p-4 backdrop-blur-2xl shadow-2xl">
          {/* Gear Indicator */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900/85 size-14 shadow-inner">
            <span className="font-mono text-[0.52rem] font-bold uppercase tracking-wider text-slate-400">
              Gear
            </span>
            <span className="font-mono text-2xl font-black text-cyan-400">{gear}</span>
          </div>

          {/* Speed Readout */}
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-4xl font-black tracking-tight text-white">
                {speedKmh}
              </span>
              <span className="font-mono text-[0.65rem] font-bold text-slate-400 uppercase">
                KM/H
              </span>
            </div>
            {/* Speed Arc Bar */}
            <div className="mt-1.5 h-2 w-32 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 transition-all duration-75"
                style={{ width: `${Math.min(100, (speedKmh / 145) * 100)}%` }}
              />
            </div>
          </div>

          {/* Nitro Fuel Tank */}
          <div className="flex flex-col items-center gap-1 pl-3 border-l border-white/10">
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

      {/* ---------------- 2D CIRCUIT RADAR / MINIMAP (BOTTOM LEFT) ---------------- */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-20 hidden sm:block">
        <div className="rounded-3xl border border-white/10 bg-slate-950/85 p-3.5 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <p className="font-mono text-[0.58rem] font-bold uppercase tracking-widest text-slate-400">
              Track Radar
            </p>
            <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <svg className="w-36 h-22 overflow-visible" viewBox="-36 -22 72 44">
            {/* Outer track loop tarmac base */}
            <path
              d="M -14.95 -14.3 L 14.95 -14.3 A 14.3 14.3 0 0 1 14.95 14.3 L -14.95 14.3 A 14.3 14.3 0 0 1 -14.95 -14.3 Z"
              fill="none"
              stroke="#1e293b"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Neon centerline path */}
            <path
              d="M -14.95 -14.3 L 14.95 -14.3 A 14.3 14.3 0 0 1 14.95 14.3 L -14.95 14.3 A 14.3 14.3 0 0 1 -14.95 -14.3 Z"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.6"
              strokeOpacity="0.85"
            />
            {/* Checkered Start Line */}
            <line x1="0" y1="-17.8" x2="0" y2="-10.8" stroke="#ffffff" strokeWidth="2.2" />

            {/* Remote Players */}
            {remoteRacers.map((rp) => (
              <circle
                key={rp.id}
                cx={rp.x * 0.65}
                cy={rp.z * 0.65}
                r="2.5"
                fill={rp.color}
                stroke="#ffffff"
                strokeWidth="0.8"
              />
            ))}

            {/* AI Bot Rivals */}
            {aiBots.map((bot) => (
              <circle
                key={bot.id}
                cx={bot.x * 0.65}
                cy={bot.z * 0.65}
                r="2.4"
                fill={bot.color}
                stroke="#090d16"
                strokeWidth="0.8"
              />
            ))}

            {/* Local Player Blip */}
            <circle
              cx={playerPos.x * 0.65}
              cy={playerPos.z * 0.65}
              r="3.2"
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth="1.4"
            />
          </svg>
        </div>
      </div>

      {/* ---------------- TOUCH SCREEN DRIVE CONTROLS (MOBILE) ---------------- */}
      {controlsMode === "touch" && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex items-end justify-between sm:hidden">
          {/* Steering Controls Pad */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              className="flex size-16 items-center justify-center rounded-2xl border border-white/20 bg-slate-900/85 text-white shadow-2xl backdrop-blur-2xl active:scale-90 active:bg-cyan-500 transition-all select-none"
              onTouchStart={(e) => {
                e.preventDefault();
                onTouchLeftStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onTouchLeftEnd();
              }}
            >
              <ArrowLeft className="size-7" />
            </button>
            <button
              type="button"
              className="flex size-16 items-center justify-center rounded-2xl border border-white/20 bg-slate-900/85 text-white shadow-2xl backdrop-blur-2xl active:scale-90 active:bg-cyan-500 transition-all select-none"
              onTouchStart={(e) => {
                e.preventDefault();
                onTouchRightStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onTouchRightEnd();
              }}
            >
              <ArrowRight className="size-7" />
            </button>
          </div>

          {/* Action Pedals: Drift, Nitro, Brake, Gas */}
          <div className="pointer-events-auto flex items-end gap-2">
            <button
              type="button"
              className="flex size-13 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/25 font-mono text-[0.65rem] font-bold text-amber-300 shadow-xl backdrop-blur-xl active:scale-90 active:bg-amber-500 active:text-black transition select-none"
              onTouchStart={(e) => {
                e.preventDefault();
                onTouchDriftStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onTouchDriftEnd();
              }}
            >
              DRIFT
            </button>
            <button
              type="button"
              className="flex size-13 items-center justify-center rounded-2xl border border-cyan-500/40 bg-cyan-500/25 font-mono text-[0.65rem] font-bold text-cyan-300 shadow-xl backdrop-blur-xl active:scale-90 active:bg-cyan-400 active:text-black transition select-none"
              onTouchStart={(e) => {
                e.preventDefault();
                onTouchNitroStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onTouchNitroEnd();
              }}
            >
              NITRO
            </button>
            <button
              type="button"
              className="flex size-16 items-center justify-center rounded-2xl border border-rose-500/35 bg-rose-500/25 text-rose-400 shadow-2xl backdrop-blur-2xl active:scale-90 active:bg-rose-500 active:text-white transition select-none"
              onTouchStart={(e) => {
                e.preventDefault();
                onTouchBrakeStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onTouchBrakeEnd();
              }}
            >
              <ArrowDown className="size-7" />
            </button>
            <button
              type="button"
              className="flex size-18 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/30 text-emerald-300 shadow-2xl backdrop-blur-2xl active:scale-90 active:bg-emerald-500 active:text-white transition select-none"
              onTouchStart={(e) => {
                e.preventDefault();
                onTouchGasStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onTouchGasEnd();
              }}
            >
              <ArrowUp className="size-8" />
            </button>
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
