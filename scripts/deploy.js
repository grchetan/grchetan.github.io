import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const rootDir = process.cwd();
const versionFile = path.join(rootDir, "version.json");

// 1. Read version.json
if (!fs.existsSync(versionFile)) {
  fs.writeFileSync(versionFile, JSON.stringify({ version: "1.0.0", builtAt: new Date().toISOString() }, null, 2));
}

const data = JSON.parse(fs.readFileSync(versionFile, "utf8"));
const oldVersion = data.version;

// Parse and increment semantic version (e.g. 1.0.0 -> 1.0.1)
const parts = oldVersion.split(".");
if (parts.length === 3) {
  parts[2] = (parseInt(parts[2], 10) + 1).toString();
} else {
  // Fallback if not standard semantic
  parts[0] = "1";
  parts[1] = "0";
  parts[2] = "0";
}
const newVersion = parts.join(".");

data.version = newVersion;
data.builtAt = new Date().toISOString();

// Write back version.json
fs.writeFileSync(versionFile, JSON.stringify(data, null, 2));
console.log(`Version incremented: ${oldVersion} -> ${newVersion}`);

// 2. Build the project
console.log("Running npm run build...");
execSync("npm run build", { stdio: "inherit" });

// 3. Format Date/Time for commit message (e.g. 2026-08-07 01:05)
const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

const commitMsg = `build: deploy v${newVersion} (${formattedDate})`;

console.log("\n=======================================================");
console.log("🚀 BUILD COMPLETED SUCCESSFULLY (v" + newVersion + ")");
console.log("=======================================================");
console.log("\nBhai, aap niche diye commands ko manually CMD/Terminal me run kijiye:\n");
console.log(`git add .`);
console.log(`git commit -m "${commitMsg}"`);
console.log(`git push origin main`);
console.log("\n(Note: Agar aap GitHub Pages par deploy karna chahein, toh push karne ke baad ye command bhi chala sakte hain: npx gh-pages -d dist)");
console.log("=======================================================\n");
