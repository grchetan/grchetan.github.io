import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const backupHtml = path.join(rootDir, "index.html.backup");
const destHtml = path.join(rootDir, "index.html");

if (fs.existsSync(backupHtml)) {
  fs.copyFileSync(backupHtml, destHtml);
  console.log("Prebuild: Successfully restored index.html from index.html.backup");
} else {
  console.error("Prebuild Error: index.html.backup not found!");
}
