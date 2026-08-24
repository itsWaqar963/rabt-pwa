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
  name: "Sana Khalid",
  initial: "س",
  subline: "Builder",
  isImsStudent: true,
  activeIntent:
    "Looking for a weekend physical meetup in Lahore|Building a focused study circle for product designers|Open to a quiet coffee and systems conversation",
  skills: ["Video Editing", "Next.js", "UI/UX", "Graphic Design"],
  socialUrls: {
    ...EMPTY_SOCIAL_URLS,
    github: "https://github.com",
    linkedin: "https://linkedin.com",
    website: "https://example.com",
  },
  introvertExtrovert: 7,
};

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
    return {
      name:
        typeof row.name === "string" ? row.name : DEFAULT_PROFILE.name,
      initial:
        typeof row.initial === "string"
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
