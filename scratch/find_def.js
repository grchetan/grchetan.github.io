import fs from "fs";
import path from "path";

const bundleDir = path.resolve(process.cwd(), "dist", "assets");
const files = fs.readdirSync(bundleDir);
const jsFile = files.find(f => f.startsWith("index-") && f.endsWith(".js"));

if (jsFile) {
  const content = fs.readFileSync(path.join(bundleDir, jsFile), "utf8");
  
  // Find definitions like "var ej="
  const searchStr = "var ej=";
  const index = content.indexOf(searchStr);
  if (index !== -1) {
    console.log("Found definition at index:", index);
    console.log(content.substring(index, index + 200));
  } else {
    // Try other assignments
    const regex = /[a-zA-Z0-9_$]+=.*"\/assets\/portrait[^"]*"/;
    const match = content.match(regex);
    if (match) {
      console.log("Found path assignment match:", match[0]);
    } else {
      console.log("Not found path assignment!");
    }
  }
} else {
  console.log("No index JS file found in dist/assets");
}
