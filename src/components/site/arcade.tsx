import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Award, Check, Copy, Crown, Download, Gamepad2, KeyRound, LogOut, Medal, Trophy, Lock, Clock, Ban, Megaphone, Sparkles, Zap, ShieldAlert, Users } from "lucide-react";
import { Section, SectionHeading, Reveal, RegMark } from "@/components/site/primitives";
import { SignalRush, type RunResult } from "@/components/site/arcade-game";
import { downloadArcadeCertificate } from "@/lib/arcade-certificate";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import {
  cleanCode,
  cleanName,
  containsProfanity,
  createPlayer,
  defaultArcadeConfig,
  isCompleteCode,
  readSessionPlayer,
  registerForContest,
  resumePlayer,
  reRankFiltered,
  rank,
  submitScore,
  tierFor,
  useArcadeConfig,
  useLeaderboard,
  validateName,
  writeSessionPlayer,
  type Player,
  type RankedRow,
} from "@/lib/arcade";
import coffeeCupSvg from "@/assets/coffee-cup.svg";
import { cn } from "@/lib/utils";

export function BuyMeACoffee() {
  return (
    <a
      href="https://buymeacoffee.com/grchetan"
      target="_blank"
      rel="noreferrer noopener"
      className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg transition-all duration-300 hover:scale-105 hover:border-amber-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-95"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/90 p-1 shadow-inner transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
        <img src={coffeeCupSvg} alt="Buy me a coffee" className="size-full object-contain" />
      </span>
      <span className="font-mono text-xs font-extrabold tracking-widest text-slate-900">
        Buy Me a Coffee
      </span>
      <span className="ml-1 opacity-70 transition-transform duration-300 group-hover:translate-x-1">
        →
      </span>
    </a>
  );
}

/* ------------------------------- join / id -------------------------------- */

function CodeReveal({ player, onContinue }: { player: Player; onContinue: () => void }) {
  const [copied, setCopied] = useState(false);
  const code = player.code ?? "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Player ID copied — save it somewhere safe.");
    } catch {
      // Fallback: select the text so user can copy manually
      setCopied(true); // allow continue anyway
      toast.info("Select the code above and press Ctrl+C to copy it manually.");
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-ink/10 bg-paper-tint/60 p-6 backdrop-blur-xl sm:p-8">
      <span className="label">Step 02 · Save this</span>
      <h3 className="mt-3 font-display text-3xl text-ink">Your player ID</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
        This code is shown <strong className="text-ink">only once</strong>. Copy it and keep it —
        it's the only way back into <strong className="text-ink">{player.name}</strong>, and nobody
        else can claim that name again.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <code
          className="flex-1 select-all cursor-text rounded-2xl border border-ink/15 bg-paper/80 px-5 py-3 text-center font-mono text-lg tracking-[0.22em] text-ink"
          onClick={() => {
            if (window.getSelection && document.createRange) {
              const el = document.activeElement;
              if (el) {
                const range = document.createRange();
                range.selectNode(el);
                window.getSelection()?.removeAllRanges();
                window.getSelection()?.addRange(range);
              }
            }
          }}
        >
          {code}
        </code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-paper transition hover:opacity-90"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy ID"}
        </button>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className={cn(
          "mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-mono text-[0.66rem] uppercase tracking-[0.18em] transition",
          copied
            ? "bg-ink text-paper hover:opacity-90"
            : "border border-ink/15 text-ink hover:bg-ink hover:text-paper"
        )}
      >
        <Gamepad2 className="size-3.5" />
        {copied ? "Let's play! →" : "I saved my ID — Start playing"}
      </button>

      {!copied && (
        <p className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-soft">
          ↑ Copy your ID first, then start playing
        </p>
      )}
    </div>
  );
}

