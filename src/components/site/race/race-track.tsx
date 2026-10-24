/**
 * Cyber Circuit — Ultra-Detailed 3D Track & Environment
 * Features:
 * - Continuous cyberpunk neon rails and boundary barriers (no gaps)
 * - Grounded holographic Cyber Gate Arches for all checkpoints
 * - Start / Finish overhead digital gantry with starting tree lights
 * - Alternating red/white curbs with inner and outer loop curves
 * - High-intensity stadium floodlights with real-time lighting
 */

import { useMemo } from "react";
import * as THREE from "three";
import { TRACK_CONFIG, TRACK_GATES, type TrackGate } from "./race-physics";

/** Holographic Cyber Gate Arch placed at each track checkpoint */
function CyberGateArch({
  gate,
  isTarget,
  width,
}: {
  gate: TrackGate;
  isTarget: boolean;
  width: number;
}) {
  const gateW = width * 2;
  const gateH = 4.8;
  const pillarColor = isTarget ? "#22c55e" : "#0284c7";
  const glowColor = isTarget ? "#4ade80" : "#38bdf8";

  return (
    <group position={[gate.x, 0, gate.z]} rotation={[0, gate.forwardAngle, 0]}>
      {/* Left Base Pillar */}
      <mesh position={[-width - 0.35, gateH / 2, 0]}>
        <boxGeometry args={[0.55, gateH, 0.55]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Left Neon Strip */}
      <mesh position={[-width - 0.35, gateH / 2, 0]}>
        <boxGeometry args={[0.62, gateH * 0.9, 0.12]} />
        <meshBasicMaterial color={pillarColor} />
      </mesh>

      {/* Right Base Pillar */}
      <mesh position={[width + 0.35, gateH / 2, 0]}>
        <boxGeometry args={[0.55, gateH, 0.55]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Right Neon Strip */}
      <mesh position={[width + 0.35, gateH / 2, 0]}>
        <boxGeometry args={[0.62, gateH * 0.9, 0.12]} />
        <meshBasicMaterial color={pillarColor} />
      </mesh>

      {/* Overhead Lintel Crossbeam */}
      <mesh position={[0, gateH + 0.2, 0]}>
        <boxGeometry args={[gateW + 1.2, 0.45, 0.65]} />
        <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Overhead Glowing Strip */}
      <mesh position={[0, gateH + 0.2, 0]}>
        <boxGeometry args={[gateW + 0.8, 0.18, 0.72]} />
        <meshBasicMaterial color={glowColor} />
      </mesh>

      {/* Holographic Drive-Through Portal Curtain */}
      <mesh position={[0, gateH / 2, 0]}>
        <planeGeometry args={[gateW, gateH - 0.2]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={isTarget ? 0.25 : 0.06}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export function Track3D({ activeGate }: { activeGate: number }) {
  const L = TRACK_CONFIG.straightLength / 2;
  const R = TRACK_CONFIG.curveRadius;
  const W = TRACK_CONFIG.halfWidth;

  // Track outer loop geometry
  const trackShape = useMemo(() => {
    const shape = new THREE.Shape();
    const outerR = R + W;
    const innerR = R - W;

    // Outer boundary
    shape.moveTo(-L, -outerR);
    shape.lineTo(L, -outerR);
    shape.absarc(L, 0, outerR, -Math.PI / 2, Math.PI / 2, false);
    shape.lineTo(-L, outerR);
    shape.absarc(-L, 0, outerR, Math.PI / 2, -Math.PI / 2, false);

    // Inner hole path
    const hole = new THREE.Path();
    hole.moveTo(-L, -innerR);
    hole.absarc(-L, 0, innerR, -Math.PI / 2, Math.PI / 2, true);
    hole.lineTo(L, innerR);
    hole.absarc(L, 0, innerR, Math.PI / 2, -Math.PI / 2, true);
    hole.lineTo(-L, -innerR);

    shape.holes.push(hole);
    return shape;
  }, [L, R, W]);

  // Infield grass shape
  const infieldShape = useMemo(() => {
    const shape = new THREE.Shape();
    const innerR = R - W;
    shape.moveTo(-L, -innerR);
    shape.lineTo(L, -innerR);
    shape.absarc(L, 0, innerR, -Math.PI / 2, Math.PI / 2, false);
    shape.lineTo(-L, innerR);
    shape.absarc(-L, 0, innerR, Math.PI / 2, -Math.PI / 2, false);
    return shape;
  }, [L, R, W]);

  return (
    <group>
      {/* Dark Ambient Ground Plane with Cyber Grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <planeGeometry args={[520, 520]} />
        <meshStandardMaterial color="#020617" roughness={0.98} metalness={0.02} />
      </mesh>

      {/* Lush Infield Turf */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <shapeGeometry args={[infieldShape]} />
        <meshStandardMaterial color="#022c22" roughness={0.92} metalness={0.08} />
      </mesh>

      {/* Main Asphalt Tarmac Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <shapeGeometry args={[trackShape]} />
        <meshStandardMaterial color="#1e293b" roughness={0.65} metalness={0.2} />
      </mesh>

      {/* Start / Finish Checkered Grid */}
      <group position={[0, 0.04, -R]}>
        {[...Array(16)].map((_, i) => (
          <mesh
            key={`grid-${i}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[-W + 1 + i, 0, 0]}
          >
            <planeGeometry args={[0.92, 1.6]} />
            <meshBasicMaterial color={i % 2 === 0 ? "#ffffff" : "#090d16"} />
          </mesh>
        ))}
      </group>

      {/* Start Grid Stalls along Start Straight */}
      {[-6, -14, -22, -30].map((stallX, idx) => (
        <group key={`stall-${idx}`} position={[stallX, 0.038, -R]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[idx % 2 === 0 ? -2.5 : 2.5, 0, 0]}>
            <planeGeometry args={[2.8, 4.2]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
          </mesh>
        </group>
      ))}

      {/* Dashed White Centerlines along Straights */}
      {[-L + 4, 0, L - 4].map((dashX, i) => (
        <group key={`dash-${i}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[dashX, 0.04, -R]}>
            <planeGeometry args={[6.5, 0.35]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[dashX, 0.04, R]}>
            <planeGeometry args={[6.5, 0.35]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
          </mesh>
        </group>
      ))}

      {/* Curved Alternating Red/White Kerbs */}
      {[
        { x: L, r: R + W + 0.1, sign: 1 },
        { x: -L, r: R + W + 0.1, sign: -1 },
        { x: L, r: R - W - 0.1, sign: 1, inner: true },
        { x: -L, r: R - W - 0.1, sign: -1, inner: true },
      ].map((curb, cIdx) => (
        <group key={`curb-${cIdx}`} position={[curb.x, 0.045, 0]}>
          {[...Array(16)].map((_, i) => {
            const startAngle = -Math.PI / 2 + (i * Math.PI) / 16;
            const color = i % 2 === 0 ? "#ef4444" : "#ffffff";
            return (
              <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry
                  args={[curb.r - 0.6, curb.r + 0.2, 20, 1, startAngle * curb.sign, Math.PI / 16]}
                />
                <meshBasicMaterial color={color} side={THREE.DoubleSide} />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* Straight Kerbs on Both Straights */}
      {[-16, 0, 16].map((kx, idx) => (
        <group key={`straight-kerb-${idx}`}>
          {/* Top straight outer & inner */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[kx, 0.042, -R - W - 0.2]}>
            <planeGeometry args={[14, 0.5]} />
            <meshBasicMaterial color={idx % 2 === 0 ? "#ef4444" : "#ffffff"} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[kx, 0.042, -R + W + 0.2]}>
            <planeGeometry args={[14, 0.5]} />
            <meshBasicMaterial color={idx % 2 === 0 ? "#ef4444" : "#ffffff"} />
          </mesh>
          {/* Bottom straight outer & inner */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[kx, 0.042, R + W + 0.2]}>
            <planeGeometry args={[14, 0.5]} />
            <meshBasicMaterial color={idx % 2 === 0 ? "#ef4444" : "#ffffff"} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[kx, 0.042, R - W - 0.2]}>
            <planeGeometry args={[14, 0.5]} />
            <meshBasicMaterial color={idx % 2 === 0 ? "#ef4444" : "#ffffff"} />
          </mesh>
        </group>
      ))}

      {/* ================= CONTINUOUS CYBER NEON BARRIERS ================= */}
      {/* 1. Straight Outer & Inner Neon Barrier Rails */}
      {/* Top Straight Outer */}
      <mesh position={[0, 0.5, -R - W - 0.95]}>
        <boxGeometry args={[L * 2, 0.65, 0.2]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>
      {/* Top Straight Inner */}
      <mesh position={[0, 0.5, -R + W + 0.95]}>
        <boxGeometry args={[L * 2, 0.65, 0.2]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>
      {/* Bottom Straight Outer */}
      <mesh position={[0, 0.5, R + W + 0.95]}>
        <boxGeometry args={[L * 2, 0.65, 0.2]} />
        <meshBasicMaterial color="#ec4899" />
      </mesh>
      {/* Bottom Straight Inner */}
      <mesh position={[0, 0.5, R - W - 0.95]}>
        <boxGeometry args={[L * 2, 0.65, 0.2]} />
        <meshBasicMaterial color="#ec4899" />
      </mesh>

      {/* 2. Curved Outer & Inner Neon Barrier Rails */}
      {/* Turn 1 (Right Loop) Outer Rail */}
      <group position={[L, 0.5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R + W + 0.85, R + W + 1.05, 48, 1, -Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Turn 1 (Right Loop) Inner Rail */}
      <group position={[L, 0.5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R - W - 1.05, R - W - 0.85, 48, 1, -Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Turn 2 (Left Loop) Outer Rail */}
      <group position={[-L, 0.5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R + W + 0.85, R + W + 1.05, 48, 1, Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#ec4899" side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Turn 2 (Left Loop) Inner Rail */}
      <group position={[-L, 0.5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R - W - 1.05, R - W - 0.85, 48, 1, Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#ec4899" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Start / Finish Overhead Gantry Archway (Gate 0) */}
      <group position={[0, 0, -R]}>
        {/* Support Trusses */}
        <mesh position={[-W - 1.2, 3.8, 0]}>
          <boxGeometry args={[0.7, 7.6, 0.7]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[W + 1.2, 3.8, 0]}>
          <boxGeometry args={[0.7, 7.6, 0.7]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Overhead Digital Display Banner */}
        <mesh position={[0, 7.2, 0]}>
          <boxGeometry args={[W * 2 + 3.2, 1.4, 0.9]} />
          <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* Neon Front Facade */}
        <mesh position={[0, 7.2, 0.48]}>
          <planeGeometry args={[W * 2 + 2.8, 1.1]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} />
        </mesh>
        {/* Starting Traffic Lights */}
        {[-3.6, -1.2, 1.2, 3.6].map((tx, idx) => (
          <mesh key={`light-${idx}`} position={[tx, 6.2, 0]}>
            <sphereGeometry args={[0.26, 16, 16]} />
            <meshBasicMaterial color={idx < 3 ? "#ef4444" : "#22c55e"} />
          </mesh>
        ))}
      </group>

      {/* Futuristic Grounded Cyber Gates (Checkpoints 1 to 7) */}
      {TRACK_GATES.filter((g) => g.index !== 0).map((gate) => (
        <CyberGateArch
          key={`gate-${gate.index}`}
          gate={gate}
          isTarget={gate.index === activeGate}
          width={W}
        />
      ))}

      {/* Stadium Floodlight Towers */}
      {[
        [-L - 14, -R - 18],
        [L + 14, -R - 18],
        [-L - 14, R + 18],
        [L + 14, R + 18],
      ].map(([fx, fz], fIdx) => (
        <group key={`floodlight-${fIdx}`} position={[fx, 0, fz]}>
          {/* Metal Tower Pole */}
          <mesh position={[0, 9, 0]}>
            <cylinderGeometry args={[0.35, 0.65, 18, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.85} />
          </mesh>
          {/* Light Fixture Bank */}
          <mesh position={[0, 18.2, 0]}>
            <boxGeometry args={[4.2, 1.6, 1.8]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <pointLight position={[0, 17.5, 0]} intensity={1.5} distance={100} color="#38bdf8" />
        </group>
      ))}
    </group>
  );
}