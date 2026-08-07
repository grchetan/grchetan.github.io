import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const rootDir = process.cwd();
const backupHtml = path.join(rootDir, "index.html.backup");
const destHtml = path.join(rootDir, "index.html");

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

if (fs.existsSync(rootVersion)) {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.copyFileSync(rootVersion, destVersion);
  console.log("Prebuild: Successfully copied version.json to public/version.json");
} else {
  console.error("Prebuild Error: version.json not found!");
}

// Generate sitemap dynamically
try {
  execSync("node scripts/generate-sitemap.js", { stdio: "inherit" });
} catch (e) {
  console.error("Prebuild Error: sitemap generation failed:", e);
}
