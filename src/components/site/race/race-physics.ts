/**
 * Cyber Circuit — Advanced Vehicle Dynamics & Track Collision Math
 * Tuned for high-speed thrills, realistic inertia, and responsive handling.
 */

import * as THREE from "three";

export const TRACK_CONFIG = {
  width: 18,
  halfWidth: 9,
  straightLength: 52,
  curveRadius: 24,
  maxSpeedForward: 50, // ~180 km/h top cruising speed
  maxSpeedReverse: -16, // ~58 km/h reverse
  accelForward: 42, // Fast, punchy response
  brakeRate: 50, // Responsive braking
  reverseAccel: 22,
  nitroBoostMultiplier: 1.5, // Takes speed to ~270 km/h!
  nitroDurationSec: 4.0,
  nitroRechargeRate: 14, // % per second
  driftGainNitroRate: 35, // Rewards drifting with nitro recharge
  normalFriction: 0.988, // Smooth high-speed glide, no sludge stop
  driftFriction: 0.982,
  barrierRestitution: -0.2,
};

export interface TrackGate {
  index: number;
  label: string;
  x: number;
  z: number;
  forwardAngle: number;
  leftX: number;
  leftZ: number;
  rightX: number;
  rightZ: number;
}

/** Pre-computed 8 Gates spanning across track from inner rail to outer rail */
export function buildTrackGates(): TrackGate[] {
  const L = TRACK_CONFIG.straightLength / 2;
  const R = TRACK_CONFIG.curveRadius;
  const W = TRACK_CONFIG.halfWidth;

  const rawPoints = [
    // 0: Start / Finish line (facing +X)
    { x: 0, z: -R, angle: Math.PI / 2, label: "Start / Finish" },
    // 1: Turn 1 Entry (facing +X)
    { x: L, z: -R, angle: Math.PI / 2, label: "Turn 1 Entry" },
    // 2: Turn 1 Apex (facing +Z)
    { x: L + R, z: 0, angle: 0, label: "Turn 1 Apex" },
    // 3: Turn 1 Exit (facing -X)
    { x: L, z: R, angle: (3 * Math.PI) / 2, label: "Turn 1 Exit" },
    // 4: Back Straight Midpoint (facing -X)
    { x: 0, z: R, angle: (3 * Math.PI) / 2, label: "Back Straight" },
    // 5: Turn 2 Entry (facing -X)
    { x: -L, z: R, angle: (3 * Math.PI) / 2, label: "Turn 2 Entry" },
    // 6: Turn 2 Apex (facing -Z)
    { x: -L - R, z: 0, angle: Math.PI, label: "Turn 2 Apex" },
    // 7: Final Turn Exit (facing +X)
    { x: -L, z: -R, angle: Math.PI / 2, label: "Final Turn" },
  ];

  return rawPoints.map((pt, index) => {
    const normAngle = pt.angle + Math.PI / 2;
    const nx = Math.sin(normAngle);
    const nz = Math.cos(normAngle);

    return {
      index,
      label: pt.label,
      x: pt.x,
      z: pt.z,
      forwardAngle: pt.angle,
      leftX: pt.x - nx * W,
      leftZ: pt.z - nz * W,
      rightX: pt.x + nx * W,
      rightZ: pt.z + nz * W,
    };
  });
}

export const TRACK_GATES = buildTrackGates();
export const TOTAL_GATES = TRACK_GATES.length;

export interface CarPhysicsState {
  x: number;
  z: number;
  rotation: number;
  speed: number;
  steerAngle: number;
  isDrifting: boolean;
  isBoosting: boolean;
  isBraking: boolean;
  isReversing: boolean;
  driftSlipAngle: number;
  driftScore: number;
  nitroPercent: number;
  currentGear: string;
  kmh: number;
  checkpoint: number;
  lap: number;
  isWrongWay: boolean;
}

export interface DriveInputs {
  gas: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  drift: boolean;
  nitro: boolean;
}

/** Check if car moved across the infinite or bounded line segment of gate */
export function checkGateCrossing(
  prevX: number,
  prevZ: number,
  currX: number,
  currZ: number,
  gate: TrackGate
): boolean {
  const distSq = (currX - gate.x) ** 2 + (currZ - gate.z) ** 2;
  if (distSq > (TRACK_CONFIG.halfWidth + 10) ** 2) return false;

  const dirX = currX - prevX;
  const dirZ = currZ - prevZ;

  const fwdX = Math.sin(gate.forwardAngle);
  const fwdZ = Math.cos(gate.forwardAngle);

  const dot = dirX * fwdX + dirZ * fwdZ;
  if (dot < -0.05 && Math.hypot(dirX, dirZ) > 0.05) {
    return false;
  }

  const gx1 = gate.leftX;
  const gz1 = gate.leftZ;
  const gx2 = gate.rightX;
  const gz2 = gate.rightZ;

  const sidePrev = (gx2 - gx1) * (prevZ - gz1) - (gz2 - gz1) * (prevX - gx1);
  const sideCurr = (gx2 - gx1) * (currZ - gz1) - (gz2 - gz1) * (currX - gx1);

  if ((sidePrev < 0 && sideCurr >= 0) || (sidePrev >= 0 && sideCurr < 0)) {
    return true;
  }

  return Math.hypot(currX - gate.x, currZ - gate.z) < 5.5;
}

