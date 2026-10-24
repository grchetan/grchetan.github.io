/**
 * Cyber Circuit — Advanced Vehicle Dynamics & Track Collision Math
 */

import * as THREE from "three";

export const TRACK_CONFIG = {
  width: 16,
  halfWidth: 8,
  straightLength: 46,
  curveRadius: 22,
  maxSpeedForward: 38, // ~137 km/h
  maxSpeedReverse: -14, // ~50 km/h reverse
  accelForward: 28,
  brakeRate: 36,
  reverseAccel: 16,
  nitroBoostMultiplier: 1.55,
  nitroDurationSec: 3.5,
  nitroRechargeRate: 8, // % per second
  driftGainNitroRate: 25, // % per second while drifting
  normalFriction: 0.94,
  driftFriction: 0.985,
  barrierRestitution: -0.25,
};

export interface TrackGate {
  index: number;
  label: string;
  // Center point
  x: number;
  z: number;
  // Tangent angle along forward driving direction (radians)
  forwardAngle: number;
  // Gate segment end points (from left rail to right rail)
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
    // 2: Turn 1 Apex (facing +Z, angle = 0, vx=sin(0)=0, vz=cos(0)=1)
    { x: L + R, z: 0, angle: 0, label: "Turn 1 Apex" },
    // 3: Turn 1 Exit (facing -X, angle = 3π/2, vx=sin(3π/2)=-1, vz=0)
    { x: L, z: R, angle: (3 * Math.PI) / 2, label: "Turn 1 Exit" },
    // 4: Back Straight Midpoint (facing -X)
    { x: 0, z: R, angle: (3 * Math.PI) / 2, label: "Back Straight" },
    // 5: Turn 2 Entry (facing -X)
    { x: -L, z: R, angle: (3 * Math.PI) / 2, label: "Turn 2 Entry" },
    // 6: Turn 2 Apex (facing -Z, angle = π, vx=sin(π)=0, vz=cos(π)=-1)
    { x: -L - R, z: 0, angle: Math.PI, label: "Turn 2 Apex" },
    // 7: Final Turn Exit (facing +X, angle = Math.PI / 2)
    { x: -L, z: -R, angle: Math.PI / 2, label: "Final Turn" },
  ];

  return rawPoints.map((pt, index) => {
    // Normal perpendicular to track forward direction (points across track)
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
  // Proximity pre-filter (fast rejection if far from gate center)
  const distSq = (currX - gate.x) ** 2 + (currZ - gate.z) ** 2;
  if (distSq > (TRACK_CONFIG.halfWidth + 8) ** 2) return false;

  // Vector from prev to curr car position
  const dirX = currX - prevX;
  const dirZ = currZ - prevZ;

  // Forward unit vector of the track at this gate
  const fwdX = Math.sin(gate.forwardAngle);
  const fwdZ = Math.cos(gate.forwardAngle);

  // Car must be moving generally in the forward direction of this gate
  const dot = dirX * fwdX + dirZ * fwdZ;
  if (dot < -0.05 && Math.hypot(dirX, dirZ) > 0.05) {
    // Moving backwards across gate - reject
    return false;
  }

  // Cross product sign test against the gate line segment
  const gx1 = gate.leftX;
  const gz1 = gate.leftZ;
  const gx2 = gate.rightX;
  const gz2 = gate.rightZ;

  const sidePrev = (gx2 - gx1) * (prevZ - gz1) - (gz2 - gz1) * (prevX - gx1);
  const sideCurr = (gx2 - gx1) * (currZ - gz1) - (gz2 - gz1) * (currX - gx1);

  // Crossed the gate line if sides have opposite signs
  if ((sidePrev < 0 && sideCurr >= 0) || (sidePrev >= 0 && sideCurr < 0)) {
    return true;
  }

  // Fallback: If very close to gate center, trigger as well
  return Math.hypot(currX - gate.x, currZ - gate.z) < 5.0;
}

/** Resolve car position against track outer & inner neon barriers */
export function resolveTrackBorders(
  x: number,
  z: number,
  speed: number,
  rotation: number
): { x: number; z: number; speed: number; collided: boolean; normalAngle: number } {
  const L = TRACK_CONFIG.straightLength / 2;
  const R = TRACK_CONFIG.curveRadius;
  const safeMargin = TRACK_CONFIG.halfWidth - 1.25;

  let centerlineX = 0;
  let centerlineZ = 0;
  let distToCenterline = 0;
  let outwardNormalX = 0;
  let outwardNormalZ = 0;

  if (x >= -L && x <= L) {
    // Straights
    centerlineX = x;
    centerlineZ = z >= 0 ? R : -R;
    distToCenterline = z - centerlineZ;
    outwardNormalX = 0;
    outwardNormalZ = Math.sign(distToCenterline) || 1;
  } else if (x > L) {
    // Right Loop Curve
    const dx = x - L;
    const dz = z;
    const angle = Math.atan2(dz, dx);
    centerlineX = L + Math.cos(angle) * R;
    centerlineZ = Math.sin(angle) * R;
    distToCenterline = Math.hypot(dx, dz) - R;
    outwardNormalX = Math.cos(angle);
    outwardNormalZ = Math.sin(angle);
  } else {
    // Left Loop Curve
    const dx = x + L;
    const dz = z;
    const angle = Math.atan2(dz, dx);
    centerlineX = -L + Math.cos(angle) * R;
    centerlineZ = Math.sin(angle) * R;
    distToCenterline = Math.hypot(dx, dz) - R;
    outwardNormalX = Math.cos(angle);
    outwardNormalZ = Math.sin(angle);
  }

  const absDist = Math.abs(distToCenterline);
  let collided = false;
  let resX = x;
  let resZ = z;
  let resSpeed = speed;

  if (absDist > safeMargin) {
    collided = true;
    const sign = Math.sign(distToCenterline);
    // Push car back inside with gentle safety buffer
    resX = centerlineX + outwardNormalX * (safeMargin - 0.25) * sign;
    resZ = centerlineZ + outwardNormalZ * (safeMargin - 0.25) * sign;

    // Dampen speed without locking the car
    resSpeed = speed * 0.72;
    if (Math.abs(resSpeed) < 1.0) resSpeed = 0;
  }

  const normalAngle = Math.atan2(outwardNormalX, outwardNormalZ);
  return { x: resX, z: resZ, speed: resSpeed, collided, normalAngle };
}

/** Step vehicle physics by one simulation tick (delta seconds) */
export function stepCarPhysics(
  current: CarPhysicsState,
  inputs: DriveInputs,
  delta: number
): { next: CarPhysicsState; gateCrossed: boolean; lapIncremented: boolean; barrierHit: boolean } {
  const d = Math.min(0.08, Math.max(0.005, delta));
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
    nitro = Math.max(0, nitro - d * 28);
  } else {
    nitro = Math.min(100, nitro + d * TRACK_CONFIG.nitroRechargeRate);
  }

  // --- DRIFTING & HANDBRAKE ---
  const isDrifting = Boolean(inputs.drift && Math.abs(speed) > 10);
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
    // Immediate thrust kick if holding nitro without gas
    speed += TRACK_CONFIG.accelForward * TRACK_CONFIG.nitroBoostMultiplier * 0.85 * d;
  }

  if (inputs.brake) {
    if (speed > 1.2) {
      isBraking = true;
      speed -= TRACK_CONFIG.brakeRate * d;
    } else {
      // True reverse gear acceleration
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

  // --- STEERING (CORRECT NON-INVERTED VEHICLE HANDLING) ---
  // In Three.js with right-handed coordinate system (forward = sin, cos):
  // When facing forward (+X):
  // - Turning LEFT means heading angle rotation.y INCREASES (counter-clockwise)
  // - Turning RIGHT means heading angle rotation.y DECREASES (clockwise)
  const steerInput = (inputs.left ? 1 : 0) - (inputs.right ? 1 : 0);

  // Speed-adaptive steering response: agile at low/mid speeds, stable at high speeds
  const speedRatio = Math.min(1, Math.abs(speed) / 12);
  const highSpeedStability = 1 - Math.min(0.35, (Math.abs(speed) / maxFwd) * 0.4);
  const targetSteerAngle = steerInput * 0.45 * highSpeedStability;

  steerAngle = THREE.MathUtils.lerp(steerAngle, targetSteerAngle, d * 16);

  // Turn rate: steer angle * speed responsiveness * drift bonus
  const driftBonus = isDrifting ? 1.75 : 1.0;
  const turnRate = steerAngle * 2.85 * speedRatio * driftBonus * Math.sign(speed || 1);

  // Left (+steerInput) increases rotation.y (Left turn)
  // Right (-steerInput) decreases rotation.y (Right turn)
  rotation += turnRate * d;

  // Slip angle for drift body tilt
  const driftSlipAngle = isDrifting ? steerAngle * 0.65 : 0;

  // --- POSITION TRANSLATION ---
  const forwardAngle = rotation + driftSlipAngle;
  const vx = Math.sin(forwardAngle) * speed;
  const vz = Math.cos(forwardAngle) * speed;

  let x = current.x + vx * d;
  let z = current.z + vz * d;

  // --- TRACK BORDER COLLISION ---
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

    // Completed full circuit (passed start/finish line)
    if (checkpoint === 0) {
      lap += 1;
      lapIncremented = true;
    }
  }

  // --- WRONG WAY DETECTION ---
  const activeGate = TRACK_GATES[checkpoint]!;
  let angleDiff = Math.abs(rotation - activeGate.forwardAngle);
  while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);
  const isWrongWay = angleDiff > Math.PI * 0.68 && Math.abs(speed) > 7;

  // Gear Calculation
  const kmh = Math.round(Math.abs(speed) * 3.6);
  let currentGear = "N";
  if (speed < -0.8) currentGear = "R";
  else if (kmh < 2) currentGear = "1";
  else if (kmh < 32) currentGear = "1";
  else if (kmh < 64) currentGear = "2";
  else if (kmh < 96) currentGear = "3";
  else if (kmh < 128) currentGear = "4";
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
