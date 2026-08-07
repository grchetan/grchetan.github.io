/**
 * Maintainable dataset of blocked terms and abbreviations for both English and Hindi.
 */

// Short abbreviations (length <= 3) that MUST match exactly as standalone tokens
// to avoid false positives in longer common words (e.g., "document" contains "cum", "because" contains "bc").
export const SHORT_BANNED_WORDS = [
  "mc",
  "bc",
  "bkl",
  "chut",
  "gand",
  "lund",
  "wtf"
];

// Longer abusive words that support substring/partial matching
export const BANNED_WORDS = [
  // Hindi Profanity
  "madarchod",
  "maderchod",
  "madrchod",
  "madarchot",
  "bhenchod",
  "behenchod",
  "bsdk",
  "bhosdi",
  "bhosdike",
  "gandu",
  "gaand",
  "lauda",
  "lawda",
  "lavda",
  "randi",
  "raand",
  "harami",
  "haramkhor",
  "kamina",
  "chutiya",
  "chutya",
  "lodu",
  "loda",
  
  // English Profanity
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
  
  // Forbidden platform keywords
  "admin",
  "moderator",
  "system",
  "staff"
];

// Custom regular expression patterns to match specific configurations
export const BANNED_REGEXES = [
  // Matches variations of mc/bc with separators or padding
  /\b[m|b][._\-\s]*[c|k]\b/i,
  // Matches bsdk variations
  /\bb[._\-\s]*s[._\-\s]*d[._\-\s]*k\b/i
];

// Whitelisted words that might otherwise trigger false positives
export const PROFANITY_WHITELIST = [
  "gandhi",
  "document",
  "association",
  "because",
  "mcdonald"
];
