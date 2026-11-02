/**
 * Cyber Circuit — Next-Gen Vehicle Dynamics & Grand Prix Circuit Math
 * Features:
 * - Professional 732-meter Grand Prix Circuit with winding S-curves, chicanes, hairpins & straights
 * - 240-point Catmull-Rom spline centerline with seamless boundary resolution
 * - High-grip progressive steering with sharp apex turn-in & trail braking
 * - High-speed momentum glide (friction 0.991) and explosive nitro boost (~285 km/h)
 * - Ultra-responsive low-speed steering & wall-slide recovery (easy for anyone to drive!)
 */

import * as THREE from "three";

export const TRACK_CONFIG = {
  width: 22,
  halfWidth: 11,
  circuitLengthMeters: 732,
  maxSpeedForward: 52, // ~187 km/h top cruising speed
  maxSpeedReverse: -18, // ~65 km/h reverse
  accelForward: 46, // Explosive throttle response
  brakeRate: 58, // High-performance racing brakes
  reverseAccel: 26,
  nitroBoostMultiplier: 1.54, // ~288 km/h with nitro!
  nitroDurationSec: 4.5,
  nitroRechargeRate: 16, // % per second
  driftGainNitroRate: 42, // High reward for powersliding
  normalFriction: 0.991, // Ultra-smooth supercar momentum glide
  driftFriction: 0.985,
  barrierRestitution: -0.15,
};

/** 15 Master Control Waypoints for the Professional 732m Grand Prix Circuit */
export const CIRCUIT_WAYPOINTS = [
  new THREE.Vector3(0, 0, -85), // 0: Start / Finish Line (Main Straight)
  new THREE.Vector3(60, 0, -85), // 1: Pit Straight End & Speed Trap
  new THREE.Vector3(110, 0, -75), // 2: Turn 1 Entry Sweeper
  new THREE.Vector3(135, 0, -40), // 3: Turn 2 Apex (High speed sweeper)
  new THREE.Vector3(120, 0, 0), // 4: Turn 2 Exit
  new THREE.Vector3(80, 0, 20), // 5: The Esses Chicane (Left Flick)
  new THREE.Vector3(45, 0, -5), // 6: The Esses Chicane (Right Flick)
  new THREE.Vector3(10, 0, 25), // 7: Infield Carousel Winding Curve
  new THREE.Vector3(-30, 0, 55), // 8: Back Straight Entry
  new THREE.Vector3(-80, 0, 55), // 9: Back Straight DRS Zone
  new THREE.Vector3(-130, 0, 45), // 10: Hairpin Braking Zone
  new THREE.Vector3(-155, 0, 15), // 11: Hairpin Apex (180° Technical Corner)
  new THREE.Vector3(-140, 0, -25), // 12: Hairpin Exit
  new THREE.Vector3(-105, 0, -60), // 13: Ascari Fast Sweeper
  new THREE.Vector3(-55, 0, -82), // 14: Final Turn onto Pit Straight
];

export const SPLINE_CURVE = new THREE.CatmullRomCurve3(CIRCUIT_WAYPOINTS, true, "centripetal", 0.5);

export const SAMPLE_COUNT = 240;

export interface SplinePoint {
  index: number;
  x: number;
  z: number;
  tangentX: number;
  tangentZ: number;
  normalX: number;
  normalZ: number;
  headingAngle: number;
}

/** Pre-computed equidistant sampled points along circuit centerline */
export function buildCircuitSamples(): SplinePoint[] {
  const points = SPLINE_CURVE.getSpacedPoints(SAMPLE_COUNT);
  const result: SplinePoint[] = [];

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const p = points[i]!;
    const prev = points[(i - 1 + SAMPLE_COUNT) % SAMPLE_COUNT]!;
    const next = points[(i + 1) % SAMPLE_COUNT]!;

    const tx = next.x - prev.x;
    const tz = next.z - prev.z;
    const tLen = Math.hypot(tx, tz) || 1;
    const tangentX = tx / tLen;
    const tangentZ = tz / tLen;

    // Normal points 90 degrees to the right of travel
    const normalX = -tangentZ;
    const normalZ = tangentX;
    const headingAngle = Math.atan2(tangentX, tangentZ);

    result.push({
      index: i,
      x: p.x,
      z: p.z,
      tangentX,
      tangentZ,
      normalX,
      normalZ,
      headingAngle,
    });
  }

  return result;
}

export const CIRCUIT_SAMPLES = buildCircuitSamples();

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