function JoinCard({ onJoined }: { onJoined: (p: Player) => void }) {
  const [mode, setMode] = useState<"create" | "resume">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<Player | null>(null);

  const { data: config = defaultArcadeConfig } = useArcadeConfig();

  const isProfane = useMemo(() => {
    return name ? containsProfanity(name, config.forbiddenWords ?? defaultArcadeConfig.forbiddenWords) : false;
  }, [name, config.forbiddenWords]);

  const problem = useMemo(() => {
    return name ? validateName(name, config.forbiddenWords ?? defaultArcadeConfig.forbiddenWords) : null;
  }, [name, config.forbiddenWords]);

  if (fresh) return <CodeReveal player={fresh} onContinue={() => onJoined(fresh)} />;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const issue = validateName(name, config.forbiddenWords ?? defaultArcadeConfig.forbiddenWords);
    if (issue) {
      toast.error(issue);
      return;
    }
    setBusy(true);
    try {
      const player = await createPlayer(name);
      setFresh(player);
      toast.success(`Name claimed — ${player.handle}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create your player ID.");
    } finally {
      setBusy(false);
    }
  };

  const resume = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const player = await resumePlayer(code);
      onJoined(player);
      toast.success(`Welcome back, ${player.name}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not find that player ID.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-ink/10 bg-paper-tint/60 p-6 backdrop-blur-xl sm:p-8">
      {/* Prominent Tab Switcher */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-ink/12 bg-paper/60 p-1.5">
        <button
          type="button"
          onClick={() => setMode("create")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] font-medium transition-all",
            mode === "create"
              ? "bg-ink text-paper shadow-sm"
              : "text-ink-soft hover:text-ink hover:bg-ink/5",
          )}
        >
          <Gamepad2 className="size-3.5" /> New Player
        </button>
        <button
          type="button"
          onClick={() => setMode("resume")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] font-medium transition-all",
            mode === "resume"
              ? "bg-ink text-paper shadow-sm"
              : "text-ink-soft hover:text-ink hover:bg-ink/5",
          )}
        >
          <KeyRound className="size-3.5" /> Login with ID
        </button>
      </div>

      {mode === "create" ? (
        <>
          <span className="label mt-6 block">Step 01 · Create Account</span>
          <h3 className="mt-3 font-display text-3xl text-ink">Claim your name</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            One name, one player. You get a secret player ID once — save it, and use it to come back
            and beat your own record anytime.
          </p>

          <form onSubmit={create} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(cleanName(e.target.value))}
              placeholder="Your name"
              maxLength={22}
              aria-label="Your name"
              className={cn(
                "w-full rounded-full border bg-paper/80 px-5 py-3 text-sm text-ink outline-none transition",
                isProfane
                  ? "border-rose-600 bg-rose-950/20 text-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.4)] animate-pulse"
                  : "border-ink/15 focus:border-[var(--prism-blue)]",
              )}
            />
            <button
              type="submit"
              disabled={busy || Boolean(problem)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-paper transition hover:opacity-90 disabled:opacity-50"
            >
              <Gamepad2 className="size-3.5" />
              {busy ? "Claiming…" : "Get my ID"}
            </button>
          </form>

          {isProfane ? (
            <div className="mt-4 rounded-2xl border border-rose-600/40 bg-gradient-to-r from-rose-950/40 via-red-900/30 to-rose-950/40 p-4 shadow-[0_0_20px_rgba(225,29,72,0.3)] backdrop-blur-md">
              <div className="flex items-center gap-2 text-rose-500 font-mono text-xs font-bold uppercase tracking-wider">
                <span className="text-base">🩸</span> RESPECTFUL ROAST WARNING
              </div>
              <p className="mt-1.5 font-sans text-xs leading-relaxed text-rose-200">
                Nice try, my friend! But abusive or inappropriate language won't work on this leaderboard.
                Please choose a clean, respectful name that you can be proud of!
              </p>
            </div>
          ) : problem ? (
            <p className="mt-2 text-xs text-[var(--prism-red)]">{problem}</p>
          ) : null}
        </>
      ) : (
        <>
          <span className="label mt-6 block">Returning Player · Resume Record</span>
          <h3 className="mt-3 font-display text-3xl text-ink">Enter Player ID</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            Enter your saved Player ID (<strong className="text-ink">CP-XXXX-XXXX</strong>). Your high score, rank, and statistics will be loaded automatically.
          </p>

          <form onSubmit={resume} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={code}
              onChange={(e) => setCode(cleanCode(e.target.value))}
              placeholder="CP-XXXX-XXXX"
              aria-label="Your player ID"
              className="w-full rounded-full border border-ink/15 bg-paper/80 px-5 py-3 font-mono text-sm tracking-[0.16em] text-ink outline-none transition focus:border-[var(--prism-blue)] uppercase"
            />
            <button
              type="submit"
              disabled={busy || !isCompleteCode(code)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-paper transition hover:opacity-90 disabled:opacity-50"
            >
              <KeyRound className="size-3.5" />
              {busy ? "Loading…" : "Login & Play"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

/* ------------------------------- leaderboard ------------------------------ */

function rankBadge(rank: number) {
  if (rank === 1) return { icon: Crown, tone: "var(--prism-yellow)" };
  if (rank === 2) return { icon: Medal, tone: "var(--prism-blue)" };
  if (rank === 3) return { icon: Award, tone: "var(--prism-pink)" };
  return null;
}

/** Score that counts up/down smoothly whenever a new value lands. */
function AnimatedScore({ value, reduced }: { value: number; reduced: boolean }) {
  const [shown, setShown] = useState(value);
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 120, damping: 22, mass: 0.6 });

  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
    mv.set(value);
  }, [value, mv, reduced]);

  useEffect(() => {
    if (reduced) return;
    return spring.on("change", (v) => setShown(Math.round(v)));
  }, [spring, reduced]);

  return <>{(reduced ? value : shown).toLocaleString()}</>;
}

