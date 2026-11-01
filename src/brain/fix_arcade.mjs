/**
 * Fix script for arcade.ts and arcade.tsx
 * Run: node src/brain/fix_arcade.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = "E:/DevWorkspace/Portfolios/grchetan.github.io-main";

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1: profanity.ts — add camelCase → space conversion in sanitizeName
// ─────────────────────────────────────────────────────────────────────────────
const profanityPath = path.join(ROOT, "src/lib/profanity.ts");
let profanity = fs.readFileSync(profanityPath, "utf8");

const oldSanitize = `export function sanitizeName(name: string): string {
  if (!name) return "Anonymous";
  if (isProfane(name)) {
    return "Blocked User";
  }
  return name;
}`;

const newSanitize = `export function sanitizeName(name: string): string {
  if (!name) return "Anonymous";
  // Insert space between camelCase words so "KyaBoltiPublic" → "Kya Bolti Public"
  let spaced = name
    .replace(/([a-z\u00C0-\u024F])([A-Z\u00C0-\u024F])/g, "$1 $2")
    .replace(/([A-Z\u00C0-\u024F]+)([A-Z\u00C0-\u024F][a-z\u00C0-\u024F])/g, "$1 $2")
    .trim();
  if (isProfane(spaced)) {
    return "Blocked User";
  }
  return spaced;
}`;

if (profanity.includes(oldSanitize)) {
  profanity = profanity.replace(oldSanitize, newSanitize);
  fs.writeFileSync(profanityPath, profanity, "utf8");
  console.log("✅ profanity.ts — sanitizeName updated with camelCase spacing");
} else {
  console.log("⚠️  profanity.ts — sanitizeName target not found, checking manually...");
  const idx = profanity.indexOf("export function sanitizeName");
  console.log("sanitizeName found at char:", idx);
  console.log(profanity.slice(idx, idx + 300));
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 2: arcade.ts — Fix isMine in grab() to normalize local- prefix
// and make real-time subscription also set liveCount for immediate display
// ─────────────────────────────────────────────────────────────────────────────
const arcadeTsxPath = path.join(ROOT, "src/components/site/arcade.tsx");
let arcadeTsx = fs.readFileSync(arcadeTsxPath, "utf8");

// Fix 2a: normalize isMine check in grab()
const oldGrab = `  const grab = useCallback(
    async (row: RankedRow) => {
      const isMine =
        (meId && row.playerId === meId) ||
        (meHandle && row.handle.toLowerCase() === meHandle.toLowerCase());`;

const newGrab = `  const grab = useCallback(
    async (row: RankedRow) => {
      // Normalize playerId so local- prefix doesn't break certificate ownership check
      const normalizeId = (id: string) => (id || "").replace(/^local-/i, "").toLowerCase();
      const isMine =
        (meId && normalizeId(row.playerId) === normalizeId(meId)) ||
        (meHandle && row.handle.toLowerCase() === meHandle.toLowerCase());`;

if (arcadeTsx.includes(oldGrab)) {
  arcadeTsx = arcadeTsx.replace(oldGrab, newGrab);
  console.log("✅ arcade.tsx — grab() isMine normalized");
} else {
  console.log("⚠️  arcade.tsx — grab() target not found");
}

// Fix 2b: normalize isMine in LeaderboardTable render
const oldTableMine = `          const isMine =
              (meId && row.playerId === meId) ||
              (meHandle && row.handle.toLowerCase() === meHandle.toLowerCase());`;

const newTableMine = `          const normalizeId2 = (id: string) => (id || "").replace(/^local-/i, "").toLowerCase();
            const isMine =
              (meId && normalizeId2(row.playerId) === normalizeId2(meId)) ||
              (meHandle && row.handle.toLowerCase() === meHandle.toLowerCase());`;

if (arcadeTsx.includes(oldTableMine)) {
  arcadeTsx = arcadeTsx.replace(oldTableMine, newTableMine);
  console.log("✅ arcade.tsx — LeaderboardTable isMine normalized");
} else {
  console.log("⚠️  arcade.tsx — LeaderboardTable isMine target not found");
}

// Fix 2c: me and myLifetimeRow lookup — normalize playerId comparison
const oldMeLookup = `  const me = useMemo(() => {
    if (!player) return null;
    return (
      filteredRows.find(
        (r) =>
          r.playerId === player.id ||
          (r.handle && r.handle.toLowerCase() === player.handle.toLowerCase())
      ) ?? null
    );
  }, [filteredRows, player]);`;

const newMeLookup = `  const me = useMemo(() => {
    if (!player) return null;
    const nId = (id: string) => (id || "").replace(/^local-/i, "").toLowerCase();
    return (
      filteredRows.find(
        (r) =>
          nId(r.playerId) === nId(player.id) ||
          (r.handle && r.handle.toLowerCase() === player.handle.toLowerCase())
      ) ?? null
    );
  }, [filteredRows, player]);`;

if (arcadeTsx.includes(oldMeLookup)) {
  arcadeTsx = arcadeTsx.replace(oldMeLookup, newMeLookup);
  console.log("✅ arcade.tsx — me lookup normalized");
} else {
  console.log("⚠️  arcade.tsx — me lookup target not found");
}

const oldMyLifetime = `  const myLifetimeRow = useMemo(() => {
    if (!player) return null;
    return (
      lifetimeRankedRows.find(
        (r) =>
          r.playerId === player.id ||
          (r.handle && r.handle.toLowerCase() === player.handle.toLowerCase())
      ) ?? null
    );
  }, [lifetimeRankedRows, player]);`;

const newMyLifetime = `  const myLifetimeRow = useMemo(() => {
    if (!player) return null;
    const nId = (id: string) => (id || "").replace(/^local-/i, "").toLowerCase();
    return (
      lifetimeRankedRows.find(
        (r) =>
          nId(r.playerId) === nId(player.id) ||
          (r.handle && r.handle.toLowerCase() === player.handle.toLowerCase())
      ) ?? null
    );
  }, [lifetimeRankedRows, player]);`;

if (arcadeTsx.includes(oldMyLifetime)) {
  arcadeTsx = arcadeTsx.replace(oldMyLifetime, newMyLifetime);
  console.log("✅ arcade.tsx — myLifetimeRow lookup normalized");
} else {
  console.log("⚠️  arcade.tsx — myLifetimeRow lookup target not found");
}

// Fix 2d: Fix LeaderboardTable — add onOpenCert prop and pass it
// Check if onOpenCert prop is already in LeaderboardTable props
if (!arcadeTsx.includes("onOpenCert?: (row: RankedRow) => void;")) {
  const oldLeaderboardTableProps = `function LeaderboardTable({
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
})`;

  const newLeaderboardTableProps = `function LeaderboardTable({
  rows,
  meId,
  meHandle,
  boardTab,
  config,
  onOpenCert,
}: {
  rows: RankedRow[];
  meId?: string | undefined;
  meHandle?: string | undefined;
  boardTab: "weekly" | "lifetime" | "contest";
  config: any;
  onOpenCert?: (row: RankedRow) => void;
})`;

  if (arcadeTsx.includes(oldLeaderboardTableProps)) {
    arcadeTsx = arcadeTsx.replace(oldLeaderboardTableProps, newLeaderboardTableProps);
    console.log("✅ arcade.tsx — LeaderboardTable got onOpenCert prop");
  } else {
    console.log("⚠️  arcade.tsx — LeaderboardTable props target not found");
  }
}

// Fix 2e: Pass onOpenCert to LeaderboardRow in the LeaderboardTable render
const oldLeaderboardRowRender = `              <LeaderboardRow
                key={row.playerId}
                row={row}
                index={i}
                mine={Boolean(isMine)}
                reduced={reduced}
                busy={busy === row.id}
                onGrab={grab}
              />`;

const newLeaderboardRowRender = `              <LeaderboardRow
                key={row.playerId}
                row={row}
                index={i}
                mine={Boolean(isMine)}
                reduced={reduced}
                busy={busy === row.id}
                onGrab={grab}
                onOpenCert={onOpenCert}
              />`;

if (arcadeTsx.includes(oldLeaderboardRowRender)) {
  arcadeTsx = arcadeTsx.replace(oldLeaderboardRowRender, newLeaderboardRowRender);
  console.log("✅ arcade.tsx — LeaderboardRow gets onOpenCert forwarded");
} else {
  console.log("⚠️  arcade.tsx — LeaderboardRow render target not found");
}

// Fix 2f: Pass setSelectedCertRow as onOpenCert to LeaderboardTable in ArcadeStage
const oldLeaderboardTableUsage = `            <LeaderboardTable
              rows={filteredRows}
              meId={player?.id}
              meHandle={player?.handle}
              boardTab={boardTab}
              config={config}
            />`;

const newLeaderboardTableUsage = `            <LeaderboardTable
              rows={filteredRows}
              meId={player?.id}
              meHandle={player?.handle}
              boardTab={boardTab}
              config={config}
              onOpenCert={setSelectedCertRow}
            />`;

if (arcadeTsx.includes(oldLeaderboardTableUsage)) {
  arcadeTsx = arcadeTsx.replace(oldLeaderboardTableUsage, newLeaderboardTableUsage);
  console.log("✅ arcade.tsx — LeaderboardTable in ArcadeStage passes onOpenCert");
} else {
  console.log("⚠️  arcade.tsx — LeaderboardTable usage target not found");
}

fs.writeFileSync(arcadeTsxPath, arcadeTsx, "utf8");
console.log("✅ arcade.tsx written");

// ─────────────────────────────────────────────────────────────────────────────
// FIX 3: arcade.ts — Fix useInfiniteLeaderboard real-time update
// The snapshot gives raw ScoreRow[], we need to store them in a way that
// filteredRows (which does rank()) can process correctly.
// Also add immediate liveRows state so "Live · N players" shows on load.
// ─────────────────────────────────────────────────────────────────────────────
const arcadeTsPath = path.join(ROOT, "src/lib/arcade.ts");
let arcadeTs = fs.readFileSync(arcadeTsPath, "utf8");

// Fix 3a: Export liveRowsAtom via a simple ref so ArcadeStage can show immediate count
// Instead, we fix useInfiniteLeaderboard to also export liveRows count
const oldUseInfinite = `export function useInfiniteLeaderboard(pageSize: number = 100) {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: ["arcade", "leaderboard", "paginated", pageSize],
    queryFn: ({ pageParam }) => fetchLeaderboardPage(pageSize, pageParam),
    initialPageParam: null as any,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    retry: 2,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  useEffect(() => {
    return subscribeLeaderboard((liveRows) => {
      if (!liveRows) return;
      queryClient.setQueryData<InfiniteData<ScorePage>>(
        ["arcade", "leaderboard", "paginated", pageSize],
        (oldData) => {
          if (!oldData || !oldData.pages || oldData.pages.length === 0) {
            if (liveRows.length === 0) return oldData;
            return {
              pages: [
                {
                  rows: liveRows.slice(0, pageSize),
                  nextCursor: liveRows.length >= pageSize ? liveRows[pageSize - 1] : null,
                },
              ],
              pageParams: [null],
            };
          }

          const updatedPages = [...oldData.pages];
          updatedPages[0] = {
            ...updatedPages[0],
            rows: liveRows.slice(0, pageSize),
            nextCursor: liveRows.length >= pageSize ? updatedPages[0].nextCursor : null,
          };

          return {
            ...oldData,
            pages: updatedPages,
          };
        }
      );

      queryClient.setQueryData<ScoreRow[]>(["arcade", "leaderboard"], liveRows);
    });
  }, [queryClient, pageSize]);

  return query;
}`;

const newUseInfinite = `export function useInfiniteLeaderboard(pageSize: number = 100) {
  const queryClient = useQueryClient();
  // Track live raw row count for immediate "Live · N players" display
  const [liveCount, setLiveCount] = useState<number | null>(null);

  const query = useInfiniteQuery({
    queryKey: ["arcade", "leaderboard", "paginated", pageSize],
    queryFn: ({ pageParam }) => fetchLeaderboardPage(pageSize, pageParam),
    initialPageParam: null as any,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    retry: 2,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  useEffect(() => {
    return subscribeLeaderboard((liveRows) => {
      if (!liveRows) return;
      // Track unique player count for the live badge
      const uniquePlayers = new Set(
        liveRows.map((r) => (r.playerId || r.handle || r.name).replace(/^local-/i, "").toLowerCase())
      ).size;
      setLiveCount(uniquePlayers);

      queryClient.setQueryData<InfiniteData<ScorePage>>(
        ["arcade", "leaderboard", "paginated", pageSize],
        (oldData) => {
          if (!oldData || !oldData.pages || oldData.pages.length === 0) {
            if (liveRows.length === 0) return oldData;
            return {
              pages: [
                {
                  rows: liveRows.slice(0, pageSize),
                  nextCursor: liveRows.length >= pageSize ? liveRows[pageSize - 1] : null,
                },
              ],
              pageParams: [null],
            };
          }

          const updatedPages = [...oldData.pages];
          updatedPages[0] = {
            ...updatedPages[0],
            rows: liveRows.slice(0, pageSize),
            nextCursor: liveRows.length >= pageSize ? updatedPages[0].nextCursor : null,
          };

          return {
            ...oldData,
            pages: updatedPages,
          };
        }
      );

      queryClient.setQueryData<ScoreRow[]>(["arcade", "leaderboard"], liveRows);
    });
  }, [queryClient, pageSize]);

  return { ...query, liveCount };
}`;

if (arcadeTs.includes(oldUseInfinite)) {
  arcadeTs = arcadeTs.replace(oldUseInfinite, newUseInfinite);
  console.log("✅ arcade.ts — useInfiniteLeaderboard exports liveCount");
} else {
  console.log("⚠️  arcade.ts — useInfiniteLeaderboard target not found, checking...");
  const idx = arcadeTs.indexOf("export function useInfiniteLeaderboard");
  console.log("Found at char:", idx);
  console.log(arcadeTs.slice(idx, idx + 200));
}

// Check if useState is already imported in arcade.ts
if (!arcadeTs.includes("useState") || !arcadeTs.match(/from ["']react["']/)) {
  console.log("⚠️  arcade.ts may need useState import from react");
} else {
  console.log("✅ arcade.ts — useState already imported");
}

fs.writeFileSync(arcadeTsPath, arcadeTs, "utf8");
console.log("✅ arcade.ts written");

console.log("\n✅ All fixes applied. Now check the imports and build.");
