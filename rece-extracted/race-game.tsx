import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Player } from "@/lib/arcade";
import type { RacePlayer, RaceRoom } from "@/lib/race";

const TRACK_WIDTH = 14;
const TRACK_HALF_WIDTH = TRACK_WIDTH / 2;
const TRACK_LENGTH_X = 70;
const TRACK_LENGTH_Z = 40;
const TOTAL_CHECKPOINTS = 4;

const CHECKPOINTS = [
  { x: 0, z: -TRACK_LENGTH_Z / 2, r: 0 }, // start/finish (top straight)
  { x: TRACK_LENGTH_X / 2, z: 0, r: Math.PI / 2 }, // right straight
  { x: 0, z: TRACK_LENGTH_Z / 2, r: Math.PI }, // bottom straight
  { x: -TRACK_LENGTH_X / 2, z: 0, r: -Math.PI / 2 }, // left straight
];

type Pose = { x: number; z: number; rotation: number };

const START_POSE: Pose = {
  x: -5,
  z: -TRACK_LENGTH_Z / 2,
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
    group.current.position.set(pose.x, 0.6, pose.z);
    group.current.rotation.y = pose.rotation;
  });


  return (
    <group ref={group}>
      {/* body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.6, 0.5, 2.8]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </mesh>
      {/* cabin */}
      <mesh position={[0, 0.45, -0.2]}>
        <boxGeometry args={[1.1, 0.4, 1.4]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.2} roughness={0.6} />
      </mesh>
      {/* wheels */}
      {(
        [
          [-0.9, -0.15, 0.9],
          [0.9, -0.15, 0.9],
          [-0.9, -0.15, -0.9],
          [0.9, -0.15, -0.9],
        ] as const
      ).map(([wx, wy, wz], i) => (
        <mesh key={i} position={[wx, wy, wz]}>
          <cylinderGeometry args={[0.28, 0.28, 0.25, 16]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
    </group>
  );
}

function Track() {
  return (
    <group>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* track surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[TRACK_LENGTH_X + TRACK_WIDTH, TRACK_LENGTH_Z + TRACK_WIDTH]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* inner grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[TRACK_LENGTH_X - TRACK_WIDTH, TRACK_LENGTH_Z - TRACK_WIDTH]} />
        <meshStandardMaterial color="#0b3d2e" roughness={1} />
      </mesh>

      {/* center line */}
      {(
        [
          [0, -TRACK_LENGTH_Z / 2, TRACK_LENGTH_X, 0.15],
          [TRACK_LENGTH_X / 2, 0, 0.15, TRACK_LENGTH_Z],
          [0, TRACK_LENGTH_Z / 2, TRACK_LENGTH_X, 0.15],
          [-TRACK_LENGTH_X / 2, 0, 0.15, TRACK_LENGTH_Z],
        ] as const
      ).map(([cx, cz, w, h], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.03, cz]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial color="#ffffff" opacity={0.25} transparent />
        </mesh>
      ))}

      {/* start line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, -TRACK_LENGTH_Z / 2 + 2]}>
        <planeGeometry args={[TRACK_WIDTH - 1, 1.2]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* checkpoint markers */}
      {CHECKPOINTS.map((cp, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, cp.r]} position={[cp.x, 0.04, cp.z]}>
          <planeGeometry args={[TRACK_WIDTH - 1, 0.4]} />
          <meshBasicMaterial color={i === 0 ? "#ffffff" : "#3b82f6"} opacity={0.6} transparent />
        </mesh>
      ))}
    </group>
  );
}

function CameraRig({ getTarget }: { getTarget: () => Pose }) {
  const { camera } = useThree();
  const desired = useRef(new THREE.Vector3());

  useFrame(() => {
    const target = getTarget();
    const offsetX = Math.sin(target.rotation) * 12;
    const offsetZ = Math.cos(target.rotation) * 12;
    desired.current.set(target.x - offsetX, 10, target.z - offsetZ);
    camera.position.lerp(desired.current, 0.08);
    camera.lookAt(target.x, 0, target.z);
  });

  return null;
}

