/**
 * Cyber Circuit — Next-Gen 3D Multiplayer & Single-Player Arcade Racer
 * Features:
 * - Realistic vehicle dynamics, True Reverse gear, Drifting mechanics, Nitro Boost
 * - Web Audio API procedural sound synthesizer (Engine, Drift, Nitro, Chimes, Fanfare)
 * - Intelligent AI Competitor Rivals with pathfinding & competitive racing line
 * - Cyberpunk 3D Track with neon rails, gantry bridge, floodlights & checkpoint gates
 * - Multiple camera perspectives (Chase Cam, Bumper Cam, Top-Down Cam)
 * - Cyber HUD with Speedometer, Tachometer, Gear indicator, Nitro tank & 2D Minimap
 * - Smooth multiplayer netcode with exponential interpolation
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Player } from "@/lib/arcade";
import type { RacePlayer, RaceRoom } from "@/lib/race";

import { raceAudio } from "./race/race-audio";
import {
  TRACK_CONFIG,
  TRACK_GATES,
  TOTAL_GATES,
  stepCarPhysics,
  type CarPhysicsState,
  type DriveInputs,
} from "./race/race-physics";
import { Track3D } from "./race/race-track";
import { createAIRivals, updateAIRivals, type AIRival } from "./race/race-ai";
import { RaceHUD } from "./race/race-hud";

/* =========================================================================
   3D CAR MODEL (LOCAL, REMOTE & AI BOT)
   ========================================================================= */

