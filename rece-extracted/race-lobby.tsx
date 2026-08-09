import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Users, Plus, LogIn, Crown, ArrowRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Player } from "@/lib/arcade";
import type { RaceRoom, RacePhase, RaceResult } from "@/lib/race";
import { useCountdown } from "@/lib/race";

export type LobbyView = "menu" | "create" | "join" | "room";

export function RaceLobby({
  player,
  room,
  view,
  onCreate,
  onJoin,
  onStart,
  onLeave,
  onCopyCode,
  onView,
}: {
  player: Player;
  room: RaceRoom | null;
  view: LobbyView;
  onCreate: () => void | Promise<void>;
  onJoin: (code: string) => void | Promise<void>;
  onView: (view: LobbyView) => void;
  onStart: () => void;
  onLeave: () => void;
  onCopyCode: (code: string) => void;
}) {
  const [codeInput, setCodeInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const countdown = useCountdown(room);

  if (view === "menu") {
    return (
      <div className="mx-auto max-w-md rounded-[1.75rem] border border-ink/10 bg-paper-tint/60 p-6 backdrop-blur-xl sm:p-8">
        <h2 className="font-display text-2xl text-ink">Chrome Circuit</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Multiplayer mini race. Create a private room and invite friends with a 4-letter code.
        </p>
        <div className="mt-6 grid gap-3">
          <button
            type="button"
            disabled={isCreating}
            onClick={async () => {
              setCreateError(null);
              setIsCreating(true);
              try {
                await onCreate();
              } catch (e: any) {
                setCreateError(e?.message || "Could not create room.");
              } finally {
                setIsCreating(false);
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] text-paper transition hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="size-4" />
            {isCreating ? "Creating..." : "Create Room"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCodeInput("");
              setJoinError(null);
              onView("join");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-paper/60 px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] text-ink transition hover:bg-paper"
          >
            <LogIn className="size-4" />
            Join Room
          </button>
          {createError ? (
            <p className="text-center text-sm text-[var(--prism-red)]">{createError}</p>
          ) : null}
        </div>
      </div>
    );
  }

  if (view === "join") {
    return (
      <div className="mx-auto max-w-md rounded-[1.75rem] border border-ink/10 bg-paper-tint/60 p-6 backdrop-blur-xl sm:p-8">
        <h2 className="font-display text-2xl text-ink">Join a room</h2>
        <p className="mt-2 text-sm text-ink-soft">Enter the 4-letter code your friend shared.</p>
        <div className="mt-6">
          <input
            type="text"
            maxLength={4}
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            placeholder="ABCD"
            className="w-full rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3 text-center font-mono text-2xl tracking-[0.2em] text-ink placeholder:text-ink/30 focus:border-[var(--prism-blue)] focus:outline-none"
          />
          {joinError ? <p className="mt-2 text-sm text-[var(--prism-red)]">{joinError}</p> : null}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onView("menu")}
            className="rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3 font-mono text-xs uppercase tracking-[0.14em] text-ink transition hover:bg-paper"
          >
            Back
          </button>
          <button
            type="button"
            disabled={codeInput.length !== 4 || isJoining}
            onClick={async () => {
              setJoinError(null);
              setIsJoining(true);
              try {
                await onJoin(codeInput);
              } catch (e: any) {
                setJoinError(e?.message || "Could not join room.");
              } finally {
                setIsJoining(false);
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 font-mono text-xs uppercase tracking-[0.14em] text-paper transition hover:opacity-90 disabled:opacity-50"
          >
            {isJoining ? "Joining..." : "Join"}
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="mx-auto max-w-md rounded-[1.75rem] border border-ink/10 bg-paper-tint/60 p-6 backdrop-blur-xl">
        <p className="text-sm text-ink-soft">Loading room...</p>
      </div>
    );
  }

  const players = Object.values(room.players).sort((a, b) => a.connectedAt - b.connectedAt);
  const isHost = room.hostId === player.id;
  const canStart = players.length >= 1 && isHost && room.phase === "lobby";

  return (
    <div className="mx-auto max-w-md rounded-[1.75rem] border border-ink/10 bg-paper-tint/60 p-6 backdrop-blur-xl sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-soft">Room code</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-display text-3xl tracking-[0.12em] text-ink">{room.code}</span>
            <button
              type="button"
              onClick={() => onCopyCode(room.code)}
              className="rounded-full p-2 transition hover:bg-ink/5"
              aria-label="Copy room code"
            >
              <Copy className="size-4 text-ink-soft" />
            </button>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-soft">Players</p>
          <p className="font-display text-2xl text-ink">
            {players.length}/{room.settings.maxPlayers}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {players.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-paper/50 px-4 py-3"
          >
            <span
              className="size-4 rounded-full"
              style={{ backgroundColor: p.car.color }}
            />
            <span className="flex-1 text-sm font-medium text-ink">{p.name}</span>
            {p.id === room.hostId ? (
              <Crown className="size-4 text-[var(--prism-yellow)]" />
            ) : null}
            {p.id === player.id ? (
              <span className="rounded-full bg-ink/5 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-ink-soft">
                You
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {room.phase === "countdown" ? (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="mt-6 grid place-items-center rounded-2xl bg-ink py-6 text-paper"
          >
            <p className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">Starting in</p>
            <p className="font-display text-5xl">{countdown}</p>
          </motion.div>
        ) : room.phase === "lobby" ? (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 grid gap-3">
            {canStart ? (
              <button
                type="button"
                onClick={onStart}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] text-paper transition hover:opacity-90"
              >
                <Users className="size-4" />
                Start Race
              </button>
            ) : (
              <div className="rounded-2xl border border-ink/10 bg-paper/50 px-4 py-3 text-center text-sm text-ink-soft">
                {isHost
                  ? "Waiting for you to start the race."
                  : "Waiting for the host to start the race."}
              </div>
            )}
            <button
              type="button"
              onClick={onLeave}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-paper/60 px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] text-ink transition hover:bg-paper"
            >
              <Trash2 className="size-4" />
              Leave Room
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function RaceResults({
  results,
  player,
  onPlayAgain,
}: {
  results: RaceResult[];
  player: Player;
  onPlayAgain: () => void;
}) {
  const sorted = [...results].sort((a, b) => {
    if (a.totalTime == null && b.totalTime == null) return 0;
    if (a.totalTime == null) return 1;
    if (b.totalTime == null) return -1;
    return a.totalTime - b.totalTime;
  });

  return (
    <div className="mx-auto max-w-md rounded-[1.75rem] border border-ink/10 bg-paper-tint/60 p-6 backdrop-blur-xl sm:p-8">
      <h2 className="font-display text-2xl text-ink">Race finished</h2>
      <div className="mt-6 space-y-2">
        {sorted.map((r, i) => (
          <div
            key={r.playerId}
            className={cn(
              "flex items-center gap-3 rounded-2xl border px-4 py-3",
              r.playerId === player.id
                ? "border-[var(--prism-blue)]/40 bg-[var(--prism-blue)]/8"
                : "border-ink/10 bg-paper/50",
            )}
          >
            <span className="font-display text-xl text-ink-soft">#{i + 1}</span>
            <span className="flex-1 text-sm font-medium text-ink">{r.name}</span>
            <span className="font-mono text-xs text-ink-soft">
              {r.totalTime ? `${(r.totalTime / 1000).toFixed(2)}s` : "DNF"}
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onPlayAgain}
        className="mt-6 w-full rounded-2xl bg-ink px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] text-paper transition hover:opacity-90"
      >
        Play Again
      </button>
    </div>
  );
}
