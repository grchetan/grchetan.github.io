import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const rootDir = process.cwd();
const backupHtml = path.join(rootDir, "index.html.backup");
const destHtml = path.join(rootDir, "index.html");

// Clean up old compiled folders to prevent asset accumulation and caching conflicts
const assetsDir = path.join(rootDir, "assets");
if (fs.existsSync(assetsDir)) {
  fs.rmSync(assetsDir, { recursive: true, force: true });
  console.log("Prebuild: Cleaned up old assets/ folder in root");
}
const distDir = path.join(rootDir, "dist");
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
  console.log("Prebuild: Cleaned up old dist/ folder in root");
}

if (fs.existsSync(backupHtml)) {
  fs.copyFileSync(backupHtml, destHtml);
  console.log("Prebuild: Successfully restored index.html from index.html.backup");
} else {
  console.error("Prebuild Error: index.html.backup not found!");
}

// Copy version.json to public/version.json
const rootVersion = path.join(rootDir, "version.json");
const publicDir = path.join(rootDir, "public");
const destVersion = path.join(publicDir, "version.json");

// Auto-increment patch version on every build so VersionWatcher detects new deployments
if (fs.existsSync(rootVersion)) {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  // Bump the patch number
  const versionData = JSON.parse(fs.readFileSync(rootVersion, 'utf-8'));
  const parts = String(versionData.version || '1.0.0').split('.');
  parts[2] = String((parseInt(parts[2] || '0', 10) + 1));
  versionData.version = parts.join('.');
  versionData.builtAt = new Date().toISOString();
  fs.writeFileSync(rootVersion, JSON.stringify(versionData, null, 2));
  fs.copyFileSync(rootVersion, destVersion);
  console.log(`Prebuild: Bumped version to ${versionData.version} and copied version.json to public/version.json`);
} else {
  console.error('Prebuild Error: version.json not found!');
}

// Generate sitemap dynamically
try {
  execSync("node scripts/generate-sitemap.js", { stdio: "inherit" });
} catch (e) {
  console.error("Prebuild Error: sitemap generation failed:", e);
}