/** 12 Sector Checkpoint Gates distributed around the 732m circuit */
export function buildTrackGates(): TrackGate[] {
  const gateIndices = [
    { sampleIdx: 0, label: "Start / Finish" },
    { sampleIdx: 20, label: "Pit Straight" },
    { sampleIdx: 42, label: "Turn 1 Sweeper" },
    { sampleIdx: 64, label: "Turn 2 Exit" },
    { sampleIdx: 82, label: "The Esses (Left)" },
    { sampleIdx: 100, label: "The Esses (Right)" },
    { sampleIdx: 118, label: "Infield Carousel" },
    { sampleIdx: 142, label: "Back Straight DRS" },
    { sampleIdx: 165, label: "Hairpin Entry" },
    { sampleIdx: 184, label: "Hairpin Apex" },
    { sampleIdx: 205, label: "Ascari Sweeper" },
    { sampleIdx: 226, label: "Final Turn" },
  ];

  const W = TRACK_CONFIG.halfWidth;

  return gateIndices.map((g, index) => {
    const sp = CIRCUIT_SAMPLES[g.sampleIdx]!;
    const nx = sp.normalX;
    const nz = sp.normalZ;

    return {
      index,
      label: g.label,
      x: sp.x,
      z: sp.z,
      forwardAngle: sp.headingAngle,
      leftX: sp.x - nx * W,
      leftZ: sp.z - nz * W,
      rightX: sp.x + nx * W,
      rightZ: sp.z + nz * W,
    };
  });
}

export const TRACK_GATES = buildTrackGates();
export const TOTAL_GATES = TRACK_GATES.length;

export const START_GRID_POS = {
  x: 0,
  z: -85,
  rotation: Math.PI / 2, // Facing East (+X) along Main Straight
};

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
  nearestSampleIdx?: number;
}

export interface DriveInputs {
  gas: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  drift: boolean;
  nitro: boolean;
}

/** Check if car moved across the gate line */
export function checkGateCrossing(
  prevX: number,
  prevZ: number,
  currX: number,
  currZ: number,
  gate: TrackGate
): boolean {
  const distSq = (currX - gate.x) ** 2 + (currZ - gate.z) ** 2;
  if (distSq > (TRACK_CONFIG.halfWidth + 14) ** 2) return false;

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

  return Math.hypot(currX - gate.x, currZ - gate.z) < 7.5;
}

/** Find closest point on spline centerline */
export function findNearestSplinePoint(x: number, z: number, hintIdx?: number): SplinePoint {
  let bestIdx = hintIdx ?? 0;
  let minDistSq = Infinity;

  // Search local window if hint provided, else full search
  if (hintIdx !== undefined && hintIdx >= 0) {
    const range = 24;
    for (let offset = -range; offset <= range; offset++) {
      const idx = (hintIdx + offset + SAMPLE_COUNT) % SAMPLE_COUNT;
      const sp = CIRCUIT_SAMPLES[idx]!;
      const dSq = (x - sp.x) ** 2 + (z - sp.z) ** 2;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        bestIdx = idx;
      }
    }
  } else {
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const sp = CIRCUIT_SAMPLES[i]!;
      const dSq = (x - sp.x) ** 2 + (z - sp.z) ** 2;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        bestIdx = i;
      }
    }
  }

  return CIRCUIT_SAMPLES[bestIdx]!;
}

/** Robust, glitch-free track border barrier collision for the 732m circuit */
export function resolveTrackBorders(
  x: number,
  z: number,
  speed: number,
  rotation: number,
  hintIdx?: number
): { x: number; z: number; speed: number; collided: boolean; normalAngle: number; nearestIdx: number } {
  const safeMargin = TRACK_CONFIG.halfWidth - 1.6; // 9.4m from centerline
  const nearest = findNearestSplinePoint(x, z, hintIdx);

  const dx = x - nearest.x;
  const dz = z - nearest.z;
  const dist = Math.hypot(dx, dz);

  let collided = false;
  let resX = x;
  let resZ = z;
  let resSpeed = speed;
  let normalAngle = 0;

  if (dist > safeMargin) {
    collided = true;
    const nx = dx / (dist || 1);
    const nz = dz / (dist || 1);

    // Clamp inside boundary with smooth buffer
    resX = nearest.x + nx * (safeMargin - 0.2);
    resZ = nearest.z + nz * (safeMargin - 0.2);

    // Wall slide: preserve forward momentum along track tangent so beginners don't get stuck!
    const forwardSpeed = Math.abs(speed);
    resSpeed = forwardSpeed * 0.88 * Math.sign(speed || 1);
    normalAngle = Math.atan2(nx, nz);
  }

  if (collided && Math.abs(resSpeed) < 1.0) {
    resSpeed = 0;
  }

  return { x: resX, z: resZ, speed: resSpeed, collided, normalAngle, nearestIdx: nearest.index };
}

