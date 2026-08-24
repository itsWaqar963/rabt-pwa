import {
  EMPTY_SOCIAL_URLS,
  normalizeSocialUrls,
  trimSocialUrls,
  type SocialUrls,
} from "@/lib/social-links";

export const PROFILE_KEY = "rabt_profile";

export type { SocialUrls };

export type ProfileData = {
  name: string;
  initial: string;
  subline: string;
  isImsStudent: boolean;
  activeIntent: string;
  skills: string[];
  socialUrls: SocialUrls;
  introvertExtrovert: number;
};

export const DEFAULT_PROFILE: ProfileData = {
  name: "",
  initial: "?",
  subline: "",
  isImsStudent: false,
  activeIntent: "",
  skills: [],
  socialUrls: { ...EMPTY_SOCIAL_URLS },
  introvertExtrovert: 5,
};

const DUMMY_PROFILE_NAME = "Sana Khalid";
const LATIN_LETTER = /[A-Za-z]/;

/** First letters of up to 2 Latin words; otherwise first character (Arabic / other). */
export function initialsFromName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "?";

  const words = trimmed.split(/\s+/).filter(Boolean);
  const latinInitials: string[] = [];
  for (const word of words) {
    const match = word.match(LATIN_LETTER);
    if (!match) continue;
    latinInitials.push(match[0].toUpperCase());
    if (latinInitials.length >= 2) break;
  }
  if (latinInitials.length > 0) return latinInitials.join("");

  return Array.from(trimmed)[0] ?? "?";
}

export function overlayAuthIdentity(
  profile: ProfileData,
  user: { name: string; email?: string; avatarUrl?: string } | null,
): ProfileData {
  if (!user) return profile;
  return {
    ...profile,
    name: user.name,
    initial: initialsFromName(user.name),
  };
}

function clampScore(score: number): number {
  return Math.min(10, Math.max(1, Math.round(score)));
}

function parseStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string");
}

function parseSocialUrls(raw: unknown): SocialUrls {
  const normalized = normalizeSocialUrls(raw);
  const hasAny = Object.values(normalized).some((v) => v.length > 0);
  if (!hasAny && raw === undefined) {
    return { ...DEFAULT_PROFILE.socialUrls };
  }
  return normalized;
}

function parseProfile(raw: string | null): ProfileData {
  if (!raw) return { ...DEFAULT_PROFILE };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_PROFILE };
    const row = parsed as Record<string, unknown>;
    const rawName =
      typeof row.name === "string" ? row.name : DEFAULT_PROFILE.name;
    const isDummy = rawName === DUMMY_PROFILE_NAME;
    return {
      name: isDummy ? DEFAULT_PROFILE.name : rawName,
      initial: isDummy
        ? DEFAULT_PROFILE.initial
        : typeof row.initial === "string"
          ? row.initial
          : DEFAULT_PROFILE.initial,
      subline:
        typeof row.subline === "string"
          ? row.subline
          : DEFAULT_PROFILE.subline,
      isImsStudent:
        typeof row.isImsStudent === "boolean"
          ? row.isImsStudent
          : DEFAULT_PROFILE.isImsStudent,
      activeIntent:
        typeof row.activeIntent === "string"
          ? row.activeIntent
          : DEFAULT_PROFILE.activeIntent,
      skills: (() => {
        const skills = parseStringArray(row.skills);
        return skills.length > 0 ? skills : [...DEFAULT_PROFILE.skills];
      })(),
      socialUrls: parseSocialUrls(row.socialUrls),
      introvertExtrovert:
        typeof row.introvertExtrovert === "number"
          ? clampScore(row.introvertExtrovert)
          : DEFAULT_PROFILE.introvertExtrovert,
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function loadProfile(): ProfileData {
  if (typeof window === "undefined") return { ...DEFAULT_PROFILE };
  const stored = localStorage.getItem(PROFILE_KEY);
  if (!stored) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
    return { ...DEFAULT_PROFILE };
  }
  return parseProfile(stored);
}

export function saveProfile(profile: ProfileData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify({
      ...profile,
      socialUrls: trimSocialUrls(profile.socialUrls),
      introvertExtrovert: clampScore(profile.introvertExtrovert),
    }),
  );
}

export function parseActiveIntents(activeIntent: string): string[] {
  return activeIntent
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function formatIntentMarquee(activeIntent: string): string {
  const intents = parseActiveIntents(activeIntent);
  if (intents.length === 0) return activeIntent.trim();
  return intents.join("  ·  ");
}

export function parseSkillsInput(input: string): string[] {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}
