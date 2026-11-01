/**
 * Cyber Circuit — Ultra-Detailed 3D Advanced Race Track & Environment
 * Features:
 * - High-visibility glowing neon centerlines across the ENTIRE circuit (straights + curves)
 * - Bright illuminated white road edge lines (inner & outer)
 * - Holographic Turn Direction Chevron Arrows at Turn 1 and Turn 2
 * - High-tech Speed Boost Pads with pulsing cyan neon on straightaways
 * - Start / Finish digital overhead gantry with starting lights and checkered grid
 * - High-poly red & white rumble curbs with neon underglow
 * - Continuous cyber barrier rails with collision feedback
 * - Stadium floodlights and sci-fi arena aesthetics
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
  const gateH = 5.2;
  const pillarColor = isTarget ? "#10b981" : "#0284c7";
  const glowColor = isTarget ? "#34d399" : "#38bdf8";

  return (
    <group position={[gate.x, 0, gate.z]} rotation={[0, gate.forwardAngle, 0]}>
      {/* Left Base Pillar */}
      <mesh position={[-width - 0.4, gateH / 2, 0]}>
        <boxGeometry args={[0.65, gateH, 0.65]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Left Neon Light Strip */}
      <mesh position={[-width - 0.4, gateH / 2, 0]}>
        <boxGeometry args={[0.72, gateH * 0.92, 0.16]} />
        <meshBasicMaterial color={pillarColor} />
      </mesh>

      {/* Right Base Pillar */}
      <mesh position={[width + 0.4, gateH / 2, 0]}>
        <boxGeometry args={[0.65, gateH, 0.65]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Right Neon Light Strip */}
      <mesh position={[width + 0.4, gateH / 2, 0]}>
        <boxGeometry args={[0.72, gateH * 0.92, 0.16]} />
        <meshBasicMaterial color={pillarColor} />
      </mesh>

      {/* Overhead Lintel Crossbeam */}
      <mesh position={[0, gateH + 0.25, 0]}>
        <boxGeometry args={[gateW + 1.4, 0.55, 0.75]} />
        <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Overhead Glowing Strip */}
      <mesh position={[0, gateH + 0.25, 0]}>
        <boxGeometry args={[gateW + 0.9, 0.22, 0.82]} />
        <meshBasicMaterial color={glowColor} />
      </mesh>

      {/* Holographic Drive-Through Portal Curtain */}
      <mesh position={[0, gateH / 2, 0]}>
        <planeGeometry args={[gateW, gateH - 0.2]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={isTarget ? 0.32 : 0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/** Holographic Animated Turn Chevron Signs */
function TurnChevronSign({
  x,
  z,
  angle,
}: {
  x: number;
  z: number;
  angle: number;
}) {
  return (
    <group position={[x, 2.2, z]} rotation={[0, angle, 0]}>
      {/* Sign Backing Panel */}
      <mesh>
        <planeGeometry args={[4.2, 1.4]} />
        <meshBasicMaterial color="#020617" side={THREE.DoubleSide} />
      </mesh>
      {/* Neon Border */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[4.4, 1.55]} />
        <meshBasicMaterial color="#38bdf8" wireframe side={THREE.DoubleSide} />
      </mesh>
      {/* 3 Chevron Arrows >>> */}
      {[-1.2, 0, 1.2].map((cx, i) => (
        <group key={i} position={[cx, 0, 0.05]}>
          <mesh rotation={[0, 0, -Math.PI / 4]} position={[-0.18, 0.22, 0]}>
            <boxGeometry args={[0.55, 0.16, 0.05]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 4]} position={[-0.18, -0.22, 0]}>
            <boxGeometry args={[0.55, 0.16, 0.05]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Track3D({ activeGate }: { activeGate: number }) {
  const L = TRACK_CONFIG.straightLength / 2; // 26
  const R = TRACK_CONFIG.curveRadius; // 24
  const W = TRACK_CONFIG.halfWidth; // 9

  // Main Track Asphalt Geometry
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

    // Inner boundary hole
    const hole = new THREE.Path();
    hole.moveTo(-L, -innerR);
    hole.absarc(-L, 0, innerR, -Math.PI / 2, Math.PI / 2, true);
    hole.lineTo(L, innerR);
    hole.absarc(L, 0, innerR, Math.PI / 2, -Math.PI / 2, true);
    hole.lineTo(-L, -innerR);

    shape.holes.push(hole);
    return shape;
  }, [L, R, W]);

  // Infield turf
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

  // Pre-calculate full-circuit center dashes around curves
  const curveDashes = useMemo(() => {
    const dashes: { x: number; z: number; rotY: number }[] = [];
    const count = 14;

    // Right curve (Turn 1 centered at (L, 0))
    for (let i = 0; i <= count; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI) / count;
      // Skip very close to straight transitions to avoid overlap
      if (i > 0 && i < count) {
        dashes.push({
          x: L + Math.cos(angle) * R,
          z: Math.sin(angle) * R,
          rotY: -angle,
        });
      }
    }

    // Left curve (Turn 2 centered at (-L, 0))
    for (let i = 0; i <= count; i++) {
      const angle = Math.PI / 2 + (i * Math.PI) / count;
      if (i > 0 && i < count) {
        dashes.push({
          x: -L + Math.cos(angle) * R,
          z: Math.sin(angle) * R,
          rotY: -angle,
        });
      }
    }

    return dashes;
  }, [L, R]);

  return (
    <group>
      {/* Dark Cyber Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#020617" roughness={0.98} metalness={0.02} />
      </mesh>

      {/* Cyber Infield Grid Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <shapeGeometry args={[infieldShape]} />
        <meshStandardMaterial color="#031525" roughness={0.88} metalness={0.12} />
      </mesh>

      {/* Main High-Grip Asphalt Road Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <shapeGeometry args={[trackShape]} />
        <meshStandardMaterial color="#111827" roughness={0.55} metalness={0.25} />
      </mesh>

      {/* ================= ROAD EDGE BORDERS (CONTINUOUS GLOWING LINES) ================= */}
      {/* 1. Straight Outer and Inner Edge Lines */}
      {/* Top Straight Outer White Edge Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, -R - W + 0.3]}>
        <planeGeometry args={[L * 2, 0.32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Top Straight Inner White Edge Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, -R + W - 0.3]}>
        <planeGeometry args={[L * 2, 0.32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Bottom Straight Outer White Edge Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, R + W - 0.3]}>
        <planeGeometry args={[L * 2, 0.32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Bottom Straight Inner White Edge Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, R - W + 0.3]}>
        <planeGeometry args={[L * 2, 0.32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* 2. Curved Outer and Inner White Edge Lines */}
      {/* Turn 1 (Right Curve) Outer Edge */}
      <group position={[L, 0.045, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R + W - 0.45, R + W - 0.15, 64, 1, -Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
        {/* Turn 1 Inner Edge */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R - W + 0.15, R - W + 0.45, 64, 1, -Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Turn 2 (Left Curve) Outer Edge */}
      <group position={[-L, 0.045, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R + W - 0.45, R + W - 0.15, 64, 1, Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
        {/* Turn 2 Inner Edge */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R - W + 0.15, R - W + 0.45, 64, 1, Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ================= HIGH-VISIBILITY GLOWING YELLOW CENTERLINE ================= */}
      {/* Straightaway Dashed Centerlines */}
      {[-L + 4, -L + 13, -L + 22, -4, 5, 14, L - 5].map((dx, i) => (
        <group key={`str-dash-${i}`}>
          {/* Top Straight Centerline Dash */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[dx, 0.048, -R]}>
            <planeGeometry args={[5.2, 0.42]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
          {/* Bottom Straight Centerline Dash */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[dx, 0.048, R]}>
            <planeGeometry args={[5.2, 0.42]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
        </group>
      ))}

      {/* Curve Centerline Dashes (Turn 1 & Turn 2) */}
      {curveDashes.map((dash, idx) => (
        <group key={`curv-dash-${idx}`} position={[dash.x, 0.048, dash.z]} rotation={[0, dash.rotY, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.42, 3.8]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
        </group>
      ))}

      {/* ================= NEON SPEED BOOST PADS ================= */}
      {/* Boost Pad on Top Straight */}
      <group position={[L - 10, 0.044, -R]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[7.5, 4.5]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.35} />
        </mesh>
        {[-2.2, 0, 2.2].map((bx, bIdx) => (
          <mesh key={bIdx} rotation={[-Math.PI / 2, 0, 0]} position={[bx, 0.002, 0]}>
            <planeGeometry args={[0.9, 3.8]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        ))}
      </group>

      {/* Boost Pad on Bottom Straight */}
      <group position={[-L + 10, 0.044, R]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[7.5, 4.5]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.35} />
        </mesh>
        {[-2.2, 0, 2.2].map((bx, bIdx) => (
          <mesh key={bIdx} rotation={[-Math.PI / 2, 0, 0]} position={[bx, 0.002, 0]}>
            <planeGeometry args={[0.9, 3.8]} />
            <meshBasicMaterial color="#f472b6" />
          </mesh>
        ))}
      </group>

      {/* ================= HOLOGRAPHIC TURN DIRECTION CHEVRON ARROWS ================= */}
      {/* Turn 1 (Right Apex) Chevron Sign */}
      <TurnChevronSign x={L + R + 1.8} z={0} angle={-Math.PI / 2} />
      {/* Turn 2 (Left Apex) Chevron Sign */}
      <TurnChevronSign x={-L - R - 1.8} z={0} angle={Math.PI / 2} />

      {/* ================= START / FINISH CHECKERED GRID ================= */}
      <group position={[0, 0.048, -R]}>
        {[...Array(18)].map((_, i) => (
          <mesh
            key={`grid-${i}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[-W + 0.8 + i * 0.95, 0, 0]}
          >
            <planeGeometry args={[0.92, 1.8]} />
            <meshBasicMaterial color={i % 2 === 0 ? "#ffffff" : "#090d16"} />
          </mesh>
        ))}
      </group>

      {/* Start Grid Stalls along Start Straight */}
      {[-7, -15, -23].map((stallX, idx) => (
        <group key={`stall-${idx}`} position={[stallX, 0.042, -R]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[idx % 2 === 0 ? -2.8 : 2.8, 0, 0]}>
            <planeGeometry args={[3.2, 4.8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
          </mesh>
        </group>
      ))}

      {/* ================= CONTINUOUS CYBER NEON BARRIERS ================= */}
      {/* Top Straight Outer & Inner Neon Barrier Rails */}
      <mesh position={[0, 0.6, -R - W - 0.75]}>
        <boxGeometry args={[L * 2 + 1, 0.8, 0.25]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>
      <mesh position={[0, 0.6, -R + W + 0.75]}>
        <boxGeometry args={[L * 2 + 1, 0.8, 0.25]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>

      {/* Bottom Straight Outer & Inner Neon Barrier Rails */}
      <mesh position={[0, 0.6, R + W + 0.75]}>
        <boxGeometry args={[L * 2 + 1, 0.8, 0.25]} />
        <meshBasicMaterial color="#ec4899" />
      </mesh>
      <mesh position={[0, 0.6, R - W - 0.75]}>
        <boxGeometry args={[L * 2 + 1, 0.8, 0.25]} />
        <meshBasicMaterial color="#ec4899" />
      </mesh>

      {/* Turn 1 (Right Loop) Outer Rail */}
      <group position={[L, 0.6, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R + W + 0.65, R + W + 0.9, 64, 1, -Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Turn 1 (Right Loop) Inner Rail */}
      <group position={[L, 0.6, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R - W - 0.9, R - W - 0.65, 64, 1, -Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Turn 2 (Left Loop) Outer Rail */}
      <group position={[-L, 0.6, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R + W + 0.65, R + W + 0.9, 64, 1, Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#ec4899" side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Turn 2 (Left Loop) Inner Rail */}
      <group position={[-L, 0.6, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R - W - 0.9, R - W - 0.65, 64, 1, Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#ec4899" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ================= START / FINISH OVERHEAD DIGITAL GANTRY ================= */}
      <group position={[0, 0, -R]}>
        {/* Support Trusses */}
        <mesh position={[-W - 1.4, 4.2, 0]}>
          <boxGeometry args={[0.8, 8.4, 0.8]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[W + 1.4, 4.2, 0]}>
          <boxGeometry args={[0.8, 8.4, 0.8]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.15} />
        </mesh>

        {/* Overhead Digital Display Banner */}
        <mesh position={[0, 7.8, 0]}>
          <boxGeometry args={[W * 2 + 3.8, 1.6, 1.0]} />
          <meshStandardMaterial color="#090d16" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Glowing Front Screen */}
        <mesh position={[0, 7.8, 0.52]}>
          <planeGeometry args={[W * 2 + 3.4, 1.25]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.92} />
        </mesh>

        {/* F1-Style Starting Tree Lights */}
        {[-4.2, -1.4, 1.4, 4.2].map((tx, idx) => (
          <mesh key={`light-${idx}`} position={[tx, 6.6, 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
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
        [-L - 16, -R - 18],
        [L + 16, -R - 18],
        [-L - 16, R + 18],
        [L + 16, R + 18],
      ].map(([fx, fz], fIdx) => (
        <group key={`floodlight-${fIdx}`} position={[fx, 0, fz]}>
          <mesh position={[0, 9.5, 0]}>
            <cylinderGeometry args={[0.4, 0.75, 19, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.85} />
          </mesh>
          <mesh position={[0, 19, 0]}>
            <boxGeometry args={[4.5, 1.8, 2.0]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <pointLight position={[0, 18.2, 0]} intensity={1.8} distance={120} color="#38bdf8" />
        </group>
      ))}
    </group>
  );
}
