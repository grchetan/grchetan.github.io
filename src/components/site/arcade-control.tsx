import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Gamepad2, Clock, ShieldAlert, Ban, Trash2, CheckCircle2, AlertTriangle, RefreshCw, Lock, Megaphone, Trophy, RotateCcw, Sparkles, Zap, Users, Star, Swords, Download, Search, History, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import {
  useArcadeConfig,
  updateArcadeConfig,
  useLeaderboard,
  usePlayersCodes,
  deleteScore,
  updateScore,
  deleteAllScores,
  deletePlayerScores,
  banPlayer,
  unbanPlayer,
  resetWeeklyLeaderboard,
  resetContestLeaderboard,
  reRankFiltered,
  rank,
  tierFor,
  getLastFirebaseError,
  DEFAULT_FORBIDDEN_WORDS,
  type ArcadeMode,
  type RankedRow,
  type ArcadeConfig,
  type ArcadeAnnouncement,
  type ArcadeContest,
} from "@/lib/arcade";
import { downloadArcadeCertificate } from "@/lib/arcade-certificate";

import { cn } from "@/lib/utils";

export function ArcadeControlManager() {
  const { data: config = { mode: "always_on", bannedPlayers: [] }, isLoading: isConfigLoading } = useArcadeConfig();
  const { data: leaderboard = [], refetch } = useLeaderboard();
  const { data: playersCodes } = usePlayersCodes();

  const activeContestParticipantsCount = useMemo(() => {
    if (!config.contest) return 0;
    const startAt = config.contest.startAt ?? 0;
    const endAt = config.contest.endAt ?? Date.now();
    const registrations = config.contest.registrations ?? [];
    const playedPlayerIds = leaderboard
      .filter((r) => r.createdAt >= startAt && r.createdAt <= endAt)
      .map((r) => r.playerId);
    return new Set([...registrations, ...playedPlayerIds]).size;
  }, [config.contest, leaderboard]);

  const [mode, setMode] = useState<ArcadeMode>(config.mode ?? "always_on");
  const [offlineMessage, setOfflineMessage] = useState(
    config.offlineMessage ?? "The Arcade has been temporarily closed by the administrator. Please check back later!"
  );
  const [timerMinutes, setTimerMinutes] = useState<number>(60);
  const [newWord, setNewWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [remainingSec, setRemainingSec] = useState<number>(0);
  const [lbTab, setLbTab] = useState<"weekly" | "lifetime" | "contest" | "audit">("lifetime");
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [editingRunId, setEditingRunId] = useState<string | null>(null);
  const [editScoreValue, setEditScoreValue] = useState<string>("");
  const [editAccuracyValue, setEditAccuracyValue] = useState<string>("");
  const [editComboValue, setEditComboValue] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [showRegsModal, setShowRegsModal] = useState(false);
  const [regsSearchQuery, setRegsSearchQuery] = useState("");

  const downloadCSV = (rows: RankedRow[], title: string) => {
    const headers = ["Rank", "Name", "Handle", "Score", "Accuracy", "Plays", "Played At"];
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => [
        r.rank,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.handle.replace(/"/g, '""')}"`,
        r.score,
        `${r.accuracy}%`,
        r.plays,
        `"${new Date(r.createdAt).toLocaleString()}"`,
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `arcade-${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file downloaded successfully!");
  };

  const removeRegistration = async (playerId: string) => {
    setBusy(true);
    try {
      const existingRegs = config.contest?.registrations ?? [];
      const updatedRegs = existingRegs.filter((id) => id !== playerId);
      await updateArcadeConfig({
        ...config,
        contest: {
          ...config.contest!,
          registrations: updatedRegs,
        },
      });
      toast.success("Player removed from tournament registration.");
    } catch {
      toast.error("Failed to remove player registration.");
    } finally {
      setBusy(false);
    }
  };




  // Compute start of current week (Monday 00:00 local time)
  const startOfWeek = (() => {
    const d = new Date();
    const day = d.getDay(); // 0=Sun
    const diffToMonday = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diffToMonday);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();

  // Derived leaderboard rows per tab with correct local ranking
  const adminReset = config.weeklyResetAt ?? 0;
  const effectiveWeeklyStart = adminReset > startOfWeek ? adminReset : startOfWeek;
  const weeklyRows = rank(
    leaderboard.filter((r) => r.createdAt >= effectiveWeeklyStart)
  );
  const contestRows = rank(
    leaderboard.filter(
      (r) =>
        r.createdAt >= (config.contest?.startAt ?? 0) &&
        r.createdAt <= (config.contest?.endAt ?? Infinity)
    )
  );
  const activeTabRows =
    lbTab === "weekly" ? weeklyRows : lbTab === "contest" ? contestRows : rank(leaderboard);


  // Filter moderation rows by search query
  const filteredModerationRows = activeTabRows.filter(
    (row) =>
      row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.playerId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group all raw runs from leaderboard by player and calculate total runs & highest score
  const groupedPlayers = useMemo(() => {
    const playersMap = new Map<string, {
      playerId: string;
      name: string;
      handle: string;
      totalRuns: number;
      highestScore: number;
      highestAccuracy: number;
      highestCombo: number;
      latestRunAt: number;
      allRuns: typeof leaderboard;
    }>();

    for (const r of leaderboard) {
      const existing = playersMap.get(r.playerId);
      if (!existing) {
        playersMap.set(r.playerId, {
          playerId: r.playerId,
          name: r.name,
          handle: r.handle,
          totalRuns: 1,
          highestScore: r.score,
          highestAccuracy: r.accuracy,
          highestCombo: r.combo,
          latestRunAt: r.createdAt,
          allRuns: [r],
        });
      } else {
        existing.totalRuns += 1;
        existing.allRuns.push(r);
        if (r.createdAt > existing.latestRunAt) {
          existing.latestRunAt = r.createdAt;
        }
        if (r.score > existing.highestScore) {
          existing.highestScore = r.score;
          existing.highestAccuracy = r.accuracy;
          existing.highestCombo = r.combo;
        }
      }
    }

    // Sort allRuns for each player by score desc
    for (const p of playersMap.values()) {
      p.allRuns.sort((a, b) => b.score - a.score || b.accuracy - a.accuracy || b.createdAt - a.createdAt);
    }

    return [...playersMap.values()].sort((a, b) => b.highestScore - a.highestScore);
  }, [leaderboard]);

  const filteredGroupedPlayers = useMemo(() => {
    if (!searchQuery) return groupedPlayers;
    const q = searchQuery.toLowerCase();
    return groupedPlayers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.handle.toLowerCase().includes(q) ||
        p.playerId.toLowerCase().includes(q)
    );
  }, [groupedPlayers, searchQuery]);

  // Derived details of players registered for current contest
  const registeredPlayersDetails = useMemo(() => {
    const regs = config.contest?.registrations ?? [];
    return regs.map((id) => {
      // Find player details from leaderboard
      const found = leaderboard.find((r) => r.playerId === id);
      return {
        id,
        name: found?.name ?? "Registered Participant",
        handle: found?.handle ?? (id.startsWith("local-") ? id.replace("local-", "") : id).slice(0, 12),
      };
    });
  }, [config.contest?.registrations, leaderboard]);

  const filteredRegs = useMemo(() => {
    return registeredPlayersDetails.filter(
      (p) =>
        p.name.toLowerCase().includes(regsSearchQuery.toLowerCase()) ||
        p.handle.toLowerCase().includes(regsSearchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(regsSearchQuery.toLowerCase())
    );
  }, [registeredPlayersDetails, regsSearchQuery]);





  // Announcement state
  const [announcementActive, setAnnouncementActive] = useState(config.announcement?.active ?? false);
  const [announcementTitle, setAnnouncementTitle] = useState(config.announcement?.title ?? "Upcoming Contest!");
  const [announcementMessage, setAnnouncementMessage] = useState(config.announcement?.message ?? "Get ready for the next Signal Rush Tournament version v1.0!");
  const [announcementDateText, setAnnouncementDateText] = useState(config.announcement?.dateText ?? "This Weekend @ 8:00 PM");

  const toLocalISO = (ms: number) => {
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Contest state
  const [contestActive, setContestActive] = useState(config.contest?.active ?? false);
  const [contestVersion, setContestVersion] = useState(config.contest?.version ?? "v1.0");
  const [contestTitle, setContestTitle] = useState(config.contest?.title ?? "Signal Rush Championship v1.0");
  const [contestDescription, setContestDescription] = useState(config.contest?.description ?? "Compete against top players for the v1.0 Gold Crown!");
  const [contestStartAt, setContestStartAt] = useState<string>(
    toLocalISO(config.contest?.startAt ?? Date.now())
  );
  const [contestEndAt, setContestEndAt] = useState<string>(
    toLocalISO(config.contest?.endAt ?? Date.now() + 7 * 86400 * 1000)
  );

  // Sync state when config loads
  useEffect(() => {
    if (config) {
      setMode(config.mode ?? "always_on");
      setOfflineMessage(
        config.offlineMessage ?? "The Arcade has been temporarily closed by the administrator. Please check back later!"
      );
      if (config.announcement) {
        setAnnouncementActive(config.announcement.active);
        setAnnouncementTitle(config.announcement.title || "Upcoming Contest!");
        setAnnouncementMessage(config.announcement.message || "");
        setAnnouncementDateText(config.announcement.dateText || "");
      }
      if (config.contest) {
        setContestActive(config.contest.active);
        setContestVersion(config.contest.version || "v1.0");
        setContestTitle(config.contest.title || "Signal Rush Championship v1.0");
        setContestDescription(config.contest.description || "");
        setContestStartAt(toLocalISO(config.contest.startAt ?? Date.now()));
        setContestEndAt(toLocalISO(config.contest.endAt ?? Date.now() + 7 * 86400 * 1000));
      }
    }
  }, [config]);

  // Live timer countdown calculation
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
    if (totalSec <= 0) return "Expired";
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  };

  const saveSettings = async (selectedMode: ArcadeMode, durationMin?: number, customMsg?: string) => {
    setBusy(true);
    try {
      let timerEndAt: number | undefined = undefined;
      if (selectedMode === "timer") {
        const mins = durationMin ?? timerMinutes;
        timerEndAt = Date.now() + mins * 60 * 1000;
      }

      const msg = customMsg !== undefined ? customMsg : offlineMessage;

      const nextConfig: ArcadeConfig = {
        ...config,
        mode: selectedMode,
        offlineMessage: msg.trim(),
        bannedPlayers: config.bannedPlayers ?? [],
        forbiddenWords: config.forbiddenWords ?? [],
      };
      if (timerEndAt !== undefined) {
        nextConfig.timerEndAt = timerEndAt;
      }

      await updateArcadeConfig(nextConfig);
      setMode(selectedMode);
      toast.success(
        selectedMode === "always_on"
          ? "Arcade set to 24/7 Always Live!"
          : selectedMode === "timer"
          ? `Timer set for ${durationMin ?? timerMinutes} minutes.`
          : "Arcade set to Offline / Closed."
      );
    } catch (err) {
      console.error("[Save Arcade Settings Error]:", err);
      toast.error("Failed to save Arcade configuration.");
    } finally {
      setBusy(false);
    }
  };

  const [showResetModal, setShowResetModal] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [nextVersionInput, setNextVersionInput] = useState("v2.0");

  useEffect(() => {
    if (config.contest?.version) {
      const current = config.contest.version;
      const match = current.match(/v?(\d+)(\.(\d+))?/i);
      if (match) {
        const major = parseInt(match[1], 10);
        const minor = match[3] ? parseInt(match[3], 10) : 0;
        if (match[3]) {
          if (minor === 0) {
            setNextVersionInput(`v${major + 1}.0`);
          } else {
            setNextVersionInput(`v${major}.${minor + 1}`);
          }
        } else {
          setNextVersionInput(`v${major + 1}`);
        }
      }
    }
  }, [config.contest?.version]);


  const confirmResetWeekly = async () => {
    setShowResetModal(false);
    setBusy(true);
    try {
      await resetWeeklyLeaderboard();
      toast.success("Weekly Leaderboard reset to 0! Lifetime scores remain 100% protected.");
      void refetch();
    } catch {
      toast.error("Failed to reset Weekly Leaderboard.");
    } finally {
      setBusy(false);
    }
  };

  const saveAnnouncement = async () => {
    setBusy(true);
    try {
      await updateArcadeConfig({
        ...config,
        announcement: {
          active: announcementActive,
          title: announcementTitle.trim(),
          message: announcementMessage.trim(),
          dateText: announcementDateText.trim(),
        },
      });
      toast.success("Announcement banner updated live!");
    } catch {
      toast.error("Failed to save announcement.");
    } finally {
      setBusy(false);
    }
  };

  const saveContest = async (newVersion?: string) => {
    setBusy(true);
    try {
      const v = newVersion ?? contestVersion;
      const startMs = contestStartAt ? new Date(contestStartAt).getTime() : Date.now();
      const endMs = contestEndAt ? new Date(contestEndAt).getTime() : Date.now() + 7 * 86400 * 1000;

      await updateArcadeConfig({
        ...config,
        contest: {
          id: `contest-${v.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          version: v,
          title: contestTitle.trim(),
          description: contestDescription.trim(),
          startAt: startMs,
          endAt: endMs,
          active: contestActive,
          registrations: config.contest?.registrations ?? [],
        },
      });
      toast.success(`Contest ${v} configuration saved!`);
    } catch {
      toast.error("Failed to save contest settings.");
    } finally {
      setBusy(false);
    }
  };

  const archiveCurrentContest = async () => {
    if (!config.contest) return;
    const curVer = config.contest.version || "v1.0";
    const startAt = config.contest?.startAt ?? 0;
    const endAt = config.contest?.endAt ?? Date.now();

    const contestRows = rank(
      leaderboard.filter((r) => r.createdAt >= startAt && r.createdAt <= endAt)
    );

    if (contestRows.length === 0) {
      toast.error(`Cannot archive an empty contest. No score submissions were recorded for ${curVer}!`);
      return;
    }

    const winners = contestRows.slice(0, 10).map((r, idx) => ({
      rank: idx + 1,
      name: r.name,
      handle: r.handle,
      score: r.score,
      accuracy: r.accuracy,
    }));

    const registrations = config.contest.registrations ?? [];
    const playedPlayerIds = contestRows.map((r) => r.playerId);
    const uniqueParticipants = Array.from(new Set([...registrations, ...playedPlayerIds]));

    const archiveEntry = {
      version: curVer,
      title: config.contest.title || `Contest ${curVer}`,
      endedAt: Date.now(),
      totalRegistrations: uniqueParticipants.length,
      winners,
    };

    const existingArchives = config.contestArchives ?? [];
    const updatedArchives = [
      archiveEntry,
      ...existingArchives.filter((a) => a.version !== curVer),
    ];

    setBusy(true);
    try {
      await updateArcadeConfig({
        ...config,
        contestArchives: updatedArchives,
      });
      toast.success(`Archived results for Contest ${curVer} (${winners.length} top players saved)!`);
    } catch {
      toast.error("Failed to archive contest results.");
    } finally {
      setBusy(false);
    }
  };

  const deleteContestArchive = (version: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Contest Archive",
      message: `Are you sure you want to delete the archived results for Contest ${version}? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      isDestructive: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          const existingArchives = config.contestArchives ?? [];
          const updatedArchives = existingArchives.filter((a) => a.version !== version);
          await updateArcadeConfig({
            ...config,
            contestArchives: updatedArchives,
          });
          toast.success(`Archived results for Contest ${version} deleted successfully.`);
        } catch {
          toast.error("Failed to delete contest archive.");
        } finally {
          setBusy(false);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const confirmLaunchNewVersion = async () => {
    const nextVer = nextVersionInput.trim() || "v2.0";
    setShowLaunchModal(false);
    setBusy(true);
    try {
      // Archive current version results first
      const curVer = config.contest?.version || "v1.0";
      const startAt = config.contest?.startAt ?? 0;
      const endAt = config.contest?.endAt ?? Date.now();

      // Filter contest scores and sort by score desc for correct winner order
      const contestRows = rank(
        leaderboard.filter((r) => r.createdAt >= startAt && r.createdAt <= endAt)
      );

      const existingArchives = config.contestArchives ?? [];
      let updatedArchives = existingArchives;

      if (contestRows.length > 0) {
        const winners = contestRows.slice(0, 10).map((r, idx) => ({
          rank: idx + 1,
          name: r.name,
          handle: r.handle,
          score: r.score,
          accuracy: r.accuracy,
        }));

        const archiveEntry = {
          version: curVer,
          title: config.contest?.title || `Contest ${curVer}`,
          endedAt: Date.now(),
          totalRegistrations: (config.contest?.registrations ?? []).length,
          winners,
        };

        updatedArchives = [
          archiveEntry,
          ...existingArchives.filter((a) => a.version !== curVer),
        ];
        toast.info(`Archived results for completed contest ${curVer}.`);
      } else {
        // Remove empty version archive from list if it matches curVer just to clean up any past mistakes
        updatedArchives = existingArchives.filter((a) => a.version !== curVer);
        toast.info(`Previous contest ${curVer} had no score submissions. Skipped archiving.`);
      }

      // Start of today (00:00 AM) so scores played today are included in new contest
      const startOfToday = (() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })();

      setContestVersion(nextVer);
      setContestTitle(`Signal Rush Championship ${nextVer}`);
      await updateArcadeConfig({
        ...config,
        contestArchives: updatedArchives,
        contest: {
          id: `contest-${nextVer.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          version: nextVer,
          title: `Signal Rush Championship ${nextVer}`,
          description: `Compete against top players for the ${nextVer} Gold Crown!`,
          startAt: startOfToday,
          endAt: startOfToday + 7 * 86400 * 1000,
          active: true,
          registrations: [],
        },
      });
      setContestActive(true);
      toast.success(`Archived ${curVer} Results & Launched Contest ${nextVer}!`);
    } catch {
      toast.error("Failed to launch new contest version.");
    } finally {
      setBusy(false);
    }
  };

  const toggleBanPlayer = async (playerId: string, name: string) => {
    const currentBanned = config.bannedPlayers ?? [];
    const isBanned = currentBanned.includes(playerId);
    const nextBanned = isBanned
      ? currentBanned.filter((id) => id !== playerId)
      : [...currentBanned, playerId];

    setBusy(true);
    try {
      await updateArcadeConfig({
        ...config,
        bannedPlayers: nextBanned,
      });
      toast.success(isBanned ? `Unbanned ${name}.` : `Banned ${name} from playing.`);
    } catch {
      toast.error("Could not update ban status.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteScore = (scoreId: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Score Entry",
      message: `Are you sure you want to delete the score entry for ${name}?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteScore(scoreId);
          toast.success(`Deleted score entry for ${name}.`);
          void refetch();
        } catch {
          toast.error("Failed to delete score.");
        } finally {
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Firebase Sync Status Indicator */}
      {(() => {
        const fbErr = getLastFirebaseError();
        if (fbErr) {
          return (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex flex-wrap items-center gap-3 animate-fade-in">
              <span className="flex size-9 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 shrink-0">
                <ShieldAlert className="size-4" />
              </span>
              <div className="flex-1 min-w-[240px]">
                <span className="font-mono text-[0.62rem] font-bold uppercase tracking-wider text-rose-500">⚠️ Local Storage Demo Mode (Sync Error)</span>
                <p className="text-[0.68rem] text-rose-400/90 mt-0.5 leading-relaxed font-mono">
                  Firebase connection failed: <strong>{fbErr}</strong>. Standings are stored in local browser memory and will not sync across other browsers. Please check your Firestore database or security rules.
                </p>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Dynamic Summary Stats Dashboard */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4 shadow-sm backdrop-blur-xl">
          <span className="font-mono text-[0.62rem] font-bold uppercase tracking-wider text-ink-soft">Lifetime Players</span>
          <div className="mt-1 font-display text-2xl font-bold text-ink">{rank(leaderboard).length}</div>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4 shadow-sm backdrop-blur-xl">
          <span className="font-mono text-[0.62rem] font-bold uppercase tracking-wider text-blue-500">Weekly Active</span>
          <div className="mt-1 font-display text-2xl font-bold text-blue-500">{weeklyRows.length}</div>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4 shadow-sm backdrop-blur-xl">
          <span className="font-mono text-[0.62rem] font-bold uppercase tracking-wider text-amber-500">Registered (Contest)</span>
          <div className="mt-1 font-display text-2xl font-bold text-amber-500">{(config.contest?.registrations ?? []).length}</div>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4 shadow-sm backdrop-blur-xl">
          <span className="font-mono text-[0.62rem] font-bold uppercase tracking-wider text-rose-500">Banned Players</span>
          <div className="mt-1 font-display text-2xl font-bold text-rose-500">{(config.bannedPlayers ?? []).length}</div>
        </div>
      </div>

      {/* Game Mode & Control Box */}
      <section className="plate p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="label">Control Room · Arcade</span>
            <h2 className="mt-2 text-[1.4rem] font-display text-ink">Arcade Live & Timer Settings</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void refetch()}
              className="press-btn-outline"
              title="Refresh Leaderboard & Config"
            >
              <RefreshCw className="size-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Current Live Mode Indicator */}
        <div className="mt-6 rounded-2xl border border-ink/12 bg-paper-tint/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "size-3.5 rounded-full animate-pulse",
                  mode === "always_on"
                    ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                    : mode === "timer" && remainingSec > 0
                    ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                    : "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                )}
              />
              <span className="font-mono text-sm uppercase tracking-wider text-ink font-semibold">
                Status: {mode === "always_on" ? "24/7 Always Live" : mode === "timer" ? "Scheduled Timer Mode" : "Closed / Maintenance"}
              </span>
            </div>

            {mode === "timer" ? (
              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 font-mono text-xs text-amber-600 dark:text-amber-300 font-semibold">
                ⏱️ {remainingSec > 0 ? `Remaining: ${formatCountdown(remainingSec)}` : "Timer Expired (Closed)"}
              </span>
            ) : null}
          </div>
        </div>

        {/* Mode Selector Buttons */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {/* Mode 1: Always On */}
          <button
            type="button"
            onClick={() => void saveSettings("always_on")}
            disabled={busy}
            className={cn(
              "flex flex-col items-start p-4 rounded-xl border transition-all text-left",
              mode === "always_on"
                ? "border-emerald-500 bg-emerald-500/10 text-ink shadow-sm"
                : "border-ink/12 bg-paper hover:border-ink/30 text-ink-soft"
            )}
          >
            <div className="flex items-center gap-2 font-mono text-xs uppercase font-semibold text-emerald-600 dark:text-emerald-400">
              <Gamepad2 className="size-4" /> 24/7 Unlimited
            </div>
            <p className="mt-2 text-xs text-ink-soft">Game stays live continuously without any timer limits.</p>
          </button>

          {/* Mode 2: Scheduled Timer */}
          <div
            className={cn(
              "flex flex-col items-start p-4 rounded-xl border transition-all text-left",
              mode === "timer"
                ? "border-amber-500 bg-amber-500/10 text-ink shadow-sm"
                : "border-ink/12 bg-paper hover:border-ink/30 text-ink-soft"
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-2 font-mono text-xs uppercase font-semibold text-amber-600 dark:text-amber-400">
                <Clock className="size-4" /> Scheduled Timer
              </span>
            </div>
            <p className="mt-2 text-xs text-ink-soft">Game stays open only for a specific duration.</p>

            <div className="mt-3 flex items-center gap-2 w-full">
              <select
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(Number(e.target.value))}
                className="rounded-lg border border-ink/15 bg-paper px-2 py-1 font-mono text-xs text-ink flex-1"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={120}>2 Hours</option>
                <option value={360}>6 Hours</option>
                <option value={1440}>24 Hours</option>
              </select>
              <button
                type="button"
                onClick={() => void saveSettings("timer")}
                disabled={busy}
                className="press-btn text-xs py-1 px-3"
              >
                Start
              </button>
            </div>
          </div>

          {/* Mode 3: Disabled / Closed */}
          <button
            type="button"
            onClick={() => void saveSettings("disabled")}
            disabled={busy}
            className={cn(
              "flex flex-col items-start p-4 rounded-xl border transition-all text-left",
              mode === "disabled"
                ? "border-rose-500 bg-rose-500/10 text-ink shadow-sm"
                : "border-ink/12 bg-paper hover:border-ink/30 text-ink-soft"
            )}
          >
            <div className="flex items-center gap-2 font-mono text-xs uppercase font-semibold text-rose-600 dark:text-rose-400">
              <Lock className="size-4" /> Closed / Offline
            </div>
            <p className="mt-2 text-xs text-ink-soft">Closes arcade completely and displays notice message.</p>
          </button>
        </div>

        {/* Custom Offline Notice Message Input */}
        <div className="mt-6 space-y-2">
          <label className="block">
            <span className="label">Custom Admin Notice Message</span>
            <span className="block text-xs text-ink-soft mt-0.5">
              Message shown to visitors on `/arcade` when the game is closed or timer expires.
            </span>
          </label>
          <div className="flex flex-col gap-2 sm:flex-row items-stretch sm:items-end">
            <textarea
              rows={2}
              value={offlineMessage}
              onChange={(e) => setOfflineMessage(e.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-paper p-3 text-sm text-ink outline-none transition focus:border-chrome-1 flex-1"
              placeholder="Enter notice message for visitors..."
            />
            <button
              type="button"
              onClick={() => void saveSettings(mode, undefined, offlineMessage)}
              disabled={busy}
              className="press-btn justify-center shrink-0 py-3 px-4 text-xs font-semibold"
            >
              Save Message
            </button>
          </div>
        </div>
      </section>

      {/* Weekly Leaderboard Reset & Lifetime Rank Protection */}
      <section className="plate p-6 sm:p-8 border-l-4 border-l-emerald-500">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 font-mono text-[0.66rem] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" /> Lifetime Ranks 100% Protected
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 font-mono text-[0.66rem] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">
                <Zap className="size-3.5" /> Resets Weekly Ranks Only
              </span>
            </div>
            <h2 className="text-[1.4rem] font-display text-ink">Weekly Leaderboard Reset</h2>
            <p className="max-w-2xl text-xs leading-relaxed text-ink-soft">
              Clicking this button only zeroes out the <strong>Weekly Leaderboard</strong> scores for this week.
              Your <strong>Lifetime Hall of Fame</strong> scores, player IDs, and all-time achievements are <strong>permanently protected and will NEVER be deleted or modified</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2.5 shrink-0 rounded-2xl bg-amber-500/20 border border-amber-500/50 px-5 py-3 font-mono text-xs uppercase font-bold text-amber-600 dark:text-amber-300 hover:bg-amber-500/30 hover:scale-105 transition-all shadow-sm"
          >
            <RotateCcw className="size-4" /> Reset Weekly Board (To 0)
          </button>
        </div>
      </section>

      {/* Public Announcement & Banner Manager */}
      <section className="plate p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="label">Public Communication</span>
            <h2 className="mt-2 text-[1.4rem] font-display text-ink">Arcade Announcement Banner</h2>
            <p className="mt-1 text-xs text-ink-soft">
              Post an upcoming contest alert or news banner at the top of the `/arcade` page.
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={announcementActive}
              onChange={(e) => setAnnouncementActive(e.target.checked)}
              className="size-4 rounded accent-chrome-1"
            />
            <span className="font-mono text-xs font-semibold uppercase text-ink">Banner Active</span>
          </label>
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Banner Title</label>
              <input
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="e.g. Upcoming Tournament!"
                className="mt-1 w-full rounded-xl border border-ink/15 bg-paper p-3 text-sm text-ink outline-none transition focus:border-chrome-1"
              />
            </div>
            <div>
              <label className="label">Schedule / Date Text</label>
              <input
                value={announcementDateText}
                onChange={(e) => setAnnouncementDateText(e.target.value)}
                placeholder="e.g. Sunday @ 8:00 PM IST"
                className="mt-1 w-full rounded-xl border border-ink/15 bg-paper p-3 text-sm text-ink outline-none transition focus:border-chrome-1"
              />
            </div>
          </div>

          <div>
            <label className="label">Announcement Message</label>
            <textarea
              rows={2}
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              placeholder="Enter announcement details for players..."
              className="mt-1 w-full rounded-xl border border-ink/15 bg-paper p-3 text-sm text-ink outline-none transition focus:border-chrome-1"
            />
          </div>

          <button
            type="button"
            onClick={() => void saveAnnouncement()}
            disabled={busy}
            className="press-btn justify-center py-2.5 px-6 text-xs font-semibold"
          >
            <Megaphone className="size-3.5" /> Save Announcement Banner
          </button>
        </div>
      </section>

      {/* Contest Registration & Version Manager */}
      <section className="plate p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="label">Tournament System</span>
            <h2 className="mt-2 text-[1.4rem] font-display text-ink">Contest Version & Registration</h2>
            <p className="mt-1 text-xs text-ink-soft">
              Manage contest versions (e.g. v1.0, v2.0), enable registrations, and track player signups.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLaunchModal(true)}
              disabled={busy}
              className="press-btn"
            >
              <Sparkles className="size-3.5" /> Launch New Version (e.g. v2.0)
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Version Label</label>
              <input
                value={contestVersion}
                onChange={(e) => setContestVersion(e.target.value)}
                placeholder="v1.0"
                className="mt-1 w-full rounded-xl border border-ink/15 bg-paper p-3 text-sm text-ink outline-none transition focus:border-chrome-1 font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Contest Title</label>
              <input
                value={contestTitle}
                onChange={(e) => setContestTitle(e.target.value)}
                placeholder="Signal Rush Championship v1.0"
                className="mt-1 w-full rounded-xl border border-ink/15 bg-paper p-3 text-sm text-ink outline-none transition focus:border-chrome-1"
              />
            </div>
          </div>

          <div>
            <label className="label">Contest Description</label>
            <input
              value={contestDescription}
              onChange={(e) => setContestDescription(e.target.value)}
              placeholder="Compete against top players for the Gold Crown!"
              className="mt-1 w-full rounded-xl border border-ink/15 bg-paper p-3 text-sm text-ink outline-none transition focus:border-chrome-1"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label">Contest Start Time (Date & Time)</label>
              </div>
              <input
                type="datetime-local"
                value={contestStartAt}
                onChange={(e) => setContestStartAt(e.target.value)}
                className="w-full rounded-xl border border-ink/15 bg-paper p-3 text-sm text-ink outline-none transition focus:border-chrome-1 font-mono"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label">Contest End Time (Date & Time)</label>
              </div>
              <input
                type="datetime-local"
                value={contestEndAt}
                onChange={(e) => setContestEndAt(e.target.value)}
                className="w-full rounded-xl border border-ink/15 bg-paper p-3 text-sm text-ink outline-none transition focus:border-chrome-1 font-mono"
              />
            </div>
          </div>

          {/* Quick Date Presets Row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <span className="font-mono text-[0.62rem] uppercase tracking-wider text-ink-soft mr-1">Quick Presets:</span>
            <button
              type="button"
              onClick={() => {
                const start = new Date();
                start.setHours(0, 0, 0, 0);
                const end = new Date(start);
                end.setHours(23, 59, 59, 999);
                setContestStartAt(toLocalISO(start.getTime()));
                setContestEndAt(toLocalISO(end.getTime()));
                toast.info("Preset: Today (24 Hours) selected.");
              }}
              className="rounded-lg border border-ink/10 bg-paper px-2 py-0.5 font-mono text-[0.6rem] font-bold uppercase tracking-wider text-ink-soft hover:border-chrome-1 hover:text-ink transition"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const start = new Date();
                start.setHours(0, 0, 0, 0);
                const end = new Date(start);
                end.setDate(start.getDate() + 3);
                end.setHours(23, 59, 59, 999);
                setContestStartAt(toLocalISO(start.getTime()));
                setContestEndAt(toLocalISO(end.getTime()));
                toast.info("Preset: 3 Days Tournament selected.");
              }}
              className="rounded-lg border border-ink/10 bg-paper px-2 py-0.5 font-mono text-[0.6rem] font-bold uppercase tracking-wider text-ink-soft hover:border-chrome-1 hover:text-ink transition"
            >
              3 Days
            </button>
            <button
              type="button"
              onClick={() => {
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const nextSunday = new Date(todayStart);
                nextSunday.setDate(todayStart.getDate() + (7 - todayStart.getDay() || 7));
                nextSunday.setHours(23, 59, 0, 0);
                setContestStartAt(toLocalISO(todayStart.getTime()));
                setContestEndAt(toLocalISO(nextSunday.getTime()));
                toast.info("Preset: Full Week (Monday-Sunday) selected.");
              }}
              className="rounded-lg border border-ink/10 bg-paper px-2 py-0.5 font-mono text-[0.6rem] font-bold uppercase tracking-wider text-ink-soft hover:border-chrome-1 hover:text-ink transition"
            >
              Full Week
            </button>
            <button
              type="button"
              onClick={() => {
                const start = new Date();
                start.setHours(0, 0, 0, 0);
                const end = new Date(start);
                end.setDate(start.getDate() + 30);
                end.setHours(23, 59, 59, 999);
                setContestStartAt(toLocalISO(start.getTime()));
                setContestEndAt(toLocalISO(end.getTime()));
                toast.info("Preset: Monthly League selected.");
              }}
              className="rounded-lg border border-ink/10 bg-paper px-2 py-0.5 font-mono text-[0.6rem] font-bold uppercase tracking-wider text-ink-soft hover:border-chrome-1 hover:text-ink transition"
            >
              1 Month
            </button>
          </div>

          {/* Date sanity warnings + Quick Fix */}
          {(() => {
            const startMs = contestStartAt ? new Date(contestStartAt).getTime() : 0;
            const endMs = contestEndAt ? new Date(contestEndAt).getTime() : 0;
            const now = Date.now();
            const isEndPast = endMs < now;
            const isWindowTiny = endMs - startMs < 60 * 60 * 1000; // less than 1 hour
            if (isEndPast || isWindowTiny) {
              return (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
                  <div className="flex-1">
                    <span className="font-mono text-xs font-bold text-rose-600 uppercase">⚠️ Contest dates look wrong!</span>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {isEndPast ? "End time is in the past — no scores will match this window." : ""}
                      {isWindowTiny ? " Window is less than 1 hour — scores may not appear in Contest tab." : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const todayStart = new Date();
                      todayStart.setHours(0, 0, 0, 0);
                      const nextSunday = new Date(todayStart);
                      nextSunday.setDate(todayStart.getDate() + (7 - todayStart.getDay() || 7));
                      nextSunday.setHours(23, 59, 0, 0);
                      setContestStartAt(toLocalISO(todayStart.getTime()));
                      setContestEndAt(toLocalISO(nextSunday.getTime()));
                      toast.info("Dates set to today 00:00 → this Sunday 23:59. Click Save to apply.");
                    }}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 px-3 py-1.5 font-mono text-[0.65rem] uppercase font-bold text-rose-600 hover:bg-rose-500/15 transition"
                  >
                    <RefreshCw className="size-3" /> Fix to This Week
                  </button>
                </div>
              );
            }
            return null;
          })()}

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink/10 bg-paper-tint/30 p-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={contestActive}
                  onChange={(e) => setContestActive(e.target.checked)}
                  className="size-4 rounded accent-chrome-1"
                />
                <span className="font-mono text-xs font-semibold uppercase text-ink">Contest & Registration Live</span>
              </label>

              {/* Dynamic Status Badge */}
              {(() => {
                const startMs = contestStartAt ? new Date(contestStartAt).getTime() : 0;
                const endMs = contestEndAt ? new Date(contestEndAt).getTime() : 0;
                const now = Date.now();
                if (!contestActive) {
                  return (
                    <span className="inline-flex items-center rounded-md bg-slate-500/10 px-2 py-0.5 font-mono text-[0.62rem] font-bold uppercase tracking-wider text-slate-500 border border-slate-500/20">
                      Inactive
                    </span>
                  );
                }
                if (now < startMs) {
                  return (
                    <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 font-mono text-[0.62rem] font-bold uppercase tracking-wider text-amber-500 border border-amber-500/20 animate-pulse">
                      Upcoming
                    </span>
                  );
                }
                if (now >= startMs && now <= endMs) {
                  return (
                    <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-[0.62rem] font-bold uppercase tracking-wider text-emerald-500 border border-emerald-500/20">
                      🔴 Active & Live
                    </span>
                  );
                }
                return (
                  <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2 py-0.5 font-mono text-[0.62rem] font-bold uppercase tracking-wider text-rose-500 border border-rose-500/20">
                    Expired / Ended
                  </span>
                );
              })()}
            </div>
            <div className="font-mono text-xs text-ink-soft flex items-center gap-2">
              <span>Registered Players: <span className="font-bold text-ink font-mono">{activeContestParticipantsCount} {activeContestParticipantsCount === 1 ? "player" : "players"}</span></span>
              {(config.contest?.registrations ?? []).length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowRegsModal(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-ink/15 bg-paper px-2 py-1 font-mono text-[0.62rem] font-bold uppercase tracking-wider text-ink-soft hover:bg-ink/5 transition"
                >
                  <Users className="size-3" /> Manage List
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => void saveContest()}
              disabled={busy}
              className="press-btn justify-center py-2.5 px-6 text-xs font-semibold"
            >
              <Trophy className="size-3.5" /> Save Contest Version Settings
            </button>
            <button
              type="button"
              onClick={() => void archiveCurrentContest()}
              disabled={busy}
              className="press-btn-outline border-amber-500/40 text-amber-600 dark:text-amber-300 hover:bg-amber-500/10 justify-center py-2.5 px-6 text-xs font-semibold"
            >
              <Lock className="size-3.5 text-amber-500" /> Freeze & Archive Current Results
            </button>
          </div>
        </div>

        {/* Contest Archives / Results History */}
        <div className="mt-8 border-t border-ink/10 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="label text-amber-500">Hall of Fame</span>
              <h3 className="text-lg font-display text-ink mt-1">Archived Contest Results & Winners</h3>
            </div>
            <span className="font-mono text-xs text-ink-soft">{(config.contestArchives ?? []).length} versions archived</span>
          </div>

          {(config.contestArchives ?? []).length > 0 ? (
            <div className="mt-4 grid gap-4">
              {(config.contestArchives ?? []).map((arch) => (
                <div key={arch.version} className="rounded-2xl border border-ink/12 bg-paper p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-3">
                    <div className="flex items-center justify-between gap-4 w-full">
                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[0.7rem] font-bold text-amber-400">
                          🏆 Contest {arch.version}
                        </span>
                        <h4 className="mt-1 font-display text-base font-bold text-ink">{arch.title}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-xs text-ink-soft text-right">
                          <p>{arch.totalRegistrations} Participants Registered</p>
                          <p className="text-[0.68rem] text-ink-soft/70">Ended: {new Date(arch.endedAt).toLocaleDateString()}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void deleteContestArchive(arch.version)}
                          disabled={busy}
                          className="p-2 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10 transition-all"
                          title={`Delete archived results for ${arch.version}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs">
                      <thead>
                        <tr className="font-mono uppercase text-[0.65rem] tracking-wider text-ink-soft border-b border-ink/10">
                          <th className="py-2">Rank</th>
                          <th className="py-2">Player</th>
                          <th className="py-2">Score</th>
                          <th className="py-2">Accuracy</th>
                          <th className="py-2 text-right">Certificate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/10">
                        {(arch.winners ?? []).map((w) => {
                          const tier = tierFor(w.rank);
                          return (
                            <tr key={w.rank}>
                              <td className="py-2 font-mono font-bold">
                                {w.rank === 1 ? "🥇 1st" : w.rank === 2 ? "🥈 2nd" : w.rank === 3 ? "🥉 3rd" : `#${w.rank}`}
                              </td>
                              <td className="py-2 font-semibold text-ink">{w.name} ({w.handle})</td>
                              <td className="py-2 font-mono font-bold text-amber-400">{Math.round(w.score).toLocaleString()}</td>
                              <td className="py-2 font-mono text-ink-soft">{Math.round(w.accuracy)}%</td>
                              <td className="py-2 text-right">
                                {tier ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const tempRow: RankedRow = {
                                        id: `arch-${w.handle}`,
                                        playerId: `arch-${w.handle}`,
                                        name: w.name,
                                        handle: w.handle,
                                        score: w.score,
                                        accuracy: w.accuracy,
                                        combo: 12,
                                        createdAt: arch.endedAt,
                                        rank: w.rank,
                                        plays: 1,
                                      };
                                      downloadArcadeCertificate(
                                        tempRow,
                                        arch.title
                                      );
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-1 font-mono text-[0.62rem] font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-700 transition"
                                  >
                                    <Download className="size-3" /> PDF
                                  </button>
                                ) : (
                                  <span className="text-[0.62rem] text-slate-500 font-mono">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="caption mt-3">No archived contest results yet. Click "Freeze & Archive Current Results" or "Launch New Version" to save version standings.</p>
          )}
        </div>
      </section>

      {/* ===== LEADERBOARD MANAGEMENT — 3 TABS ===== */}
      <section className="plate p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="label">Leaderboard Management</span>
            <h2 className="mt-2 text-[1.4rem] font-display text-ink">Player Database & Moderation</h2>
            <p className="mt-1 text-xs text-ink-soft">View and manage Weekly, Lifetime, and Contest leaderboards separately.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-ink-soft">{rank(leaderboard).length} total players on board</span>
          </div>
        </div>

        {/* Tab Bar + Search Input */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex rounded-2xl border border-ink/12 bg-paper/80 p-1.5 shadow-xs gap-1">
            {(["weekly", "lifetime", "contest", "audit"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setLbTab(t);
                  setSearchQuery(""); // Clear search on tab switch
                  setExpandedPlayerId(null); // Clear expanded view
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] font-semibold transition-all",
                  lbTab === t
                    ? t === "weekly" ? "bg-blue-500 text-white shadow-xs" : t === "contest" ? "bg-amber-500 text-slate-950 shadow-xs" : t === "audit" ? "bg-emerald-500 text-white shadow-xs" : "bg-ink text-paper shadow-xs"
                    : "text-ink-soft hover:text-ink hover:bg-ink/5"
                )}
              >
                {t === "weekly" ? <Zap className="size-3" /> : t === "lifetime" ? <Star className="size-3" /> : t === "contest" ? <Swords className="size-3" /> : <History className="size-3" />}
                {t === "weekly" ? "Weekly" : t === "lifetime" ? "Lifetime" : t === "contest" ? "Contest" : "Player Search & History"}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search name, handle, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-paper px-4 py-2 text-xs text-ink outline-none transition focus:border-chrome-1 font-mono"
            />
          </div>
        </div>

        {/* Tab Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {lbTab === "weekly" && (
            <>
              <span className="font-mono text-xs text-ink-soft">
                {weeklyRows.length} players · Reset date: {config.weeklyResetAt ? new Date(config.weeklyResetAt).toLocaleDateString() : "Never"}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadCSV(weeklyRows, "Weekly Leaderboard")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/40 px-3 py-1.5 font-mono text-[0.65rem] uppercase font-semibold text-blue-600 hover:bg-blue-500/10 transition"
                >
                  <Download className="size-3" /> Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 px-3 py-1.5 font-mono text-[0.65rem] uppercase font-semibold text-amber-600 hover:bg-amber-500/10 transition"
                >
                  <RotateCcw className="size-3" /> Reset Weekly Board
                </button>
              </div>
            </>
          )}
          {lbTab === "lifetime" && (
            <>
              <span className="font-mono text-xs text-ink-soft">{rank(leaderboard).length} lifetime players</span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadCSV(rank(leaderboard), "Lifetime Leaderboard")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-ink/40 px-3 py-1.5 font-mono text-[0.65rem] uppercase font-semibold text-ink hover:bg-ink/5 transition"
                >
                  <Download className="size-3" /> Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmConfig({
                      isOpen: true,
                      title: "Wipe All Leaderboard Scores",
                      message: "⚠️ Are you sure you want to DELETE ALL scores permanently? This cannot be undone!",
                      confirmText: "Delete All",
                      cancelText: "Cancel",
                      isDestructive: true,
                      onConfirm: async () => {
                        setBusy(true);
                        try {
                          await deleteAllScores();
                          void refetch();
                          toast.success("All scores deleted. Leaderboard wiped.");
                        } catch {
                          toast.error("Failed to delete all scores.");
                        } finally {
                          setBusy(false);
                          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
                        }
                      },
                    });
                  }}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 px-3 py-1.5 font-mono text-[0.65rem] uppercase font-semibold text-rose-600 hover:bg-rose-500/10 transition"
                >
                  <Trash2 className="size-3" /> Wipe All Scores
                </button>
              </div>
            </>
          )}
          {lbTab === "contest" && (
            <>
              <span className="font-mono text-xs text-ink-soft">
                {contestRows.length} contest players · {config.contest?.version ?? "v1.0"}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadCSV(contestRows, `Contest ${config.contest?.version ?? "v1.0"} Leaderboard`)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 px-3 py-1.5 font-mono text-[0.65rem] uppercase font-semibold text-amber-600 hover:bg-amber-500/10 transition"
                >
                  <Download className="size-3" /> Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmConfig({
                      isOpen: true,
                      title: "Reset Contest Leaderboard",
                      message: "Are you sure you want to reset the contest leaderboard? Scores before now will be hidden from this standings view.",
                      confirmText: "Reset",
                      cancelText: "Cancel",
                      isDestructive: true,
                      onConfirm: async () => {
                        setBusy(true);
                        try {
                          await resetContestLeaderboard();
                          void refetch();
                          toast.success("Contest board reset. New scores will appear now.");
                        } catch {
                          toast.error("Failed to reset contest board.");
                        } finally {
                          setBusy(false);
                          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
                        }
                      },
                    });
                  }}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 px-3 py-1.5 font-mono text-[0.65rem] uppercase font-semibold text-amber-600 hover:bg-amber-500/10 transition"
                >
                  <Swords className="size-3" /> Reset Contest Board
                </button>
              </div>
            </>
          )}
          {lbTab === "audit" && (
            <>
              <span className="font-mono text-xs text-ink-soft">
                {filteredGroupedPlayers.length} unique players found
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const csvRows: RankedRow[] = filteredGroupedPlayers.map((p, idx) => ({
                      id: p.playerId,
                      playerId: p.playerId,
                      name: p.name,
                      handle: p.handle,
                      score: p.highestScore,
                      accuracy: p.highestAccuracy,
                      combo: p.highestCombo,
                      createdAt: p.latestRunAt,
                      plays: p.totalRuns,
                      rank: idx + 1,
                    }));
                    downloadCSV(csvRows, "Player Directory & High Scores");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 px-3 py-1.5 font-mono text-[0.65rem] uppercase font-semibold text-emerald-600 hover:bg-emerald-500/10 transition"
                >
                  <Download className="size-3" /> Export Player CSV
                </button>
              </div>
            </>
          )}
        </div>

        {/* Leaderboard Table / Player Search Table */}
        {lbTab === "audit" ? (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/12 bg-paper-tint/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/10 font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft">
                  <th className="p-3">Player</th>
                  <th className="p-3">Personal Best</th>
                  <th className="p-3">Best Acc</th>
                  <th className="p-3">Best Combo</th>
                  <th className="p-3">Plays (Runs)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 font-sans text-sm">
                {filteredGroupedPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center caption">
                      No players match the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredGroupedPlayers.map((p) => {
                    const isBanned = (config.bannedPlayers ?? []).includes(p.playerId) || (config.bannedPlayers ?? []).includes(p.handle);
                    const isExpanded = expandedPlayerId === p.playerId;
                    const loginCode = playersCodes?.get(p.playerId) || p.playerId;

                    return (
                      <>
                        <tr
                          key={p.playerId}
                          className={cn(
                            "transition-colors hover:bg-paper/60",
                            isBanned ? "bg-rose-500/10" : ""
                          )}
                        >
                          <td className="p-3">
                            <div className="font-semibold text-ink">{p.name}</div>
                            <div className="font-mono text-xs text-ink-soft">{p.handle}</div>
                            <div
                              className="font-mono text-[0.62rem] text-ink-soft/60 cursor-pointer select-all hover:text-chrome-1 active:text-chrome-2 transition-colors mt-0.5"
                              title="Click to copy Login ID (Secret Code)"
                              onClick={() => {
                                navigator.clipboard.writeText(loginCode);
                                toast.success("Login ID copied!");
                              }}
                            >
                              Login ID: {loginCode}
                            </div>
                          </td>
                          <td className="p-3 font-mono text-ink font-semibold">
                            {p.highestScore.toLocaleString()}
                          </td>
                          <td className="p-3 font-mono text-ink-soft">
                            {p.highestAccuracy}%
                          </td>
                          <td className="p-3 font-mono text-ink-soft">
                            x{p.highestCombo}
                          </td>
                          <td className="p-3 font-mono text-ink-soft">
                            {p.totalRuns} {p.totalRuns === 1 ? "run" : "runs"}
                          </td>
                          <td className="p-3">
                            {isBanned ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 font-mono text-[0.65rem] uppercase font-semibold">
                                <Ban className="size-3" /> Banned
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                                <CheckCircle2 className="size-3" /> OK
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setExpandedPlayerId(isExpanded ? null : p.playerId)}
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-[0.65rem] uppercase font-semibold border transition-all",
                                  isExpanded
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                                    : "border-ink/20 text-ink hover:bg-ink/5"
                                )}
                              >
                                <Eye className="size-3" /> {isExpanded ? "Hide History" : "View History"}
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  setBusy(true);
                                  try {
                                    if (isBanned) {
                                      await unbanPlayer(p.playerId);
                                      toast.success(`${p.name} unbanned.`);
                                    } else {
                                      await banPlayer(p.playerId);
                                      toast.success(`${p.name} banned.`);
                                    }
                                  } catch {
                                    toast.error("Failed to update ban.");
                                  } finally {
                                    setBusy(false);
                                  }
                                }}
                                disabled={busy}
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[0.65rem] uppercase font-medium border transition-colors",
                                  isBanned
                                    ? "border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                                    : "border-rose-500/40 text-rose-600 hover:bg-rose-500/10"
                                )}
                              >
                                <Ban className="size-3" /> {isBanned ? "Unban" : "Ban"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmConfig({
                                    isOpen: true,
                                    title: "Delete Player Account & Scores",
                                    message: `⚠️ Are you sure you want to delete the player account and ALL scores for ${p.name}? This will permanently remove all of their runs and release the username "${p.name}" so it can be registered again.`,
                                    confirmText: "Delete Account & Scores",
                                    cancelText: "Cancel",
                                    isDestructive: true,
                                    onConfirm: async () => {
                                      setBusy(true);
                                      try {
                                        await deletePlayerScores(p.playerId);
                                        void refetch();
                                        toast.success(`All scores for ${p.name} deleted.`);
                                      } catch {
                                        toast.error("Delete failed.");
                                      } finally {
                                        setBusy(false);
                                        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
                                      }
                                    },
                                  });
                                }}
                                title="Delete all scores for this player"
                                className="p-1.5 rounded-lg border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-paper/40 animate-fade-in">
                            <td colSpan={7} className="p-4 border-l-4 border-emerald-500">
                              <div className="rounded-xl border border-ink/10 bg-paper/60 p-4 shadow-inner">
                                <h4 className="font-mono text-[0.7rem] uppercase tracking-wider text-ink-soft mb-3 flex items-center gap-1.5">
                                  <History className="size-3.5" /> Run History Audit for {p.name}
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse text-xs font-mono">
                                    <thead>
                                      <tr className="border-b border-ink/10 text-ink-soft">
                                        <th className="pb-2">Run #</th>
                                        <th className="pb-2">Score</th>
                                        <th className="pb-2">Accuracy</th>
                                        <th className="pb-2">Max Combo</th>
                                        <th className="pb-2">Timestamp</th>
                                        <th className="pb-2 text-right">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-ink/5">
                                      {p.allRuns.map((run, idx) => {
                                        const isEditing = editingRunId === run.id;
                                        return (
                                          <tr key={run.id} className="hover:bg-paper/80">
                                            <td className="py-2 text-ink-soft">Run {p.allRuns.length - idx}</td>
                                            <td className="py-2 font-bold text-ink">
                                              {isEditing ? (
                                                <input
                                                  type="number"
                                                  value={editScoreValue}
                                                  onChange={(e) => setEditScoreValue(e.target.value)}
                                                  className="w-20 rounded border border-ink/20 bg-paper px-1.5 py-0.5 text-xs font-semibold text-ink outline-none"
                                                />
                                              ) : (
                                                run.score.toLocaleString()
                                              )}
                                            </td>
                                            <td className="py-2 text-ink-soft">
                                              {isEditing ? (
                                                <div className="flex items-center gap-1">
                                                  <input
                                                    type="number"
                                                    value={editAccuracyValue}
                                                    onChange={(e) => setEditAccuracyValue(e.target.value)}
                                                    className="w-14 rounded border border-ink/20 bg-paper px-1.5 py-0.5 text-xs text-ink outline-none"
                                                    min="0"
                                                    max="100"
                                                  />
                                                  <span>%</span>
                                                </div>
                                              ) : (
                                                `${run.accuracy}%`
                                              )}
                                            </td>
                                            <td className="py-2 text-ink-soft">
                                              {isEditing ? (
                                                <div className="flex items-center gap-1">
                                                  <span>x</span>
                                                  <input
                                                    type="number"
                                                    value={editComboValue}
                                                    onChange={(e) => setEditComboValue(e.target.value)}
                                                    className="w-12 rounded border border-ink/20 bg-paper px-1.5 py-0.5 text-xs text-ink outline-none"
                                                    min="1"
                                                  />
                                                </div>
                                              ) : (
                                                `x${run.combo}`
                                              )}
                                            </td>
                                            <td className="py-2 text-ink-soft/80">
                                              {new Date(run.createdAt).toLocaleString()}
                                            </td>
                                            <td className="py-2 text-right">
                                              <div className="flex items-center justify-end gap-2">
                                                {isEditing ? (
                                                  <>
                                                    <button
                                                      type="button"
                                                      onClick={async () => {
                                                        const nScore = Math.max(0, parseInt(editScoreValue) || 0);
                                                        const nAcc = Math.min(100, Math.max(0, parseFloat(editAccuracyValue) || 0));
                                                        const nCombo = Math.max(1, parseInt(editComboValue) || 1);
                                                        setBusy(true);
                                                        try {
                                                          await updateScore(run.id, {
                                                            score: nScore,
                                                            accuracy: nAcc,
                                                            combo: nCombo,
                                                          });
                                                          setEditingRunId(null);
                                                          void refetch();
                                                          toast.success("Score updated successfully!");
                                                        } catch {
                                                          toast.error("Failed to update score.");
                                                        } finally {
                                                          setBusy(false);
                                                        }
                                                      }}
                                                      disabled={busy}
                                                      className="text-emerald-600 hover:text-emerald-500 font-mono text-[0.65rem] uppercase font-bold border border-emerald-500/20 rounded px-1.5 py-0.5 bg-emerald-500/5 transition-colors"
                                                    >
                                                      Save
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => setEditingRunId(null)}
                                                      className="text-ink-soft hover:text-ink font-mono text-[0.65rem] uppercase font-bold border border-ink/20 rounded px-1.5 py-0.5 bg-paper transition-colors"
                                                    >
                                                      Cancel
                                                    </button>
                                                  </>
                                                ) : (
                                                  <>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setEditingRunId(run.id);
                                                        setEditScoreValue(String(run.score));
                                                        setEditAccuracyValue(String(run.accuracy));
                                                        setEditComboValue(String(run.combo));
                                                      }}
                                                      className="text-blue-600 hover:text-blue-500 font-mono text-[0.65rem] uppercase font-bold transition-colors"
                                                    >
                                                      Edit
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={async () => {
                                                        setConfirmConfig({
                                                          isOpen: true,
                                                          title: "Delete Single Score Entry",
                                                          message: `Are you sure you want to delete this specific score of ${run.score.toLocaleString()} submitted on ${new Date(run.createdAt).toLocaleDateString()}?`,
                                                          confirmText: "Delete Run",
                                                          cancelText: "Cancel",
                                                          isDestructive: true,
                                                          onConfirm: async () => {
                                                            setBusy(true);
                                                            try {
                                                              await deleteScore(run.id);
                                                              void refetch();
                                                              toast.success("Single score run deleted.");
                                                            } catch {
                                                              toast.error("Failed to delete score.");
                                                            } finally {
                                                              setBusy(false);
                                                              setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
                                                            }
                                                          },
                                                        });
                                                      }}
                                                      className="text-rose-600 hover:text-rose-500 transition-colors p-1"
                                                      title="Delete this single run"
                                                    >
                                                      <Trash2 className="size-3.5" />
                                                    </button>
                                                  </>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/12 bg-paper-tint/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/10 font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft">
                  <th className="p-3">Rank</th>
                  <th className="p-3">Player</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Acc</th>
                  <th className="p-3">Runs</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 font-sans text-sm">
                {filteredModerationRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center caption">
                      No players match the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredModerationRows.map((row) => {
                    const isBanned = (config.bannedPlayers ?? []).includes(row.playerId) || (config.bannedPlayers ?? []).includes(row.handle);
                    const isSuspicious = row.score > 25000 || (row.accuracy === 100 && row.score > 15000);

                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          "transition-colors hover:bg-paper/60",
                          isBanned ? "bg-rose-500/10" : isSuspicious ? "bg-amber-500/10" : ""
                        )}
                      >
                        <td className="p-3 font-mono font-semibold text-ink">#{row.rank}</td>
                        <td className="p-3">
                          <div className="font-semibold text-ink">{row.name}</div>
                          <div className="font-mono text-xs text-ink-soft">{row.handle}</div>
                          <div
                            className="font-mono text-[0.62rem] text-ink-soft/60 cursor-pointer select-all hover:text-chrome-1 active:text-chrome-2 transition-colors mt-0.5"
                            title="Click to copy Login ID (Secret Code)"
                            onClick={() => {
                              const loginCode = playersCodes?.get(row.playerId) || row.playerId;
                              navigator.clipboard.writeText(loginCode);
                              toast.success("Login ID copied!");
                            }}
                          >
                            Login ID: {playersCodes?.get(row.playerId) || row.playerId}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-ink font-semibold">{row.score.toLocaleString()}</td>
                        <td className="p-3 font-mono text-ink-soft">{row.accuracy}%</td>
                        <td className="p-3 font-mono text-ink-soft">{row.plays}</td>
                        <td className="p-3">
                          {isBanned ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 font-mono text-[0.65rem] uppercase font-semibold">
                              <Ban className="size-3" /> Banned
                            </span>
                          ) : isSuspicious ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-mono text-[0.65rem] uppercase font-semibold">
                              <AlertTriangle className="size-3" /> Suspicious
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                              <CheckCircle2 className="size-3" /> OK
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={async () => {
                                setBusy(true);
                                try {
                                  if (isBanned) {
                                    await unbanPlayer(row.playerId);
                                    toast.success(`${row.name} unbanned.`);
                                  } else {
                                    await banPlayer(row.playerId);
                                    toast.success(`${row.name} banned.`);
                                  }
                                } catch {
                                  toast.error("Failed to update ban.");
                                } finally {
                                  setBusy(false);
                                }
                              }}
                              disabled={busy}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[0.65rem] uppercase font-medium border transition-colors",
                                isBanned
                                  ? "border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                                  : "border-rose-500/40 text-rose-600 hover:bg-rose-500/10"
                              )}
                            >
                              <Ban className="size-3" /> {isBanned ? "Unban" : "Ban"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmConfig({
                                  isOpen: true,
                                  title: "Delete Player Account & Scores",
                                  message: `⚠️ Are you sure you want to delete the player account and ALL scores for ${row.name}? This will permanently remove all of their runs and release the username "${row.name}" so it can be registered again.`,
                                  confirmText: "Delete Account & Scores",
                                  cancelText: "Cancel",
                                  isDestructive: true,
                                  onConfirm: async () => {
                                    setBusy(true);
                                    try {
                                      await deletePlayerScores(row.playerId);
                                      void refetch();
                                      toast.success(`All scores for ${row.name} deleted.`);
                                    } catch {
                                      toast.error("Delete failed.");
                                    } finally {
                                      setBusy(false);
                                      setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
                                    }
                                  },
                                });
                              }}
                              title="Delete all scores for this player"
                              className="p-1.5 rounded-lg border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 transition-colors"
                            >
                              <Users className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteScore(row.id, row.name)}
                              className="p-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                              title="Delete this single score entry"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Profanity & Bad Words Censorship Panel */}
      <section className="plate p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="label">Profanity & Abuse Control</span>
            <h2 className="mt-2 text-[1.4rem] font-display text-ink">Forbidden Words Filter</h2>
            <p className="mt-1 text-xs text-ink-soft">
              Names containing any of these words will be blocked automatically on registration.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {/* Add Bad Word Input */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const term = newWord.trim().toLowerCase();
              if (!term) return;
              const currentList = config.forbiddenWords ?? DEFAULT_FORBIDDEN_WORDS;
              if (currentList.map((w) => w.toLowerCase()).includes(term)) {
                toast.info(`"${term}" is already in the forbidden words list.`);
                setNewWord("");
                return;
              }
              const nextList = [...currentList, term];
              setBusy(true);
              try {
                await updateArcadeConfig({ ...config, forbiddenWords: nextList });
                toast.success(`Added "${term}" to forbidden words.`);
                setNewWord("");
              } catch {
                toast.error("Could not update forbidden words.");
              } finally {
                setBusy(false);
              }
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Type word or phrase to block..."
              className="flex-1 rounded-xl border border-ink/15 bg-paper p-3 text-sm text-ink outline-none transition focus:border-chrome-1"
            />
            <button
              type="submit"
              disabled={busy || !newWord.trim()}
              className="press-btn justify-center py-3 px-6 shrink-0 disabled:opacity-50"
            >
              Add Bad Word
            </button>
          </form>

          {/* Active Forbidden Words Badges */}
          <div className="rounded-2xl border border-ink/12 bg-paper-tint/30 p-4">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Blocked Words List ({ (config.forbiddenWords ?? DEFAULT_FORBIDDEN_WORDS).length })
            </span>
            <div className="mt-3 flex flex-wrap gap-2">
              {(config.forbiddenWords ?? DEFAULT_FORBIDDEN_WORDS).map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 font-mono text-xs text-rose-600 dark:text-rose-400"
                >
                  {word}
                  <button
                    type="button"
                    onClick={async () => {
                      const currentList = config.forbiddenWords ?? DEFAULT_FORBIDDEN_WORDS;
                      const nextList = currentList.filter((w) => w.toLowerCase() !== word.toLowerCase());
                      setBusy(true);
                      try {
                        await updateArcadeConfig({ ...config, forbiddenWords: nextList });
                        toast.success(`Removed "${word}" from forbidden list.`);
                      } catch {
                        toast.error("Could not update list.");
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className="hover:opacity-75 transition-opacity"
                    title={`Remove "${word}"`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Custom Reset Weekly Confirmation Modal */}
      {showResetModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-fade-in">
          <div className="plate max-w-md w-full p-6 space-y-5 border-amber-500/40 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-500">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30">
                <AlertTriangle className="size-5" />
              </span>
              <div>
                <span className="label text-amber-500 font-bold">Leaderboard Reset</span>
                <h3 className="font-display text-xl text-ink">Reset Weekly Scores to 0?</h3>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                <CheckCircle2 className="size-4" /> Lifetime Ranks 100% Protected
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">
                All-time Hall of Fame rankings, certificates, and player accounts are completely safe and will <strong>NOT</strong> be deleted.
              </p>
            </div>

            <p className="text-xs text-ink-soft leading-relaxed">
              This action will reset the <strong>Weekly Leaderboard</strong> scores to zero for a brand new weekly competition.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="press-btn-outline text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmResetWeekly()}
                disabled={busy}
                className="press-btn bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-bold"
              >
                <RotateCcw className="size-3.5" /> Yes, Reset Weekly Board
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Custom Launch New Version Modal */}
      {showLaunchModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-fade-in">
          <div className="plate max-w-md w-full p-6 space-y-5 border-chrome-1/40 shadow-2xl">
            <div className="flex items-center gap-3 text-chrome-1">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-chrome-1/15 border border-chrome-1/30">
                <Sparkles className="size-5" />
              </span>
              <div>
                <span className="label text-chrome-1 font-bold">Tournament Launcher</span>
                <h3 className="font-display text-xl text-ink">Launch New Contest Version</h3>
              </div>
            </div>

            <div className="space-y-2">
              <label className="label">Version Label</label>
              <input
                value={nextVersionInput}
                onChange={(e) => setNextVersionInput(e.target.value)}
                placeholder="e.g. v2.0, v3.0, v2.5"
                className="w-full rounded-xl border border-ink/15 bg-paper p-3 text-sm text-ink outline-none transition focus:border-chrome-1 font-mono"
              />
              <p className="text-[0.72rem] text-ink-soft">
                This creates a brand new tournament version, resets registration list, and opens registration for players.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLaunchModal(false)}
                className="press-btn-outline text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmLaunchNewVersion()}
                disabled={busy || !nextVersionInput.trim()}
                className="press-btn text-xs font-bold"
              >
                <Sparkles className="size-3.5" /> Launch {nextVersionInput || "v2.0"} & Open Registrations
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Custom Confirmation Modal for Deletes & Resets */}
      {confirmConfig.isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-fade-in">
          <div className={cn(
            "plate max-w-md w-full p-6 space-y-5 shadow-2xl border",
            confirmConfig.isDestructive ? "border-rose-500/40" : "border-amber-500/40"
          )}>
            <div className="flex items-center gap-3">
              <span className={cn(
                "flex size-10 items-center justify-center rounded-2xl border",
                confirmConfig.isDestructive 
                  ? "bg-rose-500/15 border-rose-500/30 text-rose-500" 
                  : "bg-amber-500/15 border-amber-500/30 text-amber-500"
              )}>
                <AlertTriangle className="size-5" />
              </span>
              <div>
                <span className={cn(
                  "label font-bold",
                  confirmConfig.isDestructive ? "text-rose-500" : "text-amber-500"
                )}>
                  {confirmConfig.title}
                </span>
                <h3 className="font-display text-xl text-ink mt-0.5">{confirmConfig.title}</h3>
              </div>
            </div>

            <p className="text-xs text-ink-soft leading-relaxed">
              {confirmConfig.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
                className="press-btn-outline text-xs"
              >
                {confirmConfig.cancelText || "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => void confirmConfig.onConfirm()}
                disabled={busy}
                className={cn(
                  "press-btn text-xs font-bold",
                  confirmConfig.isDestructive 
                    ? "bg-rose-600 hover:bg-rose-500 text-white" 
                    : "bg-amber-500 text-slate-950 hover:bg-amber-400"
                )}
              >
                {confirmConfig.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Custom Contest Registrations Manager Modal */}
      {showRegsModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-fade-in">
          <div className="plate max-w-lg w-full p-6 space-y-5 border-ink/10 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500">
                  <Users className="size-5" />
                </span>
                <div>
                  <span className="label text-amber-500 font-bold">Contest Participants</span>
                  <h3 className="font-display text-xl text-ink">Manage Registered Players</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRegsModal(false);
                  setRegsSearchQuery("");
                }}
                className="text-lg font-mono text-ink-soft hover:text-ink transition"
                title="Close Modal"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Search registered players..."
                value={regsSearchQuery}
                onChange={(e) => setRegsSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-ink/15 bg-paper px-4 py-2.5 text-xs text-ink outline-none transition focus:border-chrome-1 font-mono"
              />

              <div className="max-h-60 overflow-y-auto rounded-xl border border-ink/10 bg-paper-tint/30 divide-y divide-ink/10">
                {filteredRegs.length === 0 ? (
                  <p className="p-6 text-center text-xs text-ink-soft">No registered players found matching that search.</p>
                ) : (
                  filteredRegs.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 text-xs">
                      <div>
                        <div className="font-semibold text-ink">{p.name}</div>
                        <div className="font-mono text-[0.68rem] text-ink-soft mt-0.5">@{p.handle}</div>
                        <div
                          className="font-mono text-[0.62rem] text-ink-soft/60 cursor-pointer select-all hover:text-chrome-1 active:text-chrome-2 transition-colors mt-1"
                          title="Click to copy Login ID (Secret Code)"
                          onClick={() => {
                            const loginCode = playersCodes?.get(p.id) || p.id;
                            navigator.clipboard.writeText(loginCode);
                            toast.success("Login ID copied!");
                          }}
                        >
                          Login ID: {playersCodes?.get(p.id) || p.id}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void removeRegistration(p.id)}
                        disabled={busy}
                        className="p-1.5 rounded-lg border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Remove player registration"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRegsModal(false);
                  setRegsSearchQuery("");
                }}
                className="press-btn text-xs font-bold"
              >
                Close Manager
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
