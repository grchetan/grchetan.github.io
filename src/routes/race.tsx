import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHero, SiteShell } from "@/components/site/shell";
import { RaceGame } from "@/components/site/race-game";
import {
  RaceLobby,
  RaceResults,
  type LobbyView,
} from "@/components/site/race-lobby";
import { RaceLeaderboard } from "@/components/site/race/race-leaderboard";
import { createPlayer, cleanInputName, cleanName, type Player } from "@/lib/arcade";
import { UserPlus, Link as LinkIcon, Keyboard, Trophy, Zap } from "lucide-react";
import { raceAudio } from "@/components/site/race/race-audio";
import { getStartingGridPos } from "@/components/site/race/race-physics";
import {
  createRaceRoom,
  finishRace,
  getRacePlayer,
  joinRaceRoom,
  leaveRaceRoom,
  setRacePlayer,
  startCountdown,
  startRace,
  subscribeRaceRoom,
  submitRaceResult,
  updateRoomSettings,
  type RaceRoom,
  type RoomSettings,
} from "@/lib/race";

const title = "Horizon Circuit — Multiplayer 3D GP Race | Chetan Prajapat";
const description =
  "Create a room, invite friends with a 4-letter code, and race on a 1.92km Horizon Grand Prix 3D circuit. Live standings & lap records.";

export const Route = createFileRoute("/race")({
  component: RacePage,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
  }),
});

