/**
 * Horizon Grand Prix — Vehicle Dynamics & 1,920m International Circuit Math
 * Tuned for crisp, controllable high-speed racing:
 * - Balanced top cruising speed (~180 km/h) and Nitro Overdrive (~223 km/h)
 * - Nitro Boost Tank with 30% minimum recharge cooldown lock (prevents uncontrollable spam)
 * - Speed-sensitive progressive steering stability
 */

import * as THREE from "three";

export const TRACK_CONFIG = {
  width: 26,
  halfWidth: 13,
  circuitLengthMeters: 1920,
  maxSpeedForward: 50, // ~180 km/h crisp controllable cruising speed
  maxSpeedReverse: -18, // ~65 km/h reverse
  accelForward: 44,
  brakeRate: 64,
  reverseAccel: 26,
  nitroBoostMultiplier: 1.24, // ~223 km/h max boost speed (fast & controllable!)
  nitroDrainRate: 32, // % per second (~3.1s continuous boost per full tank)
  nitroRechargeRate: 9, // % per second passive recharge
  nitroMinThreshold: 30, // Must recharge to 30% after depletion before boosting again
  driftGainNitroRate: 24, // % per second bonus while drifting
  normalFriction: 0.991,
  driftFriction: 0.985,
};

/** 20 Master Control Waypoints for the 1,920m Horizon Grand Prix Circuit */
export const CIRCUIT_WAYPOINTS = [
  new THREE.Vector3(0, 0, -190),
  new THREE.Vector3(105, 0, -190),
  new THREE.Vector3(205, 0, -190),
  new THREE.Vector3(280, 0, -162),
  new THREE.Vector3(310, 0, -85),
  new THREE.Vector3(265, 0, -10),
  new THREE.Vector3(175, 0, 15),
  new THREE.Vector3(120, 0, 82),
  new THREE.Vector3(205, 0, 145),
  new THREE.Vector3(175, 0, 215),
  new THREE.Vector3(55, 0, 228),
  new THREE.Vector3(-75, 0, 220),
  new THREE.Vector3(-190, 0, 195),
  new THREE.Vector3(-268, 0, 125),
  new THREE.Vector3(-265, 0, 30),
  new THREE.Vector3(-180, 0, -15),
  new THREE.Vector3(-115, 0, -72),
  new THREE.Vector3(-185, 0, -135),
  new THREE.Vector3(-165, 0, -186),
  new THREE.Vector3(-85, 0, -190),
];

export const SPLINE_CURVE = new THREE.CatmullRomCurve3(
  CIRCUIT_WAYPOINTS,
  true,
  "centripetal",
  0.5
);

export const SAMPLE_COUNT = 360;

export interface SplinePoint {
  index: number;
  x: number;
  z: number;
  tangentX: number;
  tangentZ: number;
  normalX: number;
  normalZ: number;
  headingAngle: number;
  curvature: number;
  isCorner: boolean;
}

export function buildCircuitSamples(): SplinePoint[] {
  const points = SPLINE_CURVE.getSpacedPoints(SAMPLE_COUNT);
  const raw: {
    x: number;
    z: number;
    tangentX: number;
    tangentZ: number;
    normalX: number;
    normalZ: number;
    headingAngle: number;
  }[] = [];

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const p = points[i]!;
    const prev = points[(i - 1 + SAMPLE_COUNT) % SAMPLE_COUNT]!;
    const next = points[(i + 1) % SAMPLE_COUNT]!;

    const tx = next.x - prev.x;
    const tz = next.z - prev.z;
    const tLen = Math.hypot(tx, tz) || 1;
    const tangentX = tx / tLen;
    const tangentZ = tz / tLen;

    const normalX = -tangentZ;
    const normalZ = tangentX;
    const headingAngle = Math.atan2(tangentX, tangentZ);

    raw.push({
      x: p.x,
      z: p.z,
      tangentX,
      tangentZ,
      normalX,
      normalZ,
      headingAngle,
    });
  }

  return raw.map((sp, i) => {
    const prev = raw[(i - 3 + SAMPLE_COUNT) % SAMPLE_COUNT]!;
    const next = raw[(i + 3) % SAMPLE_COUNT]!;
    let dAngle = next.headingAngle - prev.headingAngle;
    while (dAngle > Math.PI) dAngle -= Math.PI * 2;
    while (dAngle < -Math.PI) dAngle += Math.PI * 2;
    const curvature = dAngle;
    return {
      index: i,
      ...sp,
      curvature,
      isCorner: Math.abs(curvature) > 0.14,
    };
  });
}

export const CIRCUIT_SAMPLES = buildCircuitSamples();

export interface TrackGate {
  index: number;
  sampleIdx: number;
  label: string;
  x: number;
  z: number;
  forwardAngle: number;
  leftX: number;
  leftZ: number;
  rightX: number;
  rightZ: number;
}

