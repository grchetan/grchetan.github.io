/**
 * Horizon Grand Prix — Realistic 1,920m International Circuit World
 * Features:
 * - Procedural Twilight-Daylight Gradient Sky Dome + Crisp Horizon Glow (never dark void!)
 * - High-Resolution Procedural Asphalt & Turf Grass CanvasTextures
 * - 26m Wide Ribbon Tarmac + Gravel Runoffs + Continuous White Track Borders
 * - Continuous Full-Circuit FIA Armco Safety Barriers + Neon Corner Guide Rails (InstancedMesh)
 * - Automatic Curvature-Detected Red & White Rumble Kerbs (InstancedMesh)
 * - 150m / 100m / 50m Braking Distance Markers at Major Corners
 * - Main Pit Complex, Race Control Tower, Spectator Grandstands & Stadium Floodlights
 * - 180+ Automatically Track-Cleared Pine Trees & Horizon Skyline
 * - Static World Memoized to eliminate re-renders; only active Checkpoint Arch updates
 */

import { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  BOOST_PADS,
  CIRCUIT_SAMPLES,
  SAMPLE_COUNT,
  TRACK_CONFIG,
  TRACK_GATES,
  type TrackGate,
} from "./race-physics";

/* ── Procedural Canvas Textures ──────────────────────────────────────── */

function createAsphaltTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Rich weathered racing asphalt grey
  ctx.fillStyle = "#2b323f";
  ctx.fillRect(0, 0, 512, 512);

  // Subtle racing groove tire-wear darker bands along center lanes
  const groove = ctx.createLinearGradient(0, 0, 512, 0);
  groove.addColorStop(0, "rgba(15, 20, 28, 0.15)");
  groove.addColorStop(0.28, "rgba(12, 16, 24, 0.34)");
  groove.addColorStop(0.5, "rgba(35, 42, 54, 0.1)");
  groove.addColorStop(0.72, "rgba(12, 16, 24, 0.34)");
  groove.addColorStop(1, "rgba(15, 20, 28, 0.15)");
  ctx.fillStyle = groove;
  ctx.fillRect(0, 0, 512, 512);

  // Fine mineral asphalt speckle grain
  for (let i = 0; i < 6500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const bright = Math.random() > 0.5;
    ctx.fillStyle = bright
      ? `rgba(255,255,255,${0.02 + Math.random() * 0.045})`
      : `rgba(0,0,0,${0.05 + Math.random() * 0.08})`;
    ctx.fillRect(x, y, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 55);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTurfTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Circuit emerald turf base with realistic mowed lawn stripes
  ctx.fillStyle = "#173726";
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = "#1c432e";
  for (let i = 0; i < 8; i += 2) {
    ctx.fillRect(i * 64, 0, 64, 512);
  }

  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle =
      Math.random() > 0.5
        ? "rgba(74, 222, 128, 0.04)"
        : "rgba(5, 20, 12, 0.09)";
    ctx.fillRect(x, y, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(55, 55);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createDistanceBoardTexture(meters: string): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 240, 112);

  ctx.fillStyle = "#0f172a";
  ctx.font = "900 72px ui-monospace, SFMono-Regular, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(meters, 128, 66);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBillboardTexture(
  title: string,
  accent: string
): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#090f1d";
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, 502, 118);

  ctx.fillStyle = accent;
  ctx.font = "900 42px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, 256, 66);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ── Atmospheric Twilight-Horizon Sky Dome ───────────────────────────── */

