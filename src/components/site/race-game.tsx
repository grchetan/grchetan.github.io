/**
 * Horizon Grand Prix — Next-Gen 3D Multiplayer & AI Arcade Racer
 * Highlights:
 * - Sculpted Metallic Clearcoat Hypercar 3D Model with wheel arches, GT wing, interior steering wheel & contact shadow
 * - 4 Camera Perspectives: Chase (GT Rear-3/4), Cockpit (Interior POV), Hood/Bumper, and Top-Down
 * - Balanced Speeds (180 km/h cruise / 223 km/h Nitro) with 30% Recharge Cooldown Limit
 * - Dual-Transport Netcode (WebRTC P2P + BroadcastChannel + Coalesced Cloud) with live Ping (ms)
 * - GPU-Instanced Drift Tire Smoke, Persistent Skid Marks, Sparks & Twin Afterburners
 * - Portal Fullscreen above Navbar + Zero-Leak Audio Lifecycle
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { toast } from "sonner";
import type { Player } from "@/lib/arcade";
import { getValidPlayers, type RacePlayer, type RaceRoom } from "@/lib/race";
import { RaceNetSession, type NetMetrics } from "@/lib/race-net";
import { raceAudio } from "./race/race-audio";
import {
  BOOST_PADS,
  CIRCUIT_SAMPLES,
  START_GRID_POS,
  TOTAL_GATES,
  TRACK_CONFIG,
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

export type CameraMode = "chase" | "cockpit" | "bumper" | "top";

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

/* =========================================================================
   SCULPTED METALLIC CLEARCOAT HYPERCAR 3D MODEL (WITH INTERIOR COCKPIT)
   ========================================================================= */

function createGroundShadowTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const grad = ctx.createRadialGradient(64, 128, 18, 64, 128, 64);
  grad.addColorStop(0, "rgba(0,0,0,0.72)");
  grad.addColorStop(0.55, "rgba(0,0,0,0.42)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function HyperRaceCar({
  color,
  getPose,
  playerName,
  isRemote = false,
  isCockpitView = false,
}: {
  color: string;
  getPose: () => CarVisualPose | null;
  playerName?: string;
  isRemote?: boolean;
  isCockpitView?: boolean;
}) {
  const carGroup = useRef<THREE.Group>(null);
  const frontLeftWheel = useRef<THREE.Group>(null);
  const frontRightWheel = useRef<THREE.Group>(null);
  const rearLeftWheel = useRef<THREE.Group>(null);
  const rearRightWheel = useRef<THREE.Group>(null);
  const interiorWheelRef = useRef<THREE.Group>(null);
  const brakeBarMat = useRef<THREE.MeshBasicMaterial>(null);
  const reverseLightMat = useRef<THREE.MeshBasicMaterial>(null);
  const nitroOuterLeft = useRef<THREE.Mesh>(null);
  const nitroOuterRight = useRef<THREE.Mesh>(null);
  const nitroCoreLeft = useRef<THREE.Mesh>(null);
  const nitroCoreRight = useRef<THREE.Mesh>(null);
  const nitroGlow = useRef<THREE.PointLight>(null);

  const shadowTex = useMemo(() => createGroundShadowTexture(), []);
  useEffect(() => () => shadowTex?.dispose(), [shadowTex]);

  const smoothPos = useRef<THREE.Vector3 | null>(null);
  const smoothRot = useRef<number | null>(null);
  const wheelRollAngle = useRef(0);

  useFrame((_, rawDelta) => {
    const pose = getPose();
    if (!carGroup.current || !pose) return;
    const delta = Math.min(0.05, rawDelta);

    if (isRemote) {
      if (!smoothPos.current) {
        smoothPos.current = new THREE.Vector3(pose.x, 0.38, pose.z);
        smoothRot.current = pose.rotation;
      } else {
        const factor = 1 - Math.exp(-delta * 16);
        smoothPos.current.lerp(
          new THREE.Vector3(pose.x, 0.38, pose.z),
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
      carGroup.current.position.set(pose.x, 0.38, pose.z);
      carGroup.current.rotation.y = pose.rotation;

      // Subtle dynamic suspension roll & squat
      const rollAmount = (pose.steerAngle * pose.speed) / 145;
      const pitchAmount =
        (pose.isBraking ? 0.042 : pose.isBoosting ? -0.045 : 0) *
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

    // Wheel rotation & front wheel steering
    wheelRollAngle.current += (pose.speed * delta) / 0.34;
    if (frontLeftWheel.current) {
      frontLeftWheel.current.rotation.y = -pose.steerAngle;
      frontLeftWheel.current.rotation.x = wheelRollAngle.current;
    }
    if (frontRightWheel.current) {
      frontRightWheel.current.rotation.y = -pose.steerAngle;
      frontRightWheel.current.rotation.x = wheelRollAngle.current;
    }
    if (rearLeftWheel.current) rearLeftWheel.current.rotation.x = wheelRollAngle.current;
    if (rearRightWheel.current) rearRightWheel.current.rotation.x = wheelRollAngle.current;

    // Interior cockpit steering wheel rotation
    if (interiorWheelRef.current) {
      interiorWheelRef.current.rotation.z = pose.steerAngle * 2.2;
    }

    // Rear full-width LED tail light bar + reverse indicator
    if (brakeBarMat.current) {
      brakeBarMat.current.color.set(pose.isBraking ? "#ff1744" : "#880e24");
    }
    if (reverseLightMat.current) {
      reverseLightMat.current.color.set(pose.isReversing ? "#ffffff" : "#1e293b");
    }

    // Twin Nitro Afterburner Flames
    if (
      nitroOuterLeft.current &&
      nitroOuterRight.current &&
      nitroCoreLeft.current &&
      nitroCoreRight.current
    ) {
      if (pose.isBoosting) {
        const f = 1.0 + (Math.random() - 0.5) * 0.35;
        nitroOuterLeft.current.scale.set(f, f, f * 2.4);
        nitroOuterRight.current.scale.set(f, f, f * 2.4);
        nitroCoreLeft.current.scale.set(f * 0.68, f * 0.68, f * 2.0);
        nitroCoreRight.current.scale.set(f * 0.68, f * 0.68, f * 2.0);
        nitroOuterLeft.current.visible = true;
        nitroOuterRight.current.visible = true;
        nitroCoreLeft.current.visible = true;
        nitroCoreRight.current.visible = true;
        if (nitroGlow.current) nitroGlow.current.intensity = 3.2;
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

      {/* Grounded Ambient Contact Shadow */}
      <mesh position={[0, -0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 4.3]} />
        <meshBasicMaterial
          map={shadowTex}
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </mesh>

      {/* Main Sculpted Lower Tub & Mid-Engine Chassis */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[1.46, 0.34, 3.18]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.78}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.08}
        />
      </mesh>

      {/* Tapered Sloped Front Hood (visible from Cockpit Cam!) */}
      <mesh position={[0, 0.14, 1.02]} rotation={[0.14, 0, 0]}>
        <boxGeometry args={[1.28, 0.18, 1.15]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.78}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.08}
        />
      </mesh>

      {/* Center Carbon Racing Livery Stripe */}
      <mesh position={[0, 0.235, 1.02]} rotation={[0.14, 0, 0]}>
        <boxGeometry args={[0.26, 0.015, 1.12]} />
        <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Flared Front Left & Right Wheel Arch Fenders */}
      <mesh position={[-0.76, 0.12, 1.02]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[0.34, 0.24, 0.96]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.78}
          roughness={0.18}
          clearcoat={1}
        />
      </mesh>
      <mesh position={[0.76, 0.12, 1.02]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[0.34, 0.24, 0.96]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.78}
          roughness={0.18}
          clearcoat={1}
        />
      </mesh>

      {/* Flared Rear Left & Right Haunches & Side Air Intakes */}
      <mesh position={[-0.78, 0.16, -0.92]}>
        <boxGeometry args={[0.38, 0.32, 1.16]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.78}
          roughness={0.18}
          clearcoat={1}
        />
      </mesh>
      <mesh position={[0.78, 0.16, -0.92]}>
        <boxGeometry args={[0.38, 0.32, 1.16]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.78}
          roughness={0.18}
          clearcoat={1}
        />
      </mesh>

      {/* Carbon Side Intakes & Side Skirts */}
      <mesh position={[-0.78, 0.04, -0.2]}>
        <boxGeometry args={[0.16, 0.22, 0.9]} />
        <meshStandardMaterial color="#090d16" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0.78, 0.04, -0.2]}>
        <boxGeometry args={[0.16, 0.22, 0.9]} />
        <meshStandardMaterial color="#090d16" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[-0.86, -0.17, 0]}>
        <boxGeometry args={[0.16, 0.06, 2.2]} />
        <meshStandardMaterial color="#090d16" roughness={0.4} />
      </mesh>
      <mesh position={[0.86, -0.17, 0]}>
        <boxGeometry args={[0.16, 0.06, 2.2]} />
        <meshStandardMaterial color="#090d16" roughness={0.4} />
      </mesh>

      {/* Aggressive Carbon Front Splitter + Side Canards */}
      <mesh position={[0, -0.17, 1.64]}>
        <boxGeometry args={[1.82, 0.055, 0.38]} />
        <meshStandardMaterial color="#090d16" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[-0.89, -0.1, 1.62]}>
        <boxGeometry args={[0.04, 0.16, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.89, -0.1, 1.62]}>
        <boxGeometry args={[0.04, 0.16, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Rear Engine Louvers & Carbon Diffuser Fins */}
      <mesh position={[0, 0.22, -0.96]} rotation={[-0.14, 0, 0]}>
        <boxGeometry args={[1.0, 0.16, 0.95]} />
        <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh position={[0, -0.15, -1.62]}>
        <boxGeometry args={[1.55, 0.14, 0.24]} />
        <meshStandardMaterial color="#020617" roughness={0.5} />
      </mesh>

      {/* ── TRANSPARENT COCKPIT CANOPY & DETAILED INTERIOR ── */}
      {/* Interior Dashboard Cowl & Glowing Digital Cluster */}
      <mesh position={[0, 0.24, 0.36]}>
        <boxGeometry args={[1.04, 0.18, 0.32]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.31, 0.21]} rotation={[-0.25, 0, 0]}>
        <planeGeometry args={[0.42, 0.1]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>

      {/* Rotating Interior GT Steering Wheel */}
      <group ref={interiorWheelRef} position={[0, 0.34, 0.16]}>
        <mesh rotation={[0.2, 0, 0]}>
          <torusGeometry args={[0.13, 0.022, 8, 20]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.125, 0]}>
          <boxGeometry args={[0.03, 0.03, 0.03]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh>
          <boxGeometry args={[0.22, 0.035, 0.02]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
      </group>

      {/* Racing Seat Headrest */}
      <mesh position={[0, 0.38, -0.45]}>
        <boxGeometry args={[0.38, 0.42, 0.14]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Sleek Cockpit Roof & A-Pillars */}
      <mesh position={[0, 0.62, -0.22]}>
        <boxGeometry args={[1.02, 0.07, 0.92]} />
        <meshPhysicalMaterial
          color="#090d16"
          metalness={0.85}
          roughness={0.12}
          clearcoat={1}
        />
      </mesh>
      {/* Roof Air Scoop */}
      <mesh position={[0, 0.68, -0.35]}>
        <boxGeometry args={[0.28, 0.09, 0.45]} />
        <meshPhysicalMaterial color={color} metalness={0.8} clearcoat={1} />
      </mesh>
      {/* A-Pillars framing Cockpit */}
      <mesh position={[-0.49, 0.44, 0.34]} rotation={[0.58, 0, 0.1]}>
        <boxGeometry args={[0.055, 0.46, 0.06]} />
        <meshStandardMaterial color="#090d16" metalness={0.8} />
      </mesh>
      <mesh position={[0.49, 0.44, 0.34]} rotation={[0.58, 0, -0.1]}>
        <boxGeometry args={[0.055, 0.46, 0.06]} />
        <meshStandardMaterial color="#090d16" metalness={0.8} />
      </mesh>

      {/* Aerodynamic Wing Mirrors */}
      <mesh position={[-0.78, 0.34, 0.32]}>
        <boxGeometry args={[0.2, 0.08, 0.12]} />
        <meshPhysicalMaterial color={color} metalness={0.8} clearcoat={1} />
      </mesh>
      <mesh position={[0.78, 0.34, 0.32]}>
        <boxGeometry args={[0.2, 0.08, 0.12]} />
        <meshPhysicalMaterial color={color} metalness={0.8} clearcoat={1} />
      </mesh>

      {/* Tinted Windshield Glass (ultra-clear in Cockpit POV) */}
      <mesh position={[0, 0.43, 0.35]} rotation={[0.62, 0, 0]}>
        <planeGeometry args={[0.96, 0.56]} />
        <meshPhysicalMaterial
          color="#0ea5e9"
          roughness={0.05}
          metalness={0.2}
          transparent
          opacity={isCockpitView ? 0.12 : 0.42}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Swan-Neck Carbon GT Rear Spoiler */}
      <group position={[0, 0.62, -1.48]}>
        <mesh position={[-0.44, -0.2, 0.04]} rotation={[-0.18, 0, 0]}>
          <boxGeometry args={[0.06, 0.42, 0.14]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} />
        </mesh>
        <mesh position={[0.44, -0.2, 0.04]} rotation={[-0.18, 0, 0]}>
          <boxGeometry args={[0.06, 0.42, 0.14]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} />
        </mesh>
        {/* Main Wing Plane */}
        <mesh position={[0, 0.03, 0]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[1.94, 0.055, 0.38]} />
          <meshStandardMaterial color="#090d16" metalness={0.8} roughness={0.25} />
        </mesh>
        {/* Wing Endplates */}
        <mesh position={[-0.98, 0.0, 0]}>
          <boxGeometry args={[0.04, 0.24, 0.44]} />
          <meshPhysicalMaterial color={color} metalness={0.8} clearcoat={1} />
        </mesh>
        <mesh position={[0.98, 0.0, 0]}>
          <boxGeometry args={[0.04, 0.24, 0.44]} />
          <meshPhysicalMaterial color={color} metalness={0.8} clearcoat={1} />
        </mesh>
      </group>

      {/* Sharp Dual-Blade LED DRL Headlights */}
      <mesh position={[-0.64, 0.14, 1.54]} rotation={[0, 0.15, -0.1]}>
        <boxGeometry args={[0.34, 0.055, 0.08]} />
        <meshBasicMaterial color="#e0f2fe" />
      </mesh>
      <mesh position={[0.64, 0.14, 1.54]} rotation={[0, -0.15, 0.1]}>
        <boxGeometry args={[0.34, 0.055, 0.08]} />
        <meshBasicMaterial color="#e0f2fe" />
      </mesh>
      <mesh position={[-0.6, -0.28, 6.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.8, 9.2]} />
        <meshBasicMaterial color="#bae6fd" transparent opacity={0.11} depthWrite={false} />
      </mesh>
      <mesh position={[0.6, -0.28, 6.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.8, 9.2]} />
        <meshBasicMaterial color="#bae6fd" transparent opacity={0.11} depthWrite={false} />
      </mesh>

      {/* Full-Width Rear LED Tail-Light Bar + Reverse Light */}
      <mesh position={[0, 0.14, -1.61]}>
        <boxGeometry args={[1.48, 0.065, 0.05]} />
        <meshBasicMaterial ref={brakeBarMat} color="#880e24" />
      </mesh>
      <mesh position={[0, 0.04, -1.61]}>
        <boxGeometry args={[0.26, 0.05, 0.05]} />
        <meshBasicMaterial ref={reverseLightMat} color="#1e293b" />
      </mesh>

      {/* Twin Titanium Exhausts + Afterburner Flames */}
      <pointLight
        ref={nitroGlow}
        position={[0, 0, -2.1]}
        color="#38bdf8"
        distance={14}
        intensity={0}
      />
      {[-0.26, 0.26].map((ex, i) => (
        <group key={i} position={[ex, -0.08, -1.63]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 0.18, 12]} />
            <meshStandardMaterial color="#64748b" metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh
            ref={i === 0 ? nitroOuterLeft : nitroOuterRight}
            position={[0, 0, -0.35]}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
          >
            <coneGeometry args={[0.13, 0.68, 12]} />
            <meshBasicMaterial color="#0ea5e9" transparent opacity={0.85} />
          </mesh>
          <mesh
            ref={i === 0 ? nitroCoreLeft : nitroCoreRight}
            position={[0, 0, -0.24]}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
          >
            <coneGeometry args={[0.075, 0.48, 10]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* 4 Multi-Spoke Wheels with Glowing Brake Calipers */}
      {[
        { ref: frontLeftWheel, pos: [-0.88, -0.1, 1.02] as const, r: 0.34, rimOffset: -0.025 },
        { ref: frontRightWheel, pos: [0.88, -0.1, 1.02] as const, r: 0.34, rimOffset: 0.025 },
        { ref: rearLeftWheel, pos: [-0.9, -0.09, -0.96] as const, r: 0.36, rimOffset: -0.025 },
        { ref: rearRightWheel, pos: [0.9, -0.09, -0.96] as const, r: 0.36, rimOffset: 0.025 },
      ].map((w, idx) => (
        <group key={idx} ref={w.ref} position={[w.pos[0], w.pos[1], w.pos[2]]}>
          {/* Tire */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[w.r, w.r, 0.28, 22]} />
            <meshStandardMaterial color="#09090b" roughness={0.85} />
          </mesh>
          {/* Metallic Alloy Rim */}
          <mesh position={[w.rimOffset, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[w.r * 0.64, w.r * 0.64, 0.29, 14]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.94} roughness={0.12} />
          </mesh>
          {/* Inner Brake Caliper Disc */}
          <mesh position={[w.rimOffset * 0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[w.r * 0.36, w.r * 0.36, 0.3, 10]} />
            <meshBasicMaterial color={color} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* =========================================================================
   CINEMATIC 4-MODE CAMERA RIG (CHASE, COCKPIT, HOOD, TOP)
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
  mode: CameraMode;
}) {
  const { camera } = useThree();
  const currentPos = useRef(
    new THREE.Vector3(START_GRID_POS.x - 8, 3.2, START_GRID_POS.z)
  );
  const currentLookAt = useRef(
    new THREE.Vector3(START_GRID_POS.x + 14, 1.0, START_GRID_POS.z)
  );

  useFrame((_, rawDelta) => {
    const delta = Math.min(0.05, rawDelta);
    const target = getTarget();
    const speed = Math.abs(target.speed);
    const speedRatio = speed / TRACK_CONFIG.maxSpeedForward;

    const sinR = Math.sin(target.rotation);
    const cosR = Math.cos(target.rotation);

    const desiredPos = new THREE.Vector3();
    const desiredLook = new THREE.Vector3(target.x, 0.9, target.z);

    if (mode === "chase") {
      // Crisp Gran Turismo Rear-3/4 Chase Camera: low, close, wide forward road view
      const dist = 7.0 + speedRatio * 1.65 + (target.isBoosting ? 0.9 : 0);
      const height = 2.85 - speedRatio * 0.18;
      desiredPos.set(target.x - sinR * dist, height, target.z - cosR * dist);
      desiredLook.set(
        target.x + sinR * 14,
        1.05,
        target.z + cosR * 14
      );
    } else if (mode === "cockpit") {
      // True Driver Interior POV looking over rotating steering wheel & hood
      desiredPos.set(target.x - sinR * 0.14, 0.88, target.z - cosR * 0.14);
      desiredLook.set(
        target.x + sinR * 18,
        0.74,
        target.z + cosR * 18
      );
    } else if (mode === "bumper") {
      // Hood / Nose Cam
      desiredPos.set(target.x + sinR * 0.85, 0.86, target.z + cosR * 0.85);
      desiredLook.set(
        target.x + sinR * 20,
        0.78,
        target.z + cosR * 20
      );
    } else {
      // Top-Down Tactical Cam
      desiredPos.set(target.x, 58, target.z - 0.1);
      desiredLook.set(target.x, 0, target.z);
    }

    if (mode === "cockpit" || mode === "bumper") {
      currentPos.current.copy(desiredPos);
      currentLookAt.current.copy(desiredLook);
    } else {
      const lerpRate = 1 - Math.exp(-delta * 13);
      currentPos.current.lerp(desiredPos, lerpRate);
      currentLookAt.current.lerp(desiredLook, lerpRate);
    }

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);

    const persCam = camera as THREE.PerspectiveCamera;
    if (persCam.fov !== undefined) {
      const baseFov = mode === "cockpit" ? 72 : 60;
      const targetFov = target.isBoosting ? baseFov + 10 : baseFov + speedRatio * 6;
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
      const shakeAmt = target.isBoosting ? 0.04 : target.isOnKerb ? 0.035 : 0.014;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [room.code]
  );

  const initialNearest = useMemo(
    () => findNearestSplinePoint(initialSpawn.x, initialSpawn.z).index,
    [initialSpawn.x, initialSpawn.z]
  );

  const isMultiplayer = room.code !== "SOLO";
  const withAI = room.settings?.withAI ?? true;

  const physicsRef = useRef<CarPhysicsState>({
    x: initialSpawn.x,
    z: initialSpawn.z,
    rotation: initialSpawn.rotation,
    speed: 0,
    steerAngle: 0,
    isDrifting: false,
    isBoosting: false,
    isBoostCooldown: false,
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
  const [cameraMode, setCameraMode] = useState<CameraMode>("chase");
  const [isMuted, setIsMuted] = useState(raceAudio.isMuted);
  const [autoDrive, setAutoDrive] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [activeKeys, setActiveKeys] = useState({
    gas: false,
    brake: false,
    left: false,
    right: false,
    drift: false,
    nitro: false,
  });

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
    isBoosting: false,
    isBoostCooldown: false,
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
    }, 2400);
  }, []);

  const aiBotsRef = useRef<AIRival[]>(createAIRivals());
  const [aiBotsHUD, setAiBotsHUD] = useState<AIRival[]>(aiBotsRef.current);
  const prevRankRef = useRef<number>(1);

  const startTimeRef = useRef<number>(Date.now());
  const lapStartRef = useRef<number>(Date.now());
  const bestLapRef = useRef<number>(Infinity);
  const finishedRef = useRef(false);
  const lastHudUpdateRef = useRef(0);
  const lastBoostPadSoundRef = useRef(0);

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

  useEffect(() => {
    netRef.current?.syncRoom(room);
  }, [room]);

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

  const handleCycleMobileControl = useCallback(async () => {
    const nextOrder: MobileControlType[] = ["pad", "wheel", "tilt"];
    const next =
      nextOrder[(nextOrder.indexOf(mobileControlType) + 1) % nextOrder.length]!;

    if (
      next === "tilt" &&
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (
        DeviceOrientationEvent as unknown as {
          requestPermission?: () => Promise<string>;
        }
      ).requestPermission === "function"
    ) {
      try {
        const res = await (
          DeviceOrientationEvent as unknown as {
            requestPermission: () => Promise<string>;
          }
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

  useEffect(() => {
    if (controlsMode !== "touch" || mobileControlType !== "tilt") return;

    const onOrientation = (e: DeviceOrientationEvent) => {
      const angle =
        window.screen?.orientation?.angle ??
        (window.orientation as number) ??
        0;
      const isLand = Math.abs(angle) === 90;
      const rawTilt = isLand ? (e.beta ?? 0) : (e.gamma ?? 0);
      const signed = angle === -90 || angle === 270 ? -rawTilt : rawTilt;

      if (Math.abs(signed) < 4) {
        inputsRef.current.steerValue = 0;
      } else {
        inputsRef.current.steerValue = Math.max(-1, Math.min(1, signed / 28));
      }
    };

    window.addEventListener("deviceorientation", onOrientation);
    return () => {
      window.removeEventListener("deviceorientation", onOrientation);
      inputsRef.current.steerValue = undefined;
    };
  }, [controlsMode, mobileControlType]);

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

  const handleCycleCamera = useCallback(() => {
    setCameraMode((prev) => {
      const next: CameraMode =
        prev === "chase"
          ? "cockpit"
          : prev === "cockpit"
            ? "bumper"
            : prev === "bumper"
              ? "top"
              : "chase";
      showBanner(`CAMERA: ${next.toUpperCase()}`);
      return next;
    });
  }, [showBanner]);

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

  useEffect(() => {
    const syncActiveKeys = () => {
      const r = inputsRef.current;
      setActiveKeys({
        gas: r.gas,
        brake: r.brake,
        left: r.left,
        right: r.right,
        drift: r.drift,
        nitro: r.nitro,
      });
    };

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
      if (k === "c") handleCycleCamera();
      if (k === "m") setIsMuted(raceAudio.toggleMute());

      syncActiveKeys();
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

      syncActiveKeys();
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
      syncActiveKeys();
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
  }, [handleResetCar, handleCycleCamera]);

  const onPhysicsStep = useCallback(
    (delta: number) => {
      if (finishedRef.current) return;

      const current = physicsRef.current;
      const rawInputs = inputsRef.current;
      const inputs: DriveInputs = { ...rawInputs };

      if (autoDrive && controlsMode === "touch" && !rawInputs.brake) {
        inputs.gas = true;
      }

      const { next, gateCrossed, lapIncremented, barrierHit } = stepCarPhysics(
        current,
        inputs,
        delta
      );

      // Speed Boost Pads
      const nowPerf = performance.now();
      for (const pad of BOOST_PADS) {
        if (Math.hypot(next.x - pad.x, next.z - pad.z) < 7.5) {
          next.speed = Math.min(
            next.speed + delta * 36,
            TRACK_CONFIG.maxSpeedForward * TRACK_CONFIG.nitroBoostMultiplier
          );
          next.nitroPercent = Math.min(100, next.nitroPercent + delta * 35);
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

      if (withAI) {
        aiBotsRef.current = updateAIRivals(
          aiBotsRef.current,
          delta,
          next.x,
          next.z
        );
      }

      raceAudio.updateCarSound(
        next.speed,
        TRACK_CONFIG.maxSpeedForward,
        inputs.gas,
        next.isBoosting
      );
      raceAudio.updateDrift(next.isDrifting, next.speed);
      raceAudio.updateNitro(next.isBoosting);

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

        const rank = Math.max(1, allProgress.findIndex((r) => r.isMe) + 1);

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
          isBoosting: next.isBoosting,
          isBoostCooldown: next.isBoostCooldown,
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
          : "relative w-full overflow-hidden rounded-[1.75rem] sm:rounded-[2.2rem] border border-cyan-500/30 bg-[#0c1a30] shadow-[0_0_60px_rgba(6,182,212,0.22)] select-none touch-none"
      }
      onClick={() => raceAudio.resume()}
    >
      {/* 3D WebGL Canvas */}
      <div
        className={
          isLandscape
            ? "h-[100dvh] w-screen"
            : "h-[68vh] min-h-[460px] sm:h-[76vh] sm:min-h-[540px] w-full"
        }
      >
        <Canvas
          camera={{
            position: [initialSpawn.x - 8, 3.2, initialSpawn.z],
            fov: 60,
            near: 0.25,
            far: 1400,
          }}
          gl={{
            powerPreference: "high-performance",
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
          }}
          dpr={[1, 1.75]}
        >
          <color attach="background" args={["#183558"]} />
          <fog attach="fog" args={["#23466d", 240, 960]} />
          <hemisphereLight args={["#bae6fd", "#1c382a", 1.2]} />
          <directionalLight position={[120, 140, -110]} intensity={2.0} color="#fff7ed" />
          <directionalLight position={[-120, 80, 140]} intensity={0.8} color="#7dd3fc" />

          <PhysicsTick onStep={onPhysicsStep} />
          <Track3D activeGate={hudState.activeGate} />
          <RaceParticlesFX getPlayerFx={getPlayerFx} />

          {/* Local Player Hypercar */}
          <HyperRaceCar
            color={localPlayer?.car.color ?? "#38bdf8"}
            getPose={getLocalCarPose}
            isCockpitView={cameraMode === "cockpit"}
          />

          {/* Remote Multiplayer Human Racers */}
          {remotePlayersList.map((rp) => (
            <HyperRaceCar
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
              <HyperRaceCar
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
        isBoosting={hudState.isBoosting}
        isBoostCooldown={hudState.isBoostCooldown}
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
        activeKeys={activeKeys}
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
        onToggleCamera={handleCycleCamera}
        onToggleMute={() => setIsMuted(raceAudio.toggleMute())}
        onResetCar={handleResetCar}
        onToggleControlsMode={() =>
          setControlsMode((m) => (m === "keyboard" ? "touch" : "keyboard"))
        }
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

  if (isLandscape && mounted) {
    return createPortal(gameViewport, document.body);
  }

  return gameViewport;
}