/** Runs the local car physics — must live INSIDE <Canvas> so useFrame is valid. */
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
      <ambientLight intensity={0.6} />
      <directionalLight position={[20, 30, 20]} intensity={1.2} castShadow />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#a855f7" />
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
  const carMargin = 1.25;
  const outerX = (TRACK_LENGTH_X + TRACK_WIDTH) / 2 - carMargin;
  const outerZ = (TRACK_LENGTH_Z + TRACK_WIDTH) / 2 - carMargin;
  const innerX = (TRACK_LENGTH_X - TRACK_WIDTH) / 2 + carMargin;
  const innerZ = (TRACK_LENGTH_Z - TRACK_WIDTH) / 2 + carMargin;

  let nx = Math.max(-outerX, Math.min(outerX, x));
  let nz = Math.max(-outerZ, Math.min(outerZ, z));

  // The track is a ring. If the car enters the grass, return it to the
  // closest inner road edge instead of trapping it in the centre field.
  if (Math.abs(nx) < innerX && Math.abs(nz) < innerZ) {
    const toVerticalEdge = innerX - Math.abs(nx);
    const toHorizontalEdge = innerZ - Math.abs(nz);
    if (toVerticalEdge < toHorizontalEdge) {
      nx = (nx < 0 ? -1 : 1) * innerX;
    } else {
      nz = (nz < 0 ? -1 : 1) * innerZ;
    }
  }
  return { x: nx, z: nz };
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

  const remotePlayers = useMemo(
    () => Object.values(room.players).filter((p) => p.id !== player.id),
    [room.players, player.id],
  );

  useEffect(() => {
    // never overwrite the locally simulated car from the network — only sync race start
    if (room.raceStartedAt) startTimeRef.current = room.raceStartedAt;
  }, [room.raceStartedAt]);

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
    speed *= Math.pow(0.35, delta); // frame-rate independent rolling resistance
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

    // lap / checkpoint logic
    const nextCheckpoint = (s.checkpoint + 1) % TOTAL_CHECKPOINTS;
    const cp = CHECKPOINTS[nextCheckpoint];
    if (!cp) return;
    const dist = distanceToCheckpoint(x, z, cp);
    let checkpoint = s.checkpoint;
    let lapCount = s.lap;
    let finishedAt = s.finishedAt;

    if (dist < 6) {
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

    // network sync ~8x/sec (or immediately on finish) to keep Firestore writes sane
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
        <Canvas camera={{ position: [0, 12, 18], fov: 55 }}>
          <Scene
            localPlayer={local}
            remotePlayers={remotePlayers}
            getLocalPose={getLocalPose}
            step={physics}
          />

        </Canvas>
      </div>

      {/* mobile controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex items-end justify-between px-4 sm:hidden">
        <div className="pointer-events-auto grid grid-cols-3 gap-2">
          <div />
          <button
            type="button"
            className="rounded-2xl bg-ink/80 p-4 text-paper active:bg-ink"
            onTouchStart={() => (keys.current["arrowup"] = true)}
            onTouchEnd={() => (keys.current["arrowup"] = false)}
          >
            ↑
          </button>
          <div />
          <button
            type="button"
            className="rounded-2xl bg-ink/80 p-4 text-paper active:bg-ink"
            onTouchStart={() => (keys.current["arrowleft"] = true)}
            onTouchEnd={() => (keys.current["arrowleft"] = false)}
          >
            ←
          </button>
          <button
            type="button"
            className="rounded-2xl bg-ink/80 p-4 text-paper active:bg-ink"
            onTouchStart={() => (keys.current["arrowdown"] = true)}
            onTouchEnd={() => (keys.current["arrowdown"] = false)}
          >
            ↓
          </button>
          <button
            type="button"
            className="rounded-2xl bg-ink/80 p-4 text-paper active:bg-ink"
            onTouchStart={() => (keys.current["arrowright"] = true)}
            onTouchEnd={() => (keys.current["arrowright"] = false)}
          >
            →
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-10 hidden rounded-2xl border border-ink/10 bg-paper/80 px-3 py-2 backdrop-blur-xl sm:block">
        <p className="text-xs text-ink-soft">Use WASD or Arrow keys to drive</p>
      </div>
    </div>
  );
}
