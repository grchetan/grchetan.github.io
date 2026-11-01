import fs from "fs";
import path from "path";

const ROOT = "E:/DevWorkspace/Portfolios/grchetan.github.io-main";

// ─── FIX 1: profanity.ts — sanitizeName with camelCase spacing ───────────────
{
  const filePath = path.join(ROOT, "src/lib/profanity.ts");
  let src = fs.readFileSync(filePath, "utf8");

  const OLD = "export function sanitizeName(name: string): string {\r\n  if (!name) return \"Anonymous\";\r\n  if (isProfane(name)) {\r\n    return \"Blocked User\";\r\n  }\r\n  return name;\r\n}";
  const NEW = `export function sanitizeName(name: string): string {\r\n  if (!name) return "Anonymous";\r\n  // Insert space between camelCase words: "KyaBoltiPublic" → "Kya Bolti Public"\r\n  const spaced = name\r\n    .replace(/([a-z\\u00C0-\\u024F])([A-Z\\u00C0-\\u024F])/g, "$1 $2")\r\n    .replace(/([A-Z\\u00C0-\\u024F]+)([A-Z\\u00C0-\\u024F][a-z\\u00C0-\\u024F])/g, "$1 $2")\r\n    .trim();\r\n  if (isProfane(spaced)) {\r\n    return "Blocked User";\r\n  }\r\n  return spaced;\r\n}`;

  if (src.includes(OLD)) {
    src = src.replace(OLD, NEW);
    fs.writeFileSync(filePath, src, "utf8");
    console.log("✅ profanity.ts — sanitizeName with camelCase spacing");
  } else {
    console.log("❌ profanity.ts — OLD not found");
    // Try without \r
    const OLD2 = OLD.replace(/\r\n/g, "\n");
    if (src.includes(OLD2)) {
      const NEW2 = NEW.replace(/\r\n/g, "\n");
      src = src.replace(OLD2, NEW2);
      fs.writeFileSync(filePath, src, "utf8");
      console.log("✅ profanity.ts — sanitizeName (LF) updated");
    } else {
      console.log("❌ profanity.ts — not found in LF either");
    }
  }
}

