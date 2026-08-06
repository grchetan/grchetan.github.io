import fs from "fs";
import path from "path";

const bundleDir = path.resolve(process.cwd(), "dist", "assets");
const files = fs.readdirSync(bundleDir);
const jsFile = files.find(f => f.startsWith("index-") && f.endsWith(".js"));

if (jsFile) {
  const content = fs.readFileSync(path.join(bundleDir, jsFile), "utf8");
  const index = content.indexOf("Portrait of Chetan");
  if (index !== -1) {
    console.log("Found alt text at index:", index);
    console.log("Snippet around alt text:");
    console.log(content.substring(index - 300, index + 300));
  } else {
    console.log("Alt text not found in JS file!");
  }
} else {
  console.log("No index JS file found in dist/assets");
}