function HorizonSkyDome() {
  const skyMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color("#0b192e") },
        midColor: { value: new THREE.Color("#1e436d") },
        horizonColor: { value: new THREE.Color("#5f8cb8") },
        sunGlowColor: { value: new THREE.Color("#f59e0b") },
        sunDir: { value: new THREE.Vector3(0.45, 0.24, -0.86).normalize() },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = normalize(worldPos.xyz);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 horizonColor;
        uniform vec3 sunGlowColor;
        uniform vec3 sunDir;
        varying vec3 vWorldPos;
        void main() {
          float h = clamp(vWorldPos.y, 0.0, 1.0);
          vec3 col = mix(horizonColor, midColor, smoothstep(0.0, 0.22, h));
          col = mix(col, topColor, smoothstep(0.18, 0.72, h));
          float sunDot = max(dot(vWorldPos, sunDir), 0.0);
          col += sunGlowColor * pow(sunDot, 14.0) * 0.42;
          col += vec3(1.0, 0.94, 0.8) * pow(sunDot, 180.0) * 0.9;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }, []);

  useEffect(() => () => skyMat.dispose(), [skyMat]);

  return (
    <mesh material={skyMat}>
      <sphereGeometry args={[950, 32, 20]} />
    </mesh>
  );
}

/* ── Ribbon Buffer Geometry Builder ─────────────────────────────────── */

function buildTrackRibbon(
  leftOffset: number,
  rightOffset: number,
  y: number,
  uvRepeatY = 1
): THREE.BufferGeometry {
  const N = SAMPLE_COUNT;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= N; i++) {
    const sp = CIRCUIT_SAMPLES[i % N]!;
    vertices.push(
      sp.x + sp.normalX * leftOffset,
      y,
      sp.z + sp.normalZ * leftOffset
    );
    vertices.push(
      sp.x + sp.normalX * rightOffset,
      y,
      sp.z + sp.normalZ * rightOffset
    );
    const v = (i / N) * uvRepeatY;
    uvs.push(0, v, 1, v);
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
}

