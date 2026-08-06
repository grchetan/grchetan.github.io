import fs from "fs";
import path from "path";

const distDir = path.resolve(process.cwd(), "dist");
const adminDir = path.join(distDir, "admin");

// 1. Create dist/admin directory if it doesn't exist
if (!fs.existsSync(adminDir)) {
  fs.mkdirSync(adminDir, { recursive: true });
}

// 2. Copy dist/index.html to dist/admin/index.html
const srcHtml = path.join(distDir, "index.html");
const destHtml = path.join(adminDir, "index.html");

if (fs.existsSync(srcHtml)) {
  fs.copyFileSync(srcHtml, destHtml);
  console.log("Successfully copied dist/index.html to dist/admin/index.html");
} else {
  console.error("Error: dist/index.html not found!");
}