function CyberRaceCar({
  color,
  getPose,
  isRemote = false,
  remotePose,
  playerName,
}: {
  color: string;
  getPose?: () => {
    x: number;
    z: number;
    rotation: number;
    speed: number;
    steerAngle: number;
    isDrifting: boolean;
    isBoosting: boolean;
    isBraking: boolean;
  };
  isRemote?: boolean;
  remotePose?: { x: number; z: number; rotation: number; speed?: number };
  playerName?: string;
}) {
  const carGroup = useRef<THREE.Group>(null);
  const frontLeftWheel = useRef<THREE.Group>(null);
  const frontRightWheel = useRef<THREE.Group>(null);
  const rearLeftWheel = useRef<THREE.Group>(null);
  const rearRightWheel = useRef<THREE.Group>(null);
  const brakeLightLeft = useRef<THREE.MeshBasicMaterial>(null);
  const brakeLightRight = useRef<THREE.MeshBasicMaterial>(null);
  const nitroFlameLeft = useRef<THREE.Mesh>(null);
  const nitroFlameRight = useRef<THREE.Mesh>(null);

  // Interpolation cache for smooth network rendering
  const currentPos = useRef(new THREE.Vector3(remotePose?.x ?? 0, 0.4, remotePose?.z ?? 0));
  const currentRot = useRef(remotePose?.rotation ?? 0);
  const wheelRollAngle = useRef(0);

  useFrame((_, delta) => {
    if (!carGroup.current) return;

    let posX = 0;
    let posZ = 0;
    let rotY = 0;
    let speed = 0;
    let steer = 0;
    let isBraking = false;
    let isBoosting = false;

    if (isRemote && remotePose) {
      // Exponential lerp interpolation for remote players & AI
      const targetVec = new THREE.Vector3(remotePose.x, 0.4, remotePose.z);
      currentPos.current.lerp(targetVec, Math.min(1, delta * 15));
      carGroup.current.position.copy(currentPos.current);

      let angleDelta = remotePose.rotation - currentRot.current;
      while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
      while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
      currentRot.current += angleDelta * Math.min(1, delta * 12);
      carGroup.current.rotation.y = currentRot.current;

      posX = currentPos.current.x;
      posZ = currentPos.current.z;
      rotY = currentRot.current;
      speed = remotePose.speed ?? 0;
    } else if (getPose) {
      const p = getPose();
      posX = p.x;
      posZ = p.z;
      rotY = p.rotation;
      speed = p.speed;
      steer = p.steerAngle;
      isBraking = p.isBraking;
      isBoosting = p.isBoosting;

      carGroup.current.position.set(posX, 0.4, posZ);
      carGroup.current.rotation.y = rotY;

      // Realistic car body chassis roll & pitch on cornering / braking
      const rollAmount = (steer * speed) / 110;
      const pitchAmount = (isBraking ? 0.045 : isBoosting ? -0.06 : 0) * (speed / TRACK_CONFIG.maxSpeedForward);
      carGroup.current.rotation.z = THREE.MathUtils.lerp(carGroup.current.rotation.z, rollAmount, 0.18);
      carGroup.current.rotation.x = THREE.MathUtils.lerp(carGroup.current.rotation.x, pitchAmount, 0.18);
    }

    // Wheel roll and steer animation
    wheelRollAngle.current += (speed * delta) / 0.32;
    if (frontLeftWheel.current) {
      frontLeftWheel.current.rotation.y = steer;
      frontLeftWheel.current.rotation.x = wheelRollAngle.current;
    }
    if (frontRightWheel.current) {
      frontRightWheel.current.rotation.y = steer;
      frontRightWheel.current.rotation.x = wheelRollAngle.current;
    }
    if (rearLeftWheel.current) {
      rearLeftWheel.current.rotation.x = wheelRollAngle.current;
    }
    if (rearRightWheel.current) {
      rearRightWheel.current.rotation.x = wheelRollAngle.current;
    }

    // Dynamic LED Brake Light Glow
    const brakeColor = isBraking ? "#ff0033" : "#55000d";
    if (brakeLightLeft.current) brakeLightLeft.current.color.set(brakeColor);
    if (brakeLightRight.current) brakeLightRight.current.color.set(brakeColor);

    // Nitro exhaust twin fire flare
    if (nitroFlameLeft.current && nitroFlameRight.current) {
      if (isBoosting) {
        const flicker = 1.0 + (Math.random() - 0.5) * 0.45;
        nitroFlameLeft.current.scale.set(flicker, flicker, flicker * 2.5);
        nitroFlameRight.current.scale.set(flicker, flicker, flicker * 2.5);
        nitroFlameLeft.current.visible = true;
        nitroFlameRight.current.visible = true;
      } else {
        nitroFlameLeft.current.visible = false;
        nitroFlameRight.current.visible = false;
      }
    }
  });

  return (
    <group ref={carGroup}>
      {/* Remote / AI Nameplate Display */}
      {isRemote && playerName && (
        <group position={[0, 1.85, 0]}>
          <mesh>
            <planeGeometry args={[1.8, 0.38]} />
            <meshBasicMaterial color="#090d16" transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* Main Aerodynamic Monocoque Chassis */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.52, 0.42, 2.75]} />
        <meshStandardMaterial color={color} metalness={0.75} roughness={0.2} />
      </mesh>

      {/* Aerodynamic Front Splitter & Nose Scoop */}
      <mesh position={[0, -0.06, 1.25]}>
        <boxGeometry args={[1.36, 0.18, 0.55]} />
        <meshStandardMaterial color="#090d16" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.16, 1.48]}>
        <boxGeometry args={[1.65, 0.05, 0.32]} />
        <meshStandardMaterial color="#020617" roughness={0.5} />
      </mesh>

      {/* Cockpit Canopy */}
      <mesh position={[0, 0.35, -0.15]}>
        <boxGeometry args={[1.05, 0.32, 1.35]} />
        <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Tinted Front Windshield */}
      <mesh position={[0, 0.3, 0.62]} rotation={[0.42, 0, 0]}>
        <planeGeometry args={[0.98, 0.46]} />
        <meshStandardMaterial color="#060d1a" roughness={0.1} transparent opacity={0.92} />
      </mesh>

      {/* Tinted Rear Window */}
      <mesh position={[0, 0.3, -0.92]} rotation={[-0.42, 0, 0]}>
        <planeGeometry args={[0.98, 0.46]} />
        <meshStandardMaterial color="#060d1a" roughness={0.1} transparent opacity={0.92} />
      </mesh>

      {/* Rear High-Downforce Spoiler */}
      <group position={[0, 0.52, -1.25]}>
        <mesh position={[-0.48, -0.18, 0]}>
          <boxGeometry args={[0.07, 0.36, 0.08]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0.48, -0.18, 0]}>
          <boxGeometry args={[0.07, 0.36, 0.08]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[1.82, 0.06, 0.38]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Front LED Headlights */}
      <mesh position={[-0.55, 0.02, 1.38]}>
        <boxGeometry args={[0.2, 0.08, 0.05]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[0.55, 0.02, 1.38]}>
        <boxGeometry args={[0.2, 0.08, 0.05]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Rear LED Brake Lights */}
      <mesh position={[-0.55, 0.05, -1.38]}>
        <boxGeometry args={[0.22, 0.08, 0.05]} />
        <meshBasicMaterial ref={brakeLightLeft} color="#55000d" />
      </mesh>
      <mesh position={[0.55, 0.05, -1.38]}>
        <boxGeometry args={[0.22, 0.08, 0.05]} />
        <meshBasicMaterial ref={brakeLightRight} color="#55000d" />
      </mesh>

      {/* Dual Exhaust System with Nitro Fire Cones */}
      <group position={[-0.28, -0.1, -1.4]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.16, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.9} />
        </mesh>
        <mesh ref={nitroFlameLeft} position={[0, 0, -0.32]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <coneGeometry args={[0.13, 0.65, 12]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} />
        </mesh>
      </group>
      <group position={[0.28, -0.1, -1.4]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.16, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.9} />
        </mesh>
        <mesh ref={nitroFlameRight} position={[0, 0, -0.32]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <coneGeometry args={[0.13, 0.65, 12]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} />
        </mesh>
      </group>

      {/* 4 Wheels (Front Wheels Steer & Roll) */}
      <group ref={frontLeftWheel} position={[-0.85, -0.15, 0.88]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.32, 0.32, 0.26, 20]} />
          <meshStandardMaterial color="#09090b" roughness={0.9} />
        </mesh>
        <mesh position={[-0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.27, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>

      <group ref={frontRightWheel} position={[0.85, -0.15, 0.88]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.32, 0.32, 0.26, 20]} />
          <meshStandardMaterial color="#09090b" roughness={0.9} />
        </mesh>
        <mesh position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.27, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>

      <group ref={rearLeftWheel} position={[-0.85, -0.15, -0.88]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.34, 0.28, 20]} />
          <meshStandardMaterial color="#09090b" roughness={0.9} />
        </mesh>
        <mesh position={[-0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.21, 0.21, 0.29, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>

      <group ref={rearRightWheel} position={[0.85, -0.15, -0.88]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.34, 0.28, 20]} />
          <meshStandardMaterial color="#09090b" roughness={0.9} />
        </mesh>
        <mesh position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.21, 0.21, 0.29, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

/* =========================================================================
   CAMERA RIG WITH DYNAMIC CHASE, BUMPER & TOP-DOWN PERSPECTIVES
   ========================================================================= */

function CyberCameraRig({
  getTarget,
  mode,
}: {
  getTarget: () => { x: number; z: number; rotation: number; speed: number; isBoosting: boolean };
  mode: "chase" | "bumper" | "top";
}) {
  const { camera } = useThree();
  const currentPos = useRef(new THREE.Vector3(0, 10, -TRACK_CONFIG.curveRadius - 12));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, -TRACK_CONFIG.curveRadius));

  useFrame((_, delta) => {
    const target = getTarget();
    const speed = Math.abs(target.speed);
    const speedRatio = speed / TRACK_CONFIG.maxSpeedForward;

    let desiredPos = new THREE.Vector3();
    let desiredLook = new THREE.Vector3(target.x, 0.5, target.z);

    if (mode === "chase") {
      // Dynamic chase camera: pulls back and widens when boosting
      const dist = 10.2 + speedRatio * 3.8 + (target.isBoosting ? 2.8 : 0);
      const height = 5.0 - speedRatio * 0.6;
      const offsetX = Math.sin(target.rotation) * dist;
      const offsetZ = Math.cos(target.rotation) * dist;

      desiredPos.set(target.x - offsetX, height, target.z - offsetZ);
      desiredLook.set(
        target.x + Math.sin(target.rotation) * 7,
        1.1,
        target.z + Math.cos(target.rotation) * 7
      );
    } else if (mode === "bumper") {
      // Bumper / Hood Cam
      const offsetX = Math.sin(target.rotation) * 0.4;
      const offsetZ = Math.cos(target.rotation) * 0.4;
      desiredPos.set(target.x + offsetX, 0.95, target.z + offsetZ);
      desiredLook.set(
        target.x + Math.sin(target.rotation) * 16,
        0.8,
        target.z + Math.cos(target.rotation) * 16
      );
    } else {
      // Top-Down Bird's Eye Cam
      desiredPos.set(target.x, 38, target.z - 0.1);
      desiredLook.set(target.x, 0, target.z);
    }

    const lerpRate = Math.min(1, delta * (mode === "bumper" ? 24 : 10));
    currentPos.current.lerp(desiredPos, lerpRate);
    currentLookAt.current.lerp(desiredLook, lerpRate);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

/* =========================================================================
   SCENE PHYSICS DRIVER HOOK
   ========================================================================= */

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
  onUpdate,
  onFinish,
}: {
  player: Player;
  room: RaceRoom;
  onUpdate: (state: Partial<RacePlayer>) => void;
  onFinish: (totalTime: number, bestLap: number) => void;
}) {
  const localPlayer = room.players[player.id]!;
  const R = TRACK_CONFIG.curveRadius;

  // Initial starting state
  const initialPhysicsState: CarPhysicsState = {
    x: 0,
    z: -R,
    rotation: Math.PI / 2, // Facing forward (+X)
    speed: 0,
    steerAngle: 0,
    isDrifting: false,
    isBoosting: false,
    isBraking: false,
    isReversing: false,
    driftSlipAngle: 0,
    driftScore: 0,
    nitroPercent: 100,
    currentGear: "N",
    kmh: 0,
    checkpoint: 0,
    lap: 1,
    isWrongWay: false,
  };

  const physicsRef = useRef<CarPhysicsState>(initialPhysicsState);
  const inputsRef = useRef<DriveInputs>({
    gas: false,
    brake: false,
    left: false,
    right: false,
    drift: false,
    nitro: false,
  });

  const [controlsMode, setControlsMode] = useState<"keyboard" | "touch">("keyboard");
  const [cameraMode, setCameraMode] = useState<"chase" | "bumper" | "top">("chase");
  const [isMuted, setIsMuted] = useState(raceAudio.isMuted);
  const [hasAI, setHasAI] = useState(true);

  // HUD Render State (Throttled for silky 60fps)
  const [hudState, setHudState] = useState({
    speedKmh: 0,
    gear: "N",
    nitroPercent: 100,
    lap: 1,
    totalTimeMs: 0,
    bestLapMs: null as number | null,
    lapSplitText: null as string | null,
    rank: 1,
    isWrongWay: false,
  });

  // AI Bots State
  const aiBotsRef = useRef<AIRival[]>(createAIRivals());
  const [aiBotsHUD, setAiBotsHUD] = useState<AIRival[]>(aiBotsRef.current);

  const startTimeRef = useRef<number>(room.raceStartedAt ?? Date.now());
  const lapStartRef = useRef<number>(Date.now());
  const bestLapRef = useRef<number>(Infinity);
  const finishedRef = useRef(false);

  const lastNetSyncRef = useRef(0);
  const lastHudUpdateRef = useRef(0);

  // Auto-detect mobile devices
  useEffect(() => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;
    if (isMobile) {
      setControlsMode("touch");
    }
  }, []);

  // Keyboard Event Listeners with window.blur cleanup
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      raceAudio.resume();
      const k = e.key.toLowerCase();

      // Prevent scrolling when using arrow keys
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) {
        e.preventDefault();
      }

      if (k === "arrowup" || k === "w") inputsRef.current.gas = true;
      if (k === "arrowdown" || k === "s") inputsRef.current.brake = true;
      if (k === "arrowleft" || k === "a") inputsRef.current.left = true;
      if (k === "arrowright" || k === "d") inputsRef.current.right = true;
      if (k === " " || k === "space" || k === "spacebar") inputsRef.current.drift = true;
      if (k === "shift") inputsRef.current.nitro = true;

      if (k === "r") handleResetCar();
      if (k === "c") {
        setCameraMode((prev) => (prev === "chase" ? "bumper" : prev === "bumper" ? "top" : "chase"));
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
      if (k === " " || k === "space" || k === "spacebar") inputsRef.current.drift = false;
      if (k === "shift") inputsRef.current.nitro = false;
    };

    const onBlur = () => {
      inputsRef.current = { gas: false, brake: false, left: false, right: false, drift: false, nitro: false };
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // Reset car facing forward on track centerline
  const handleResetCar = useCallback(() => {
    const cur = physicsRef.current;
    const gate = TRACK_GATES[cur.checkpoint % TOTAL_GATES]!;
    physicsRef.current = {
      ...cur,
      x: gate.x,
      z: gate.z,
      rotation: gate.forwardAngle,
      speed: 0,
      steerAngle: 0,
      isDrifting: false,
      isBoosting: false,
      isBraking: false,
    };
    raceAudio.playBarrierImpact();
  }, []);

  // Main 60FPS Physics Simulation Tick
  const onPhysicsStep = useCallback(
    (delta: number) => {
      if (finishedRef.current) return;

      const current = physicsRef.current;
      const inputs = inputsRef.current;

      // 1. Step Player Car Physics
      const { next, gateCrossed, lapIncremented, barrierHit } = stepCarPhysics(current, inputs, delta);
      physicsRef.current = next;

      // Sound triggers
      if (barrierHit) {
        raceAudio.playBarrierImpact();
      }

      if (gateCrossed) {
        raceAudio.playCheckpointBeep(next.checkpoint === 0);

        if (lapIncremented) {
          const now = Date.now();
          const lapTime = now - lapStartRef.current;
          lapStartRef.current = now;

          if (next.lap > 1) {
            const isBest = lapTime < bestLapRef.current;
            bestLapRef.current = Math.min(bestLapRef.current, lapTime);
            setHudState((prev) => ({
              ...prev,
              bestLapMs: bestLapRef.current,
              lapSplitText: `Lap ${next.lap - 1}: ${(lapTime / 1000).toFixed(2)}s ${isBest ? "⚡ RECORD" : ""}`,
            }));
            setTimeout(() => {
              setHudState((prev) => ({ ...prev, lapSplitText: null }));
            }, 3000);
          }
        }
      }

      // Check race finish
      const now = Date.now();
      const totalTime = now - startTimeRef.current;
      if (next.lap > room.settings.laps && !finishedRef.current) {
        finishedRef.current = true;
        raceAudio.playVictoryHorn();
        onFinish(totalTime, bestLapRef.current === Infinity ? totalTime : bestLapRef.current);
      }

      // 2. Step AI Rivals
      if (hasAI) {
        aiBotsRef.current = updateAIRivals(aiBotsRef.current, delta, next.x, next.z);
      }

      // 3. Audio Update
      raceAudio.updateCarSound(next.speed, TRACK_CONFIG.maxSpeedForward, inputs.gas, next.isBoosting);
      raceAudio.updateDrift(next.isDrifting, next.speed);
      raceAudio.updateNitro(next.isBoosting);

      // 4. Throttle HUD Updates to 20fps for performance
      if (now - lastHudUpdateRef.current > 50) {
        lastHudUpdateRef.current = now;

        // Calculate competitive rank
        const allRacers = [
          { lap: next.lap, checkpoint: next.checkpoint },
          ...(hasAI ? aiBotsRef.current.map((b) => ({ lap: b.lap, checkpoint: b.checkpoint })) : []),
          ...Object.values(room.players)
            .filter((p) => p.id !== player.id)
            .map((p) => ({ lap: p.lap, checkpoint: p.checkpoint })),
        ];

        allRacers.sort((a, b) => {
          if (a.lap !== b.lap) return b.lap - a.lap;
          return b.checkpoint - a.checkpoint;
        });

        const rank =
          allRacers.findIndex((r) => r.lap === next.lap && r.checkpoint === next.checkpoint) + 1;

        setHudState((prev) => ({
          ...prev,
          speedKmh: next.kmh,
          gear: next.currentGear,
          nitroPercent: next.nitroPercent,
          lap: next.lap,
          totalTimeMs: totalTime,
          rank: Math.max(1, rank),
          isWrongWay: next.isWrongWay,
        }));

        if (hasAI) {
          setAiBotsHUD([...aiBotsRef.current]);
        }
      }

      // 5. Network sync throttled to 100ms
      if (finishedRef.current || now - lastNetSyncRef.current > 100) {
        lastNetSyncRef.current = now;
        onUpdate({
          x: next.x,
          z: next.z,
          rotation: next.rotation,
          speed: next.speed,
          lap: next.lap,
          checkpoint: next.checkpoint,
          finishedAt: finishedRef.current ? now : null,
        });
      }
    },
    [hasAI, onFinish, onUpdate, player.id, room.players, room.settings.laps]
  );

  const getLocalCarPose = useCallback(() => {
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
    };
  }, []);

  const remotePlayersList = useMemo(
    () => Object.values(room.players).filter((p) => p.id !== player.id),
    [room.players, player.id]
  );

  return (
    <div
      className="relative w-full overflow-hidden rounded-[2.2rem] border border-cyan-500/25 bg-slate-950 shadow-[0_0_60px_rgba(6,182,212,0.18)] select-none"
      onClick={() => raceAudio.resume()}
    >
      {/* 3D WebGL Canvas */}
      <div className="h-[65vh] min-h-[460px] w-full">
        <Canvas
          camera={{ position: [0, 8, -R - 12], fov: 58 }}
          gl={{ powerPreference: "high-performance", antialias: true }}
          dpr={[1, 1.5]}
        >
          <ambientLight intensity={0.58} />
          <directionalLight position={[45, 55, 25]} intensity={1.45} castShadow />
          <pointLight position={[0, 22, 0]} intensity={0.9} color="#38bdf8" />

          {/* Physics Engine Hook */}
          <PhysicsTick onStep={onPhysicsStep} />

          {/* Track and Cyber Environment */}
          <Track3D activeGate={(physicsRef.current.checkpoint + 1) % TOTAL_GATES} />

          {/* Local Player Car */}
          <CyberRaceCar color={localPlayer.car.color} getPose={getLocalCarPose} />

          {/* Remote Multiplayer Players */}
          {remotePlayersList.map((rp) => (
            <CyberRaceCar
              key={rp.id}
              color={rp.car.color}
              isRemote
              remotePose={{ x: rp.x, z: rp.z, rotation: rp.rotation, speed: rp.speed }}
              playerName={rp.name}
            />
          ))}

          {/* AI Rival Bots */}
          {hasAI &&
            aiBotsRef.current.map((bot) => (
              <CyberRaceCar
                key={bot.id}
                color={bot.color}
                isRemote
                remotePose={{ x: bot.x, z: bot.z, rotation: bot.rotation, speed: bot.speed }}
                playerName={bot.name}
              />
            ))}

          {/* Camera View Follow Rig */}
          <CyberCameraRig getTarget={getLocalCarPose} mode={cameraMode} />
        </Canvas>
      </div>

      {/* Cyberpunk Heads-Up Display (HUD) */}
      <RaceHUD
        speedKmh={hudState.speedKmh}
        gear={hudState.gear}
        nitroPercent={hudState.nitroPercent}
        lap={hudState.lap}
        maxLaps={room.settings.laps}
        totalTimeMs={hudState.totalTimeMs}
        bestLapMs={hudState.bestLapMs}
        lapSplitText={hudState.lapSplitText}
        rank={hudState.rank}
        totalRacers={1 + remotePlayersList.length + (hasAI ? aiBotsRef.current.length : 0)}
        isWrongWay={hudState.isWrongWay}
        cameraMode={cameraMode}
        isMuted={isMuted}
        controlsMode={controlsMode}
        hasAI={hasAI}
        playerPos={{ x: physicsRef.current.x, z: physicsRef.current.z }}
        remoteRacers={remotePlayersList.map((rp) => ({
          id: rp.id,
          color: rp.car.color,
          x: rp.x,
          z: rp.z,
        }))}
        aiBots={hasAI ? aiBotsHUD : []}
        onToggleCamera={() =>
          setCameraMode((prev) => (prev === "chase" ? "bumper" : prev === "bumper" ? "top" : "chase"))
        }
        onToggleMute={() => setIsMuted(raceAudio.toggleMute())}
        onResetCar={handleResetCar}
        onToggleAI={() => setHasAI((prev) => !prev)}
        onTouchGasStart={() => (inputsRef.current.gas = true)}
        onTouchGasEnd={() => (inputsRef.current.gas = false)}
        onTouchBrakeStart={() => (inputsRef.current.brake = true)}
        onTouchBrakeEnd={() => (inputsRef.current.brake = false)}
        onTouchLeftStart={() => (inputsRef.current.left = true)}
        onTouchLeftEnd={() => (inputsRef.current.left = false)}
        onTouchRightStart={() => (inputsRef.current.right = true)}
        onTouchRightEnd={() => (inputsRef.current.right = false)}
        onTouchDriftStart={() => (inputsRef.current.drift = true)}
        onTouchDriftEnd={() => (inputsRef.current.drift = false)}
        onTouchNitroStart={() => (inputsRef.current.nitro = true)}
        onTouchNitroEnd={() => (inputsRef.current.nitro = false)}
      />
    </div>
  );
}