/** Robust, glitch-free track border barrier collision */
export function resolveTrackBorders(
  x: number,
  z: number,
  speed: number,
  rotation: number
): { x: number; z: number; speed: number; collided: boolean; normalAngle: number } {
  const L = TRACK_CONFIG.straightLength / 2;
  const R = TRACK_CONFIG.curveRadius;
  const safeMargin = TRACK_CONFIG.halfWidth - 1.4;

  let collided = false;
  let resX = x;
  let resZ = z;
  let resSpeed = speed;
  let normalAngle = 0;

  if (x >= -L && x <= L) {
    // Straights: centerline is at z = -R (top) or z = R (bottom)
    const centerlineZ = z >= 0 ? R : -R;
    const distToCenterline = z - centerlineZ;

    if (Math.abs(distToCenterline) > safeMargin) {
      collided = true;
      const pushSign = Math.sign(distToCenterline) || 1;
      resZ = centerlineZ + pushSign * (safeMargin - 0.2);
      resSpeed = speed * 0.8;
      normalAngle = pushSign > 0 ? -Math.PI / 2 : Math.PI / 2;
    }
  } else if (x > L) {
    // Turn 1 (Right loop curve centered at (L, 0))
    const dx = x - L;
    const dz = z;
    const currentRadius = Math.hypot(dx, dz);
    const distFromTrackCenter = currentRadius - R;

    if (Math.abs(distFromTrackCenter) > safeMargin) {
      collided = true;
      const angle = Math.atan2(dz, dx);
      const pushSign = Math.sign(distFromTrackCenter) || 1;
      const clampedRadius = R + pushSign * (safeMargin - 0.2);
      resX = L + Math.cos(angle) * clampedRadius;
      resZ = Math.sin(angle) * clampedRadius;
      resSpeed = speed * 0.8;
      normalAngle = angle;
    }
  } else {
    // Turn 2 (Left loop curve centered at (-L, 0))
    const dx = x + L;
    const dz = z;
    const currentRadius = Math.hypot(dx, dz);
    const distFromTrackCenter = currentRadius - R;

    if (Math.abs(distFromTrackCenter) > safeMargin) {
      collided = true;
      const angle = Math.atan2(dz, dx);
      const pushSign = Math.sign(distFromTrackCenter) || 1;
      const clampedRadius = R + pushSign * (safeMargin - 0.2);
      resX = -L + Math.cos(angle) * clampedRadius;
      resZ = Math.sin(angle) * clampedRadius;
      resSpeed = speed * 0.8;
      normalAngle = angle;
    }
  }

  if (collided && Math.abs(resSpeed) < 1.0) {
    resSpeed = 0;
  }

  return { x: resX, z: resZ, speed: resSpeed, collided, normalAngle };
}

