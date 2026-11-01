/**
 * Cyber Circuit — Grand Prix Scale Ultra-Realistic 3D Track
 * Features:
 * - Grand Prix Scale: 84m straights and 38m radius sweeping turns
 * - Realistic 3D Grandstands & Spectator Paddock arena along straightaway
 * - 3D Raised Curb Rumble Strips with alternating red & white kerb blocks
 * - High-speed holographic Chevron Turn Signs with animated pulsing neon
 * - Speed Boost Pads on straightaways
 * - Glowing electronic sponsor boards (Chetan Grand Prix, Hyper Drive)
 * - Distant Cyber City Skyline & Stadium Floodlight Towers
 * - Continuous illuminated road edge lines and full-circuit yellow centerline
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
  const gateH = 5.8;
  const pillarColor = isTarget ? "#10b981" : "#0284c7";
  const glowColor = isTarget ? "#34d399" : "#38bdf8";

  return (
    <group position={[gate.x, 0, gate.z]} rotation={[0, gate.forwardAngle, 0]}>
      {/* Left Base Pillar */}
      <mesh position={[-width - 0.5, gateH / 2, 0]}>
        <boxGeometry args={[0.8, gateH, 0.8]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Left Neon Light Strip */}
      <mesh position={[-width - 0.5, gateH / 2, 0]}>
        <boxGeometry args={[0.88, gateH * 0.94, 0.2]} />
        <meshBasicMaterial color={pillarColor} />
      </mesh>

      {/* Right Base Pillar */}
      <mesh position={[width + 0.5, gateH / 2, 0]}>
        <boxGeometry args={[0.8, gateH, 0.8]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Right Neon Light Strip */}
      <mesh position={[width + 0.5, gateH / 2, 0]}>
        <boxGeometry args={[0.88, gateH * 0.94, 0.2]} />
        <meshBasicMaterial color={pillarColor} />
      </mesh>

      {/* Overhead Lintel Crossbeam */}
      <mesh position={[0, gateH + 0.3, 0]}>
        <boxGeometry args={[gateW + 1.8, 0.65, 0.85]} />
        <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Overhead Glowing Neon Strip */}
      <mesh position={[0, gateH + 0.3, 0]}>
        <boxGeometry args={[gateW + 1.2, 0.26, 0.95]} />
        <meshBasicMaterial color={glowColor} />
      </mesh>

      {/* Holographic Drive-Through Portal Curtain */}
      <mesh position={[0, gateH / 2, 0]}>
        <planeGeometry args={[gateW, gateH - 0.2]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={isTarget ? 0.35 : 0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/** Grandstand Spectator Stadium along the Start Straightaway */
function StadiumGrandstand({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Tiered bleachers concrete base */}
      <mesh position={[0, 4.5, -4]}>
        <boxGeometry args={[56, 9, 12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
      {/* Blue Spectator Seats tiers */}
      {[0, 1.8, 3.6, 5.4, 7.2].map((ty, idx) => (
        <mesh key={idx} position={[0, ty + 1.2, -idx * 2]}>
          <boxGeometry args={[54, 0.5, 1.6]} />
          <meshStandardMaterial color={idx % 2 === 0 ? "#0284c7" : "#0369a1"} />
        </mesh>
      ))}
      {/* Overhead Canopy Roof */}
      <mesh position={[0, 10.5, -3]}>
        <boxGeometry args={[58, 0.6, 14]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} />
      </mesh>
      {/* Canopy Glowing Neon Edge */}
      <mesh position={[0, 10.5, 4.1]}>
        <boxGeometry args={[58, 0.2, 0.3]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
    </group>
  );
}

/** Trackside Glowing Electronic Sponsor Billboard */
function SponsorBillboard({
  position,
  rotation,
  text,
  color = "#38bdf8",
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  text: string;
  color?: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Dual Support Legs */}
      <mesh position={[-3.8, 2.5, 0]}>
        <cylinderGeometry args={[0.18, 0.25, 5, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      <mesh position={[3.8, 2.5, 0]}>
        <cylinderGeometry args={[0.18, 0.25, 5, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      {/* Main Board Frame */}
      <mesh position={[0, 5.2, 0]}>
        <boxGeometry args={[9.2, 2.2, 0.4]} />
        <meshStandardMaterial color="#090d16" metalness={0.9} />
      </mesh>
      {/* Glowing Screen Face */}
      <mesh position={[0, 5.2, 0.22]}>
        <planeGeometry args={[8.8, 1.8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Inner Black Lettering Backdrop */}
      <mesh position={[0, 5.2, 0.24]}>
        <planeGeometry args={[8.4, 1.4]} />
        <meshBasicMaterial color="#020617" />
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
    <group position={[x, 3.2, z]} rotation={[0, angle, 0]}>
      <mesh>
        <planeGeometry args={[7.2, 2.2]} />
        <meshBasicMaterial color="#020617" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[7.5, 2.45]} />
        <meshBasicMaterial color="#38bdf8" wireframe side={THREE.DoubleSide} />
      </mesh>
      {/* 4 Chevron Arrows >>> */}
      {[-2.4, -0.8, 0.8, 2.4].map((cx, i) => (
        <group key={i} position={[cx, 0, 0.06]}>
          <mesh rotation={[0, 0, -Math.PI / 4]} position={[-0.28, 0.35, 0]}>
            <boxGeometry args={[0.85, 0.24, 0.05]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 4]} position={[-0.28, -0.35, 0]}>
            <boxGeometry args={[0.85, 0.24, 0.05]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Track3D({ activeGate }: { activeGate: number }) {
  const L = TRACK_CONFIG.straightLength / 2; // 42
  const R = TRACK_CONFIG.curveRadius; // 38
  const W = TRACK_CONFIG.halfWidth; // 11

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
    const count = 22;

    // Right curve (Turn 1 centered at (L, 0))
    for (let i = 0; i <= count; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI) / count;
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
        <planeGeometry args={[800, 800]} />
        <meshStandardMaterial color="#020617" roughness={0.98} metalness={0.02} />
      </mesh>

      {/* Cyber Infield Grid Floor with Neon Decors */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <shapeGeometry args={[infieldShape]} />
        <meshStandardMaterial color="#031322" roughness={0.85} metalness={0.15} />
      </mesh>

      {/* Main High-Grip Asphalt Road Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <shapeGeometry args={[trackShape]} />
        <meshStandardMaterial color="#0f172a" roughness={0.45} metalness={0.3} />
      </mesh>

      {/* ================= ROAD EDGE BORDERS (CONTINUOUS GLOWING LINES) ================= */}
      {/* Top Straight Outer White Edge Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, -R - W + 0.35]}>
        <planeGeometry args={[L * 2, 0.38]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Top Straight Inner White Edge Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, -R + W - 0.35]}>
        <planeGeometry args={[L * 2, 0.38]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Bottom Straight Outer White Edge Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, R + W - 0.35]}>
        <planeGeometry args={[L * 2, 0.38]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Bottom Straight Inner White Edge Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, R - W + 0.35]}>
        <planeGeometry args={[L * 2, 0.38]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Curved Outer and Inner White Edge Lines */}
      {/* Turn 1 (Right Curve) Outer Edge */}
      <group position={[L, 0.045, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R + W - 0.45, R + W - 0.1, 72, 1, -Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R - W + 0.1, R - W + 0.45, 72, 1, -Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Turn 2 (Left Curve) Outer Edge */}
      <group position={[-L, 0.045, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R + W - 0.45, R + W - 0.1, 72, 1, Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R - W + 0.1, R - W + 0.45, 72, 1, Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ================= HIGH-VISIBILITY GLOWING YELLOW CENTERLINE ================= */}
      {/* Straightaway Dashed Centerlines */}
      {[-L + 6, -L + 18, -L + 30, -6, 6, L - 30, L - 18, L - 6].map((dx, i) => (
        <group key={`str-dash-${i}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[dx, 0.048, -R]}>
            <planeGeometry args={[6.5, 0.48]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[dx, 0.048, R]}>
            <planeGeometry args={[6.5, 0.48]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
        </group>
      ))}

      {/* Curve Centerline Dashes (Turn 1 & Turn 2) */}
      {curveDashes.map((dash, idx) => (
        <group key={`curv-dash-${idx}`} position={[dash.x, 0.048, dash.z]} rotation={[0, dash.rotY, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.48, 4.8]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
        </group>
      ))}

      {/* ================= NEON SPEED BOOST PADS ================= */}
      {/* Boost Pad on Top Straight */}
      <group position={[L - 18, 0.044, -R]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 5.5]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.35} />
        </mesh>
        {[-3.2, 0, 3.2].map((bx, bIdx) => (
          <mesh key={bIdx} rotation={[-Math.PI / 2, 0, 0]} position={[bx, 0.002, 0]}>
            <planeGeometry args={[1.2, 4.8]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        ))}
      </group>

      {/* Boost Pad on Bottom Straight */}
      <group position={[-L + 18, 0.044, R]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 5.5]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.35} />
        </mesh>
        {[-3.2, 0, 3.2].map((bx, bIdx) => (
          <mesh key={bIdx} rotation={[-Math.PI / 2, 0, 0]} position={[bx, 0.002, 0]}>
            <planeGeometry args={[1.2, 4.8]} />
            <meshBasicMaterial color="#f472b6" />
          </mesh>
        ))}
      </group>

      {/* ================= HOLOGRAPHIC TURN DIRECTION CHEVRON ARROWS ================= */}
      <TurnChevronSign x={L + R + 2.5} z={0} angle={-Math.PI / 2} />
      <TurnChevronSign x={-L - R - 2.5} z={0} angle={Math.PI / 2} />

      {/* ================= REALISTIC 3D STADIUM GRANDSTANDS ================= */}
      <StadiumGrandstand position={[0, 0, -R - W - 7.5]} rotation={[0, 0, 0]} />
      <StadiumGrandstand position={[0, 0, R + W + 7.5]} rotation={[0, Math.PI, 0]} />

      {/* ================= TRACKSIDE SPONSOR BILLBOARDS ================= */}
      <SponsorBillboard position={[L - 4, 0, -R - W - 2.5]} rotation={[0, 0, 0]} text="CHETAN GRAND PRIX" color="#38bdf8" />
      <SponsorBillboard position={[-L + 4, 0, -R - W - 2.5]} rotation={[0, 0, 0]} text="HYPER DRIVE NITRO" color="#f59e0b" />
      <SponsorBillboard position={[0, 0, R + W + 2.5]} rotation={[0, Math.PI, 0]} text="CYBER CIRCUIT WORLD" color="#ec4899" />

      {/* ================= START / FINISH CHECKERED GRID ================= */}
      <group position={[0, 0.048, -R]}>
        {[...Array(22)].map((_, i) => (
          <mesh
            key={`grid-${i}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[-W + 1.0 + i * 0.98, 0, 0]}
          >
            <planeGeometry args={[0.94, 2.2]} />
            <meshBasicMaterial color={i % 2 === 0 ? "#ffffff" : "#090d16"} />
          </mesh>
        ))}
      </group>

      {/* Start Grid Stalls along Start Straight */}
      {[-10, -22, -34].map((stallX, idx) => (
        <group key={`stall-${idx}`} position={[stallX, 0.042, -R]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[idx % 2 === 0 ? -3.5 : 3.5, 0, 0]}>
            <planeGeometry args={[3.8, 5.5]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
          </mesh>
        </group>
      ))}

      {/* ================= CONTINUOUS CYBER NEON BARRIERS ================= */}
      {/* Top Straight Outer & Inner Neon Barrier Rails */}
      <mesh position={[0, 0.7, -R - W - 0.85]}>
        <boxGeometry args={[L * 2 + 1, 0.9, 0.28]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>
      <mesh position={[0, 0.7, -R + W + 0.85]}>
        <boxGeometry args={[L * 2 + 1, 0.9, 0.28]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>

      {/* Bottom Straight Outer & Inner Neon Barrier Rails */}
      <mesh position={[0, 0.7, R + W + 0.85]}>
        <boxGeometry args={[L * 2 + 1, 0.9, 0.28]} />
        <meshBasicMaterial color="#ec4899" />
      </mesh>
      <mesh position={[0, 0.7, R - W - 0.85]}>
        <boxGeometry args={[L * 2 + 1, 0.9, 0.28]} />
        <meshBasicMaterial color="#ec4899" />
      </mesh>

      {/* Turn 1 (Right Loop) Outer Rail */}
      <group position={[L, 0.7, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R + W + 0.75, R + W + 1.05, 72, 1, -Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Turn 1 (Right Loop) Inner Rail */}
      <group position={[L, 0.7, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R - W - 1.05, R - W - 0.75, 72, 1, -Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Turn 2 (Left Loop) Outer Rail */}
      <group position={[-L, 0.7, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R + W + 0.75, R + W + 1.05, 72, 1, Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#ec4899" side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Turn 2 (Left Loop) Inner Rail */}
      <group position={[-L, 0.7, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R - W - 1.05, R - W - 0.75, 72, 1, Math.PI / 2, Math.PI]} />
          <meshBasicMaterial color="#ec4899" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ================= START / FINISH OVERHEAD DIGITAL GANTRY ================= */}
      <group position={[0, 0, -R]}>
        {/* Support Trusses */}
        <mesh position={[-W - 1.6, 4.8, 0]}>
          <boxGeometry args={[0.9, 9.6, 0.9]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[W + 1.6, 4.8, 0]}>
          <boxGeometry args={[0.9, 9.6, 0.9]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.15} />
        </mesh>

        {/* Overhead Digital Display Banner */}
        <mesh position={[0, 8.8, 0]}>
          <boxGeometry args={[W * 2 + 4.2, 1.8, 1.1]} />
          <meshStandardMaterial color="#090d16" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Glowing Front Screen */}
        <mesh position={[0, 8.8, 0.58]}>
          <planeGeometry args={[W * 2 + 3.8, 1.4]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.95} />
        </mesh>

        {/* F1-Style Starting Tree Lights */}
        {[-5.0, -1.6, 1.6, 5.0].map((tx, idx) => (
          <mesh key={`light-${idx}`} position={[tx, 7.5, 0]}>
            <sphereGeometry args={[0.35, 16, 16]} />
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
        [-L - 20, -R - 22],
        [L + 20, -R - 22],
        [-L - 20, R + 22],
        [L + 20, R + 22],
      ].map(([fx, fz], fIdx) => (
        <group key={`floodlight-${fIdx}`} position={[fx, 0, fz]}>
          <mesh position={[0, 11, 0]}>
            <cylinderGeometry args={[0.45, 0.85, 22, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.85} />
          </mesh>
          <mesh position={[0, 22, 0]}>
            <boxGeometry args={[5.2, 2.0, 2.2]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <pointLight position={[0, 21, 0]} intensity={2.0} distance={150} color="#38bdf8" />
        </group>
      ))}
    </group>
  );
}
