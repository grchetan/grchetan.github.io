/**
 * Horizon Grand Prix — Spline Look-Ahead Racing AI Rivals
 */

import {
  CIRCUIT_SAMPLES,
  SAMPLE_COUNT,
  TRACK_GATES,
  TOTAL_GATES,
  checkGateCrossing,
  getStartingGridPos,
  resolveTrackBorders,
} from "./race-physics";

export interface AIRival {
  id: string;
  name: string;
  color: string;
  x: number;
  z: number;
  rotation: number;
  speed: number;
  steerAngle: number;
  checkpoint: number;
  lap: number;
  progress: number;
  nearestSampleIdx: number;
  targetOffset: number;
  skillFactor: number;
  topSpeed: number;
  isBraking: boolean;
  isBoosting: boolean;
}

export const AI_BOT_PROFILES = [
  {
    name: "Apex Phantom",
    color: "#f59e0b",
    skillFactor: 1.03,
    topSpeed: 54,
    offset: -3.2,
  },
  {
    name: "Neon Drift",
    color: "#ec4899",
    skillFactor: 0.96,
    topSpeed: 51,
    offset: 3.4,
  },
  {
    name: "Viper Shadow",
    color: "#10b981",
    skillFactor: 0.9,
    topSpeed: 47,
    offset: 0.2,
  },
];

export function createAIRivals(): AIRival[] {
  return AI_BOT_PROFILES.map((bot, idx) => {
    const pos = getStartingGridPos(idx + 1);
    return {
      id: `ai-bot-${idx + 1}`,
      name: bot.name,
      color: bot.color,
      x: pos.x,
      z: pos.z,
      rotation: pos.rotation,
      speed: 0,
      steerAngle: 0,
      checkpoint: 0,
      lap: 1,
      progress: -5 - idx * 2,
      nearestSampleIdx: SAMPLE_COUNT - 3 - idx * 2,
      targetOffset: bot.offset,
      skillFactor: bot.skillFactor,
      topSpeed: bot.topSpeed,
      isBraking: false,
      isBoosting: false,
    };
  });
}

/** Step all AI bots smoothly along the 360-point spline look-ahead racing line */
export function updateAIRivals(
  bots: AIRival[],
  delta: number,
  playerX: number,
  playerZ: number
): AIRival[] {
  const d = Math.min(0.05, Math.max(0.004, delta));

  return bots.map((bot, idx) => {
    const prevX = bot.x;
    const prevZ = bot.z;

    const lookIdx = (bot.nearestSampleIdx + 11) % SAMPLE_COUNT;
    const lookSample = CIRCUIT_SAMPLES[lookIdx]!;
    const farLookSample =
      CIRCUIT_SAMPLES[(bot.nearestSampleIdx + 20) % SAMPLE_COUNT]!;

    let avoidOffset = bot.targetOffset;
    if (Math.hypot(bot.x - playerX, bot.z - playerZ) < 6.5) {
      avoidOffset += idx % 2 === 0 ? -2.8 : 2.8;
    }

    const targetX = lookSample.x + lookSample.normalX * avoidOffset;
    const targetZ = lookSample.z + lookSample.normalZ * avoidOffset;

    const dx = targetX - bot.x;
    const dz = targetZ - bot.z;
    const desiredAngle = Math.atan2(dx, dz);

    let angleDiff = desiredAngle - bot.rotation;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

    const maxSteerRate = 3.8 * d;
    const steerChange = Math.max(
      -maxSteerRate,
      Math.min(maxSteerRate, angleDiff)
    );
    let rotation = bot.rotation + steerChange;

    const upcomingCurve = Math.max(
      Math.abs(lookSample.curvature),
      Math.abs(farLookSample.curvature)
    );
    let targetSpeed = bot.topSpeed * bot.skillFactor;
    if (upcomingCurve > 0.25) {
      targetSpeed *= 0.68;
    } else if (upcomingCurve > 0.14) {
      targetSpeed *= 0.84;
    }

    let speed = bot.speed;
    let isBraking = false;
    if (speed < targetSpeed) {
      speed += 42 * d;
    } else {
      isBraking = speed - targetSpeed > 4;
      speed -= 48 * d;
    }

    const isBoosting =
      upcomingCurve < 0.08 &&
      speed > 44 &&
      (idx === 0 || Math.sin(Date.now() * 0.002 + idx) > 0.7);
    if (isBoosting) {
      speed = Math.min(targetSpeed * 1.18, speed + 14 * d);
    }

    const vx = Math.sin(rotation) * speed;
    const vz = Math.cos(rotation) * speed;
    let nextX = bot.x + vx * d;
    let nextZ = bot.z + vz * d;

    const res = resolveTrackBorders(
      nextX,
      nextZ,
      speed,
      rotation,
      bot.nearestSampleIdx
    );
    nextX = res.x;
    nextZ = res.z;
    speed = res.speed;
    rotation = res.rotation;

    const nextGateIdx = (bot.checkpoint + 1) % TOTAL_GATES;
    const targetGate = TRACK_GATES[nextGateIdx]!;
    let checkpoint = bot.checkpoint;
    let lap = bot.lap;

    if (checkGateCrossing(prevX, prevZ, nextX, nextZ, targetGate)) {
      checkpoint = nextGateIdx;
      if (checkpoint === 0) {
        lap += 1;
      }
    }

    let adjustedSample = res.nearestIdx;
    if (lap === 1 && checkpoint === 0 && res.nearestIdx > SAMPLE_COUNT - 40) {
      adjustedSample = res.nearestIdx - SAMPLE_COUNT;
    }
    const progress = (lap - 1) * SAMPLE_COUNT + adjustedSample;

    return {
      ...bot,
      x: nextX,
      z: nextZ,
      rotation,
      speed,
      steerAngle: Math.max(-0.5, Math.min(0.5, steerChange * 12)),
      checkpoint,
      lap,
      progress,
      nearestSampleIdx: res.nearestIdx,
      isBraking,
      isBoosting,
    };
  });
}
