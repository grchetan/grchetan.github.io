/**
 * Horizon Grand Prix — Next-Gen 3D Multiplayer & AI Arcade Racer
 * Highlights:
 * - Zero-Jank 60/120fps WebGL loop (no per-frame React re-renders of 3D track or opponents)
 * - Dual-Transport Netcode (WebRTC P2P + BroadcastChannel + Coalesced Cloud) with live Ping (ms)
 * - Dead-Reckoning Velocity Extrapolation & Smooth Exponential Interpolation for rivals
 * - GPU-Instanced Drift Tire Smoke, Persistent Skid Marks, Impact Sparks & Twin Afterburners
 * - Crisp Driver Nameplate Sprites, Working Reverse Lights & Accurate Visual Front-Wheel Steering
 * - Portal-Mounted Fullscreen / Landscape Mode above Site Navbar + Zero-Leak Audio Lifecycle
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { toast } from "sonner";
import type { Player } from "@/lib/arcade";
import {
  getValidPlayers,
  type RacePlayer,
  type RaceRoom,
} from "@/lib/race";
import { RaceNetSession, type NetMetrics } from "@/lib/race-net";
import { raceAudio } from "./race/race-audio";
import {
  BOOST_PADS,
  CIRCUIT_SAMPLES,
  START_GRID_POS,
  TOTAL_GATES,
  TRACK_CONFIG,
  TRACK_GATES,
  findNearestSplinePoint,
  getStartingGridPos,
  stepCarPhysics,
  type CarPhysicsState,
  type DriveInputs,
} from "./race/race-physics";
import { Track3D } from "./race/race-track";
import { createAIRivals, updateAIRivals, type AIRival } from "./race/race-ai";
import {
  DriverNameSprite,
  RaceParticlesFX,
  type TelemetryFxSource,
} from "./race/race-effects";
import { RaceHUD, type MobileControlType } from "./race/race-hud";

/* =========================================================================
   3D CAR MODEL (LOCAL, REMOTE P2P/CLOUD & AI BOT)
   ========================================================================= */

interface CarVisualPose {
  x: number;
  z: number;
  rotation: number;
  speed: number;
  steerAngle: number;
  isDrifting: boolean;
  isBoosting: boolean;
  isBraking: boolean;
  isReversing: boolean;
}

