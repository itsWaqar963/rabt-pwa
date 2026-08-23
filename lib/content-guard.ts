/** Local keyword stubs for Create Meetup free-text screening (demo only). */
export const RESTRICTED_KEYWORDS: readonly string[] = [
  "slut",
  "whore",
  "bitch",
  "bastard",
  "asshole",
  "dickhead",
  "fuck",
  "fucker",
  "fucking",
  "shit",
  "bullshit",
  "piss",
  "cunt",
  "cock",
  "dick",
  "pussy",
  "retard",
  "retarded",
  "nigger",
  "nigga",
  "faggot",
  "fag",
  "dyke",
  "tranny",
  "rape",
  "rapist",
  "molest",
  "pedophile",
  "pedo",
  "kill yourself",
  "kys",
  "suicide",
  "terrorist",
  "bomb threat",
  "shoot up",
  "mass shooting",
  "drug deal",
  "sell drugs",
  "buy drugs",
];

const CONTENT_WARNING =
  "Please keep meetups focused and appropriate.";

export function getContentWarningMessage(): string {
  return CONTENT_WARNING;
}

/** Case-insensitive word-ish match against RESTRICTED_KEYWORDS. */
export function containsRestrictedContent(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return false;

  for (const keyword of RESTRICTED_KEYWORDS) {
    const needle = keyword.toLowerCase();
    if (needle.includes(" ")) {
      if (normalized.includes(needle)) return true;
      continue;
    }
    const pattern = new RegExp(
      `(^|[^a-z0-9])${escapeRegExp(needle)}([^a-z0-9]|$)`,
      "i",
    );
    if (pattern.test(normalized)) return true;
  }
  return false;
}

export function textsContainRestrictedContent(
  ...texts: Array<string | undefined | null>
): boolean {
  return texts.some((t) => t != null && containsRestrictedContent(t));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