/** Step vehicle physics by one simulation tick */
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

  // --- DRIFTING & POWERSLIDING ---
  const isDrifting = Boolean(inputs.drift && Math.abs(speed) > 10);
  if (isDrifting) {
    nitro = Math.min(100, nitro + d * TRACK_CONFIG.driftGainNitroRate);
    driftScore += Math.round(Math.abs(speed) * 5 * d);
  }

  // --- ACCELERATION / BRAKING / REVERSE ---
  let isBraking = false;
  let isReversing = false;

  if (inputs.gas) {
    const boostMult = isBoosting ? TRACK_CONFIG.nitroBoostMultiplier : 1.0;
    speed += TRACK_CONFIG.accelForward * boostMult * d;
  } else if (isBoosting) {
    speed += TRACK_CONFIG.accelForward * TRACK_CONFIG.nitroBoostMultiplier * 1.15 * d;
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

  // Supercar momentum rolling resistance
  const friction = isDrifting ? TRACK_CONFIG.driftFriction : TRACK_CONFIG.normalFriction;
  speed *= Math.pow(friction, d * 60);

  // Absolute speed clamps
  const maxFwd = isBoosting
    ? TRACK_CONFIG.maxSpeedForward * TRACK_CONFIG.nitroBoostMultiplier
    : TRACK_CONFIG.maxSpeedForward;
  speed = Math.max(TRACK_CONFIG.maxSpeedReverse, Math.min(speed, maxFwd));

  // --- PROGRESSIVE RACING STEERING (EASY FOR ANYONE!) ---
  const steerInput = (inputs.right ? 1 : 0) - (inputs.left ? 1 : 0);

  // Responsive steering: enhanced low-speed turning authority so cars never feel stuck
  const speedRatio = Math.max(0.45, Math.min(1.2, Math.abs(speed) / 5.5));
  const targetSteerAngle = steerInput * 0.58;

  steerAngle = THREE.MathUtils.lerp(steerAngle, targetSteerAngle, d * 22);

  // Cornering rate: agile apex turn-in, trail-braking bonus & power-drift bonus
  const brakingTurnBonus = isBraking ? 1.3 : 1.0;
  const driftBonus = isDrifting ? 1.88 : 1.0;
  const turnRate = -steerAngle * (3.3 + Math.abs(speed) * 0.016) * speedRatio * driftBonus * brakingTurnBonus * Math.sign(speed || 1);

  rotation += turnRate * d;

  // Drift slip angle for realistic car body rotation during powerslide
  const driftSlipAngle = isDrifting ? -steerAngle * 0.65 : 0;

  // --- POSITION TRANSLATION ---
  const forwardAngle = rotation + driftSlipAngle;
  const vx = Math.sin(forwardAngle) * speed;
  const vz = Math.cos(forwardAngle) * speed;

  let x = current.x + vx * d;
  let z = current.z + vz * d;

  // --- TRACK BORDER BARRIER COLLISION ---
  const borderRes = resolveTrackBorders(x, z, speed, rotation, current.nearestSampleIdx);
  x = borderRes.x;
  z = borderRes.z;
  speed = borderRes.speed;
  const barrierHit = borderRes.collided;
  const nearestSampleIdx = borderRes.nearestIdx;

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
  const nearestSample = CIRCUIT_SAMPLES[nearestSampleIdx]!;
  let angleDiff = Math.abs(rotation - nearestSample.headingAngle);
  while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);
  const isWrongWay = angleDiff > Math.PI * 0.72 && Math.abs(speed) > 12;

  // Dynamic Gear Calculation
  const kmh = Math.round(Math.abs(speed) * 3.6);
  let currentGear = "N";
  if (speed < -0.8) currentGear = "R";
  else if (kmh < 2) currentGear = "1";
  else if (kmh < 45) currentGear = "1";
  else if (kmh < 95) currentGear = "2";
  else if (kmh < 145) currentGear = "3";
  else if (kmh < 195) currentGear = "4";
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
    nearestSampleIdx,
  };

  return { next: nextState, gateCrossed, lapIncremented, barrierHit };
}