function RacePage() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [room, setRoom] = useState<RaceRoom | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [view, setView] = useState<LobbyView>("menu");
  const [nameInput, setNameInput] = useState("");
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const countdownTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const existing = getRacePlayer();
    if (existing) {
      setPlayer(existing);
    }
    return () => {
      if (countdownTimerRef.current) {
        window.clearTimeout(countdownTimerRef.current);
      }
      raceAudio.endSession();
    };
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    const unsub = subscribeRaceRoom(roomCode, (r) => {
      if (!r) {
        toast.error("Room closed or expired.");
        raceAudio.endSession();
        setRoom(null);
        setRoomCode(null);
        setView("menu");
        return;
      }
      setRoom(r);
      setView("room");
    });
    return () => unsub();
  }, [roomCode]);

  // Safety fallback: if countdown started >3.4s ago, ensure room progresses cleanly
  useEffect(() => {
    if (
      room &&
      room.phase === "countdown" &&
      room.countdownStartedAt &&
      player &&
      room.hostId === player.id
    ) {
      const remaining = Math.max(
        50,
        3000 - (Date.now() - room.countdownStartedAt)
      );
      const t = window.setTimeout(() => {
        void startRace(room.code);
      }, remaining);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [room?.code, room?.phase, room?.countdownStartedAt, room?.hostId, player]);

  const ensurePlayer = async (customName?: string) => {
    if (player) return player;
    let name = (customName ?? nameInput).trim();
    if (!name) {
      name = `Racer-${Math.floor(100 + Math.random() * 900)}`;
    }
    setIsCreatingPlayer(true);
    try {
      const p = await createPlayer(name);
      setRacePlayer(p);
      setPlayer(p);
      toast.success(`Welcome, ${p.name}!`);
      return p;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not create player ID";
      toast.error(msg);
      throw err;
    } finally {
      setIsCreatingPlayer(false);
    }
  };

  const scrollToStage = () => {
    window.setTimeout(() => {
      stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleCreate = async () => {
    raceAudio.endSession();
    const p = await ensurePlayer();
    const r = await createRaceRoom(p);
    setRoom(r);
    setRoomCode(r.code);
    setView("room");
    toast.success(`Room created: ${r.code}`);
  };

  const handleQuickRace = async (directName?: string) => {
    raceAudio.startSession();
    const p = await ensurePlayer(directName);
    const spawn = getStartingGridPos(0);
    const r: RaceRoom = {
      code: "SOLO",
      hostId: p.id,
      phase: "racing",
      settings: { laps: 3, maxPlayers: 6, withAI: true },
      players: {
        [p.id]: {
          id: p.id,
          name: p.name,
          handle: p.handle,
          car: { color: "#38bdf8" },
          x: spawn.x,
          z: spawn.z,
          rotation: spawn.rotation,
          speed: 0,
          lap: 1,
          checkpoint: 0,
          progress: -6,
          finishedAt: null,
          bestLap: null,
          connectedAt: Date.now(),
        },
      },
      raceStartedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setRoom(r);
    setRoomCode(null);
    setView("room");
    scrollToStage();
    toast.success("Quick Race started on 1.92km Horizon GP!");
  };

  const handleJoin = async (code: string) => {
    raceAudio.endSession();
    const p = await ensurePlayer();
    const r = await joinRaceRoom(p, code);
    setRoom(r);
    setRoomCode(r.code);
    setView("room");
  };

  const handleUpdateSettings = async (patch: Partial<RoomSettings>) => {
    if (!room || room.code === "SOLO") return;
    await updateRoomSettings(room.code, patch);
  };

  const handleStart = async () => {
    if (!room) return;
    raceAudio.startSession();
    await startCountdown(room.code);
    scrollToStage();
    if (countdownTimerRef.current) window.clearTimeout(countdownTimerRef.current);
    countdownTimerRef.current = window.setTimeout(() => {
      void startRace(room.code);
    }, 3000);
  };

  const handleLeave = useCallback(async () => {
    raceAudio.endSession();
    if (player && room && room.code !== "SOLO") {
      await leaveRaceRoom(player.id, room.code);
    }
    setRoom(null);
    setRoomCode(null);
    setView("menu");
  }, [player, room]);

  const handleCopyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    toast.success("Room code copied!");
  };

  const handleFinish = useCallback(
    async (totalTime: number, bestLap: number) => {
      if (!player || !room) return;
      await submitRaceResult({
        playerId: player.id,
        name: player.name,
        handle: player.handle,
        totalTime,
        bestLap,
        laps: room.settings.laps,
      });

      const results = room.results ?? [];
      const existing = results.find((r) => r.playerId === player.id);
      const nextResult = {
        playerId: player.id,
        name: player.name,
        handle: player.handle,
        totalTime,
        bestLap,
        rank: 0,
      };
      const nextResults = existing
        ? results.map((r) => (r.playerId === player.id ? nextResult : r))
        : [...results, nextResult];
      if (room.code === "SOLO") {
        setRoom((prev) =>
          prev ? { ...prev, phase: "finished", results: [nextResult] } : null
        );
        return;
      }
      await finishRace(room.code, nextResults);
    },
    [player, room]
  );

  const handlePlayAgain = useCallback(() => {
    raceAudio.endSession();
    setRoomCode(null);
    setRoom(null);
    setView("menu");
  }, []);

  const steps = [
    {
      num: "01",
      title: "Enter the Pits",
      desc: "Pick a display name or launch instant Quick Race in 1 tap.",
      icon: UserPlus,
      color: "from-cyan-500 to-blue-500",
      shadow: "shadow-cyan-500/10",
    },
    {
      num: "02",
      title: "Low-MS Multiplayer",
      desc: "Create a room or enter a 4-letter code for direct P2P low-ping racing.",
      icon: LinkIcon,
      color: "from-blue-500 to-indigo-500",
      shadow: "shadow-blue-500/10",
    },
    {
      num: "03",
      title: "Desktop & Mobile Pro",
      desc: "Desktop WASD/Arrows or Mobile Slide-Pad, Virtual Wheel & Tilt Gyro.",
      icon: Keyboard,
      color: "from-indigo-500 to-purple-500",
      shadow: "shadow-indigo-500/10",
    },
    {
      num: "04",
      title: "Claim Records",
      desc: "Hit boost pads, powerslide through apexes, and set fastest lap records.",
      icon: Trophy,
      color: "from-purple-500 to-rose-500",
      shadow: "shadow-purple-500/10",
    },
  ];

  const isRacing = view === "room" && room && room.phase === "racing";

  return (
    <SiteShell>
      {!isRacing && (
        <PageHero
          eyebrow="Arcade"
          title="Horizon Circuit"
          lead="Create a room, share the code, race your friends across a 1.92km Grand Prix 3D circuit."
          meta={["P2P + Cloud Sync", "3 Mobile Control Modes", "Lap records"]}
        />
      )}

      <section
        ref={stageRef}
        className={
          isRacing
            ? "relative z-10 px-2 pb-16 pt-24 sm:px-6 lg:px-10"
            : "relative z-10 px-5 pb-24 pt-6 sm:px-8 lg:px-14"
        }
      >
        <div className="mx-auto w-full max-w-[84rem]">
          {!player ? (
            <div className="mx-auto max-w-md rounded-[1.75rem] border border-ink/10 bg-paper-tint/60 p-6 backdrop-blur-xl sm:p-8">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cyan-500">
                  Ready to Race
                </span>
              </div>
              <h2 className="mt-2 font-display text-2xl text-ink">
                Enter the pits
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Pick a display name or jump straight onto the 1.92km circuit with
                1 tap.
              </p>

              <button
                type="button"
                onClick={() => handleQuickRace()}
                disabled={isCreatingPlayer}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-5 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.16em] text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] hover:shadow-cyan-500/40 active:scale-95 disabled:opacity-50"
              >
                <Zap className="size-4 animate-bounce" />
                ⚡ Instant Quick Race (vs AI)
              </button>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-ink/10" />
                <span className="font-mono text-[0.62rem] uppercase tracking-wider text-ink-soft/60">
                  or choose your name
                </span>
                <div className="h-px flex-1 bg-ink/10" />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleQuickRace();
                }}
                className="space-y-3"
              >
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(cleanInputName(e.target.value))}
                  onBlur={() => setNameInput(cleanName(nameInput))}
                  placeholder="Your name (e.g. Chetan Prajapat)"
                  maxLength={22}
                  className="w-full rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3 text-ink placeholder:text-ink/30 focus:border-[var(--prism-blue)] focus:outline-none font-mono text-sm"
                />
                <button
                  type="submit"
                  disabled={isCreatingPlayer}
                  className="w-full rounded-2xl bg-ink px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] text-paper transition hover:opacity-90 disabled:opacity-50"
                >
                  {isCreatingPlayer ? "Creating..." : "Save Name & Race"}
                </button>
              </form>
            </div>
          ) : view === "room" && room && room.phase === "racing" ? (
            <RaceGame
              player={player}
              room={room}
              onExit={() => void handleLeave()}
              onFinish={handleFinish}
            />
          ) : view === "room" &&
            room &&
            room.phase === "finished" &&
            room.results ? (
            <RaceResults
              results={room.results}
              player={player}
              onPlayAgain={handlePlayAgain}
            />
          ) : (
            <RaceLobby
              player={player}
              room={room}
              view={view}
              onCreate={handleCreate}
              onJoin={handleJoin}
              onQuickRace={handleQuickRace}
              onUpdateSettings={handleUpdateSettings}
              onStart={handleStart}
              onLeave={() => void handleLeave()}
              onCopyCode={handleCopyCode}
              onView={setView}
            />
          )}

          {/* Circuit Hall of Fame Leaderboard */}
          {!isRacing && <RaceLeaderboard currentRacerId={player?.id} />}

          {/* How to Play Section */}
          {!isRacing && (
            <div className="mt-24 border-t border-ink/10 pt-16">
              <div className="text-center max-w-xl mx-auto">
                <span className="label text-cyan-400">Rules of engagement</span>
                <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                  How to Play{" "}
                  <span className="chrome-text">Horizon Circuit</span>
                </h2>
                <p className="mt-3 text-sm text-ink-soft leading-relaxed">
                  Follow these quick steps to get behind the wheel, connect with
                  friends, and set fast lap records.
                </p>
              </div>

              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map((step, i) => (
                  <div
                    key={i}
                    className="group relative rounded-3xl border border-ink/10 bg-paper-tint/30 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-500/30 hover:bg-paper-tint/50"
                  >
                    <div
                      className={`absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-10 bg-gradient-to-br ${step.color} blur-[12px] -z-10`}
                    />

                    <div className="flex items-center justify-between">
                      <span
                        className={`font-mono text-xs font-black tracking-widest bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}
                      >
                        STEP {step.num}
                      </span>
                      <div
                        className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} p-2 text-white shadow-lg ${step.shadow} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
                      >
                        <step.icon className="size-full" strokeWidth={1.5} />
                      </div>
                    </div>

                    <h3 className="mt-6 font-display text-lg font-bold text-ink transition-colors duration-300 group-hover:text-cyan-400">
                      {step.title}
                    </h3>

                    <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
