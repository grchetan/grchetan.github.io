import { execSync } from "child_process";

try {
  const content = execSync("git show HEAD:index.html", { encoding: "utf8" });
  console.log("git show HEAD:index.html (first 200 chars):");
  console.log(content.substring(0, 200));
  
  const hasSrc = content.includes('src="/src/main.tsx"');
  console.log("Contains src='/src/main.tsx':", hasSrc);
} catch (err) {
  console.error("Error running git show:", err.message);
}
