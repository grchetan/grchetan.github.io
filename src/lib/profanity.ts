import { BANNED_WORDS, SHORT_BANNED_WORDS, BANNED_REGEXES, PROFANITY_WHITELIST } from "../data/profanity-dict";

/**
 * Normalization Pipeline:
 * 1. Normalize Unicode characters (decompose and remove accents/diacritics).
 * 2. Convert to lowercase.
 * 3. Convert leetspeak characters (e.g. 0 -> o, @ -> a).
 * 4. Remove punctuation, underscores, dots, hyphens, and special characters.
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
    "$": "s",
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
      tmp[i][j] =
        a[i - 1] === b[j - 1]
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
 * Uses word boundaries to avoid false positives on legitimate multi-word names
 * (e.g. "Samiran Das" doesn't falsely trigger on "rand").
 */
export function isProfane(text: string): boolean {
  if (!text) return false;

  const trimmedLower = text.toLowerCase().trim();

  // Full string whitelist check
  if (PROFANITY_WHITELIST.includes(trimmedLower)) {
    return false;
  }

  // 1. Direct Regex match on raw text (e.g. for mc, bc with symbols/spaces)
  for (const regex of BANNED_REGEXES) {
    if (regex.test(text)) {
      return true;
    }
  }

  // 2. Token-level check: test each word individually to respect word boundaries
  const tokens = trimmedLower.split(/[\s._\-]+/);
  for (const token of tokens) {
    if (!token) continue;
    if (PROFANITY_WHITELIST.includes(token)) continue;

    const normToken = normalizeText(token);

    // Exact match on short banned words
    for (const word of SHORT_BANNED_WORDS) {
      if (normToken === normalizeText(word)) {
        return true;
      }
    }

    // Exact and substring match on longer abusive words within this specific token
    for (const word of BANNED_WORDS) {
      const normWord = normalizeText(word);
      if (normToken === normWord) {
        return true;
      }
      // Substring match within the token only (word length >= 4)
      if (normWord.length >= 4 && normToken.includes(normWord)) {
        return true;
      }
    }
  }

  // 3. Full text check for spaced-out single insults (e.g. "m a d a r c h o d" or "f u c k")
  const normalizedInput = normalizeText(text);

  // Exact match against full normalized text
  for (const word of BANNED_WORDS) {
    const normWord = normalizeText(word);
    if (normalizedInput === normWord) {
      return true;
    }
  }
  for (const word of SHORT_BANNED_WORDS) {
    const normWord = normalizeText(word);
    if (normalizedInput === normWord) {
      return true;
    }
  }

  // 4. Fuzzy Matching on single words (similarity >= 90%)
  for (const word of BANNED_WORDS) {
    const normWord = normalizeText(word);
    if (Math.abs(normalizedInput.length - normWord.length) <= 1) {
      const similarity = getSimilarity(normalizedInput, normWord);
      if (similarity >= 0.90) {
        return true;
      }
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
  const spaced = name
    .replace(/([a-z\u00C0-\u024F])([A-Z\u00C0-\u024F])/g, "$1 $2")
    .replace(/([A-Z\u00C0-\u024F]+)([A-Z\u00C0-\u024F][a-z\u00C0-\u024F])/g, "$1 $2")
    .trim();
  if (isProfane(spaced)) {
    return "Blocked User";
  }
  return spaced;
}