/* ── Track Architecture Components ───────────────────────────────────── */

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
  const gateH = 7.0;
  const pillarColor = isTarget ? "#10b981" : "#334155";
  const glowColor = isTarget ? "#34d399" : "#38bdf8";

  // Gate 0 is covered by the main Start/Finish Gantry
  if (gate.index === 0) return null;

  return (
    <group position={[gate.x, 0, gate.z]} rotation={[0, gate.forwardAngle, 0]}>
      <mesh position={[-width - 1.2, gateH / 2, 0]}>
        <boxGeometry args={[0.8, gateH, 0.8]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-width - 1.2, gateH / 2, 0]}>
        <boxGeometry args={[0.9, gateH * 0.9, 0.25]} />
        <meshBasicMaterial color={pillarColor} />
      </mesh>

      <mesh position={[width + 1.2, gateH / 2, 0]}>
        <boxGeometry args={[0.8, gateH, 0.8]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[width + 1.2, gateH / 2, 0]}>
        <boxGeometry args={[0.9, gateH * 0.9, 0.25]} />
        <meshBasicMaterial color={pillarColor} />
      </mesh>

      <mesh position={[0, gateH + 0.35, 0]}>
        <boxGeometry args={[gateW + 3.2, 0.7, 0.8]} />
        <meshStandardMaterial color="#090d16" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, gateH + 0.35, 0]}>
        <boxGeometry args={[gateW + 2.2, 0.28, 0.92]} />
        <meshBasicMaterial color={glowColor} />
      </mesh>

      {isTarget && (
        <mesh position={[0, gateH / 2, 0]}>
          <planeGeometry args={[gateW, gateH - 0.3]} />
          <meshBasicMaterial
            color="#34d399"
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

function BrakingBoard({
  position,
  rotation,
  meters,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  meters: string;
}) {
  const tex = useMemo(() => createDistanceBoardTexture(meters), [meters]);
  useEffect(() => () => tex?.dispose(), [tex]);

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[-0.7, 1.3, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 2.6, 6]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh position={[0.7, 1.3, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 2.6, 6]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh position={[0, 2.4, 0]}>
        <boxGeometry args={[2.3, 1.25, 0.14]} />
        <meshBasicMaterial map={tex} color={tex ? "#ffffff" : "#f8fafc"} />
      </mesh>
    </group>
  );
}

function SponsorBillboard({
  position,
  rotation,
  title,
  accent,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  title: string;
  accent: string;
}) {
  const tex = useMemo(
    () => createBillboardTexture(title, accent),
    [title, accent]
  );
  useEffect(() => () => tex?.dispose(), [tex]);

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[-5.5, 3.2, 0]}>
        <cylinderGeometry args={[0.25, 0.32, 6.4, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      <mesh position={[5.5, 3.2, 0]}>
        <cylinderGeometry args={[0.25, 0.32, 6.4, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      <mesh position={[0, 6.6, 0]}>
        <boxGeometry args={[14, 3.5, 0.5]} />
        <meshStandardMaterial color="#0f172a" metalness={0.85} />
      </mesh>
      <mesh position={[0, 6.6, 0.28]}>
        <planeGeometry args={[13.4, 3.1]} />
        <meshBasicMaterial map={tex} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function StadiumGrandstand({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 5.2, -6]}>
        <boxGeometry args={[92, 10.4, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.75} />
      </mesh>
      {[0, 2.0, 4.0, 6.0, 8.0].map((ty, idx) => (
        <mesh key={idx} position={[0, ty + 1.5, -idx * 2.3]}>
          <boxGeometry args={[88, 0.65, 2.0]} />
          <meshStandardMaterial color={idx % 2 === 0 ? "#0284c7" : "#0369a1"} />
        </mesh>
      ))}
      <mesh position={[0, 12.2, -5]}>
        <boxGeometry args={[96, 0.75, 18]} />
        <meshStandardMaterial color="#0f172a" metalness={0.85} />
      </mesh>
      <mesh position={[0, 12.2, 4.2]}>
        <boxGeometry args={[96, 0.28, 0.35]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
    </group>
  );
}

function RaceControlTower({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh position={[0, 12, 0]}>
        <cylinderGeometry args={[3.2, 4.2, 24, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 25.5, 0]}>
        <cylinderGeometry args={[7.2, 5.4, 4.2, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, 25.6, 0]}>
        <cylinderGeometry args={[7.35, 7.35, 1.8, 16]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.45} />
      </mesh>
      <mesh position={[0, 28.4, 0]}>
        <cylinderGeometry args={[0.25, 0.4, 4, 8]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0, 30.6, 0]}>
        <sphereGeometry args={[0.45, 8, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

function SpeedBoostPad({
  x,
  z,
  angle,
}: {
  x: number;
  z: number;
  angle: number;
}) {
  return (
    <group
      position={[x, 0.06, z]}
      rotation={[-Math.PI / 2, 0, -angle + Math.PI / 2]}
    >
      <mesh>
        <planeGeometry args={[14, 6.2]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.36} />
      </mesh>
      {[-3.2, 0, 3.2].map((offset, i) => (
        <group key={i} position={[offset, 0, 0.02]}>
          <mesh rotation={[0, 0, -Math.PI / 4]} position={[-0.35, 0.72, 0]}>
            <boxGeometry args={[1.6, 0.38, 0.02]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 4]} position={[-0.35, -0.72, 0]}>
            <boxGeometry args={[1.6, 0.38, 0.02]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

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
    <group position={[x, 3.6, z]} rotation={[0, angle, 0]}>
      <mesh>
        <planeGeometry args={[9.5, 2.6]} />
        <meshBasicMaterial color="#090f1d" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[9.8, 2.9]} />
        <meshBasicMaterial color="#f59e0b" wireframe side={THREE.DoubleSide} />
      </mesh>
      {[-3.2, -1.1, 1.1, 3.2].map((cx, i) => (
        <group key={i} position={[cx, 0, 0.06]}>
          <mesh rotation={[0, 0, -Math.PI / 4]} position={[-0.32, 0.42, 0]}>
            <boxGeometry args={[1.1, 0.3, 0.06]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 4]} position={[-0.32, -0.42, 0]}>
            <boxGeometry args={[1.1, 0.3, 0.06]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ── Memoized Static Circuit World (Zero Per-Frame Re-renders!) ───────── */

const StaticCircuitWorld = memo(function StaticCircuitWorld() {
  const W = TRACK_CONFIG.halfWidth; // 13

  const asphaltTex = useMemo(() => createAsphaltTexture(), []);
  const turfTex = useMemo(() => createTurfTexture(), []);

  useEffect(() => {
    return () => {
      asphaltTex?.dispose();
      turfTex?.dispose();
    };
  }, [asphaltTex, turfTex]);

  // Geometries for road, gravel shoulders, white edge markings
  const geometries = useMemo(() => {
    const road = buildTrackRibbon(-W, W, 0.04, 1);
    const gravel = buildTrackRibbon(-(W + 2.8), W + 2.8, 0.01, 1);
    const leftLine = buildTrackRibbon(-(W - 0.15), -(W - 0.75), 0.055, 1);
    const rightLine = buildTrackRibbon(W - 0.75, W - 0.15, 0.055, 1);
    return { road, gravel, leftLine, rightLine };
  }, [W]);

  useEffect(() => {
    return () => {
      geometries.road.dispose();
      geometries.gravel.dispose();
      geometries.leftLine.dispose();
      geometries.rightLine.dispose();
    };
  }, [geometries]);

  // Precompute Instanced transforms for:
  // 1) Continuous left & right Armco metallic barriers (720 segments)
  // 2) Top neon guide strip along corner barriers
  // 3) Curvature-detected Red & White FIA Rumble Kerbs
  // 4) Centerline dashes
  // 5) Track-cleared Cypress trees + Horizon skyline towers
  const instancedData = useMemo(() => {
    const dummy = new THREE.Object3D();

    const barrierMats: THREE.Matrix4[] = [];
    const cornerRailMats: THREE.Matrix4[] = [];
    const redKerbMats: THREE.Matrix4[] = [];
    const whiteKerbMats: THREE.Matrix4[] = [];
    const dashMats: THREE.Matrix4[] = [];

    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const sp = CIRCUIT_SAMPLES[i]!;
      const next = CIRCUIT_SAMPLES[(i + 1) % SAMPLE_COUNT]!;
      const segLen = Math.hypot(next.x - sp.x, next.z - sp.z) + 0.55;
      const midX = (sp.x + next.x) * 0.5;
      const midZ = (sp.z + next.z) * 0.5;
      const angle = Math.atan2(next.x - sp.x, next.z - sp.z);

      // Left & Right continuous safety walls at W + 2.4m
      for (const side of [-1, 1]) {
        const bx = midX + sp.normalX * side * (W + 2.4);
        const bz = midZ + sp.normalZ * side * (W + 2.4);
        dummy.position.set(bx, 0.65, bz);
        dummy.rotation.set(0, angle, 0);
        dummy.scale.set(0.55, 1.3, segLen);
        dummy.updateMatrix();
        barrierMats.push(dummy.matrix.clone());

        if (sp.isCorner || i % 3 === 0) {
          dummy.position.set(bx, 1.38, bz);
          dummy.scale.set(0.65, 0.16, segLen);
          dummy.updateMatrix();
          cornerRailMats.push(dummy.matrix.clone());
        }
      }

      // Red & White FIA Rumble Kerbs on every curve!
      if (sp.isCorner) {
        for (const side of [-1, 1]) {
          const kx = sp.x + sp.normalX * side * (W + 0.45);
          const kz = sp.z + sp.normalZ * side * (W + 0.45);
          dummy.position.set(kx, 0.09, kz);
          dummy.rotation.set(0, sp.headingAngle, 0);
          dummy.scale.set(1.3, 0.18, segLen * 0.95);
          dummy.updateMatrix();
          if (i % 2 === 0) redKerbMats.push(dummy.matrix.clone());
          else whiteKerbMats.push(dummy.matrix.clone());
        }
      }

      // Centerline dashes
      if (i % 2 === 0) {
        dummy.position.set(sp.x, 0.055, sp.z);
        dummy.rotation.set(-Math.PI / 2, 0, -sp.headingAngle + Math.PI / 2);
        dummy.scale.set(2.8, 0.38, 1);
        dummy.updateMatrix();
        dashMats.push(dummy.matrix.clone());
      }
    }

    // Track-cleared Stylized Trackside Trees
    const treeTrunkMats: THREE.Matrix4[] = [];
    const treeCrownMats: THREE.Matrix4[] = [];
    let seed = 4219;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let t = 0; t < 260; t++) {
      const tx = (rand() - 0.5) * 820;
      const tz = (rand() - 0.5) * 680;
      // Clear check against all track samples
      let minDist = Infinity;
      for (let i = 0; i < SAMPLE_COUNT; i += 3) {
        const sp = CIRCUIT_SAMPLES[i]!;
        const d = Math.hypot(tx - sp.x, tz - sp.z);
        if (d < minDist) minDist = d;
      }
      if (minDist < W + 16) continue;
      // Also avoid Pit Grandstand box area
      if (Math.abs(tx - 40) < 60 && Math.abs(tz - -215) < 25) continue;

      const s = 0.85 + rand() * 0.9;
      dummy.position.set(tx, 1.8 * s, tz);
      dummy.rotation.set(0, rand() * Math.PI * 2, 0);
      dummy.scale.set(0.55 * s, 3.6 * s, 0.55 * s);
      dummy.updateMatrix();
      treeTrunkMats.push(dummy.matrix.clone());

      dummy.position.set(tx, 6.2 * s, tz);
      dummy.scale.set(2.4 * s, 6.8 * s, 2.4 * s);
      dummy.updateMatrix();
      treeCrownMats.push(dummy.matrix.clone());
    }

    // Horizon City Skyline Silhouettes (far outside track)
    const skylineMats: THREE.Matrix4[] = [];
    for (let k = 0; k < 44; k++) {
      const ang = (k / 44) * Math.PI * 2 + rand() * 0.08;
      const radius = 560 + rand() * 140;
      const w = 22 + rand() * 26;
      const h = 45 + rand() * 110;
      dummy.position.set(Math.cos(ang) * radius, h * 0.5, Math.sin(ang) * radius);
      dummy.rotation.set(0, ang, 0);
      dummy.scale.set(w, h, w * 0.8);
      dummy.updateMatrix();
      skylineMats.push(dummy.matrix.clone());
    }

    // Compute Braking Boards positions cleanly ahead of Turn 1 (sample 32..38) & Hairpin (214..220)
    const boardAt = (idx: number, side: number) => {
      const sp = CIRCUIT_SAMPLES[idx % SAMPLE_COUNT]!;
      return {
        pos: [
          sp.x + sp.normalX * side * (W + 4.2),
          0,
          sp.z + sp.normalZ * side * (W + 4.2),
        ] as [number, number, number],
        rot: [0, sp.headingAngle + Math.PI, 0] as [number, number, number],
      };
    };

    const brakingBoards = [
      { ...boardAt(30, -1), meters: "150" },
      { ...boardAt(36, -1), meters: "100" },
      { ...boardAt(42, -1), meters: "50" },
      { ...boardAt(200, -1), meters: "150" },
      { ...boardAt(206, -1), meters: "100" },
      { ...boardAt(212, -1), meters: "50" },
    ];

    // Turn Chevron Signs outside heavy turns
    const chevronAt = (idx: number, side: number) => {
      const sp = CIRCUIT_SAMPLES[idx % SAMPLE_COUNT]!;
      return {
        x: sp.x + sp.normalX * side * (W + 5.2),
        z: sp.z + sp.normalZ * side * (W + 5.2),
        angle: sp.headingAngle + (side > 0 ? -Math.PI * 0.72 : Math.PI * 0.72),
      };
    };
    const chevrons = [
      chevronAt(52, 1),
      chevronAt(126, -1),
      chevronAt(234, 1),
      chevronAt(312, 1),
    ];

    return {
      barrierMats,
      cornerRailMats,
      redKerbMats,
      whiteKerbMats,
      dashMats,
      treeTrunkMats,
      treeCrownMats,
      skylineMats,
      brakingBoards,
      chevrons,
    };
  }, [W]);

  const applyMatrices =
    (matrices: THREE.Matrix4[]) => (mesh: THREE.InstancedMesh | null) => {
      if (!mesh) return;
      for (let i = 0; i < matrices.length; i++) {
        mesh.setMatrixAt(i, matrices[i]!);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };

  return (
    <group>
      {/* Sky Dome */}
      <HorizonSkyDome />

      {/* Crisp Turf Grass Terrain Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial
          map={turfTex}
          color={turfTex ? "#ffffff" : "#1a3c2a"}
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>

      {/* Gravel / Runoff Border Belt Under Track */}
      <mesh geometry={geometries.gravel}>
        <meshStandardMaterial color="#4b5563" roughness={0.9} />
      </mesh>

      {/* Main High-Grip Weathered Asphalt Road Surface */}
      <mesh geometry={geometries.road}>
        <meshStandardMaterial
          map={asphaltTex}
          color={asphaltTex ? "#ffffff" : "#2b323f"}
          roughness={0.58}
          metalness={0.12}
        />
      </mesh>

      {/* Continuous Crisp White Track Boundary Lines */}
      <mesh geometry={geometries.leftLine}>
        <meshBasicMaterial color="#f8fafc" />
      </mesh>
      <mesh geometry={geometries.rightLine}>
        <meshBasicMaterial color="#f8fafc" />
      </mesh>

      {/* Instanced Dashed Gold Centerline */}
      <instancedMesh
        ref={applyMatrices(instancedData.dashMats)}
        args={[undefined, undefined, instancedData.dashMats.length]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#eab308" />
      </instancedMesh>

      {/* Instanced Full-Circuit FIA Metallic Safety Barriers */}
      <instancedMesh
        ref={applyMatrices(instancedData.barrierMats)}
        args={[undefined, undefined, instancedData.barrierMats.length]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.55} roughness={0.4} />
      </instancedMesh>

      {/* Instanced Neon Corner Guide Strips on Top of Barriers */}
      <instancedMesh
        ref={applyMatrices(instancedData.cornerRailMats)}
        args={[undefined, undefined, instancedData.cornerRailMats.length]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#38bdf8" />
      </instancedMesh>

      {/* Instanced Alternating Red & White FIA Rumble Kerbs */}
      <instancedMesh
        ref={applyMatrices(instancedData.redKerbMats)}
        args={[undefined, undefined, instancedData.redKerbMats.length]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ef4444" roughness={0.45} />
      </instancedMesh>
      <instancedMesh
        ref={applyMatrices(instancedData.whiteKerbMats)}
        args={[undefined, undefined, instancedData.whiteKerbMats.length]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.45} />
      </instancedMesh>

      {/* Instanced Trackside Pine Trees */}
      <instancedMesh
        ref={applyMatrices(instancedData.treeTrunkMats)}
        args={[undefined, undefined, instancedData.treeTrunkMats.length]}
      >
        <cylinderGeometry args={[0.35, 0.55, 1, 6]} />
        <meshStandardMaterial color="#451a03" roughness={0.95} />
      </instancedMesh>
      <instancedMesh
        ref={applyMatrices(instancedData.treeCrownMats)}
        args={[undefined, undefined, instancedData.treeCrownMats.length]}
      >
        <coneGeometry args={[1, 1, 7]} />
        <meshStandardMaterial color="#14532d" roughness={0.85} />
      </instancedMesh>

      {/* Distant Horizon City Skyline */}
      <instancedMesh
        ref={applyMatrices(instancedData.skylineMats)}
        args={[undefined, undefined, instancedData.skylineMats.length]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </instancedMesh>

      {/* ================= START / FINISH LINE, GRID BOXES & F1 GANTRY ================= */}
      <group position={[0, 0.06, -190]} rotation={[0, Math.PI / 2, 0]}>
        {/* Checkered Start / Finish Line */}
        {[-10.5, -7.5, -4.5, -1.5, 1.5, 4.5, 7.5, 10.5].map((cx, i) => (
          <group key={i} position={[cx, 0, 0]}>
            <mesh position={[-0.75, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.5, 1.8]} />
              <meshBasicMaterial color={i % 2 === 0 ? "#ffffff" : "#090d16"} />
            </mesh>
            <mesh position={[0.75, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.5, 1.8]} />
              <meshBasicMaterial color={i % 2 === 0 ? "#090d16" : "#ffffff"} />
            </mesh>
          </group>
        ))}

        {/* Staggered White Starting Grid Boxes */}
        {[0, 1, 2, 3, 4, 5].map((slot) => {
          const row = Math.floor(slot / 2);
          const col = slot % 2;
          const gx = col === 0 ? -4.2 : 4.2;
          const gz = -(8 + row * 9.5 + col * 3.2);
          return (
            <group key={slot} position={[gx, 0.01, gz]}>
              <mesh position={[0, 0, 1.4]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[2.2, 0.25]} />
                <meshBasicMaterial color="#e2e8f0" />
              </mesh>
              <mesh position={[-1.0, 0, 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.25, 1.6]} />
                <meshBasicMaterial color="#e2e8f0" />
              </mesh>
              <mesh position={[1.0, 0, 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.25, 1.6]} />
                <meshBasicMaterial color="#e2e8f0" />
              </mesh>
            </group>
          );
        })}

        {/* Main Start / Finish Gantry Bridge */}
        <mesh position={[-W - 2.0, 4.6, 0]}>
          <boxGeometry args={[1.4, 9.2, 1.4]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} />
        </mesh>
        <mesh position={[W + 2.0, 4.6, 0]}>
          <boxGeometry args={[1.4, 9.2, 1.4]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} />
        </mesh>
        <mesh position={[0, 9.4, 0]}>
          <boxGeometry args={[W * 2 + 5.6, 1.6, 1.8]} />
          <meshStandardMaterial color="#090d16" metalness={0.85} />
        </mesh>
        <mesh position={[0, 9.4, 0.94]}>
          <planeGeometry args={[W * 2 + 3.2, 0.55]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        {/* 5 Illuminated Green Launch Lights */}
        {[-4, -2, 0, 2, 4].map((lx, idx) => (
          <mesh key={idx} position={[lx, 8.8, -0.95]}>
            <sphereGeometry args={[0.32, 10, 10]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
        ))}
      </group>

      {/* ================= SPEED BOOST PADS ================= */}
      {BOOST_PADS.map((pad, idx) => (
        <SpeedBoostPad key={idx} x={pad.x} z={pad.z} angle={pad.angle} />
      ))}

      {/* ================= BRAKING BOARDS & TURN CHEVRONS ================= */}
      {instancedData.brakingBoards.map((b, i) => (
        <BrakingBoard key={i} position={b.pos} rotation={b.rot} meters={b.meters} />
      ))}
      {instancedData.chevrons.map((c, i) => (
        <TurnChevronSign key={i} x={c.x} z={c.z} angle={c.angle} />
      ))}

      {/* ================= GRANDSTANDS, RACE TOWER & BILLBOARDS ================= */}
      <StadiumGrandstand position={[35, 0, -218]} rotation={[0, 0, 0]} />
      <StadiumGrandstand position={[55, 0, 256]} rotation={[0, Math.PI, 0]} />
      <RaceControlTower position={[30, 0, -158]} />

      <SponsorBillboard
        position={[320, 0, -130]}
        rotation={[0, -Math.PI / 2.6, 0]}
        title="CHETAN GRAND PRIX"
        accent="#38bdf8"
      />
      <SponsorBillboard
        position={[195, 0, 175]}
        rotation={[0, -Math.PI * 0.75, 0]}
        title="NITRO OVERDRIVE"
        accent="#fbbf24"
      />
      <SponsorBillboard
        position={[-288, 0, 80]}
        rotation={[0, Math.PI / 2, 0]}
        title="HORIZON CIRCUIT"
        accent="#ec4899"
      />
    </group>
  );
});

export function Track3D({ activeGate }: { activeGate: number }) {
  const W = TRACK_CONFIG.halfWidth;
  return (
    <group>
      <StaticCircuitWorld />
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