/** Step vehicle physics by one simulation tick (delta seconds) */
export function stepCarPhysics(
  current: CarPhysicsState,
  inputs: DriveInputs,
  delta: number
): { next: CarPhysicsState; gateCrossed: boolean; lapIncremented: boolean; barrierHit: boolean } {
  const d = Math.min(0.06, Math.max(0.005, delta));
  const prevX = current.x;
  const prevZ = current.z;

  let speed = current.speed;
  let rotation = current.rotation;
  let steerAngle = current.steerAngle;
  let nitro = current.nitroPercent;
  let driftScore = current.driftScore;

  // --- NITRO MANAGEMENT ---
  let isBoosting = false;
  if (inputs.nitro && nitro > 0) {
    isBoosting = true;
    nitro = Math.max(0, nitro - d * 22);
  } else {
    nitro = Math.min(100, nitro + d * TRACK_CONFIG.nitroRechargeRate);
  }

  // --- DRIFTING & HANDBRAKE ---
  const isDrifting = Boolean(inputs.drift && Math.abs(speed) > 12);
  if (isDrifting) {
    nitro = Math.min(100, nitro + d * TRACK_CONFIG.driftGainNitroRate);
    driftScore += Math.round(Math.abs(speed) * 4 * d);
  }

  // --- ACCELERATION / BRAKING / REVERSE ---
  let isBraking = false;
  let isReversing = false;

  if (inputs.gas) {
    const boostMult = isBoosting ? TRACK_CONFIG.nitroBoostMultiplier : 1.0;
    speed += TRACK_CONFIG.accelForward * boostMult * d;
  } else if (isBoosting) {
    // Instant rocket thrust kick when pressing nitro
    speed += TRACK_CONFIG.accelForward * TRACK_CONFIG.nitroBoostMultiplier * 1.1 * d;
  }

  if (inputs.brake) {
    if (speed > 1.2) {
      isBraking = true;
      speed -= TRACK_CONFIG.brakeRate * d;
    } else {
      isReversing = true;
      speed -= TRACK_CONFIG.reverseAccel * d;
    }
  }

  // Natural rolling resistance and aerodynamic drag
  const friction = isDrifting ? TRACK_CONFIG.driftFriction : TRACK_CONFIG.normalFriction;
  speed *= Math.pow(friction, d * 60);

  // Absolute speed clamps
  const maxFwd = isBoosting
    ? TRACK_CONFIG.maxSpeedForward * TRACK_CONFIG.nitroBoostMultiplier
    : TRACK_CONFIG.maxSpeedForward;
  speed = Math.max(TRACK_CONFIG.maxSpeedReverse, Math.min(speed, maxFwd));

  // --- STEERING (CORRECT NON-INVERTED INTUITIVE VEHICLE HANDLING) ---
  // Pressing LEFT: steerInput = -1 -> wheel points left -> car turns LEFT
  // Pressing RIGHT: steerInput = +1 -> wheel points right -> car turns RIGHT
  const steerInput = (inputs.right ? 1 : 0) - (inputs.left ? 1 : 0);

  const speedRatio = Math.min(1, Math.abs(speed) / 7.5);
  const highSpeedStability = 1 - Math.min(0.25, (Math.abs(speed) / maxFwd) * 0.3);
  const targetSteerAngle = steerInput * 0.48 * highSpeedStability;

  steerAngle = THREE.MathUtils.lerp(steerAngle, targetSteerAngle, d * 18);

  // Negative steerAngle turns Left (+rotation), Positive steerAngle turns Right (-rotation)
  const driftBonus = isDrifting ? 1.65 : 1.0;
  const turnRate = -steerAngle * 2.85 * speedRatio * driftBonus * Math.sign(speed || 1);

  rotation += turnRate * d;

  // Drift body tilt angle
  const driftSlipAngle = isDrifting ? -steerAngle * 0.6 : 0;

  // --- POSITION TRANSLATION ---
  const forwardAngle = rotation + driftSlipAngle;
  const vx = Math.sin(forwardAngle) * speed;
  const vz = Math.cos(forwardAngle) * speed;

  let x = current.x + vx * d;
  let z = current.z + vz * d;

  // --- TRACK BORDER BARRIER COLLISION ---
  const borderRes = resolveTrackBorders(x, z, speed, rotation);
  x = borderRes.x;
  z = borderRes.z;
  speed = borderRes.speed;
  const barrierHit = borderRes.collided;

  // --- CHECKPOINT / GATE PASSING ---
  const nextGateIdx = (current.checkpoint + 1) % TOTAL_GATES;
  const targetGate = TRACK_GATES[nextGateIdx]!;
  let gateCrossed = false;
  let lapIncremented = false;
  let checkpoint = current.checkpoint;
  let lap = current.lap;

  if (checkGateCrossing(prevX, prevZ, x, z, targetGate)) {
    checkpoint = nextGateIdx;
    gateCrossed = true;

    if (checkpoint === 0) {
      lap += 1;
      lapIncremented = true;
    }
  }

  // --- WRONG WAY DETECTION ---
  const activeGate = TRACK_GATES[checkpoint]!;
  let angleDiff = Math.abs(rotation - activeGate.forwardAngle);
  while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);
  const isWrongWay = angleDiff > Math.PI * 0.72 && Math.abs(speed) > 10;

  // Dynamic Gear Calculation
  const kmh = Math.round(Math.abs(speed) * 3.6);
  let currentGear = "N";
  if (speed < -0.8) currentGear = "R";
  else if (kmh < 2) currentGear = "1";
  else if (kmh < 40) currentGear = "1";
  else if (kmh < 80) currentGear = "2";
  else if (kmh < 120) currentGear = "3";
  else if (kmh < 170) currentGear = "4";
  else currentGear = "5";

  const nextState: CarPhysicsState = {
    x,
    z,
    rotation,
    speed,
    steerAngle,
    isDrifting,
    isBoosting,
    isBraking,
    isReversing,
    driftSlipAngle,
    driftScore,
    nitroPercent: Math.round(nitro),
    currentGear,
    kmh,
    checkpoint,
    lap,
    isWrongWay,
  };

  return { next: nextState, gateCrossed, lapIncremented, barrierHit };
}