function LeaderboardRow({
  row,
  index,
  mine,
  reduced,
  busy,
  onGrab,
}: {
  row: RankedRow;
  index: number;
  mine: boolean;
  reduced: boolean;
  busy: boolean;
  onGrab: (row: RankedRow) => void;
}) {
  const badge = rankBadge(row.rank);
  const tier = tierFor(row.rank);
  const prev = useRef({ rank: row.rank, score: row.score });
  const [pulse, setPulse] = useState<"up" | "down" | "score" | null>(null);

  useEffect(() => {
    const before = prev.current;
    let next: "up" | "down" | "score" | null = null;
    if (row.rank < before.rank) next = "up";
    else if (row.rank > before.rank) next = "down";
    else if (row.score !== before.score) next = "score";
    prev.current = { rank: row.rank, score: row.score };
    if (!next || reduced) return;
    setPulse(next);
    const t = setTimeout(() => setPulse(null), 1100);
    return () => clearTimeout(t);
  }, [row.rank, row.score, reduced]);

  const glow =
    pulse === "up"
      ? "var(--prism-yellow)"
      : pulse === "down"
        ? "var(--prism-red)"
        : pulse === "score"
          ? "var(--prism-blue)"
          : null;

  return (
    <motion.li
      layout={!reduced}
      {...(reduced ? {} : { layoutId: `lb-${row.playerId}` })}
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        backgroundColor: glow
          ? `color-mix(in oklab, ${glow} 14%, transparent)`
          : mine
            ? "color-mix(in oklab, var(--prism-blue) 8%, transparent)"
            : "rgba(0,0,0,0)",
      }}
      exit={reduced ? { opacity: 1 } : { opacity: 0, y: -8, transition: { duration: 0.22 } }}
      transition={
        reduced
          ? { duration: 0 }
          : {
              layout: { type: "spring", stiffness: 420, damping: 34 },
              opacity: { duration: 0.3, delay: Math.min(index, 12) * 0.02 },
              y: { duration: 0.3, delay: Math.min(index, 12) * 0.02 },
              backgroundColor: { duration: 0.55 },
            }
      }
      className="relative grid grid-cols-12 items-center gap-y-2 gap-x-2 border-b border-ink/[0.07] px-4 py-3.5 md:grid-cols-[4rem_1fr_6rem_6rem_6rem_9rem]"
    >
      <span className="col-span-3 flex items-center gap-1.5 font-display text-lg text-ink md:col-span-1 md:text-xl">
        {badge ? (
          <badge.icon className="size-4 shrink-0" style={{ color: badge.tone }} strokeWidth={2.2} />
        ) : null}
        <motion.span
          key={row.rank}
          initial={reduced ? false : { opacity: 0, y: pulse === "down" ? -8 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          #{row.rank}
        </motion.span>
      </span>

      <span className="col-span-5 min-w-0 md:col-span-1">
        <span className="block truncate text-sm font-semibold text-ink md:text-[0.95rem]">
          {row.name}
          {mine ? <span className="ml-1.5 caption">you</span> : null}
        </span>
        <span className="block truncate font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-soft">
          {row.handle} · {row.plays} {row.plays === 1 ? "run" : "runs"}
        </span>
      </span>

      <span className="col-span-4 font-mono text-sm font-semibold text-ink text-right md:col-span-1">
        <AnimatedScore value={row.score} reduced={reduced} />
      </span>

      <span className="col-span-4 font-mono text-xs text-ink-soft md:col-span-1 md:text-right">
        Acc: {row.accuracy}%
      </span>
      <span className="col-span-4 font-mono text-xs text-ink-soft md:col-span-1 md:text-right">
        Combo: x{row.combo}
      </span>

      <span className="col-span-4 text-right md:col-span-1">
        {mine && tier ? (
          <button
            type="button"
            onClick={() => onGrab(row)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-paper transition hover:opacity-90 disabled:opacity-50 shadow-xs"
          >
            <Download className="size-2.5" />
            {busy ? "…" : "PDF"}
          </button>
        ) : (
          <span className="caption text-ink-soft opacity-50 text-[0.65rem]">
            {tier ? tier.label : "—"}
          </span>
        )}
      </span>
    </motion.li>
  );
}

function LeaderboardTable({
  rows,
  meId,
  meHandle,
  boardTab,
  config,
}: {
  rows: RankedRow[];
  meId?: string | undefined;
  meHandle?: string | undefined;
  boardTab: "weekly" | "lifetime" | "contest";
  config: any;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const { reduced } = useMotionPreference();

  const grab = useCallback(
    async (row: RankedRow) => {
      const isMine =
        (meId && row.playerId === meId) ||
        (meHandle && row.handle.toLowerCase() === meHandle.toLowerCase());
      if (!isMine) {
        toast.error("You can only download your own certificate.");
        return;
      }
      setBusy(row.id);
      try {
        const title =
          boardTab === "weekly"
            ? "Signal Rush Weekly Leaderboard"
            : boardTab === "contest"
            ? (config.contest?.title ?? "Signal Rush Tournament")
            : "Signal Rush All-Time Leaderboard";
        await downloadArcadeCertificate(row, title);
        toast.success(`Certificate ready — rank #${row.rank}`);
      } catch {
        toast.error("Certificate could not be generated.");
      } finally {
        setBusy(null);
      }
    },
    [meId, meHandle],
  );

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-dashed border-ink/15 bg-paper/50 p-10 text-center">
        <p className="font-display text-2xl text-ink">No runs yet.</p>
        <p className="mt-2 text-sm text-ink-soft">Be the first name on the board.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-ink/10 bg-paper-tint/50 backdrop-blur-xl">
      <div className="hidden grid-cols-[4rem_1fr_6rem_6rem_6rem_9rem] gap-3 border-b border-ink/10 px-5 py-3 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-soft md:grid">
        <span>Rank</span>
        <span>Player</span>
        <span className="text-right">Score</span>
        <span className="text-right">Accuracy</span>
        <span className="text-right">Combo</span>
        <span className="text-right">Certificate</span>
      </div>

      <ul>
        <AnimatePresence initial={false}>
          {rows.map((row, i) => {
            const isMine =
              (meId && row.playerId === meId) ||
              (meHandle && row.handle.toLowerCase() === meHandle.toLowerCase());
            return (
              <LeaderboardRow
                key={row.playerId}
                row={row}
                index={i}
                mine={Boolean(isMine)}
                reduced={reduced}
                busy={busy === row.id}
                onGrab={grab}
              />
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}


/* --------------------------------- stage ---------------------------------- */

export function ArcadeStage() {
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    setPlayer(readSessionPlayer());
  }, []);

  const [last, setLast] = useState<RunResult | null>(null);
  const { data: rows = [], isLoading } = useLeaderboard();
  const { data: config = defaultArcadeConfig } = useArcadeConfig();
  const qc = useQueryClient();

  const [remainingSec, setRemainingSec] = useState<number>(0);

  useEffect(() => {
    if (config.mode !== "timer" || !config.timerEndAt) {
      setRemainingSec(0);
      return;
    }
    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((config.timerEndAt! - Date.now()) / 1000));
      setRemainingSec(diff);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [config.mode, config.timerEndAt]);

  const formatCountdown = (totalSec: number) => {
    if (totalSec <= 0) return "00h 00m 00s";
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  };

  const isBanned = player ? (config.bannedPlayers ?? []).includes(player.id) : false;
  const isTimerExpired = config.mode === "timer" && remainingSec <= 0;
  const isClosed = config.mode === "disabled" || isTimerExpired;

  const [boardTab, setBoardTab] = useState<"weekly" | "lifetime" | "contest">("weekly");
  const [registering, setRegistering] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [contestSec, setContestSec] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);

      if (config.contest?.active) {
        const { startAt, endAt } = config.contest;
        if (now < startAt) {
          setContestSec(Math.max(0, Math.floor((startAt - now) / 1000)));
        } else if (now <= endAt) {
          setContestSec(Math.max(0, Math.floor((endAt - now) / 1000)));
        } else {
          setContestSec(0);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [config.contest]);

  const contest = config.contest;
  const isContestActive = Boolean(contest?.active);
  const isContestLive = isContestActive && currentTime >= (contest?.startAt ?? 0) && currentTime <= (contest?.endAt ?? Infinity);
  const isContestUpcoming = isContestActive && currentTime < (contest?.startAt ?? 0);
  const isContestEnded = isContestActive && currentTime > (contest?.endAt ?? Infinity);

  const finish = useCallback(
    async (result: RunResult) => {
      if (isClosed || isBanned) {
        toast.error("Game is currently closed or restricted.");
        return;
      }
      setLast(result);
      if (!player) return;
      try {
        await submitScore({ player, ...result });
        await qc.invalidateQueries({ queryKey: ["arcade", "leaderboard"] });
        if (isContestLive) {
          setBoardTab("contest");
          toast.success(`🏆 Contest Run Logged! ${Math.round(result.score).toLocaleString()} pts added to Contest Standings!`);
        } else {
          toast.success(`Score saved — ${Math.round(result.score).toLocaleString()} points`);
        }
      } catch (err) {
        console.warn("[Arcade score save fallback]:", err);
        toast.success(`Score saved — ${Math.round(result.score).toLocaleString()} points`);
      }
    },
    [player, qc, isClosed, isBanned, isContestLive],
  );

  const isRegistered = useMemo(() => {
    if (!player || !config.contest) return false;
    return (config.contest.registrations ?? []).includes(player.id);
  }, [player, config.contest]);

  const handleRegister = async () => {
    if (!player) {
      toast.error("Please claim a name or log in first to register for the contest.");
      return;
    }
    setRegistering(true);
    try {
      const updatedConfig = await registerForContest(player.id);
      qc.setQueryData(["arcade", "config"], updatedConfig);
      await qc.invalidateQueries({ queryKey: ["arcade", "config"] });
      toast.success(`Registered for ${config.contest?.title ?? "Contest"} (${config.contest?.version ?? "v1.0"})!`);
    } catch {
      toast.error("Could not complete registration.");
    } finally {
      setRegistering(false);
    }
  };

  const filteredRows = useMemo(() => {
    const now = Date.now();
    const bannedIds = config.bannedPlayers ?? [];
    const activeRuns = rows.filter((r) => !bannedIds.includes(r.playerId));

    // Compute start of the current week (Monday 00:00:00 local time)
    const startOfWeek = (() => {
      const d = new Date();
      const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      const diffToMonday = day === 0 ? -6 : 1 - day; // days back to Monday
      d.setDate(d.getDate() + diffToMonday);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })();

    if (boardTab === "weekly") {
      // Use admin's manual reset timestamp if it was set more recently than this week's Monday
      const adminReset = config.weeklyResetAt ?? 0;
      const effectiveReset = adminReset > startOfWeek ? adminReset : startOfWeek;
      const resetTs = Math.min(effectiveReset, now);
      const weeklyFiltered = activeRuns.filter((r) => r.createdAt >= resetTs);
      return rank(weeklyFiltered); // group by player and rank Weekly scores 1st, 2nd...
    }
    if (boardTab === "contest") {
      const startAt = config.contest?.startAt ?? 0;
      const endAt = config.contest?.endAt ?? Infinity;
      const contestFiltered = activeRuns.filter((r) => r.createdAt >= startAt && r.createdAt <= endAt);
      return rank(contestFiltered); // group by player and rank Contest scores 1st, 2nd...
    }
    return rank(activeRuns); // lifetime — group by player and rank of all time
  }, [rows, boardTab, config.weeklyResetAt, config.contest?.startAt, config.contest?.endAt, config.bannedPlayers]);

  const me = useMemo(() => {
    if (!player) return null;
    return (
      filteredRows.find(
        (r) =>
          r.playerId === player.id ||
          (r.handle && r.handle.toLowerCase() === player.handle.toLowerCase())
      ) ?? null
    );
  }, [filteredRows, player]);

  const lifetimeRankedRows = useMemo(() => {
    const bannedIds = config.bannedPlayers ?? [];
    const activeRuns = rows.filter((r) => !bannedIds.includes(r.playerId));
    return rank(activeRuns);
  }, [rows, config.bannedPlayers]);

  const bannedPlayersNames = useMemo(() => {
    const bannedIds = config.bannedPlayers ?? [];
    const uniqueBanned = new Set<string>();
    const names: string[] = [];
    for (const r of rows) {
      if (bannedIds.includes(r.playerId) && !uniqueBanned.has(r.playerId)) {
        uniqueBanned.add(r.playerId);
        names.push(`${r.name} (@${r.handle})`);
      }
    }
    return names;
  }, [rows, config.bannedPlayers]);

  const myLifetimeRow = useMemo(() => {
    if (!player) return null;
    return (
      lifetimeRankedRows.find(
        (r) =>
          r.playerId === player.id ||
          (r.handle && r.handle.toLowerCase() === player.handle.toLowerCase())
      ) ?? null
    );
  }, [lifetimeRankedRows, player]);


  const activeRank = me?.rank ?? myLifetimeRow?.rank ?? (last ? 1 : null);
  const activeScore = me?.score ?? myLifetimeRow?.score ?? (last ? Math.round(last.score) : null);
  const activeRuns = me?.plays ?? myLifetimeRow?.plays ?? (last ? 1 : 0);
  const myTier = me ? tierFor(me.rank) : myLifetimeRow ? tierFor(myLifetimeRow.rank) : null;

  const signOut = () => {
    writeSessionPlayer(null);
    setPlayer(null);
    setLast(null);
  };

  return (
    <>
      <Section id="play">
        {/* Sleek Dark Obsidian Esports Tournament Banner */}
        {config.announcement?.active || config.contest?.active ? (
          <div className="relative mb-12 overflow-hidden rounded-[1.75rem] border border-amber-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-slate-100 shadow-2xl backdrop-blur-xl sm:p-8">
            {/* Background Ambient Gold Light & Tech Decor */}
            <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-amber-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 size-72 rounded-full bg-yellow-500/10 blur-3xl" />
            <RegMark className="absolute right-5 top-5 opacity-40" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* Left Side: Tournament Metadata */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[0.66rem] font-bold uppercase tracking-[0.2em]",
                      isContestLive
                        ? "border-rose-500/50 bg-rose-500/20 text-rose-400"
                        : isContestUpcoming
                        ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
                        : "border-slate-700 bg-slate-800 text-slate-300"
                    )}
                  >
                    <span className="relative flex size-2">
                      <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-75", isContestLive ? "bg-rose-400" : "bg-amber-400")} />
                      <span className={cn("relative inline-flex size-2 rounded-full", isContestLive ? "bg-rose-500" : "bg-amber-400")} />
                    </span>
                    {isContestLive
                      ? `🔴 LIVE NOW · ${config.contest?.version}`
                      : isContestUpcoming
                      ? `⏳ UPCOMING · ${config.contest?.version}`
                      : isContestEnded
                      ? `🏁 CONTEST ENDED`
                      : "Arcade Alert"}
                  </span>

                  {isContestLive || isContestUpcoming ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-[0.68rem] font-bold text-amber-300">
                      <Clock className="size-3 text-amber-400 animate-spin" />
                      {isContestLive ? `Ends In: ${formatCountdown(contestSec)}` : `Starts In: ${formatCountdown(contestSec)}`}
                    </span>
                  ) : config.announcement?.dateText ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-800/80 px-3 py-1 font-mono text-[0.66rem] font-semibold text-slate-300">
                      <Clock className="size-3 text-amber-400" />
                      {config.announcement.dateText}
                    </span>
                  ) : null}

                  {config.contest?.active && (config.contest.registrations ?? []).length > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[0.68rem] font-bold text-emerald-300">
                      <Users className="size-3 text-emerald-400" />
                      {(config.contest.registrations ?? []).length} {(config.contest.registrations ?? []).length === 1 ? "player" : "players"} registered
                    </span>
                  )}
                </div>

                <h3 className="font-display text-2xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-400 bg-clip-text text-transparent sm:text-3xl">
                  {config.contest?.active ? config.contest.title : config.announcement?.title}
                </h3>

                <p className="max-w-xl text-sm leading-relaxed text-slate-300">
                  {config.contest?.active ? config.contest.description : config.announcement?.message}
                </p>
              </div>

              {/* Right Side: Registration Action or Contest Closed Notice */}
              {config.contest?.active ? (
                <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                  {isContestEnded ? (
                    <div className={cn(
                      "flex flex-col items-start gap-2 rounded-2xl border p-4 shadow-xl backdrop-blur-md lg:items-end",
                      isRegistered
                        ? "border-emerald-500/40 bg-emerald-950/60 text-emerald-100"
                        : "border-rose-500/40 bg-rose-950/60 text-rose-100"
                    )}>
                      <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider">
                        {isRegistered ? (
                          <>
                            <Trophy className="size-4 text-amber-400 shrink-0 animate-pulse" />
                            <span className="text-emerald-300">🏆 CONTEST ENDED — RESULTS ARE IN!</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="size-4 text-rose-400 shrink-0" />
                            <span className="text-rose-300">⚠️ YOU ARE LATE — CONTEST HAS ENDED</span>
                          </>
                        )}
                      </div>
                      <p className="text-[0.78rem] text-slate-300">
                        {isRegistered
                          ? "Thank you for participating! Check the final tournament standings below."
                          : `Registrations for ${config.contest.version} are closed. View final standings below!`}
                      </p>
                      <div className="flex items-center gap-2 font-mono text-[0.72rem] text-slate-300 mt-0.5">
                        <strong className="font-extrabold text-amber-300 text-sm">{(config.contest.registrations ?? []).length}</strong>{" "}
                        {(config.contest.registrations ?? []).length === 1 ? "player registered" : "total players registered"}
                      </div>
                    </div>
                  ) : isContestLive ? (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!isRegistered && player) {
                          await handleRegister();
                        }
                        setBoardTab("contest");
                        const el = document.getElementById("arcade-arena");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="inline-flex items-center gap-2.5 rounded-full border border-rose-400 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 px-7 py-3 font-mono text-xs font-extrabold uppercase tracking-widest text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_35px_rgba(244,63,94,0.6)] active:scale-95"
                    >
                      <Trophy className="size-4 animate-bounce text-amber-300" />
                      {isRegistered ? `Play Tournament Now (Live)` : `Register & Enter Tournament`}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleRegister()}
                        disabled={registering || isRegistered}
                        className={cn(
                          "inline-flex items-center gap-2.5 rounded-full px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-xl",
                          isRegistered
                            ? "border border-emerald-500/50 bg-emerald-600/90 text-white cursor-default shadow-emerald-500/20"
                            : "border border-amber-300 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 hover:scale-105 hover:shadow-[0_0_35px_rgba(251,191,36,0.6)] active:scale-95"
                        )}
                      >
                        {isRegistered ? (
                          <>
                            <Check className="size-4" /> Registered for {config.contest.version} ✓
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-4 animate-pulse" /> Register for {config.contest.version}
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2 font-mono text-[0.72rem] text-slate-300">
                        <span className="flex items-center -space-x-1.5">
                          <span className="grid size-5 place-items-center rounded-full bg-amber-400 text-[0.5rem] font-bold text-slate-950 shadow-xs">1</span>
                          <span className="grid size-5 place-items-center rounded-full bg-purple-400 text-[0.5rem] font-bold text-slate-950 shadow-xs">2</span>
                          <span className="grid size-5 place-items-center rounded-full bg-emerald-400 text-[0.5rem] font-bold text-slate-950 shadow-xs">3</span>
                        </span>
                        <span>
                          <strong className="font-extrabold text-amber-300 text-sm">{(config.contest.registrations ?? []).length}</strong>{" "}
                          {(config.contest.registrations ?? []).length === 1 ? "player registered" : "total players registered"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Dedicated Live Tournament Arena Banner */}
        {isContestLive ? (
          <div className="mb-10 overflow-hidden rounded-3xl border border-rose-500/50 bg-gradient-to-r from-rose-950/70 via-slate-950 to-amber-950/70 p-5 text-slate-100 shadow-2xl backdrop-blur-2xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-lg">
                  <Trophy className="size-6 animate-pulse text-amber-400" />
                </span>
                <div>
                  <div className="flex items-center gap-2 font-mono text-[0.66rem] font-extrabold uppercase tracking-widest text-rose-400">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
                    </span>
                    TOURNAMENT MODE ACTIVE · {config.contest?.version}
                  </div>
                  <h4 className="font-display text-xl font-extrabold text-white">
                    {config.contest?.title}
                  </h4>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-2 font-mono text-xs font-bold text-amber-300">
                  <Clock className="size-4 text-amber-400 animate-spin" />
                  Time Remaining: {formatCountdown(contestSec)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 font-mono text-[0.68rem] font-bold text-emerald-400">
                  <Check className="size-3.5" /> Contest Scores Auto-Recorded
                </span>
                {config.contest?.active && (config.contest.registrations ?? []).length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/15 px-3 py-1.5 font-mono text-[0.68rem] font-bold text-indigo-400">
                    <Users className="size-3.5" /> {(config.contest.registrations ?? []).length} {(config.contest.registrations ?? []).length === 1 ? "player" : "players"} registered
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <div id="arcade-arena" className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading eyebrow="Arcade" figure="01" title="Play a run." />
          <BuyMeACoffee />
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <Reveal>
            {player ? (
              <div className="rounded-[1.75rem] border border-ink/10 bg-paper-tint/60 p-6 backdrop-blur-xl sm:p-8">
                <span className="label">Player</span>
                <h3 className="mt-3 font-display text-3xl text-ink">{player.name}</h3>
                <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ink-soft">
                  {player.handle} · ID {player.code ? `${player.code.slice(0, 5)}••••` : "saved"}
                </p>

                <dl className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    ["Weekly", isBanned ? "—" : activeScore !== null ? activeScore.toLocaleString() : "—"],
                    ["Rank", isBanned ? "BANNED" : activeRank !== null ? `#${activeRank}` : "—"],
                    ["Runs", isBanned ? "—" : String(activeRuns)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-2xl border border-ink/10 bg-paper/70 px-3 py-2">
                      <dt className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ink-soft">{k}</dt>
                      <dd className="font-display text-xl text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>

                {last ? (
                  <p className="mt-5 text-sm text-ink-soft">
                    Last run: {Math.round(last.score).toLocaleString()} points · {Math.round(last.accuracy)}%
                    accuracy · best combo x{last.combo}.
                  </p>
                ) : null}

                {myTier && me ? (
                  <button
                    type="button"
                    onClick={() => {
                      const title =
                        boardTab === "weekly"
                          ? "Signal Rush Weekly Leaderboard"
                          : boardTab === "contest"
                          ? (config.contest?.title ?? "Signal Rush Tournament")
                          : "Signal Rush All-Time Leaderboard";
                      void downloadArcadeCertificate(me, title);
                    }}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-paper transition hover:opacity-90"
                  >
                    <Trophy className="size-3.5" />
                    Download {myTier.label} certificate
                  </button>
                ) : (
                  <p className="mt-5 caption">Finish inside the top 100 to unlock a certificate.</p>
                )}

                <button
                  type="button"
                  onClick={signOut}
                  className="mt-5 flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-soft transition hover:text-ink"
                >
                  <LogOut className="size-3.5" /> Sign out
                </button>
              </div>
            ) : (
              <JoinCard onJoined={(p) => setPlayer(p)} />
            )}
          </Reveal>

          <Reveal delay={0.08}>
            {isBanned ? (
              <div className="rounded-[1.75rem] border border-rose-500/30 bg-rose-500/10 p-8 backdrop-blur-xl">
                <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 font-mono text-xs font-semibold uppercase tracking-wider">
                  <Ban className="size-4" /> Account Banned
                </div>
                <h3 className="mt-3 text-2xl font-display text-ink">Access Restricted</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Your Player ID has been restricted by the administrator due to policy or anti-cheat violations.
                </p>
              </div>
            ) : isClosed ? (
              <div className="rounded-[1.75rem] border border-amber-500/30 bg-amber-500/10 p-8 backdrop-blur-xl">
                <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 font-mono text-xs font-semibold uppercase tracking-wider">
                  <Lock className="size-4" /> {config.mode === "timer" ? "Tournament Expired" : "Arcade Closed"}
                </div>
                <h3 className="mt-3 text-2xl font-display text-ink">
                  {config.mode === "timer" ? "Scheduled Tournament Ended" : "Game Offline"}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {config.offlineMessage || "The Arcade has been temporarily closed by the administrator. Please check back later!"}
                </p>
              </div>
            ) : (
              <>
                {config.mode === "timer" && remainingSec > 0 ? (
                  <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/15 px-4 py-2.5 text-xs font-mono font-semibold text-amber-600 dark:text-amber-300">
                    <span className="flex items-center gap-2">
                      <Clock className="size-3.5 animate-spin" /> Live Tournament Active
                    </span>
                    <span>Time Remaining: {formatCountdown(remainingSec)}</span>
                  </div>
                ) : null}

                <SignalRush onFinish={finish} disabled={!player} />
                {!player ? (
                  <p className="mt-3 caption">Claim a name or enter your saved player ID to start a run.</p>
                ) : null}
              </>
            )}
          </Reveal>
        </div>
      </Section>

      <Section id="leaderboard" tint>
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Leaderboard"
            figure="02"
            title="Who is on top."
            description="Top 100 runs, ranked by score, then accuracy. Switch between Weekly, Lifetime, and Contest ranks."
          />
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 shrink-0 self-start sm:self-auto">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400 font-semibold">
                Live · {filteredRows.length} players
              </span>
            </div>

            <div className="inline-flex rounded-2xl border border-ink/12 bg-paper/80 p-1.5 shadow-xs">
              <button
                type="button"
                onClick={() => setBoardTab("weekly")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] font-semibold transition-all",
                  boardTab === "weekly"
                    ? "bg-ink text-paper shadow-xs"
                    : "text-ink-soft hover:text-ink hover:bg-ink/5"
                )}
              >
                <Zap className="size-3" /> Weekly Rank
              </button>

              <button
                type="button"
                onClick={() => setBoardTab("lifetime")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] font-semibold transition-all",
                  boardTab === "lifetime"
                    ? "bg-ink text-paper shadow-xs"
                    : "text-ink-soft hover:text-ink hover:bg-ink/5"
                )}
              >
                <Crown className="size-3" /> Lifetime Rank
              </button>

              {config.contest?.active ? (
                <button
                  type="button"
                  onClick={() => setBoardTab("contest")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] font-semibold transition-all",
                    boardTab === "contest"
                      ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                      : "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  )}
                >
                  <Trophy className="size-3" /> {config.contest.version} Contest
                </button>
              ) : null}
            </div>
          </div>
        </div>
        {isLoading ? (
          <p className="caption">Loading the board…</p>
        ) : (
          <>
            <LeaderboardTable
              rows={filteredRows}
              meId={player?.id}
              meHandle={player?.handle}
              boardTab={boardTab}
              config={config}
            />

            {bannedPlayersNames.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 animate-fade-in">
                <span className="flex size-7 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500">
                  <ShieldAlert className="size-4" />
                </span>
                <div className="flex-1 min-w-[200px]">
                  <span className="font-mono text-[0.62rem] font-bold uppercase tracking-wider text-rose-500">Anti-Cheat Action · Standings Updated</span>
                  <p className="text-[0.68rem] text-rose-400/90 mt-0.5 leading-relaxed font-mono">
                    The following players have been removed from all leaderboards due to verified cheating: <span className="font-sans font-semibold underline decoration-rose-500/40 text-rose-300">{bannedPlayersNames.join(", ")}</span>
                  </p>
                </div>
              </div>
            ) : null}
          </>
        )}
      </Section>
    </>
  );
}
