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

// 4. Git operations
console.log("Staging changes...");
execSync("git add .", { stdio: "inherit" });

// Reset scratch files to avoid committing them
try {
  execSync("git reset -- scratch/", { stdio: "ignore" });
} catch (e) {}

const commitMsg = `build: deploy v${newVersion} (${formattedDate})`;
console.log(`Committing: "${commitMsg}"`);
execSync(`git commit -m "${commitMsg}"`, { stdio: "inherit" });

console.log("Pushing to main branch...");
execSync("git push origin main", { stdio: "inherit" });

// 5. Deploy to gh-pages
console.log("Deploying to gh-pages...");
execSync("npx gh-pages -d dist", { stdio: "inherit" });

console.log(`\n🎉 Deployment of v${newVersion} completed successfully!`);
