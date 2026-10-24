/**
 * Cyber Circuit — Intelligent Autonomous Racing AI Rivals
 */

import { TRACK_CONFIG, TRACK_GATES, TOTAL_GATES, resolveTrackBorders } from "./race-physics";
import * as THREE from "three";

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
  targetOffset: number; // racing line preference (-3 to +3 across track)
  skillFactor: number; // 0.85 to 1.15
  topSpeed: number;
}

export const AI_BOT_PROFILES = [
  {
    name: "Apex Phantom",
    color: "#f59e0b", // Amber gold
    skillFactor: 1.05,
    topSpeed: 34,
    offset: -1.8,
  },
  {
    name: "Neon Drift",
    color: "#ec4899", // Cyber Magenta
    skillFactor: 0.98,
    topSpeed: 32,
    offset: 2.2,
  },
  {
    name: "Viper Shadow",
    color: "#10b981", // Emerald Neon
    skillFactor: 0.92,
    topSpeed: 30,
    offset: 0.5,
  },
];

export function createAIRivals(): AIRival[] {
  const L = TRACK_CONFIG.straightLength / 2;
  const R = TRACK_CONFIG.curveRadius;

  return AI_BOT_PROFILES.map((bot, idx) => {
    // Stagger starting grid positions behind player
    const gridSpacing = 6.5;
    const startX = -4 - (idx + 1) * gridSpacing;
    const startZ = -R + bot.offset;

    return {
      id: `ai-bot-${idx + 1}`,
      name: bot.name,
      color: bot.color,
      x: startX,
      z: startZ,
      rotation: Math.PI / 2, // Facing forward (+X)
      speed: 0,
      steerAngle: 0,
      checkpoint: 0,
      lap: 1,
      targetOffset: bot.offset,
      skillFactor: bot.skillFactor,
      topSpeed: bot.topSpeed,
    };
  });
}

/** Step all AI bots forward along the circuit waypoint spline */
export function updateAIRivals(
  bots: AIRival[],
  delta: number,
  playerX: number,
  playerZ: number
): AIRival[] {
  const d = Math.min(0.08, Math.max(0.005, delta));

  return bots.map((bot) => {
    // Current target checkpoint
    const targetIdx = (bot.checkpoint + 1) % TOTAL_GATES;
    const targetGate = TRACK_GATES[targetIdx]!;

    // Offset waypoint along the gate normal for race line variation
    const normAngle = targetGate.forwardAngle + Math.PI / 2;
    const targetX = targetGate.x + Math.sin(normAngle) * bot.targetOffset;
    const targetZ = targetGate.z + Math.cos(normAngle) * bot.targetOffset;

    // Distance and angle to target
    const dx = targetX - bot.x;
    const dz = targetZ - bot.z;
    const distToTarget = Math.hypot(dx, dz);

    // Desired heading angle
    const desiredAngle = Math.atan2(dx, dz);

    // Calculate shortest angle delta
    let angleDiff = desiredAngle - bot.rotation;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

    // Steering toward target
    const maxSteerSpeed = 3.2 * d;
    const steerChange = Math.max(-maxSteerSpeed, Math.min(maxSteerSpeed, angleDiff));
    const rotation = bot.rotation + steerChange;

    // Throttle / Brake control based on corner sharpness
    const turnSharpness = Math.abs(angleDiff);
    let targetSpeed = bot.topSpeed * bot.skillFactor;

    if (turnSharpness > 0.4) {
      // Brake into turn
      targetSpeed *= 0.65;
    }

    // Car avoidance: check distance to player
    const distToPlayer = Math.hypot(playerX - bot.x, playerZ - bot.z);
    if (distToPlayer < 3.8) {
      // Slow slightly to prevent hard clipping
      targetSpeed *= 0.85;
    }

    // Accelerate or decelerate toward target speed
    let speed = bot.speed;
    if (speed < targetSpeed) {
      speed += 22 * d;
    } else {
      speed -= 26 * d;
    }

    // Translate AI position
    const vx = Math.sin(rotation) * speed;
    const vz = Math.cos(rotation) * speed;
    let x = bot.x + vx * d;
    let z = bot.z + vz * d;

    // Boundary resolution
    const borderRes = resolveTrackBorders(x, z, speed, rotation);
    x = borderRes.x;
    z = borderRes.z;
    speed = borderRes.speed;

    // Checkpoint passage
    let checkpoint = bot.checkpoint;
    let lap = bot.lap;
    if (distToTarget < 9.5) {
      checkpoint = targetIdx;
      if (checkpoint === 0) {
        lap += 1;
      }
    }

    return {
      ...bot,
      x,
      z,
      rotation,
      speed,
      steerAngle: steerChange * 4,
      checkpoint,
      lap,
    };
  });
}
