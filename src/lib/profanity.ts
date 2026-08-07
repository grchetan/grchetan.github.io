import { BANNED_WORDS, SHORT_BANNED_WORDS, BANNED_REGEXES, PROFANITY_WHITELIST } from "../data/profanity-dict";

/**
 * Normalization Pipeline:
 * 1. Normalize Unicode characters (decompose and remove accents/diacritics).
 * 2. Convert to lowercase.
 * 3. Convert leetspeak characters (e.g. 0 -> o, @ -> a).
 * 4. Remove spaces, punctuation, underscores, dots, hyphens, and all special characters.
 * 5. Compress consecutive repeated characters to a single letter.
 */
export function normalizeText(text: string): string {
  if (!text) return "";

  // 1. Unicode decomposition and diacritics removal
  let normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 2. Ignore case
  normalized = normalized.toLowerCase();

  // 3. Convert leetspeak (run before stripping symbols so @ and $ are caught)
  const leetMap: Record<string, string> = {
    "0": "o",
    "1": "i",
    "3": "e",
    "4": "a",
    "5": "s",
    "7": "t",
    "@": "a",
    "$": "s"
  };

  let leetClean = "";
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    leetClean += leetMap[char] || char;
  }
  normalized = leetClean;

  // 4. Keep only letters and numbers (using unicode properties to support Hindi letters)
  normalized = normalized.replace(/[^\p{L}\p{N}]/gu, "");

  // 5. Compress repeated letters (e.g., maaadarchooood -> madarchod)
  normalized = normalized.replace(/(.)\1+/g, "$1");

  return normalized;
}

/**
 * Calculates the Levenshtein distance between two strings.
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = a[i - 1] === b[j - 1] 
        ? tmp[i - 1][j - 1] 
        : Math.min(tmp[i - 1][j - 1] + 1, tmp[i][j - 1] + 1, tmp[i - 1][j] + 1);
    }
  }
  return tmp[a.length][b.length];
}

/**
 * Calculates similarity coefficient (0 to 1) based on Levenshtein distance.
 */
export function getSimilarity(a: string, b: string): number {
  const distance = getLevenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1.0;
  return 1.0 - distance / maxLength;
}

/**
 * Checks if a given text contains profane or abusive words (English & Hindi).
 */
export function isProfane(text: string): boolean {
  if (!text) return false;

  const trimmedLower = text.toLowerCase().trim();

  // Whitelist check
  if (PROFANITY_WHITELIST.includes(trimmedLower)) {
    return false;
  }

  // 1. Direct Regex match on raw text (e.g. for mc, bc with symbols/spaces)
  for (const regex of BANNED_REGEXES) {
    if (regex.test(text)) {
      return true;
    }
  }

  // 2. Normalize input text
  const normalizedInput = normalizeText(text);

  // 3. Exact matching and Substring matching
  for (const word of BANNED_WORDS) {
    const normalizedWord = normalizeText(word);

    // Exact Match
    if (normalizedInput === normalizedWord) {
      return true;
    }

    // Partial/Substring Match: only for words > 3 chars to prevent false positives
    if (normalizedWord.length > 3 && normalizedInput.includes(normalizedWord)) {
      return true;
    }
  }

  // 4. Short words token check (e.g. mc, bc, chut)
  const cleanTokens = trimmedLower.split(/[\s._\-]+/);
  for (const word of SHORT_BANNED_WORDS) {
    const normalizedWord = normalizeText(word);

    // Exact Match on normalized version
    if (normalizedInput === normalizedWord) {
      return true;
    }

    // Standalone token match on clean tokens
    if (cleanTokens.includes(normalizedWord)) {
      return true;
    }
  }

  // 5. Fuzzy Matching (similarity >= 90%)
  for (const word of BANNED_WORDS) {
    const normalizedWord = normalizeText(word);

    // Optimize: skip fuzzy check if length difference is too large
    if (Math.abs(normalizedInput.length - normalizedWord.length) > 2) {
      continue;
    }

    const similarity = getSimilarity(normalizedInput, normalizedWord);
    if (similarity >= 0.90) {
      return true;
    }
  }

  return false;
}

/**
 * Sanitizes profane usernames shown on leaderboards.
 * If the username is profane, returns "Blocked User", otherwise returns the original name.
 */
export function sanitizeName(name: string): string {
  if (!name) return "Anonymous";
  if (isProfane(name)) {
    return "Blocked User";
  }
  return name;
}
