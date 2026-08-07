import { isProfane, normalizeText, sanitizeName } from "../src/lib/profanity.js";

// Mock the imports in Node environment since we're using ES modules
const testCases = [
  // User spec list for madarchod variations
  "madarchod",
  "maadarchod",
  "maaadarchod",
  "maderchod",
  "madrchod",
  "madarchot",
  "m@d4rch0d",
  "m.a.d.a.r.c.h.o.d",
  "m a d a r c h o d",
  "madar_chod",
  "madar-chod",
  "MADARCHOD",
  "MaDaRcHoD",

  // Hindi profanities & abbreviations
  "mc",
  "bc",
  "bsdk",
  "bkl",
  "bhosdi",
  "bhosdike",
  "gandu",
  "gaand",
  "gand",
  "lund",
  "lauda",
  "lawda",
  "lavda",
  "randi",
  "harami",
  "haramkhor",
  "kamina",
  "chutiya",
  "chut",

  // English profanities
  "fuck",
  "fucker",
  "fucking",
  "shit",
  "bitch",
  "asshole",
  "nigger",
  "nigga",
  "pussy",
  "slut",
  "whore",
  "cunt",
  "dick",
  "bastard",

  // Fuzzy match case (similarity >= 90%)
  "madarchoda", // distance 1 from madarchod (length 10) -> 90% similarity

  // Clean names (MUST NOT be blocked)
  "Chetan",
  "Gaurav",
  "McAllister",
  "document",
  "because",
  "mcdonald",
  "gandhi"
];

console.log("=== RUNNING PROFANITY FILTER UNIT TESTS ===");
let passed = 0;
let failed = 0;

for (const text of testCases) {
  const result = isProfane(text);
  const isClean = ["Chetan", "Gaurav", "McAllister", "document", "because", "mcdonald", "gandhi"].includes(text);
  
  // A test passes if profane input is blocked OR clean input is allowed
  const success = isClean ? !result : result;

  if (success) {
    console.log(`[PASS] "${text}" -> ${result ? "BLOCKED" : "ALLOWED"}`);
    passed++;
  } else {
    console.error(`[FAIL] "${text}" -> expected ${isClean ? "ALLOWED" : "BLOCKED"}, got ${result ? "BLOCKED" : "ALLOWED"}`);
    failed++;
  }
}

console.log(`\n=== TEST SUMMARY ===`);
console.log(`PASSED: ${passed}/${testCases.length}`);
console.log(`FAILED: ${failed}/${testCases.length}`);

// Test Leaderboard Sanitization
console.log(`\n=== LEADERBOARD SANITIZATION TEST ===`);
console.log(`"Chetan" -> sanitized: "${sanitizeName("Chetan")}"`);
console.log(`"madar-chod" -> sanitized: "${sanitizeName("madar-chod")}"`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