function CyberRaceCar({
  color,
  getPose,
  playerName,
  isRemote = false,
}: {
  color: string;
  getPose: () => CarVisualPose | null;
  playerName?: string;
  isRemote?: boolean;
}) {
  const carGroup = useRef<THREE.Group>(null);
  const frontLeftWheel = useRef<THREE.Group>(null);
  const frontRightWheel = useRef<THREE.Group>(null);
  const rearLeftWheel = useRef<THREE.Group>(null);
  const rearRightWheel = useRef<THREE.Group>(null);
  const brakeLightLeft = useRef<THREE.MeshBasicMaterial>(null);
  const brakeLightRight = useRef<THREE.MeshBasicMaterial>(null);
  const reverseLightMat = useRef<THREE.MeshBasicMaterial>(null);
  const nitroOuterLeft = useRef<THREE.Mesh>(null);
  const nitroOuterRight = useRef<THREE.Mesh>(null);
  const nitroCoreLeft = useRef<THREE.Mesh>(null);
  const nitroCoreRight = useRef<THREE.Mesh>(null);
  const nitroGlow = useRef<THREE.PointLight>(null);

  const smoothPos = useRef<THREE.Vector3 | null>(null);
  const smoothRot = useRef<number | null>(null);
  const wheelRollAngle = useRef(0);

  useFrame((_, rawDelta) => {
    const pose = getPose();
    if (!carGroup.current || !pose) return;
    const delta = Math.min(0.05, rawDelta);

    if (isRemote) {
      if (!smoothPos.current) {
        smoothPos.current = new THREE.Vector3(pose.x, 0.4, pose.z);
        smoothRot.current = pose.rotation;
      } else {
        const factor = 1 - Math.exp(-delta * 16);
        smoothPos.current.lerp(
          new THREE.Vector3(pose.x, 0.4, pose.z),
          factor
        );
        let angleDelta = pose.rotation - (smoothRot.current ?? pose.rotation);
        while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
        while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
        smoothRot.current =
          (smoothRot.current ?? pose.rotation) + angleDelta * factor;
      }
      carGroup.current.position.copy(smoothPos.current);
      carGroup.current.rotation.y = smoothRot.current ?? pose.rotation;
    } else {
      carGroup.current.position.set(pose.x, 0.4, pose.z);
      carGroup.current.rotation.y = pose.rotation;

      // Realistic chassis body roll & pitch squat
      const rollAmount = (pose.steerAngle * pose.speed) / 130;
      const pitchAmount =
        (pose.isBraking ? 0.048 : pose.isBoosting ? -0.055 : 0) *
        (Math.abs(pose.speed) / TRACK_CONFIG.maxSpeedForward);
      carGroup.current.rotation.z = THREE.MathUtils.lerp(
        carGroup.current.rotation.z,
        rollAmount,
        Math.min(1, delta * 12)
      );
      carGroup.current.rotation.x = THREE.MathUtils.lerp(
        carGroup.current.rotation.x,
        pitchAmount,
        Math.min(1, delta * 12)
      );
    }

    // Accurate Wheel Roll & Steering Direction (-steer turns wheels INTO the corner)
    wheelRollAngle.current += (pose.speed * delta) / 0.32;
    if (frontLeftWheel.current) {
      frontLeftWheel.current.rotation.y = -pose.steerAngle;
      frontLeftWheel.current.rotation.x = wheelRollAngle.current;
    }
    if (frontRightWheel.current) {
      frontRightWheel.current.rotation.y = -pose.steerAngle;
      frontRightWheel.current.rotation.x = wheelRollAngle.current;
    }
    if (rearLeftWheel.current) {
      rearLeftWheel.current.rotation.x = wheelRollAngle.current;
    }
    if (rearRightWheel.current) {
      rearRightWheel.current.rotation.x = wheelRollAngle.current;
    }

    // LED Brake Lights + Reverse Light
    const brakeColor = pose.isBraking ? "#ff1133" : "#4a0410";
    if (brakeLightLeft.current) brakeLightLeft.current.color.set(brakeColor);
    if (brakeLightRight.current) brakeLightRight.current.color.set(brakeColor);
    if (reverseLightMat.current) {
      reverseLightMat.current.color.set(pose.isReversing ? "#f8fafc" : "#1e293b");
    }

    // Dual-Layer Nitro Afterburner Flames
    if (
      nitroOuterLeft.current &&
      nitroOuterRight.current &&
      nitroCoreLeft.current &&
      nitroCoreRight.current
    ) {
      if (pose.isBoosting) {
        const f = 1.0 + (Math.random() - 0.5) * 0.4;
        nitroOuterLeft.current.scale.set(f, f, f * 2.6);
        nitroOuterRight.current.scale.set(f, f, f * 2.6);
        nitroCoreLeft.current.scale.set(f * 0.7, f * 0.7, f * 2.1);
        nitroCoreRight.current.scale.set(f * 0.7, f * 0.7, f * 2.1);
        nitroOuterLeft.current.visible = true;
        nitroOuterRight.current.visible = true;
        nitroCoreLeft.current.visible = true;
        nitroCoreRight.current.visible = true;
        if (nitroGlow.current) nitroGlow.current.intensity = 3.5;
      } else {
        nitroOuterLeft.current.visible = false;
        nitroOuterRight.current.visible = false;
        nitroCoreLeft.current.visible = false;
        nitroCoreRight.current.visible = false;
        if (nitroGlow.current) nitroGlow.current.intensity = 0;
      }
    }
  });

  return (
    <group ref={carGroup}>
      {isRemote && playerName && (
        <DriverNameSprite name={playerName} color={color} />
      )}

      {/* Main Aerodynamic Monocoque Chassis */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.54, 0.42, 2.82]} />
        <meshStandardMaterial color={color} metalness={0.72} roughness={0.22} />
      </mesh>

      {/* Carbon Splitter & Nose Scoop */}
      <mesh position={[0, -0.06, 1.28]}>
        <boxGeometry args={[1.38, 0.18, 0.56]} />
        <meshStandardMaterial color="#090d16" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, -0.16, 1.52]}>
        <boxGeometry args={[1.68, 0.05, 0.34]} />
        <meshStandardMaterial color="#020617" roughness={0.5} />
      </mesh>

      {/* Cockpit Canopy */}
      <mesh position={[0, 0.35, -0.15]}>
        <boxGeometry args={[1.05, 0.32, 1.35]} />
        <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Tinted Windshields */}
      <mesh position={[0, 0.3, 0.62]} rotation={[0.42, 0, 0]}>
        <planeGeometry args={[0.98, 0.46]} />
        <meshStandardMaterial color="#0b172a" roughness={0.1} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, 0.3, -0.92]} rotation={[-0.42, 0, 0]}>
        <planeGeometry args={[0.98, 0.46]} />
        <meshStandardMaterial color="#0b172a" roughness={0.1} transparent opacity={0.92} />
      </mesh>

      {/* Rear GT Spoiler */}
      <group position={[0, 0.54, -1.28]}>
        <mesh position={[-0.48, -0.18, 0]}>
          <boxGeometry args={[0.07, 0.36, 0.08]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0.48, -0.18, 0]}>
          <boxGeometry args={[0.07, 0.36, 0.08]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[1.86, 0.06, 0.38]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Front LED Headlights + Asphalt Light Cone */}
      <mesh position={[-0.55, 0.02, 1.41]}>
        <boxGeometry args={[0.24, 0.08, 0.05]} />
        <meshBasicMaterial color="#e0f2fe" />
      </mesh>
      <mesh position={[0.55, 0.02, 1.41]}>
        <boxGeometry args={[0.24, 0.08, 0.05]} />
        <meshBasicMaterial color="#e0f2fe" />
      </mesh>
      <mesh position={[-0.55, -0.32, 6.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.9, 9.8]} />
        <meshBasicMaterial color="#bae6fd" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh position={[0.55, -0.32, 6.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.9, 9.8]} />
        <meshBasicMaterial color="#bae6fd" transparent opacity={0.12} depthWrite={false} />
      </mesh>

      {/* Neon Underglow */}
      <mesh position={[0, -0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.1, 3.5]} />
        <meshBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} />
      </mesh>

      {/* Rear Brake Lights + Center Reverse Bar */}
      <mesh position={[-0.55, 0.05, -1.41]}>
        <boxGeometry args={[0.26, 0.08, 0.05]} />
        <meshBasicMaterial ref={brakeLightLeft} color="#4a0410" />
      </mesh>
      <mesh position={[0.55, 0.05, -1.41]}>
        <boxGeometry args={[0.26, 0.08, 0.05]} />
        <meshBasicMaterial ref={brakeLightRight} color="#4a0410" />
      </mesh>
      <mesh position={[0, 0.05, -1.41]}>
        <boxGeometry args={[0.32, 0.06, 0.05]} />
        <meshBasicMaterial ref={reverseLightMat} color="#1e293b" />
      </mesh>

      {/* Twin Exhausts + Dual-Core Nitro Afterburner Flames */}
      <pointLight
        ref={nitroGlow}
        position={[0, 0, -2.0]}
        color="#38bdf8"
        distance={14}
        intensity={0}
      />
      <group position={[-0.28, -0.1, -1.43]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.18, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.9} />
        </mesh>
        <mesh
          ref={nitroOuterLeft}
          position={[0, 0, -0.35]}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <coneGeometry args={[0.14, 0.72, 12]} />
          <meshBasicMaterial color="#0ea5e9" transparent opacity={0.85} />
        </mesh>
        <mesh
          ref={nitroCoreLeft}
          position={[0, 0, -0.25]}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <coneGeometry args={[0.08, 0.5, 10]} />
          <meshBasicMaterial color="#f0f9ff" />
        </mesh>
      </group>
      <group position={[0.28, -0.1, -1.43]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.18, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.9} />
        </mesh>
        <mesh
          ref={nitroOuterRight}
          position={[0, 0, -0.35]}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <coneGeometry args={[0.14, 0.72, 12]} />
          <meshBasicMaterial color="#0ea5e9" transparent opacity={0.85} />
        </mesh>
        <mesh
          ref={nitroCoreRight}
          position={[0, 0, -0.25]}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <coneGeometry args={[0.08, 0.5, 10]} />
          <meshBasicMaterial color="#f0f9ff" />
        </mesh>
      </group>

      {/* 4 Wheels */}
      {[
        { ref: frontLeftWheel, pos: [-0.86, -0.15, 0.9] as const, r: 0.32, rimOffset: -0.02 },
        { ref: frontRightWheel, pos: [0.86, -0.15, 0.9] as const, r: 0.32, rimOffset: 0.02 },
        { ref: rearLeftWheel, pos: [-0.86, -0.15, -0.9] as const, r: 0.34, rimOffset: -0.02 },
        { ref: rearRightWheel, pos: [0.86, -0.15, -0.9] as const, r: 0.34, rimOffset: 0.02 },
      ].map((w, idx) => (
        <group key={idx} ref={w.ref} position={[w.pos[0], w.pos[1], w.pos[2]]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[w.r, w.r, 0.27, 20]} />
            <meshStandardMaterial color="#09090b" roughness={0.85} />
          </mesh>
          <mesh position={[w.rimOffset, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[w.r * 0.62, w.r * 0.62, 0.28, 12]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.12} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* =========================================================================
   DYNAMIC CHASE / BUMPER / TOP-DOWN CAMERA RIG
   ========================================================================= */

function CyberCameraRig({
  getTarget,
  mode,
}: {
  getTarget: () => {
    x: number;
    z: number;
    rotation: number;
    speed: number;
    steerAngle: number;
    isBoosting: boolean;
    isOnKerb: boolean;
  };
  mode: "chase" | "bumper" | "top";
}) {
  const { camera } = useThree();
  const currentPos = useRef(
    new THREE.Vector3(START_GRID_POS.x - 12, 8, START_GRID_POS.z)
  );
  const currentLookAt = useRef(
    new THREE.Vector3(START_GRID_POS.x + 8, 1, START_GRID_POS.z)
  );

  useFrame((_, rawDelta) => {
    const delta = Math.min(0.05, rawDelta);
    const target = getTarget();
    const speed = Math.abs(target.speed);
    const speedRatio = speed / TRACK_CONFIG.maxSpeedForward;

    const desiredPos = new THREE.Vector3();
    const desiredLook = new THREE.Vector3(target.x, 0.8, target.z);

    if (mode === "chase") {
      const dist = 10.6 + speedRatio * 3.8 + (target.isBoosting ? 2.8 : 0);
      const height = 4.9 - speedRatio * 0.45;
      const offsetX = Math.sin(target.rotation) * dist;
      const offsetZ = Math.cos(target.rotation) * dist;

      desiredPos.set(target.x - offsetX, height, target.z - offsetZ);
      desiredLook.set(
        target.x + Math.sin(target.rotation) * 9.5,
        1.2,
        target.z + Math.cos(target.rotation) * 9.5
      );
    } else if (mode === "bumper") {
      const offsetX = Math.sin(target.rotation) * 0.6;
      const offsetZ = Math.cos(target.rotation) * 0.6;
      desiredPos.set(target.x + offsetX, 1.02, target.z + offsetZ);
      desiredLook.set(
        target.x + Math.sin(target.rotation) * 18,
        0.9,
        target.z + Math.cos(target.rotation) * 18
      );
    } else {
      desiredPos.set(target.x, 62, target.z - 0.1);
      desiredLook.set(target.x, 0, target.z);
    }

    const lerpRate = 1 - Math.exp(-delta * (mode === "bumper" ? 26 : 11));
    currentPos.current.lerp(desiredPos, lerpRate);
    currentLookAt.current.lerp(desiredLook, lerpRate);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);

    const persCam = camera as THREE.PerspectiveCamera;
    if (persCam.fov !== undefined) {
      const targetFov = target.isBoosting ? 76 : 60 + speedRatio * 9;
      persCam.fov = THREE.MathUtils.lerp(
        persCam.fov,
        targetFov,
        Math.min(1, delta * 8)
      );
      persCam.updateProjectionMatrix();
    }

    if (
      target.isBoosting ||
      target.isOnKerb ||
      (speedRatio > 0.88 && mode === "chase")
    ) {
      const shakeAmt = target.isBoosting ? 0.065 : target.isOnKerb ? 0.045 : 0.022;
      camera.position.x += (Math.random() - 0.5) * shakeAmt;
      camera.position.y += (Math.random() - 0.5) * shakeAmt;
    }
  });

  return null;
}

function PhysicsTick({ onStep }: { onStep: (delta: number) => void }) {
  useFrame((_, delta) => onStep(delta));
  return null;
}

/* =========================================================================
   MAIN EXPORTED COMPONENT: RACE GAME
   ========================================================================= */

export function RaceGame({
  player,
  room,
  onExit,
  onFinish,
}: {
  player: Player;
  room: RaceRoom;
  onExit: () => void;
  onFinish: (totalTime: number, bestLap: number) => void;
}) {
  const validPlayers = useMemo(() => getValidPlayers(room), [room]);
  const mySlotIndex = Math.max(
    0,
    validPlayers.findIndex((p) => p.id === player.id)
  );
  const localPlayer = room.players[player.id] ?? validPlayers[0];
  const initialSpawn = useMemo(
    () => getStartingGridPos(room.code === "SOLO" ? 0 : mySlotIndex),
    // Lock initial spawn grid slot at race start
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [room.code]
  );

  const isMultiplayer = room.code !== "SOLO";
  const withAI = room.settings?.withAI ?? true;

  const initialNearest = useMemo(
    () => findNearestSplinePoint(initialSpawn.x, initialSpawn.z).index,
    [initialSpawn.x, initialSpawn.z]
  );

  const physicsRef = useRef<CarPhysicsState>({
    x: initialSpawn.x,
    z: initialSpawn.z,
    rotation: initialSpawn.rotation,
    speed: 0,
    steerAngle: 0,
    isDrifting: false,
    isBoosting: false,
    isBraking: false,
    isReversing: false,
    isOnKerb: false,
    driftSlipAngle: 0,
    driftScore: 0,
    nitroPercent: 100,
    currentGear: "N",
    kmh: 0,
    checkpoint: 0,
    lap: 1,
    progress: -6,
    isWrongWay: false,
    nearestSampleIdx: initialNearest,
  });

  const fxStateRef = useRef<TelemetryFxSource>({
    x: initialSpawn.x,
    z: initialSpawn.z,
    rotation: initialSpawn.rotation,
    speed: 0,
    isDrifting: false,
    isBraking: false,
    isBoosting: false,
    barrierHitAt: 0,
  });

  const inputsRef = useRef<DriveInputs>({
    gas: false,
    brake: false,
    left: false,
    right: false,
    steerValue: undefined,
    drift: false,
    nitro: false,
  });

  const [controlsMode, setControlsMode] = useState<"keyboard" | "touch">(
    "keyboard"
  );
  const [mobileControlType, setMobileControlType] =
    useState<MobileControlType>(() => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("race_mobile_steer");
        if (saved === "pad" || saved === "wheel" || saved === "tilt")
          return saved;
      }
      return "pad";
    });
  const [cameraMode, setCameraMode] = useState<"chase" | "bumper" | "top">(
    "chase"
  );
  const [isMuted, setIsMuted] = useState(raceAudio.isMuted);
  const [autoDrive, setAutoDrive] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [netMetrics, setNetMetrics] = useState<NetMetrics>({
    pingMs: room.code === "SOLO" ? 0 : null,
    transport: room.code === "SOLO" ? "solo" : "cloud",
    p2pConnectedCount: 0,
    totalRemoteCount: 0,
  });

  const [hudState, setHudState] = useState({
    speedKmh: 0,
    gear: "N",
    nitroPercent: 100,
    driftScore: 0,
    lap: 1,
    activeGate: 1,
    totalTimeMs: 0,
    bestLapMs: null as number | null,
    bannerText: null as string | null,
    rank: 1,
    isWrongWay: false,
  });

  const bannerTimerRef = useRef<number | null>(null);
  const showBanner = useCallback((msg: string) => {
    setHudState((prev) => ({ ...prev, bannerText: msg }));
    if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = window.setTimeout(() => {
      setHudState((prev) => ({ ...prev, bannerText: null }));
    }, 2600);
  }, []);

  // AI Rivals Ref (zero React re-renders per frame!)
  const aiBotsRef = useRef<AIRival[]>(createAIRivals());
  const [aiBotsHUD, setAiBotsHUD] = useState<AIRival[]>(aiBotsRef.current);
  const prevRankRef = useRef<number>(1);

  const startTimeRef = useRef<number>(Date.now());
  const lapStartRef = useRef<number>(Date.now());
  const bestLapRef = useRef<number>(Infinity);
  const finishedRef = useRef(false);
  const lastHudUpdateRef = useRef(0);
  const lastBoostPadSoundRef = useRef(0);

  // Dual-Transport Netcode Session
  const netRef = useRef<RaceNetSession | null>(null);

  useEffect(() => {
    setMounted(true);
    raceAudio.startSession();
    showBanner("LIGHTS OUT — GO!");
    raceAudio.playCountdownBeep(true);

    return () => {
      if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
      raceAudio.endSession();
    };
  }, [showBanner]);

  // Create & manage multiplayer session
  useEffect(() => {
    const net = new RaceNetSession(room.code, player.id, (m) => {
      setNetMetrics(m);
    });
    netRef.current = net;
    return () => {
      net.dispose();
      netRef.current = null;
    };
  }, [room.code, player.id]);

  // Sync incoming Firestore room snapshots into RaceNetSession
  useEffect(() => {
    netRef.current?.syncRoom(room);
  }, [room]);

  // Auto-detect mobile / touch screen
  useEffect(() => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;
    if (isMobile) {
      setControlsMode("touch");
    }
  }, []);

  // Cycle Mobile Control Mode (PAD -> WHEEL -> TILT) with iOS Gyro Permission
  const handleCycleMobileControl = useCallback(async () => {
    const nextOrder: MobileControlType[] = ["pad", "wheel", "tilt"];
    const next =
      nextOrder[(nextOrder.indexOf(mobileControlType) + 1) % nextOrder.length]!;

    if (
      next === "tilt" &&
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === "function"
    ) {
      try {
        const res = await (
          DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }
        ).requestPermission();
        if (res !== "granted") {
          toast.error("Gyroscope permission denied — switched to Touch Pad.");
          setMobileControlType("pad");
          localStorage.setItem("race_mobile_steer", "pad");
          return;
        }
      } catch {
        toast.info("Tilt sensor unavailable on this device.");
      }
    }

    inputsRef.current.steerValue = undefined;
    inputsRef.current.left = false;
    inputsRef.current.right = false;
    setMobileControlType(next);
    localStorage.setItem("race_mobile_steer", next);
    toast.success(`Steering mode: ${next.toUpperCase()}`);
  }, [mobileControlType]);

  // Analog Gyroscope / Tilt Listener
  useEffect(() => {
    if (controlsMode !== "touch" || mobileControlType !== "tilt") return;

    const onOrientation = (e: DeviceOrientationEvent) => {
      const angle = window.screen?.orientation?.angle ?? (window.orientation as number) ?? 0;
      const isLand = Math.abs(angle) === 90;
      const rawTilt = isLand ? (e.beta ?? 0) : (e.gamma ?? 0);
      const signed = angle === -90 || angle === 270 ? -rawTilt : rawTilt;

      if (Math.abs(signed) < 4) {
        inputsRef.current.steerValue = 0;
      } else {
        const clamped = Math.max(-1, Math.min(1, signed / 28));
        inputsRef.current.steerValue = clamped;
      }
    };

    window.addEventListener("deviceorientation", onOrientation);
    return () => {
      window.removeEventListener("deviceorientation", onOrientation);
      inputsRef.current.steerValue = undefined;
    };
  }, [controlsMode, mobileControlType]);

  // Immersive Fullscreen & Orientation Lock
  const handleToggleRotateScreen = useCallback(async () => {
    if (!isLandscape) {
      setIsLandscape(true);
      try {
        await document.documentElement.requestFullscreen?.();
        if (window.screen?.orientation && "lock" in window.screen.orientation) {
          await (
            window.screen.orientation as unknown as {
              lock: (o: string) => Promise<void>;
            }
          )
            .lock("landscape")
            .catch(() => {});
        }
      } catch {}
    } else {
      setIsLandscape(false);
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen?.();
        }
        window.screen?.orientation?.unlock?.();
      } catch {}
    }
  }, [isLandscape]);

  // Sync ESC key exiting browser fullscreen
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && isLandscape) {
        // Allow CSS portal fullscreen to stay or exit smoothly
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [isLandscape]);

  const handleResetCar = useCallback(() => {
    const cur = physicsRef.current;
    const sp = CIRCUIT_SAMPLES[cur.nearestSampleIdx] ?? CIRCUIT_SAMPLES[0]!;
    physicsRef.current = {
      ...cur,
      x: sp.x,
      z: sp.z,
      rotation: sp.headingAngle,
      speed: 0,
      steerAngle: 0,
      isDrifting: false,
      isBoosting: false,
      isBraking: false,
      isReversing: false,
    };
    raceAudio.playBarrierImpact();
    showBanner("CAR RESET ON TRACK");
  }, [showBanner]);

  // Keyboard Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      raceAudio.resume();
      const k = e.key.toLowerCase();

      if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)
      ) {
        e.preventDefault();
      }

      if (k === "arrowup" || k === "w") inputsRef.current.gas = true;
      if (k === "arrowdown" || k === "s") inputsRef.current.brake = true;
      if (k === "arrowleft" || k === "a") inputsRef.current.left = true;
      if (k === "arrowright" || k === "d") inputsRef.current.right = true;
      if (k === " " || k === "space" || k === "spacebar")
        inputsRef.current.drift = true;
      if (k === "shift") inputsRef.current.nitro = true;
      if (k === "r") handleResetCar();
      if (k === "c") {
        setCameraMode((prev) =>
          prev === "chase" ? "bumper" : prev === "bumper" ? "top" : "chase"
        );
      }
      if (k === "m") {
        setIsMuted(raceAudio.toggleMute());
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") inputsRef.current.gas = false;
      if (k === "arrowdown" || k === "s") inputsRef.current.brake = false;
      if (k === "arrowleft" || k === "a") inputsRef.current.left = false;
      if (k === "arrowright" || k === "d") inputsRef.current.right = false;
      if (k === " " || k === "space" || k === "spacebar")
        inputsRef.current.drift = false;
      if (k === "shift") inputsRef.current.nitro = false;
    };

    const onBlur = () => {
      inputsRef.current = {
        gas: false,
        brake: false,
        left: false,
        right: false,
        steerValue: undefined,
        drift: false,
        nitro: false,
      };
      raceAudio.stopCarLoops();
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [handleResetCar]);

  // Main 60/120fps Physics Loop
  const onPhysicsStep = useCallback(
    (delta: number) => {
      if (finishedRef.current) return;

      const current = physicsRef.current;
      const rawInputs = inputsRef.current;
      const inputs: DriveInputs = { ...rawInputs };

      if (autoDrive && controlsMode === "touch" && !rawInputs.brake) {
        inputs.gas = true;
      }

      const { next, gateCrossed, lapIncremented, barrierHit } =
        stepCarPhysics(current, inputs, delta);

      // Boost Pads interaction
      const nowPerf = performance.now();
      for (const pad of BOOST_PADS) {
        if (Math.hypot(next.x - pad.x, next.z - pad.z) < 7.5) {
          next.speed = Math.min(
            next.speed + delta * 45,
            TRACK_CONFIG.maxSpeedForward * TRACK_CONFIG.nitroBoostMultiplier
          );
          next.nitroPercent = Math.min(100, next.nitroPercent + delta * 55);
          next.isBoosting = true;
          if (nowPerf - lastBoostPadSoundRef.current > 450) {
            lastBoostPadSoundRef.current = nowPerf;
            raceAudio.playSpeedPadWhoosh();
            showBanner("⚡ TURBO PAD BOOST!");
          }
          break;
        }
      }

      physicsRef.current = next;
      fxStateRef.current = {
        x: next.x,
        z: next.z,
        rotation: next.rotation,
        speed: next.speed,
        isDrifting: next.isDrifting,
        isBraking: next.isBraking,
        isBoosting: next.isBoosting,
        barrierHitAt: barrierHit ? nowPerf : fxStateRef.current.barrierHitAt,
      };

      if (barrierHit) {
        raceAudio.playBarrierImpact();
      } else if (next.isOnKerb) {
        raceAudio.playKerbRumble(next.speed);
      }

      const now = Date.now();

      if (gateCrossed) {
        raceAudio.playCheckpointBeep(next.checkpoint === 0);

        if (lapIncremented) {
          const lapTime = now - lapStartRef.current;
          lapStartRef.current = now;

          if (next.lap > 1) {
            const isBest = lapTime < bestLapRef.current;
            bestLapRef.current = Math.min(bestLapRef.current, lapTime);
            setHudState((prev) => ({
              ...prev,
              bestLapMs: bestLapRef.current,
            }));
            showBanner(
              `LAP ${next.lap - 1}: ${(lapTime / 1000).toFixed(2)}s ${
                isBest ? "⚡ NEW BEST" : ""
              }`
            );
          }
        }
      }

      // Check race finish
      const totalTime = now - startTimeRef.current;
      const maxLaps = room.settings?.laps ?? 3;
      if (next.lap > maxLaps && !finishedRef.current) {
        finishedRef.current = true;
        raceAudio.playFinishFanfareAndStop();
        netRef.current?.publishLocalPose(
          {
            x: next.x,
            z: next.z,
            rotation: next.rotation,
            speed: next.speed,
            steerAngle: next.steerAngle,
            lap: next.lap,
            checkpoint: next.checkpoint,
            progress: next.progress,
            isBoosting: next.isBoosting,
            isDrifting: next.isDrifting,
            isBraking: next.isBraking,
          },
          true
        );
        onFinish(
          totalTime,
          bestLapRef.current === Infinity ? totalTime : bestLapRef.current
        );
        return;
      }

      // Step AI bots
      if (withAI) {
        aiBotsRef.current = updateAIRivals(
          aiBotsRef.current,
          delta,
          next.x,
          next.z
        );
      }

      // Continuous Audio Update
      raceAudio.updateCarSound(
        next.speed,
        TRACK_CONFIG.maxSpeedForward,
        inputs.gas,
        next.isBoosting
      );
      raceAudio.updateDrift(next.isDrifting, next.speed);
      raceAudio.updateNitro(next.isBoosting);

      // Push Network Pose (30Hz WebRTC P2P + 150ms coalesced Cloud fallback)
      netRef.current?.publishLocalPose(
        {
          x: next.x,
          z: next.z,
          rotation: next.rotation,
          speed: next.speed,
          steerAngle: next.steerAngle,
          lap: next.lap,
          checkpoint: next.checkpoint,
          progress: next.progress,
          isBoosting: next.isBoosting,
          isDrifting: next.isDrifting,
          isBraking: next.isBraking,
        },
        gateCrossed
      );

      // Throttle React HUD state updates to ~18Hz
      if (now - lastHudUpdateRef.current > 55) {
        lastHudUpdateRef.current = now;

        const remotePoses = Array.from(
          netRef.current?.getAllRemotePoses().values() ?? []
        );
        const allProgress = [
          { isMe: true, progress: next.progress },
          ...(withAI
            ? aiBotsRef.current.map((b) => ({
                isMe: false,
                progress: b.progress,
              }))
            : []),
          ...remotePoses.map((rp) => ({
            isMe: false,
            progress: rp.progress,
          })),
        ].sort((a, b) => b.progress - a.progress);

        const rank = Math.max(
          1,
          allProgress.findIndex((r) => r.isMe) + 1
        );

        if (rank < prevRankRef.current && totalTime > 4000) {
          raceAudio.playOvertakeChime();
          showBanner(`⚡ OVERTAKE → P${rank}!`);
        }
        prevRankRef.current = rank;

        setHudState((prev) => ({
          ...prev,
          speedKmh: next.kmh,
          gear: next.currentGear,
          nitroPercent: next.nitroPercent,
          driftScore: next.driftScore,
          lap: next.lap,
          activeGate: (next.checkpoint + 1) % TOTAL_GATES,
          totalTimeMs: totalTime,
          rank,
          isWrongWay: next.isWrongWay,
        }));

        if (withAI) {
          setAiBotsHUD([...aiBotsRef.current]);
        }
      }
    },
    [
      autoDrive,
      controlsMode,
      withAI,
      onFinish,
      room.settings?.laps,
      showBanner,
    ]
  );

  // Ref callbacks for 3D scene (Zero React re-renders per frame!)
  const getLocalCarPose = useCallback((): CarVisualPose => {
    const s = physicsRef.current;
    return {
      x: s.x,
      z: s.z,
      rotation: s.rotation,
      speed: s.speed,
      steerAngle: s.steerAngle,
      isDrifting: s.isDrifting,
      isBoosting: s.isBoosting,
      isBraking: s.isBraking,
      isReversing: s.isReversing,
    };
  }, []);

  const getCameraTarget = useCallback(() => {
    const s = physicsRef.current;
    return {
      x: s.x,
      z: s.z,
      rotation: s.rotation,
      speed: s.speed,
      steerAngle: s.steerAngle,
      isBoosting: s.isBoosting,
      isOnKerb: s.isOnKerb,
    };
  }, []);

  const getPlayerFx = useCallback(() => fxStateRef.current, []);

  // Dead-reckoning prediction for remote human rivals
  const getRemotePoseCallback = useCallback(
    (rp: RacePlayer) => (): CarVisualPose => {
      const netPose = netRef.current?.getRemotePose(rp.id);
      if (!netPose) {
        return {
          x: rp.x,
          z: rp.z,
          rotation: rp.rotation,
          speed: rp.speed,
          steerAngle: rp.steerAngle ?? 0,
          isDrifting: Boolean(rp.isDrifting),
          isBoosting: Boolean(rp.isBoosting),
          isBraking: Boolean(rp.isBraking),
          isReversing: rp.speed < -0.5,
        };
      }
      // Extrapolate smoothly up to 160ms ahead using current speed & heading
      const leadSec = Math.min(
        0.16,
        Math.max(0, (performance.now() - netPose.receivedAt) / 1000)
      );
      return {
        x: netPose.x + Math.sin(netPose.rotation) * netPose.speed * leadSec,
        z: netPose.z + Math.cos(netPose.rotation) * netPose.speed * leadSec,
        rotation: netPose.rotation,
        speed: netPose.speed,
        steerAngle: netPose.steerAngle,
        isDrifting: netPose.isDrifting,
        isBoosting: netPose.isBoosting,
        isBraking: netPose.isBraking,
        isReversing: netPose.speed < -0.5,
      };
    },
    []
  );

  const getBotPoseCallback = useCallback(
    (idx: number) => (): CarVisualPose | null => {
      const b = aiBotsRef.current[idx];
      if (!b) return null;
      return {
        x: b.x,
        z: b.z,
        rotation: b.rotation,
        speed: b.speed,
        steerAngle: b.steerAngle,
        isDrifting: false,
        isBoosting: b.isBoosting,
        isBraking: b.isBraking,
        isReversing: false,
      };
    },
    []
  );

  const remotePlayersList = useMemo(
    () => validPlayers.filter((p) => p.id !== player.id),
    [validPlayers, player.id]
  );

  const handleExit = useCallback(() => {
    raceAudio.endSession();
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    window.screen?.orientation?.unlock?.();
    onExit();
  }, [onExit]);

  const gameViewport = (
    <div
      className={
        isLandscape
          ? "fixed inset-0 z-[9990] h-[100dvh] w-screen bg-[#0c1a30] select-none touch-none overflow-hidden"
          : "relative w-full overflow-hidden rounded-[1.75rem] sm:rounded-[2.2rem] border border-cyan-500/30 bg-[#0c1a30] shadow-[0_0_60px_rgba(6,182,212,0.2)] select-none touch-none"
      }
      onClick={() => raceAudio.resume()}
    >
      {/* 3D WebGL Canvas */}
      <div
        className={
          isLandscape
            ? "h-[100dvh] w-screen"
            : "h-[68vh] min-h-[460px] sm:h-[75vh] sm:min-h-[540px] w-full"
        }
      >
        <Canvas
          camera={{
            position: [initialSpawn.x - 12, 8, initialSpawn.z],
            fov: 62,
            near: 0.4,
            far: 1400,
          }}
          gl={{ powerPreference: "high-performance", antialias: true }}
          dpr={[1, 1.75]}
        >
          <color attach="background" args={["#183558"]} />
          <fog attach="fog" args={["#23466d", 240, 960]} />
          <hemisphereLight args={["#bae6fd", "#1c382a", 1.15]} />
          <directionalLight position={[120, 140, -110]} intensity={1.9} color="#fff7ed" />
          <directionalLight position={[-120, 80, 140]} intensity={0.75} color="#7dd3fc" />

          <PhysicsTick onStep={onPhysicsStep} />

          <Track3D activeGate={hudState.activeGate} />

          <RaceParticlesFX getPlayerFx={getPlayerFx} />

          {/* Local Player Car */}
          <CyberRaceCar
            color={localPlayer?.car.color ?? "#38bdf8"}
            getPose={getLocalCarPose}
          />

          {/* Remote Multiplayer Human Racers */}
          {remotePlayersList.map((rp) => (
            <CyberRaceCar
              key={rp.id}
              color={rp.car.color}
              isRemote
              getPose={getRemotePoseCallback(rp)}
              playerName={rp.name}
            />
          ))}

          {/* Autonomous AI Rivals */}
          {withAI &&
            aiBotsRef.current.map((bot, idx) => (
              <CyberRaceCar
                key={bot.id}
                color={bot.color}
                isRemote
                getPose={getBotPoseCallback(idx)}
                playerName={bot.name}
              />
            ))}

          <CyberCameraRig getTarget={getCameraTarget} mode={cameraMode} />
        </Canvas>
      </div>

      {/* Pro Responsive Heads-Up Display */}
      <RaceHUD
        speedKmh={hudState.speedKmh}
        gear={hudState.gear}
        nitroPercent={hudState.nitroPercent}
        lap={hudState.lap}
        maxLaps={room.settings?.laps ?? 3}
        totalTimeMs={hudState.totalTimeMs}
        bestLapMs={hudState.bestLapMs}
        bannerText={hudState.bannerText}
        rank={hudState.rank}
        totalRacers={
          1 + remotePlayersList.length + (withAI ? aiBotsRef.current.length : 0)
        }
        isWrongWay={hudState.isWrongWay}
        cameraMode={cameraMode}
        isMuted={isMuted}
        controlsMode={controlsMode}
        mobileControlType={mobileControlType}
        autoDrive={autoDrive}
        isLandscape={isLandscape}
        driftScore={hudState.driftScore}
        pingMs={netMetrics.pingMs}
        transport={netMetrics.transport}
        isMultiplayer={isMultiplayer}
        playerPos={{
          x: physicsRef.current.x,
          z: physicsRef.current.z,
          rotation: physicsRef.current.rotation,
        }}
        remoteRacers={remotePlayersList.map((rp) => {
          const live = netRef.current?.getRemotePose(rp.id);
          return {
            id: rp.id,
            color: rp.car.color,
            x: live?.x ?? rp.x,
            z: live?.z ?? rp.z,
          };
        })}
        aiBots={withAI ? aiBotsHUD : []}
        onExitRace={handleExit}
        onToggleCamera={() =>
          setCameraMode((prev) =>
            prev === "chase" ? "bumper" : prev === "bumper" ? "top" : "chase"
          )
        }
        onToggleMute={() => setIsMuted(raceAudio.toggleMute())}
        onResetCar={handleResetCar}
        onToggleAutoDrive={() => setAutoDrive((prev) => !prev)}
        onCycleMobileControl={handleCycleMobileControl}
        onToggleRotateScreen={handleToggleRotateScreen}
        onAnalogSteer={(val) => {
          inputsRef.current.steerValue = val;
        }}
        onTouchGasChange={(v) => {
          inputsRef.current.gas = v;
        }}
        onTouchBrakeChange={(v) => {
          inputsRef.current.brake = v;
        }}
        onTouchLeftChange={(v) => {
          inputsRef.current.left = v;
        }}
        onTouchRightChange={(v) => {
          inputsRef.current.right = v;
        }}
        onTouchDriftChange={(v) => {
          inputsRef.current.drift = v;
        }}
        onTouchNitroChange={(v) => {
          inputsRef.current.nitro = v;
        }}
      />
    </div>
  );

  // Portal fullscreen above Navbar (z-9990 > Navbar z-65) so nothing overlaps the game HUD
  if (isLandscape && mounted) {
    return createPortal(gameViewport, document.body);
  }

  return gameViewport;
}
