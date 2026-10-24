/**
 * Cyber Circuit — Ultra-Detailed 3D Track & Environment
 */

import { useMemo } from "react";
import * as THREE from "three";
import { TRACK_CONFIG, TRACK_GATES } from "./race-physics";

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
      {/* Dark Ambient Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <planeGeometry args={[480, 480]} />
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

      {/* Dashed White Centerlines */}
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

      {/* Glowing Neon Cyber Rail Barriers */}
      {[
        { x: L, r: R + W + 1.1, color: "#06b6d4", sign: 1 },
        { x: -L, r: R + W + 1.1, color: "#ec4899", sign: -1 },
      ].map((rail, rIdx) => (
        <group key={`neon-rail-${rIdx}`} position={[rail.x, 0.5, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[rail.r - 0.12, rail.r + 0.12, 64, 1, -Math.PI / 2, Math.PI]} />
            <meshBasicMaterial color={rail.color} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* Start / Finish Overhead Gantry Archway */}
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

      {/* Dynamic Floating Checkpoint Rings */}
      {TRACK_GATES.map((gate, gIdx) => {
        const isTarget = gIdx === activeGate;
        return (
          <group key={`gate-${gIdx}`} position={[gate.x, 0, gate.z]} rotation={[0, gate.forwardAngle, 0]}>
            <mesh position={[0, 5.2, 0]}>
              <ringGeometry args={[W - 0.4, W, 36]} />
              <meshBasicMaterial
                color={isTarget ? "#22c55e" : "#0284c7"}
                transparent
                opacity={isTarget ? 0.9 : 0.22}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}

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
