import fs from "fs";
import path from "path";

const bundleDir = path.resolve(process.cwd(), "dist", "assets");
const files = fs.readdirSync(bundleDir);
const jsFile = files.find(f => f.startsWith("index-") && f.endsWith(".js"));

if (jsFile) {
  const content = fs.readFileSync(path.join(bundleDir, jsFile), "utf8");
  console.log("Bundle JS Size:", content.length);
  
  // Find base64 patterns
  const base64Matches = content.match(/data:image\/[a-zA-Z+.-]+;base64,[a-zA-Z0-9+/=]+/g) || [];
  console.log("Number of base64 images found:", base64Matches.length);
  base64Matches.forEach((match, idx) => {
    console.log(`Image ${idx + 1} type:`, match.substring(0, 30), "... length:", match.length);
  });

  // Find image asset path strings
  const assetPaths = content.match(/\/assets\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|svg)/g) || [];
  console.log("Image paths found in bundle:", assetPaths);
} else {
  console.log("No index JS file found in dist/assets");
}
