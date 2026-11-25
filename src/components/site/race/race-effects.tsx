/**
 * Horizon Grand Prix — High-FPS GPU-Instanced Particle & Decal FX
 * - Drift & Wheelspin Tire Smoke Pool (InstancedMesh, zero React re-renders)
 * - Persistent Rear-Tire Skid Marks Pool (InstancedMesh ring buffer on asphalt)
 * - Guardrail Collision Sparks Pool (InstancedMesh burst)
 * - Crisp Cached Driver Nameplate Sprites for AI Rivals & Multiplayer Opponents
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface TelemetryFxSource {
  x: number;
  z: number;
  rotation: number;
  speed: number;
  isDrifting: boolean;
  isBraking: boolean;
  isBoosting: boolean;
  barrierHitAt: number; // performance.now() timestamp of latest wall contact
}

const SMOKE_COUNT = 72;
const SKID_COUNT = 220;
const SPARK_COUNT = 48;

interface SmokePuff {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  life: number;
  scale: number;
}

interface SparkPuff {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  life: number;
}

export function RaceParticlesFX({
  getPlayerFx,
}: {
  getPlayerFx: () => TelemetryFxSource;
}) {
  const smokeRef = useRef<THREE.InstancedMesh>(null);
  const skidRef = useRef<THREE.InstancedMesh>(null);
  const sparkRef = useRef<THREE.InstancedMesh>(null);

  const smokePool = useRef<SmokePuff[]>(
    Array.from({ length: SMOKE_COUNT }, () => ({
      active: false,
      x: 0,
      y: -50,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      age: 0,
      life: 0.6,
      scale: 0.5,
    }))
  );
  const smokeCursor = useRef(0);
  const smokeSpawnAccum = useRef(0);

  const skidCursor = useRef(0);
  const skidSpawnAccum = useRef(0);
  const skidInitialized = useRef(false);

  const sparkPool = useRef<SparkPuff[]>(
    Array.from({ length: SPARK_COUNT }, () => ({
      active: false,
      x: 0,
      y: -50,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      age: 0,
      life: 0.35,
    }))
  );
  const sparkCursor = useRef(0);
  const lastSparkHitAt = useRef(0);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(0.05, rawDelta);
    const fx = getPlayerFx();
    const fwdX = Math.sin(fx.rotation);
    const fwdZ = Math.cos(fx.rotation);
    const rightX = -fwdZ;
    const rightZ = fwdX;

    // Rear wheel world positions
    const rearCenterX = fx.x - fwdX * 0.95;
    const rearCenterZ = fx.z - fwdZ * 0.95;
    const rlX = rearCenterX - rightX * 0.85;
    const rlZ = rearCenterZ - rightZ * 0.85;
    const rrX = rearCenterX + rightX * 0.85;
    const rrZ = rearCenterZ + rightZ * 0.85;

    // Initialize skid pool offscreen once
    if (skidRef.current && !skidInitialized.current) {
      skidInitialized.current = true;
      for (let i = 0; i < SKID_COUNT; i++) {
        dummy.position.set(0, -20, 0);
        dummy.scale.set(0.01, 0.01, 0.01);
        dummy.updateMatrix();
        skidRef.current.setMatrixAt(i, dummy.matrix);
      }
      skidRef.current.instanceMatrix.needsUpdate = true;
    }

    // 1. Spawn & Update Tire Smoke (Drifting, Hard Braking, or Heavy Nitro Launch)
    const shouldSmoke =
      fx.isDrifting ||
      (fx.isBraking && fx.speed > 18) ||
      (fx.isBoosting && Math.abs(fx.speed) < 35);

    if (smokeRef.current) {
      if (shouldSmoke) {
        smokeSpawnAccum.current += delta * 45;
        while (smokeSpawnAccum.current >= 1) {
          smokeSpawnAccum.current -= 1;
          for (const [wx, wz] of [
            [rlX, rlZ],
            [rrX, rrZ],
          ] as const) {
            const idx = smokeCursor.current % SMOKE_COUNT;
            smokeCursor.current += 1;
            const p = smokePool.current[idx]!;
            p.active = true;
            p.x = wx + (Math.random() - 0.5) * 0.35;
            p.y = 0.18;
            p.z = wz + (Math.random() - 0.5) * 0.35;
            p.vx = (Math.random() - 0.5) * 1.4 - fwdX * 2.2;
            p.vy = 0.8 + Math.random() * 1.2;
            p.vz = (Math.random() - 0.5) * 1.4 - fwdZ * 2.2;
            p.age = 0;
            p.life = 0.45 + Math.random() * 0.35;
            p.scale = fx.isDrifting ? 0.55 : 0.38;
          }
        }
      } else {
        smokeSpawnAccum.current = 0;
      }

      for (let i = 0; i < SMOKE_COUNT; i++) {
        const p = smokePool.current[i]!;
        if (!p.active) {
          dummy.position.set(0, -30, 0);
          dummy.scale.setScalar(0.01);
          dummy.updateMatrix();
          smokeRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }
        p.age += delta;
        if (p.age >= p.life) {
          p.active = false;
          dummy.position.set(0, -30, 0);
          dummy.scale.setScalar(0.01);
          dummy.updateMatrix();
          smokeRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }
        const t = p.age / p.life;
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.z += p.vz * delta;
        const s = p.scale * (0.6 + t * 2.2) * (1 - t * 0.55);
        dummy.position.set(p.x, p.y, p.z);
        dummy.scale.setScalar(Math.max(0.02, s));
        dummy.rotation.set(t * 2, t * 3, 0);
        dummy.updateMatrix();
        smokeRef.current.setMatrixAt(i, dummy.matrix);
      }
      smokeRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Stamp Persistent Rear-Tire Skid Marks while Drifting or Hard Braking
    if (skidRef.current && (fx.isDrifting || (fx.isBraking && fx.speed > 20))) {
      skidSpawnAccum.current += delta * 60;
      if (skidSpawnAccum.current >= 1) {
        skidSpawnAccum.current = 0;
        for (const [wx, wz] of [
          [rlX, rlZ],
          [rrX, rrZ],
        ] as const) {
          const idx = skidCursor.current % SKID_COUNT;
          skidCursor.current += 1;
          dummy.position.set(wx, 0.065, wz);
          dummy.rotation.set(-Math.PI / 2, 0, -fx.rotation);
          dummy.scale.set(0.32, Math.max(0.9, Math.abs(fx.speed) * 0.04), 1);
          dummy.updateMatrix();
          skidRef.current.setMatrixAt(idx, dummy.matrix);
        }
        skidRef.current.instanceMatrix.needsUpdate = true;
      }
    }

    // 3. Guardrail Impact Sparks Burst
    if (sparkRef.current) {
      if (
        fx.barrierHitAt > lastSparkHitAt.current &&
        fx.barrierHitAt - lastSparkHitAt.current > 90 &&
        Math.abs(fx.speed) > 10
      ) {
        lastSparkHitAt.current = fx.barrierHitAt;
        for (let k = 0; k < 14; k++) {
          const idx = sparkCursor.current % SPARK_COUNT;
          sparkCursor.current += 1;
          const sp = sparkPool.current[idx]!;
          sp.active = true;
          sp.x = fx.x + (Math.random() - 0.5) * 1.4;
          sp.y = 0.45 + Math.random() * 0.4;
          sp.z = fx.z + (Math.random() - 0.5) * 1.4;
          sp.vx = (Math.random() - 0.5) * 16 - fwdX * 4;
          sp.vy = 2.5 + Math.random() * 7;
          sp.vz = (Math.random() - 0.5) * 16 - fwdZ * 4;
          sp.age = 0;
          sp.life = 0.22 + Math.random() * 0.22;
        }
      }

      for (let i = 0; i < SPARK_COUNT; i++) {
        const sp = sparkPool.current[i]!;
        if (!sp.active) {
          dummy.position.set(0, -30, 0);
          dummy.scale.setScalar(0.01);
          dummy.updateMatrix();
          sparkRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }
        sp.age += delta;
        if (sp.age >= sp.life) {
          sp.active = false;
          dummy.position.set(0, -30, 0);
          dummy.scale.setScalar(0.01);
          dummy.updateMatrix();
          sparkRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }
        sp.vy -= 22 * delta;
        sp.x += sp.vx * delta;
        sp.y = Math.max(0.08, sp.y + sp.vy * delta);
        sp.z += sp.vz * delta;
        const fade = 1 - sp.age / sp.life;
        dummy.position.set(sp.x, sp.y, sp.z);
        dummy.scale.set(0.14 * fade, 0.14 * fade, 0.42 * fade);
        dummy.rotation.set(0, Math.atan2(sp.vx, sp.vz), 0);
        dummy.updateMatrix();
        sparkRef.current.setMatrixAt(i, dummy.matrix);
      }
      sparkRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Drift Tire Smoke Pool */}
      <instancedMesh
        ref={smokeRef}
        args={[undefined, undefined, SMOKE_COUNT]}
        frustumCulled={false}
      >
        <dodecahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial
          color="#cbd5e1"
          roughness={1}
          transparent
          opacity={0.42}
          depthWrite={false}
        />
      </instancedMesh>

      {/* Asphalt Tire Skid Marks Pool */}
      <instancedMesh
        ref={skidRef}
        args={[undefined, undefined, SKID_COUNT]}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          color="#090d16"
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </instancedMesh>

      {/* Guardrail Collision Sparks Pool */}
      <instancedMesh
        ref={sparkRef}
        args={[undefined, undefined, SPARK_COUNT]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#fbbf24" />
      </instancedMesh>
    </group>
  );
}

/** Crisp 3D Driver Nameplate Sprite rendered cleanly above opponent & AI cars */
export function DriverNameSprite({
  name,
  color,
}: {
  name: string;
  color: string;
}) {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 72;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pill background
    ctx.fillStyle = "rgba(9, 13, 22, 0.86)";
    ctx.beginPath();
    ctx.roundRect(8, 8, 304, 56, 28);
    ctx.fill();

    // Neon accent border
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Color pip dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(36, 36, 10, 0, Math.PI * 2);
    ctx.fill();

    // Driver Name text
    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 24px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textBaseline = "middle";
    const label = name.length > 14 ? `${name.slice(0, 13)}…` : name;
    ctx.fillText(label, 58, 37);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [name, color]);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  if (!texture) return null;

  return (
    <sprite position={[0, 1.85, 0]} scale={[3.2, 0.72, 1]}>
      <spriteMaterial map={texture} transparent depthTest={true} />
    </sprite>
  );
}
