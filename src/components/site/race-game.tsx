import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Player } from "@/lib/arcade";
import type { RacePlayer, RaceRoom } from "@/lib/race";

const TRACK_WIDTH = 14;
const TRACK_HALF_WIDTH = TRACK_WIDTH / 2;
const L_LENGTH = 40; // straight length
const R_RADIUS = 20; // turn radius
const TOTAL_CHECKPOINTS = 4;

const CHECKPOINTS = [
  { x: 0, z: -R_RADIUS, r: 0 }, // start/finish (top straight)
  { x: L_LENGTH / 2 + R_RADIUS, z: 0, r: Math.PI / 2 }, // right curve apex
  { x: 0, z: R_RADIUS, r: Math.PI }, // bottom straight
  { x: -L_LENGTH / 2 - R_RADIUS, z: 0, r: -Math.PI / 2 }, // left curve apex
];

type Pose = { x: number; z: number; rotation: number };

const START_POSE: Pose = {
  x: 0,
  z: -R_RADIUS,
  rotation: Math.PI / 2,
};

function Car({
  color,
  x,
  z,
  rotation,
  getPose,
}: {
  color: string;
  x: number;
  z: number;
  rotation: number;
  getPose?: () => Pose;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current) return;
    const pose = getPose?.() ?? { x, z, rotation };
    group.current.position.set(pose.x, 0.4, pose.z);
    group.current.rotation.y = pose.rotation;
  });

  return (
    <group ref={group}>
      {/* Spoiler base struts */}
      <mesh position={[-0.45, 0.25, -1.1]}>
        <boxGeometry args={[0.08, 0.35, 0.08]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>
      <mesh position={[0.45, 0.25, -1.1]}>
        <boxGeometry args={[0.08, 0.35, 0.08]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>
      {/* Spoiler Wing */}
      <mesh position={[0, 0.48, -1.15]}>
        <boxGeometry args={[1.7, 0.06, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.2} />
      </mesh>

      {/* Main Car Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 0.42, 2.7]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.2} />
      </mesh>

      {/* Front Nose scoop */}
      <mesh position={[0, -0.06, 1.25]}>
        <boxGeometry args={[1.35, 0.16, 0.5]} />
        <meshStandardMaterial color="#111" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Cabin Roof */}
      <mesh position={[0, 0.34, -0.15]}>
        <boxGeometry args={[1.05, 0.32, 1.3]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.1} />
      </mesh>
      
      {/* Slanted wind shield */}
      <mesh position={[0, 0.28, 0.6]} rotation={[0.4, 0, 0]}>
        <planeGeometry args={[1.0, 0.45]} />
        <meshStandardMaterial color="#020617" roughness={0.1} transparent opacity={0.85} />
      </mesh>

      {/* Headlights (Front Glowing lights) */}
      <mesh position={[-0.55, 0.02, 1.34]}>
        <boxGeometry args={[0.18, 0.08, 0.06]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[0.55, 0.02, 1.34]}>
        <boxGeometry args={[0.18, 0.08, 0.06]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Taillights (Rear brake lights) */}
      <mesh position={[-0.55, 0.05, -1.36]}>
        <boxGeometry args={[0.2, 0.06, 0.05]} />
        <meshBasicMaterial color="#f43f5e" />
      </mesh>
      <mesh position={[0.55, 0.05, -1.36]}>
        <boxGeometry args={[0.2, 0.06, 0.05]} />
        <meshBasicMaterial color="#f43f5e" />
      </mesh>

      {/* Side Mirrors */}
      <mesh position={[-0.85, 0.22, 0.35]}>
        <boxGeometry args={[0.22, 0.08, 0.1]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.2} />
      </mesh>
      <mesh position={[0.85, 0.22, 0.35]}>
        <boxGeometry args={[0.22, 0.08, 0.1]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.2} />
      </mesh>

      {/* Wheels */}
      {(
        [
          [-0.82, -0.15, 0.85],
          [0.82, -0.15, 0.85],
          [-0.82, -0.15, -0.85],
          [0.82, -0.15, -0.85],
        ] as const
      ).map(([wx, wy, wz], i) => (
        <group key={i} position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]}>
          {/* Black tire outer ring */}
          <mesh>
            <cylinderGeometry args={[0.3, 0.3, 0.25, 16]} />
            <meshStandardMaterial color="#18181b" roughness={0.9} />
          </mesh>
          {/* Silver wheel rim */}
          <mesh position={[0, 0.02 * (wx < 0 ? -1 : 1), 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.26, 12]} />
            <meshStandardMaterial color="#e4e4e7" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Track() {
  const trackShape = useMemo(() => {
    const shape = new THREE.Shape();
    const outerR = R_RADIUS + TRACK_HALF_WIDTH;
    const innerR = R_RADIUS - TRACK_HALF_WIDTH;

    // Draw outer racetrack loop
    shape.moveTo(-L_LENGTH / 2, -outerR);
    shape.lineTo(L_LENGTH / 2, -outerR);
    shape.absarc(L_LENGTH / 2, 0, outerR, -Math.PI / 2, Math.PI / 2, false);
    shape.lineTo(-L_LENGTH / 2, outerR);
    shape.absarc(-L_LENGTH / 2, 0, outerR, Math.PI / 2, -Math.PI / 2, false);

    // Inner hole path (drawn in opposite direction to subtract)
    const hole = new THREE.Path();
    hole.moveTo(-L_LENGTH / 2, -innerR);
    hole.absarc(-L_LENGTH / 2, 0, innerR, -Math.PI / 2, Math.PI / 2, true);
    hole.lineTo(L_LENGTH / 2, innerR);
    hole.absarc(L_LENGTH / 2, 0, innerR, Math.PI / 2, -Math.PI / 2, true);
    hole.lineTo(-L_LENGTH / 2, -innerR);

    shape.holes.push(hole);
    return shape;
  }, []);

  const innerGrassShape = useMemo(() => {
    const shape = new THREE.Shape();
    const innerR = R_RADIUS - TRACK_HALF_WIDTH;
    shape.moveTo(-L_LENGTH / 2, -innerR);
    shape.lineTo(L_LENGTH / 2, -innerR);
    shape.absarc(L_LENGTH / 2, 0, innerR, -Math.PI / 2, Math.PI / 2, false);
    shape.lineTo(-L_LENGTH / 2, innerR);
    shape.absarc(-L_LENGTH / 2, 0, innerR, Math.PI / 2, -Math.PI / 2, false);
    return shape;
  }, []);

  return (
    <group>
      {/* ground field */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[350, 350]} />
        <meshStandardMaterial color="#080c14" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* inner field (green grass) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <shapeGeometry args={[innerGrassShape]} />
        <meshStandardMaterial color="#064e3b" roughness={1.0} side={THREE.DoubleSide} />
      </mesh>

      {/* smooth curved track surface (slate tarmac) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <shapeGeometry args={[trackShape]} />
        <meshStandardMaterial color="#334155" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* Start / Finish line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -R_RADIUS]}>
        <planeGeometry args={[14, 1.2]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Red and white track border kerbs along turns */}
      {[
        { x: L_LENGTH / 2, r: R_RADIUS + 7.1, sign: 1 },
        { x: -L_LENGTH / 2, r: R_RADIUS + 7.1, sign: -1 }
      ].map((curb, index) => (
        <group key={index} position={[curb.x, 0.04, 0]}>
          {[...Array(12)].map((_, i) => {
            const startAngle = -Math.PI / 2 + (i * Math.PI) / 12;
            const endAngle = startAngle + Math.PI / 12;
            const color = i % 2 === 0 ? "#ef4444" : "#ffffff";
            return (
              <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[curb.r - 0.5, curb.r, 32, 1, startAngle * curb.sign, Math.PI / 12]} />
                <meshBasicMaterial color={color} side={THREE.DoubleSide} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

function CameraRig({ getTarget }: { getTarget: () => Pose }) {
  const { camera } = useThree();
  const desired = useRef(new THREE.Vector3());

  useFrame(() => {
    const target = getTarget();
    const offsetX = Math.sin(target.rotation) * 11;
    const offsetZ = Math.cos(target.rotation) * 11;
    desired.current.set(target.x - offsetX, 8.5, target.z - offsetZ);
    camera.position.lerp(desired.current, 0.09);
    camera.lookAt(target.x, 0.2, target.z);
  });

  return null;
}

function PhysicsDriver({ step }: { step: (delta: number) => void }) {
  useFrame((_, delta) => step(delta));
  return null;
}

function Scene({
  localPlayer,
  remotePlayers,
  getLocalPose,
  step,
}: {
  localPlayer: RacePlayer;
  remotePlayers: RacePlayer[];
  getLocalPose: () => Pose;
  step: (delta: number) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[30, 45, 30]} intensity={1.3} castShadow />
      <pointLight position={[0, 15, 0]} intensity={0.6} color="#06b6d4" />
      <PhysicsDriver step={step} />
      <Track />
      <Car
        color={localPlayer.car.color}
        x={localPlayer.x}
        z={localPlayer.z}
        rotation={localPlayer.rotation}
        getPose={getLocalPose}
      />
      {remotePlayers.map((p) => (
        <Car key={p.id} color={p.car.color} x={p.x} z={p.z} rotation={p.rotation} />
      ))}
      <CameraRig getTarget={getLocalPose} />
    </>
  );
}

function useKeys() {
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return keys;
}

function clampToTrack(x: number, z: number) {
  const maxDist = 5.25; // TRACK_HALF_WIDTH - carMargin

  let cx = x;
  let cz = z;

  let centerlineX = 0;
  let centerlineZ = 0;
  let distToCenterline = 0;

  if (x >= -L_LENGTH / 2 && x <= L_LENGTH / 2) {
    centerlineX = x;
    centerlineZ = z >= 0 ? R_RADIUS : -R_RADIUS;
    distToCenterline = Math.abs(z - centerlineZ);
  } else if (x > L_LENGTH / 2) {
    const dx = x - L_LENGTH / 2;
    const dz = z;
    const angle = Math.atan2(dz, dx);
    centerlineX = L_LENGTH / 2 + Math.cos(angle) * R_RADIUS;
    centerlineZ = Math.sin(angle) * R_RADIUS;
    distToCenterline = Math.hypot(dx, dz) - R_RADIUS;
  } else {
    const dx = x + L_LENGTH / 2;
    const dz = z;
    const angle = Math.atan2(dz, dx);
    centerlineX = -L_LENGTH / 2 + Math.cos(angle) * R_RADIUS;
    centerlineZ = Math.sin(angle) * R_RADIUS;
    distToCenterline = Math.hypot(dx, dz) - R_RADIUS;
  }

  const absDist = Math.abs(distToCenterline);
  if (absDist > maxDist) {
    const dx = x - centerlineX;
    const dz = z - centerlineZ;
    const len = Math.hypot(dx, dz);
    if (len > 0) {
      cx = centerlineX + (dx / len) * maxDist * Math.sign(distToCenterline);
      cz = centerlineZ + (dz / len) * maxDist * Math.sign(distToCenterline);
    }
  }

  return { x: cx, z: cz };
}

function distanceToCheckpoint(x: number, z: number, cp: typeof CHECKPOINTS[0]) {
  return Math.hypot(x - cp.x, z - cp.z);
}

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
  const keys = useKeys();
  const local = room.players[player.id]!;
  const stateRef = useRef<RacePlayer>({
    ...local,
    ...(Math.abs(local.x) < 1 && Math.abs(local.z) < 1 ? START_POSE : {}),
  });
  const startTimeRef = useRef<number>(room.raceStartedAt ?? Date.now());
  const lapStartRef = useRef<number>(Date.now());
  const bestLapRef = useRef<number>(Infinity);
  const finishedRef = useRef(false);
  const [elapsed, setElapsed] = useState(0);
  const [lap, setLap] = useState(0);
  const [controlsMode, setControlsMode] = useState<"keyboard" | "touch">("keyboard");

  const remotePlayers = useMemo(
    () => Object.values(room.players).filter((p) => p.id !== player.id),
    [room.players, player.id],
  );

  useEffect(() => {
    if (room.raceStartedAt) startTimeRef.current = room.raceStartedAt;
  }, [room.raceStartedAt]);

  // Autodetect touch screen support to default controlsMode to touch
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || ('ontouchstart' in window)
      || (navigator.maxTouchPoints > 0);
    if (isMobile) {
      setControlsMode("touch");
    }
  }, []);

  const getLocalPose = useRef(() => {
    const s = stateRef.current;
    return { x: s.x, z: s.z, rotation: s.rotation };
  }).current;

  const lastSyncRef = useRef(0);
  const lastHudRef = useRef(0);

  const physics = (delta: number) => {
    const s = stateRef.current;

    if (!s || finishedRef.current) return;

    const accel = keys.current["arrowup"] || keys.current["w"] ? 18 : 0;
    const brake = keys.current["arrowdown"] || keys.current["s"] ? 12 : 0;
    const left = keys.current["arrowleft"] || keys.current["a"] ? 1 : 0;
    const right = keys.current["arrowright"] || keys.current["d"] ? 1 : 0;

    let speed = s.speed;
    speed += accel * delta;
    speed -= brake * delta;
    speed *= Math.pow(0.35, delta);
    speed = Math.max(0, Math.min(speed, 32));

    const turn = (right - left) * 2.2 * delta * Math.min(speed / 8, 1);
    const rotation = s.rotation - turn;

    const vx = Math.sin(rotation) * speed;
    const vz = Math.cos(rotation) * speed;

    let x = s.x + vx * delta;
    let z = s.z + vz * delta;
    const clamped = clampToTrack(x, z);
    x = clamped.x;
    z = clamped.z;

    const nextCheckpoint = (s.checkpoint + 1) % TOTAL_CHECKPOINTS;
    const cp = CHECKPOINTS[nextCheckpoint];
    if (!cp) return;
    const dist = distanceToCheckpoint(x, z, cp);
    let checkpoint = s.checkpoint;
    let lapCount = s.lap;
    let finishedAt = s.finishedAt;

    if (dist < 7) {
      checkpoint = nextCheckpoint;
      if (checkpoint === 0) {
        const lapTime = Date.now() - lapStartRef.current;
        if (lapCount > 0) {
          bestLapRef.current = Math.min(bestLapRef.current, lapTime);
        }
        lapCount += 1;
        lapStartRef.current = Date.now();
        setLap(lapCount);
      }
    }

    const now = Date.now();
    const totalTime = now - startTimeRef.current;
    if (now - lastHudRef.current > 100) {
      lastHudRef.current = now;
      setElapsed(totalTime);
    }

    if (lapCount >= room.settings.laps && !finishedAt) {
      finishedAt = now;
      finishedRef.current = true;
      onFinish(totalTime, bestLapRef.current === Infinity ? totalTime : bestLapRef.current);
    }

    const nextState: RacePlayer = {
      ...s,
      x,
      z,
      rotation,
      speed,
      lap: lapCount,
      checkpoint,
      finishedAt,
      bestLap: bestLapRef.current === Infinity ? null : bestLapRef.current,
    };

    stateRef.current = nextState;

    if (finishedAt || now - lastSyncRef.current > 120) {
      lastSyncRef.current = now;
      onUpdate({ x, z, rotation, speed, lap: lapCount, checkpoint, finishedAt });
    }
  };

  const formatTime = (ms: number) => {
    const s = ms / 1000;
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(2).padStart(5, "0");
    return `${m}:${sec}`;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-[1.75rem] border border-ink/10 bg-paper-tint/60">
      <div className="absolute left-4 top-4 z-10 rounded-2xl border border-ink/10 bg-paper/80 px-4 py-2 backdrop-blur-xl">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-soft">Time</p>
        <p className="font-display text-2xl text-ink">{formatTime(elapsed)}</p>
      </div>
      <div className="absolute right-4 top-4 z-10 rounded-2xl border border-ink/10 bg-paper/80 px-4 py-2 backdrop-blur-xl text-right">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-soft">Lap</p>
        <p className="font-display text-2xl text-ink">
          {lap}/{room.settings.laps}
        </p>
      </div>

      <div className="h-[60vh] min-h-[420px] w-full">
        <Canvas camera={{ position: [0, 10, 15], fov: 55 }}>
          <Scene
            localPlayer={local}
            remotePlayers={remotePlayers}
            getLocalPose={getLocalPose}
            step={physics}
          />
        </Canvas>
      </div>

      {/* touch buttons controls mode */}
      {controlsMode === "touch" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex items-end justify-between px-6">
          {/* Steering buttons */}
          <div className="pointer-events-auto flex gap-3">
            <button
              type="button"
              className="flex size-14 items-center justify-center rounded-2xl border border-ink/15 bg-paper/80 font-bold text-2xl text-ink shadow-lg backdrop-blur-md active:bg-ink active:text-paper active:scale-90 transition-all select-none"
              onTouchStart={() => (keys.current["arrowleft"] = true)}
              onTouchEnd={() => (keys.current["arrowleft"] = false)}
            >
              ←
            </button>
            <button
              type="button"
              className="flex size-14 items-center justify-center rounded-2xl border border-ink/15 bg-paper/80 font-bold text-2xl text-ink shadow-lg backdrop-blur-md active:bg-ink active:text-paper active:scale-90 transition-all select-none"
              onTouchStart={() => (keys.current["arrowright"] = true)}
              onTouchEnd={() => (keys.current["arrowright"] = false)}
            >
              →
            </button>
          </div>

          {/* Pedals buttons */}
          <div className="pointer-events-auto flex gap-3">
            <button
              type="button"
              className="flex size-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 font-mono text-[0.62rem] font-bold uppercase tracking-wider text-rose-500 shadow-lg backdrop-blur-md active:bg-rose-500 active:text-white active:scale-90 transition-all select-none"
              onTouchStart={() => (keys.current["arrowdown"] = true)}
              onTouchEnd={() => (keys.current["arrowdown"] = false)}
            >
              Brake
            </button>
            <button
              type="button"
              className="flex size-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 font-mono text-[0.62rem] font-bold uppercase tracking-wider text-emerald-500 shadow-lg backdrop-blur-md active:bg-emerald-500 active:text-white active:scale-90 transition-all select-none"
              onTouchStart={() => (keys.current["arrowup"] = true)}
              onTouchEnd={() => (keys.current["arrowup"] = false)}
            >
              Gas
            </button>
          </div>
        </div>
      )}

      {/* Manual mode selector panel */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-ink/10 bg-paper/80 p-1.5 backdrop-blur-xl">
        <span className="font-mono text-[0.55rem] uppercase tracking-widest text-ink-soft pl-2 pr-1 select-none">Drive:</span>
        <button
          type="button"
          onClick={() => setControlsMode("keyboard")}
          className={`rounded-xl px-2.5 py-1 font-mono text-[0.65rem] font-bold uppercase transition-all ${controlsMode === "keyboard" ? "bg-ink text-paper" : "text-ink-soft hover:bg-ink/5"}`}
        >
          ⌨ Keyboard
        </button>
        <button
          type="button"
          onClick={() => setControlsMode("touch")}
          className={`rounded-xl px-2.5 py-1 font-mono text-[0.65rem] font-bold uppercase transition-all ${controlsMode === "touch" ? "bg-ink text-paper" : "text-ink-soft hover:bg-ink/5"}`}
        >
          📱 Touch
        </button>
      </div>

      {controlsMode === "keyboard" && (
        <div className="absolute bottom-4 right-4 z-10 hidden rounded-2xl border border-ink/10 bg-paper/80 px-3 py-2 backdrop-blur-xl sm:block select-none">
          <p className="text-[0.68rem] font-medium text-ink-soft">Use WASD or Arrow keys to drive</p>
        </div>
      )}
    </div>
  );
}