// ─── FIX 2: arcade.tsx — Multiple targeted fixes ─────────────────────────────
{
  const filePath = path.join(ROOT, "src/components/site/arcade.tsx");
  let src = fs.readFileSync(filePath, "utf8");
  // Normalize line endings for search, keep original for replacement
  const LF = src.replace(/\r\n/g, "\n");

  const fixes = [
    {
      name: "grab() isMine normalize",
      old: `  const grab = useCallback(\n    async (row: RankedRow) => {\n      const isMine =\n        (meId && row.playerId === meId) ||\n        (meHandle && row.handle.toLowerCase() === meHandle.toLowerCase());`,
      new: `  const grab = useCallback(\n    async (row: RankedRow) => {\n      // Normalize playerId so local- prefix doesn't break certificate ownership\n      const nId = (id: string) => (id || "").replace(/^local-/i, "").toLowerCase();\n      const isMine =\n        (meId && nId(row.playerId) === nId(meId)) ||\n        (meHandle && row.handle.toLowerCase() === meHandle.toLowerCase());`
    },
    {
      name: "LeaderboardTable isMine normalize",
      old: `          const isMine =\n              (meId && row.playerId === meId) ||\n              (meHandle && row.handle.toLowerCase() === meHandle.toLowerCase());`,
      new: `          const nId2 = (id: string) => (id || "").replace(/^local-/i, "").toLowerCase();\n            const isMine =\n              (meId && nId2(row.playerId) === nId2(meId)) ||\n              (meHandle && row.handle.toLowerCase() === meHandle.toLowerCase());`
    },
    {
      name: "me useMemo normalize playerId",
      old: `  const me = useMemo(() => {\n    if (!player) return null;\n    return (\n      filteredRows.find(\n        (r) =>\n          r.playerId === player.id ||\n          (r.handle && r.handle.toLowerCase() === player.handle.toLowerCase())\n      ) ?? null\n    );\n  }, [filteredRows, player]);`,
      new: `  const me = useMemo(() => {\n    if (!player) return null;\n    const nId = (id: string) => (id || "").replace(/^local-/i, "").toLowerCase();\n    return (\n      filteredRows.find(\n        (r) =>\n          nId(r.playerId) === nId(player.id) ||\n          (r.handle && r.handle.toLowerCase() === player.handle.toLowerCase())\n      ) ?? null\n    );\n  }, [filteredRows, player]);`
    },
    {
      name: "myLifetimeRow useMemo normalize playerId",
      old: `  const myLifetimeRow = useMemo(() => {\n    if (!player) return null;\n    return (\n      lifetimeRankedRows.find(\n        (r) =>\n          r.playerId === player.id ||\n          (r.handle && r.handle.toLowerCase() === player.handle.toLowerCase())\n      ) ?? null\n    );\n  }, [lifetimeRankedRows, player]);`,
      new: `  const myLifetimeRow = useMemo(() => {\n    if (!player) return null;\n    const nId = (id: string) => (id || "").replace(/^local-/i, "").toLowerCase();\n    return (\n      lifetimeRankedRows.find(\n        (r) =>\n          nId(r.playerId) === nId(player.id) ||\n          (r.handle && r.handle.toLowerCase() === player.handle.toLowerCase())\n      ) ?? null\n    );\n  }, [lifetimeRankedRows, player]);`
    },
    {
      name: "LeaderboardTable add onOpenCert prop",
      old: `function LeaderboardTable({\n  rows,\n  meId,\n  meHandle,\n  boardTab,\n  config,\n}: {\n  rows: RankedRow[];\n  meId?: string | undefined;\n  meHandle?: string | undefined;\n  boardTab: "weekly" | "lifetime" | "contest";\n  config: any;\n})`,
      new: `function LeaderboardTable({\n  rows,\n  meId,\n  meHandle,\n  boardTab,\n  config,\n  onOpenCert,\n}: {\n  rows: RankedRow[];\n  meId?: string | undefined;\n  meHandle?: string | undefined;\n  boardTab: "weekly" | "lifetime" | "contest";\n  config: any;\n  onOpenCert?: (row: RankedRow) => void;\n})`
    },
    {
      name: "LeaderboardTable pass onOpenCert to rows",
      old: `              <LeaderboardRow\n                key={row.playerId}\n                row={row}\n                index={i}\n                mine={Boolean(isMine)}\n                reduced={reduced}\n                busy={busy === row.id}\n                onGrab={grab}\n              />`,
      new: `              <LeaderboardRow\n                key={row.playerId}\n                row={row}\n                index={i}\n                mine={Boolean(isMine)}\n                reduced={reduced}\n                busy={busy === row.id}\n                onGrab={grab}\n                onOpenCert={onOpenCert}\n              />`
    },
    {
      name: "ArcadeStage pass onOpenCert to LeaderboardTable",
      old: `            <LeaderboardTable\n              rows={filteredRows}\n              meId={player?.id}\n              meHandle={player?.handle}\n              boardTab={boardTab}\n              config={config}\n            />`,
      new: `            <LeaderboardTable\n              rows={filteredRows}\n              meId={player?.id}\n              meHandle={player?.handle}\n              boardTab={boardTab}\n              config={config}\n              onOpenCert={setSelectedCertRow}\n            />`
    },
  ];

  let applied = 0;
  for (const fix of fixes) {
    if (LF.includes(fix.old)) {
      const newLF = LF.replace(fix.old, fix.new);
      // Apply back to src (which may be CRLF - we work on LF normalized copy)
      src = newLF;
      console.log(`✅ ${fix.name}`);
      applied++;
    } else {
      console.log(`⚠️  NOT FOUND: ${fix.name}`);
      // Print snippet around expected area for debugging
      const snippetKey = fix.old.slice(0, 50);
      const idx = LF.indexOf(snippetKey);
      if (idx !== -1) {
        console.log("  Partial match at:", idx, LF.slice(idx, idx + 200));
      }
    }
  }

  fs.writeFileSync(filePath, src, "utf8");
  console.log(`\n✅ arcade.tsx written (${applied}/${fixes.length} fixes applied)`);
}

console.log("\n🎉 Done. Run: npm run build");
