import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const distDir = path.resolve(rootDir, "dist");
const adminDir = path.join(distDir, "admin");

// 1. Create dist/admin directory if it doesn't exist
if (!fs.existsSync(adminDir)) {
  fs.mkdirSync(adminDir, { recursive: true });
}

// 2. Copy dist/index.html to dist/admin/index.html
const destHtml = path.join(distDir, "index.html");
const adminDestHtml = path.join(adminDir, "index.html");
if (fs.existsSync(destHtml)) {
  fs.copyFileSync(destHtml, adminDestHtml);
  console.log("Successfully copied dist/index.html to dist/admin/index.html");
} else {
  console.error("Error: dist/index.html not found!");
}

// 3. Copy vercel.json to dist/vercel.json
const rootVercelJson = path.join(rootDir, "vercel.json");
const distVercelJson = path.join(distDir, "vercel.json");
if (fs.existsSync(rootVercelJson)) {
  fs.copyFileSync(rootVercelJson, distVercelJson);
  console.log("Successfully copied vercel.json to dist/vercel.json");
}

// Helper to recursively copy directories
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 4. Copy dist/ content to project root (except dist itself)
if (fs.existsSync(distDir)) {
  console.log("Copying compiled files from dist/ to project root...");
  fs.readdirSync(distDir).forEach((item) => {
    const srcPath = path.join(distDir, item);
    const destPath = path.join(rootDir, item);
    
    // Skip copying dist directory to itself
    if (item === "dist") return;
    
    try {
      copyRecursiveSync(srcPath, destPath);
    } catch (err) {
      console.error(`Error copying ${item} to root:`, err);
    }
  });
  console.log("Successfully copied all dist/ files to root.");
}
