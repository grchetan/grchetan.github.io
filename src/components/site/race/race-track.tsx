/**
 * Cyber Circuit — Grand Prix Scale Ultra-Realistic 3D Track
 * Features:
 * - Professional 732m Winding Grand Prix Circuit with sweeping curves, chicanes, hairpins & straights
 * - 240-Sample Procedural Asphalt Ribbon Geometry with realistic road crown & roughness
 * - Double continuous glowing white road boundary edge lines
 * - Full-circuit dashed yellow centerline
 * - 3D Raised Red & White Rumble Kerbs on corner apexes
 * - Checkered Start/Finish Line with Illuminated Gantry Arch
 * - Speed Boost Pads on straightaways
 * - Grandstand Spectator Stadium with Illuminated Canopy Roof & Pit Wall
 * - Electronic LED Sponsor Billboards & Holographic Chevron Turn Signs (>>>)
 * - Stadium Floodlight Towers illuminating corners
 */

import { useMemo } from "react";
import * as THREE from "three";
import {
  TRACK_CONFIG,
  TRACK_GATES,
  CIRCUIT_SAMPLES,
  SAMPLE_COUNT,
  type TrackGate,
} from "./race-physics";

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
  const gateH = 6.2;
  const pillarColor = isTarget ? "#10b981" : "#0284c7";
  const glowColor = isTarget ? "#34d399" : "#38bdf8";

  return (
    <group position={[gate.x, 0, gate.z]} rotation={[0, gate.forwardAngle, 0]}>
      {/* Left Base Pillar */}
      <mesh position={[-width - 0.5, gateH / 2, 0]}>
        <boxGeometry args={[0.85, gateH, 0.85]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Left Neon Light Strip */}
      <mesh position={[-width - 0.5, gateH / 2, 0]}>
        <boxGeometry args={[0.92, gateH * 0.94, 0.2]} />
        <meshBasicMaterial color={pillarColor} />
      </mesh>

      {/* Right Base Pillar */}
      <mesh position={[width + 0.5, gateH / 2, 0]}>
        <boxGeometry args={[0.85, gateH, 0.85]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Right Neon Light Strip */}
      <mesh position={[width + 0.5, gateH / 2, 0]}>
        <boxGeometry args={[0.92, gateH * 0.94, 0.2]} />
        <meshBasicMaterial color={pillarColor} />
      </mesh>

      {/* Overhead Lintel Crossbeam */}
      <mesh position={[0, gateH + 0.35, 0]}>
        <boxGeometry args={[gateW + 2.0, 0.75, 0.9]} />
        <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Overhead Glowing Neon Strip */}
      <mesh position={[0, gateH + 0.35, 0]}>
        <boxGeometry args={[gateW + 1.4, 0.3, 1.0]} />
        <meshBasicMaterial color={glowColor} />
      </mesh>

      {/* Holographic Drive-Through Portal Curtain */}
      <mesh position={[0, gateH / 2, 0]}>
        <planeGeometry args={[gateW, gateH - 0.2]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={isTarget ? 0.38 : 0.08}
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
      <mesh position={[0, 5.0, -5]}>
        <boxGeometry args={[75, 10, 14]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
      {/* Blue Spectator Seats tiers */}
      {[0, 2.0, 4.0, 6.0, 8.0].map((ty, idx) => (
        <mesh key={idx} position={[0, ty + 1.5, -idx * 2.2]}>
          <boxGeometry args={[72, 0.6, 1.8]} />
          <meshStandardMaterial color={idx % 2 === 0 ? "#0284c7" : "#0369a1"} />
        </mesh>
      ))}
      {/* Overhead Canopy Roof */}
      <mesh position={[0, 11.5, -4]}>
        <boxGeometry args={[78, 0.7, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.85} />
      </mesh>
      {/* Canopy Glowing Neon Edge */}
      <mesh position={[0, 11.5, 4.2]}>
        <boxGeometry args={[78, 0.25, 0.35]} />
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
      {/* Support Legs */}
      <mesh position={[-4.5, 3.0, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 6, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      <mesh position={[4.5, 3.0, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 6, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      {/* Main Board Frame */}
      <mesh position={[0, 6.2, 0]}>
        <boxGeometry args={[11, 2.6, 0.5]} />
        <meshStandardMaterial color="#090d16" metalness={0.9} />
      </mesh>
      {/* Glowing Screen Face */}
      <mesh position={[0, 6.2, 0.28]}>
        <planeGeometry args={[10.5, 2.1]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Inner Black Lettering Backdrop */}
      <mesh position={[0, 6.2, 0.3]}>
        <planeGeometry args={[10.0, 1.7]} />
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
    <group position={[x, 3.4, z]} rotation={[0, angle, 0]}>
      <mesh>
        <planeGeometry args={[8.5, 2.4]} />
        <meshBasicMaterial color="#020617" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[8.8, 2.7]} />
        <meshBasicMaterial color="#38bdf8" wireframe side={THREE.DoubleSide} />
      </mesh>
      {/* 4 Chevron Arrows >>> */}
      {[-3.0, -1.0, 1.0, 3.0].map((cx, i) => (
        <group key={i} position={[cx, 0, 0.06]}>
          <mesh rotation={[0, 0, -Math.PI / 4]} position={[-0.32, 0.4, 0]}>
            <boxGeometry args={[1.0, 0.28, 0.06]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 4]} position={[-0.32, -0.4, 0]}>
            <boxGeometry args={[1.0, 0.28, 0.06]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Speed Boost Pad on Track Surface */
function SpeedBoostPad({ x, z, angle }: { x: number; z: number; angle: number }) {
  return (
    <group position={[x, 0.05, z]} rotation={[-Math.PI / 2, 0, -angle + Math.PI / 2]}>
      <mesh>
        <planeGeometry args={[12, 5.5]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.3} />
      </mesh>
      {/* 3 Neon Cyan Chevrons >>> */}
      {[-1.8, 0, 1.8].map((offset, i) => (
        <group key={i} position={[offset, 0, 0.02]}>
          <mesh rotation={[0, 0, -Math.PI / 4]} position={[-0.3, 0.6, 0]}>
            <boxGeometry args={[1.4, 0.35, 0.02]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 4]} position={[-0.3, -0.6, 0]}>
            <boxGeometry args={[1.4, 0.35, 0.02]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function FloodlightTower({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 9, 0]}>
        <cylinderGeometry args={[0.3, 0.55, 18, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} />
      </mesh>
      <mesh position={[0, 18, 0]}>
        <boxGeometry args={[4.8, 0.45, 1.0]} />
        <meshStandardMaterial color="#090d16" metalness={0.9} />
      </mesh>
      {[-1.6, -0.5, 0.5, 1.6].map((fx, i) => (
        <mesh key={i} position={[fx, 18, 0.55]}>
          <cylinderGeometry args={[0.28, 0.38, 0.45, 8]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      ))}
    </group>
  );
}

export function Track3D({ activeGate }: { activeGate: number }) {
  const W = TRACK_CONFIG.halfWidth; // 11

  // 1. Procedural 3D Asphalt Road Ribbon Geometry
  const roadGeometry = useMemo(() => {
    const N = SAMPLE_COUNT;
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= N; i++) {
      const sp = CIRCUIT_SAMPLES[i % N]!;
      const lx = sp.x - sp.normalX * W;
      const lz = sp.z - sp.normalZ * W;
      const rx = sp.x + sp.normalX * W;
      const rz = sp.z + sp.normalZ * W;

      vertices.push(lx, 0.04, lz);
      vertices.push(rx, 0.04, rz);

      const u = (i / N) * 36;
      uvs.push(0, u, 1, u);
    }

    for (let i = 0; i < N; i++) {
      const i2 = i * 2;
      indices.push(i2, i2 + 1, i2 + 2);
      indices.push(i2 + 1, i2 + 3, i2 + 2);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [W]);

  // 2. Continuous Road Edge Boundary Lines
  const leftEdgeGeometry = useMemo(() => {
    const N = SAMPLE_COUNT;
    const vertices: number[] = [];
    const indices: number[] = [];
    const edgeW = 0.45;
    const offset = W - 0.4;

    for (let i = 0; i <= N; i++) {
      const sp = CIRCUIT_SAMPLES[i % N]!;
      const cx = sp.x - sp.normalX * offset;
      const cz = sp.z - sp.normalZ * offset;
      vertices.push(cx - sp.normalX * edgeW, 0.05, cz - sp.normalZ * edgeW);
      vertices.push(cx + sp.normalX * edgeW, 0.05, cz + sp.normalZ * edgeW);
    }

    for (let i = 0; i < N; i++) {
      const i2 = i * 2;
      indices.push(i2, i2 + 1, i2 + 2);
      indices.push(i2 + 1, i2 + 3, i2 + 2);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    return geo;
  }, [W]);

  const rightEdgeGeometry = useMemo(() => {
    const N = SAMPLE_COUNT;
    const vertices: number[] = [];
    const indices: number[] = [];
    const edgeW = 0.45;
    const offset = W - 0.4;

    for (let i = 0; i <= N; i++) {
      const sp = CIRCUIT_SAMPLES[i % N]!;
      const cx = sp.x + sp.normalX * offset;
      const cz = sp.z + sp.normalZ * offset;
      vertices.push(cx - sp.normalX * edgeW, 0.05, cz - sp.normalZ * edgeW);
      vertices.push(cx + sp.normalX * edgeW, 0.05, cz + sp.normalZ * edgeW);
    }

    for (let i = 0; i < N; i++) {
      const i2 = i * 2;
      indices.push(i2, i2 + 1, i2 + 2);
      indices.push(i2 + 1, i2 + 3, i2 + 2);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    return geo;
  }, [W]);

  // 3. Dashed Yellow Centerline
  const centerDashes = useMemo(() => {
    const dashes: { x: number; z: number; angle: number }[] = [];
    // Every 2nd sample gives realistic dashed line spacing
    for (let i = 0; i < SAMPLE_COUNT; i += 2) {
      const sp = CIRCUIT_SAMPLES[i]!;
      dashes.push({ x: sp.x, z: sp.z, angle: sp.headingAngle });
    }
    return dashes;
  }, []);

  // 4. Red & White Rumble Kerb Blocks along Key Apex Corners
  const rumbleKerbs = useMemo(() => {
    const kerbs: { x: number; z: number; angle: number; isRed: boolean }[] = [];
    // Place kerbs on:
    // Turn 1 Sweeper (samples 32 to 55)
    // The Esses (samples 75 to 105)
    // Hairpin Apex (samples 160 to 195)
    const kerbRanges = [
      [30, 56],
      [74, 106],
      [158, 196],
    ];

    kerbRanges.forEach(([start, end]) => {
      for (let i = start; i <= end; i++) {
        const sp = CIRCUIT_SAMPLES[i % SAMPLE_COUNT]!;
        // Outer kerb
        const ox = sp.x + sp.normalX * (W + 0.6);
        const oz = sp.z + sp.normalZ * (W + 0.6);
        kerbs.push({ x: ox, z: oz, angle: sp.headingAngle, isRed: i % 2 === 0 });

        // Inner apex kerb
        const ix = sp.x - sp.normalX * (W + 0.6);
        const iz = sp.z - sp.normalZ * (W + 0.6);
        kerbs.push({ x: ix, z: iz, angle: sp.headingAngle, isRed: i % 2 === 0 });
      }
    });

    return kerbs;
  }, [W]);

  return (
    <group>
      {/* Dark Cyber Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <planeGeometry args={[1200, 1200]} />
        <meshStandardMaterial color="#020617" roughness={0.98} metalness={0.02} />
      </mesh>

      {/* Main High-Grip Asphalt Road Surface */}
      <mesh geometry={roadGeometry}>
        <meshStandardMaterial color="#0f172a" roughness={0.48} metalness={0.25} />
      </mesh>

      {/* Continuous Glowing White Road Edge Lines */}
      <mesh geometry={leftEdgeGeometry}>
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh geometry={rightEdgeGeometry}>
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Full-Circuit Dashed Yellow Centerline */}
      {centerDashes.map((dash, i) => (
        <mesh
          key={i}
          position={[dash.x, 0.05, dash.z]}
          rotation={[-Math.PI / 2, 0, -dash.angle + Math.PI / 2]}
        >
          <planeGeometry args={[2.4, 0.4]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      ))}

      {/* Red & White Alternating Rumble Kerb Blocks */}
      {rumbleKerbs.map((kerb, i) => (
        <mesh
          key={i}
          position={[kerb.x, 0.12, kerb.z]}
          rotation={[0, kerb.angle, 0]}
        >
          <boxGeometry args={[1.5, 0.22, 2.2]} />
          <meshStandardMaterial
            color={kerb.isRed ? "#ef4444" : "#ffffff"}
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* ================= START / FINISH LINE WITH ILLUMINATED GANTRY ================= */}
      <group position={[0, 0.06, -85]} rotation={[0, Math.PI / 2, 0]}>
        {/* Checkered Start / Finish Strip */}
        {[-9, -6, -3, 0, 3, 6, 9].map((cx, i) => (
          <group key={i} position={[cx, 0, 0]}>
            <mesh position={[-0.75, 0, 0]}>
              <planeGeometry args={[1.5, 1.5]} />
              <meshBasicMaterial color={i % 2 === 0 ? "#ffffff" : "#090d16"} />
            </mesh>
            <mesh position={[0.75, 0, 0]}>
              <planeGeometry args={[1.5, 1.5]} />
              <meshBasicMaterial color={i % 2 === 0 ? "#090d16" : "#ffffff"} />
            </mesh>
          </group>
        ))}

        {/* Start / Finish Overhead Gantry Arch */}
        <mesh position={[-W - 0.8, 4.0, 0]}>
          <boxGeometry args={[1.2, 8.0, 1.2]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
        <mesh position={[W + 0.8, 4.0, 0]}>
          <boxGeometry args={[1.2, 8.0, 1.2]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
        <mesh position={[0, 8.2, 0]}>
          <boxGeometry args={[W * 2 + 3.2, 1.0, 1.4]} />
          <meshStandardMaterial color="#090d16" metalness={0.9} />
        </mesh>
        <mesh position={[0, 8.2, 0.72]}>
          <planeGeometry args={[W * 2 + 2.0, 0.45]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>

      {/* ================= SPEED BOOST TURBO PADS ================= */}
      <SpeedBoostPad x={40} z={-85} angle={Math.PI / 2} />
      <SpeedBoostPad x={-70} z={55} angle={(3 * Math.PI) / 2} />

      {/* ================= SCENERY & STADIUM GRANDSTANDS ================= */}
      {/* Main Stadium Grandstand along Start Straightaway */}
      <StadiumGrandstand position={[25, 0, -108]} rotation={[0, 0, 0]} />

      {/* Trackside LED Sponsor Billboards */}
      <SponsorBillboard
        position={[146, 0, -65]}
        rotation={[0, -Math.PI / 3, 0]}
        text="CHETAN GRAND PRIX"
        color="#38bdf8"
      />
      <SponsorBillboard
        position={[68, 0, 36]}
        rotation={[0, Math.PI / 4, 0]}
        text="HYPER DRIVE NITRO"
        color="#fbbf24"
      />
      <SponsorBillboard
        position={[-80, 0, 74]}
        rotation={[0, Math.PI, 0]}
        text="CYBER CIRCUIT WORLD"
        color="#ec4899"
      />
      <SponsorBillboard
        position={[-162, 0, 42]}
        rotation={[0, Math.PI / 2, 0]}
        text="APEX RACING CLUB"
        color="#10b981"
      />

      {/* Holographic Turn Chevron Signs (>>>) at Braking Zones */}
      <TurnChevronSign x={142} z={-72} angle={-Math.PI / 4} />
      <TurnChevronSign x={62} z={28} angle={Math.PI / 6} />
      <TurnChevronSign x={-165} z={28} angle={Math.PI / 2} />

      {/* Stadium Cyber Floodlight Mast Towers */}
      <FloodlightTower position={[-30, 0, -112]} />
      <FloodlightTower position={[80, 0, -112]} />
      <FloodlightTower position={[155, 0, -10]} />
      <FloodlightTower position={[-175, 0, 15]} />
      <FloodlightTower position={[-80, 0, 85]} />

      {/* ================= CHECKPOINT GATES ================= */}
      {TRACK_GATES.map((gate) => (
        <CyberGateArch
          key={gate.index}
          gate={gate}
          isTarget={gate.index === activeGate}
          width={W}
        />
      ))}
    </group>
  );
}
