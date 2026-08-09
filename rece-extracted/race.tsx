import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHero, SiteShell } from "@/components/site/shell";
import { RaceGame } from "@/components/site/race-game";
import { RaceLobby, RaceResults, type LobbyView } from "@/components/site/race-lobby";
import { createPlayer, type Player } from "@/lib/arcade";
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
  updatePlayerState,
  type RaceRoom,
} from "@/lib/race";

const title = "Chrome Circuit — Multiplayer mini 3D race | Chetan Prajapat";
const description =
  "Create a room, invite friends with a 4-letter code, and race on a chrome-lit 3D track. Live leaderboard and lap records.";

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

  useEffect(() => {
    const existing = getRacePlayer();
    if (existing) {
      setPlayer(existing);
    }
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    const unsub = subscribeRaceRoom(roomCode, (r) => {
      if (!r) {
        toast.error("Room closed or expired.");
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

  const ensurePlayer = async () => {
    if (player) return player;
    const name = nameInput.trim();
    if (!name) {
      toast.error("Enter your name to continue.");
      throw new Error("Name required");
    }
    setIsCreatingPlayer(true);
    try {
      const p = await createPlayer(name);
      setRacePlayer(p);
      setPlayer(p);
      toast.success(`Player ID created: ${p.handle}`);
      return p;
    } finally {
      setIsCreatingPlayer(false);
    }
  };

  const handleCreate = async () => {
    const p = await ensurePlayer();
    const r = await createRaceRoom(p);
    setRoom(r);
    setRoomCode(r.code);
    setView("room");
    toast.success(`Room created: ${r.code}`);
  };

  const handleJoin = async (code: string) => {
    const p = await ensurePlayer();
    const r = await joinRaceRoom(p, code);
    setRoom(r);
    setRoomCode(r.code);
    setView("room");
  };

  const handleStart = async () => {
    if (!room) return;
    await startCountdown(room.code);
    window.setTimeout(() => startRace(room.code), 3000);
  };

  const handleLeave = async () => {
    if (player && room) {
      await leaveRaceRoom(player.id, room.code);
    }
    setRoom(null);
    setRoomCode(null);
    setView("menu");
  };

  const handleCopyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    toast.success("Room code copied!");
  };

  const handleUpdate = (state: Partial<RaceRoom["players"][string]>) => {
    if (!player || !room) return;
    void updatePlayerState(room.code, player.id, state);
  };

  const handleFinish = async (totalTime: number, bestLap: number) => {
    if (!player || !room) return;
    await submitRaceResult({
      playerId: player.id,
      name: player.name,
      handle: player.handle,
      totalTime,
      bestLap,
      laps: room.settings.laps,
    });

    const localEntry = room.players[player.id];
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
    await finishRace(room.code, nextResults);
  };

  const handlePlayAgain = () => {
    setRoomCode(null);
    setRoom(null);
    setView("menu");
  };

  return (
    <SiteShell>
      <PageHero
        eyebrow="Arcade"
        title="Chrome Circuit"
        lead="Create a room, share the code, race your friends on a chrome 3D track."
        meta={["Multiplayer rooms", "Live leaderboard", "Lap records"]}
      />

      <section className="relative z-10 px-5 pb-24 pt-6 sm:px-8 lg:px-14">
        <div className="mx-auto w-full max-w-[84rem]">
          {!player ? (
            <div className="mx-auto max-w-md rounded-[1.75rem] border border-ink/10 bg-paper-tint/60 p-6 backdrop-blur-xl sm:p-8">
              <h2 className="font-display text-2xl text-ink">Enter the pits</h2>
              <p className="mt-2 text-sm text-ink-soft">
                Pick a display name. Your player ID will be created automatically.
              </p>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Your name"
                maxLength={22}
                className="mt-4 w-full rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3 text-ink placeholder:text-ink/30 focus:border-[var(--prism-blue)] focus:outline-none"
              />
              <button
                type="button"
                disabled={isCreatingPlayer || nameInput.trim().length < 2}
                onClick={() => ensurePlayer().catch(() => {})}
                className="mt-4 w-full rounded-2xl bg-ink px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] text-paper transition hover:opacity-90 disabled:opacity-50"
              >
                {isCreatingPlayer ? "Creating..." : "Create Player ID"}
              </button>
            </div>
          ) : view === "room" && room && room.phase === "racing" ? (
            <RaceGame
              player={player}
              room={room}
              onUpdate={handleUpdate}
              onFinish={handleFinish}
            />
          ) : view === "room" && room && room.phase === "finished" && room.results ? (
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
              onStart={handleStart}
              onLeave={handleLeave}
              onCopyCode={handleCopyCode}
              onView={setView}
            />
          )}
        </div>
      </section>
    </SiteShell>
  );
}