export function buildTrackGates(): TrackGate[] {
  const gateDefs = [
    { sampleIdx: 0, label: "Start / Finish" },
    { sampleIdx: 25, label: "Pit Straight DRS" },
    { sampleIdx: 52, label: "Turn 1 Apex" },
    { sampleIdx: 76, label: "Turn 2 Exit" },
    { sampleIdx: 102, label: "The Esses Entry" },
    { sampleIdx: 126, label: "Chicane Apex" },
    { sampleIdx: 154, label: "South Straight" },
    { sampleIdx: 180, label: "DRS Boulevard" },
    { sampleIdx: 208, label: "Hairpin Braking" },
    { sampleIdx: 234, label: "Sunset Hairpin" },
    { sampleIdx: 260, label: "Infield Sweep" },
    { sampleIdx: 286, label: "Technical Bend" },
    { sampleIdx: 312, label: "Parabolica" },
    { sampleIdx: 338, label: "Final Corner" },
  ];

  const W = TRACK_CONFIG.halfWidth + 2.5;

  return gateDefs.map((g, index) => {
    const sp = CIRCUIT_SAMPLES[g.sampleIdx]!;
    const nx = sp.normalX;
    const nz = sp.normalZ;

    return {
      index,
      sampleIdx: g.sampleIdx,
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

export interface BoostPad {
  x: number;
  z: number;
  angle: number;
}

export const BOOST_PADS: BoostPad[] = [18, 176, 336].map((idx) => {
  const sp = CIRCUIT_SAMPLES[idx % SAMPLE_COUNT]!;
  return { x: sp.x, z: sp.z, angle: sp.headingAngle };
});

export const START_GRID_POS = {
  x: -8,
  z: -190,
  rotation: Math.PI / 2,
};

export function getStartingGridPos(slotIndex: number): {
  x: number;
  z: number;
  rotation: number;
} {
  const row = Math.floor(slotIndex / 2);
  const col = slotIndex % 2;
  const distBehind = 8 + row * 9.5 + col * 3.2;
  const lateral = col === 0 ? -4.2 : 4.2;
  const idx =
    (SAMPLE_COUNT - Math.round(distBehind / 5.3) + SAMPLE_COUNT) % SAMPLE_COUNT;
  const sp = CIRCUIT_SAMPLES[idx]!;
  return {
    x: sp.x + sp.normalX * lateral,
    z: sp.z + sp.normalZ * lateral,
    rotation: sp.headingAngle,
  };
}

export interface CarPhysicsState {
  x: number;
  z: number;
  rotation: number;
  speed: number;
  steerAngle: number;
  isDrifting: boolean;
  isBoosting: boolean;
  isBoostCooldown: boolean;
  isBraking: boolean;
  isReversing: boolean;
  isOnKerb: boolean;
  driftSlipAngle: number;
  driftScore: number;
  nitroPercent: number;
  currentGear: string;
  kmh: number;
  checkpoint: number;
  lap: number;
  progress: number;
  isWrongWay: boolean;
  nearestSampleIdx: number;
}

export interface DriveInputs {
  gas: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  steerValue?: number | undefined;
  drift: boolean;
  nitro: boolean;
}

export function checkGateCrossing(
  prevX: number,
  prevZ: number,
  currX: number,
  currZ: number,
  gate: TrackGate
): boolean {
  const distSq = (currX - gate.x) ** 2 + (currZ - gate.z) ** 2;
  if (distSq > (TRACK_CONFIG.halfWidth + 16) ** 2) return false;

  const dirX = currX - prevX;
  const dirZ = currZ - prevZ;
  const fwdX = Math.sin(gate.forwardAngle);
  const fwdZ = Math.cos(gate.forwardAngle);

  const dot = dirX * fwdX + dirZ * fwdZ;
  if (dot < -0.1 && Math.hypot(dirX, dirZ) > 0.05) {
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

  const alongGate = (currX - gate.x) * fwdX + (currZ - gate.z) * fwdZ;
  const acrossGate = Math.abs(
    (currX - gate.x) * -fwdZ + (currZ - gate.z) * fwdX
  );
  return Math.abs(alongGate) < 4.5 && acrossGate <= TRACK_CONFIG.halfWidth + 1.5;
}

export function findNearestSplinePoint(
  x: number,
  z: number,
  hintIdx?: number
): SplinePoint {
  let bestIdx = hintIdx ?? 0;
  let minDistSq = Infinity;

  if (hintIdx !== undefined && hintIdx >= 0) {
    const range = 28;
    for (let offset = -range; offset <= range; offset++) {
      const idx = (hintIdx + offset + SAMPLE_COUNT) % SAMPLE_COUNT;
      const sp = CIRCUIT_SAMPLES[idx]!;
      const dSq = (x - sp.x) ** 2 + (z - sp.z) ** 2;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        bestIdx = idx;
      }
    }
    if (minDistSq > 45 * 45) {
      for (let i = 0; i < SAMPLE_COUNT; i++) {
        const sp = CIRCUIT_SAMPLES[i]!;
        const dSq = (x - sp.x) ** 2 + (z - sp.z) ** 2;
        if (dSq < minDistSq) {
          minDistSq = dSq;
          bestIdx = i;
        }
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

export function resolveTrackBorders(
  x: number,
  z: number,
  speed: number,
  rotation: number,
  hintIdx?: number
): {
  x: number;
  z: number;
  speed: number;
  rotation: number;
  collided: boolean;
  isOnKerb: boolean;
  nearestIdx: number;
} {
  const safeMargin = TRACK_CONFIG.halfWidth - 1.4;
  const nearest = findNearestSplinePoint(x, z, hintIdx);

  const dx = x - nearest.x;
  const dz = z - nearest.z;
  const dist = Math.hypot(dx, dz);

  const isOnKerb = nearest.isCorner && dist > TRACK_CONFIG.halfWidth - 2.3;

  let collided = false;
  let resX = x;
  let resZ = z;
  let resSpeed = speed;
  let resRot = rotation;

  if (dist > safeMargin) {
    collided = true;
    const nx = dx / (dist || 1);
    const nz = dz / (dist || 1);

    resX = nearest.x + nx * (safeMargin - 0.15);
    resZ = nearest.z + nz * (safeMargin - 0.15);

    resSpeed = Math.abs(speed) * 0.85 * Math.sign(speed || 1);
    let angleErr = nearest.headingAngle - resRot;
    while (angleErr > Math.PI) angleErr -= Math.PI * 2;
    while (angleErr < -Math.PI) angleErr += Math.PI * 2;
    resRot += angleErr * 0.24;
  }

  if (collided && Math.abs(resSpeed) < 0.8) {
    resSpeed = 0;
  }

  return {
    x: resX,
    z: resZ,
    speed: resSpeed,
    rotation: resRot,
    collided,
    isOnKerb,
    nearestIdx: nearest.index,
  };
}

export function stepCarPhysics(
  current: CarPhysicsState,
  inputs: DriveInputs,
  delta: number
): {
  next: CarPhysicsState;
  gateCrossed: boolean;
  lapIncremented: boolean;
  barrierHit: boolean;
} {
  const d = Math.min(0.05, Math.max(0.004, delta));
  const prevX = current.x;
  const prevZ = current.z;

  let speed = current.speed;
  let rotation = current.rotation;
  let steerAngle = current.steerAngle;
  let nitro = current.nitroPercent;
  let isBoostCooldown = current.isBoostCooldown;
  let driftScore = current.driftScore;

  // --- NITRO BOOST WITH RECHARGE COOLDOWN LIMIT ---
  let isBoosting = false;
  if (isBoostCooldown && nitro >= TRACK_CONFIG.nitroMinThreshold) {
    isBoostCooldown = false;
  }

  if (inputs.nitro && !isBoostCooldown && nitro > 0.5) {
    isBoosting = true;
    nitro = Math.max(0, nitro - d * TRACK_CONFIG.nitroDrainRate);
    if (nitro <= 0.5) {
      nitro = 0;
      isBoostCooldown = true;
    }
  } else {
    nitro = Math.min(100, nitro + d * TRACK_CONFIG.nitroRechargeRate);
    if (isBoostCooldown && nitro >= TRACK_CONFIG.nitroMinThreshold) {
      isBoostCooldown = false;
    }
  }

  // --- DRIFTING & POWERSLIDING ---
  const isDrifting = Boolean(inputs.drift && Math.abs(speed) > 12);
  if (isDrifting) {
    nitro = Math.min(100, nitro + d * TRACK_CONFIG.driftGainNitroRate);
    driftScore += Math.round(Math.abs(speed) * 6 * d);
  }

  // --- ACCELERATION / BRAKING / REVERSE ---
  let isBraking = false;
  let isReversing = false;

  if (inputs.gas) {
    const boostMult = isBoosting ? TRACK_CONFIG.nitroBoostMultiplier : 1.0;
    speed += TRACK_CONFIG.accelForward * boostMult * d;
  } else if (isBoosting) {
    speed +=
      TRACK_CONFIG.accelForward * TRACK_CONFIG.nitroBoostMultiplier * 1.05 * d;
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

  // Rolling resistance
  const friction = isDrifting
    ? TRACK_CONFIG.driftFriction
    : TRACK_CONFIG.normalFriction;
  speed *= Math.pow(friction, d * 60);

  // Controllable top speed clamps
  const maxFwd = isBoosting
    ? TRACK_CONFIG.maxSpeedForward * TRACK_CONFIG.nitroBoostMultiplier
    : TRACK_CONFIG.maxSpeedForward;
  speed = Math.max(TRACK_CONFIG.maxSpeedReverse, Math.min(speed, maxFwd));

  // --- SPEED-SENSITIVE PROGRESSIVE STEERING ---
  let rawSteer = 0;
  if (
    typeof inputs.steerValue === "number" &&
    Math.abs(inputs.steerValue) > 0.02
  ) {
    rawSteer = Math.max(-1, Math.min(1, inputs.steerValue));
  } else {
    rawSteer = (inputs.right ? 1 : 0) - (inputs.left ? 1 : 0);
  }

  // Smoothly reduce max steering sensitivity at top/boost speeds so corners stay controlled
  const absSpd = Math.abs(speed);
  const highSpeedDamp = 1 - Math.min(0.28, (absSpd / 65) * 0.28);
  const targetSteerAngle = rawSteer * 0.52 * highSpeedDamp;
  steerAngle = THREE.MathUtils.lerp(steerAngle, targetSteerAngle, d * 18);

  const speedFactor = Math.max(0.45, Math.min(1.1, absSpd / 7.5));
  const brakingTurnBonus = isBraking ? 1.22 : 1.0;
  const driftBonus = isDrifting ? 1.72 : 1.0;
  const turnRate =
    -steerAngle *
    2.95 *
    speedFactor *
    driftBonus *
    brakingTurnBonus *
    Math.sign(speed || 1);

  rotation += turnRate * d;

  const driftSlipAngle = isDrifting ? -steerAngle * 0.5 : 0;

  // --- POSITION TRANSLATION ---
  const forwardAngle = rotation + driftSlipAngle;
  const vx = Math.sin(forwardAngle) * speed;
  const vz = Math.cos(forwardAngle) * speed;

  let x = current.x + vx * d;
  let z = current.z + vz * d;

  // --- TRACK BORDER COLLISION ---
  const borderRes = resolveTrackBorders(
    x,
    z,
    speed,
    rotation,
    current.nearestSampleIdx
  );
  x = borderRes.x;
  z = borderRes.z;
  speed = borderRes.speed;
  rotation = borderRes.rotation;
  const barrierHit = borderRes.collided;
  const isOnKerb = borderRes.isOnKerb;
  const nearestSampleIdx = borderRes.nearestIdx;

  // --- CHECKPOINT / GATE PASSING ---
  const nextGateIdx = (current.checkpoint + 1) % TOTAL_GATES;
  const skipGateIdx = (current.checkpoint + 2) % TOTAL_GATES;
  const targetGate = TRACK_GATES[nextGateIdx]!;
  const backupGate = TRACK_GATES[skipGateIdx]!;

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
  } else if (
    skipGateIdx !== 0 &&
    checkGateCrossing(prevX, prevZ, x, z, backupGate)
  ) {
    checkpoint = skipGateIdx;
    gateCrossed = true;
  }

  // --- WRONG WAY DETECTION ---
  const nearestSample = CIRCUIT_SAMPLES[nearestSampleIdx]!;
  let angleDiff = Math.abs(rotation - nearestSample.headingAngle);
  while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);
  const isWrongWay = angleDiff > Math.PI * 0.7 && absSpd > 10;

  let adjustedSample = nearestSampleIdx;
  if (lap === 1 && checkpoint === 0 && nearestSampleIdx > SAMPLE_COUNT - 40) {
    adjustedSample = nearestSampleIdx - SAMPLE_COUNT;
  }
  const progress = (lap - 1) * SAMPLE_COUNT + adjustedSample;

  const kmh = Math.round(absSpd * 3.6);
  let currentGear = "N";
  if (speed < -0.8) currentGear = "R";
  else if (kmh < 2) currentGear = "1";
  else if (kmh < 42) currentGear = "1";
  else if (kmh < 84) currentGear = "2";
  else if (kmh < 126) currentGear = "3";
  else if (kmh < 164) currentGear = "4";
  else if (kmh < 195) currentGear = "5";
  else currentGear = "6";

  const nextState: CarPhysicsState = {
    x,
    z,
    rotation,
    speed,
    steerAngle,
    isDrifting,
    isBoosting,
    isBoostCooldown,
    isBraking,
    isReversing,
    isOnKerb,
    driftSlipAngle,
    driftScore,
    nitroPercent: Math.round(nitro),
    currentGear,
    kmh,
    checkpoint,
    lap,
    progress,
    isWrongWay,
    nearestSampleIdx,
  };

  return { next: nextState, gateCrossed, lapIncremented, barrierHit };
}
