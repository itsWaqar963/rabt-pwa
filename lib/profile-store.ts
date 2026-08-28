import { getFilterLabel } from "@/lib/discovery-filters";
import {
  EMPTY_SOCIAL_URLS,
  normalizeSocialUrls,
  trimSocialUrls,
  type SocialUrls,
} from "@/lib/social-links";

export const PROFILE_KEY = "rabt_profile";

export type { SocialUrls };

export type ProfileGender = "" | "man" | "woman" | "prefer-not";
export type ProfileAgeGroup = "" | "18-22" | "23-27" | "28-32" | "33+";

export type ProfileData = {
  name: string;
  initial: string;
  subline: string;
  isImsStudent: boolean;
  isSourceCodeAcademia: boolean;
  activeIntent: string;
  skills: string[];
  socialUrls: SocialUrls;
  introvertExtrovert: number;
  xp: number;
  gender: ProfileGender;
  ageGroup: ProfileAgeGroup;
  city: string;
  country: string;
};

export const DEFAULT_PROFILE: ProfileData = {
  name: "",
  initial: "?",
  subline: "",
  isImsStudent: false,
  isSourceCodeAcademia: false,
  activeIntent: "",
  skills: [],
  socialUrls: { ...EMPTY_SOCIAL_URLS },
  introvertExtrovert: 5,
  xp: 0,
  gender: "",
  ageGroup: "",
  city: "",
  country: "",
};

export const PROFILE_GENDER_OPTIONS: { value: ProfileGender; label: string }[] =
  [
    { value: "man", label: "Man" },
    { value: "woman", label: "Woman" },
    { value: "prefer-not", label: "Prefer not to say" },
  ];

export const PROFILE_AGE_GROUP_OPTIONS: {
  value: ProfileAgeGroup;
  label: string;
}[] = [
  { value: "18-22", label: "18–22" },
  { value: "23-27", label: "23–27" },
  { value: "28-32", label: "28–32" },
  { value: "33+", label: "33+" },
];

const UNSET_LABEL = "—";

export function parseProfileGender(raw: unknown): ProfileGender {
  if (raw === "man" || raw === "woman" || raw === "prefer-not") return raw;
  return "";
}

export function parseProfileAgeGroup(raw: unknown): ProfileAgeGroup {
  if (
    raw === "18-22" ||
    raw === "23-27" ||
    raw === "28-32" ||
    raw === "33+"
  ) {
    return raw;
  }
  return "";
}

export function profileGenderLabel(gender: ProfileGender): string {
  switch (gender) {
    case "man":
      return "Man";
    case "woman":
      return "Woman";
    case "prefer-not":
      return "Prefer not to say";
    case "":
      return UNSET_LABEL;
    default: {
      const _exhaustive: never = gender;
      return _exhaustive;
    }
  }
}

export function profileAgeGroupLabel(ageGroup: ProfileAgeGroup): string {
  switch (ageGroup) {
    case "18-22":
      return "18–22";
    case "23-27":
      return "23–27";
    case "28-32":
      return "28–32";
    case "33+":
      return "33+";
    case "":
      return UNSET_LABEL;
    default: {
      const _exhaustive: never = ageGroup;
      return _exhaustive;
    }
  }
}

export function profilePlaceLabel(
  key: "city" | "country",
  value: string,
): string {
  if (!value) return UNSET_LABEL;
  return getFilterLabel(key, value);
}

export function clusterSignalItems(profile: ProfileData): {
  label: string;
  value: string;
}[] {
  return [
    { label: "City", value: profilePlaceLabel("city", profile.city) },
    { label: "Country", value: profilePlaceLabel("country", profile.country) },
    { label: "Gender", value: profileGenderLabel(profile.gender) },
    { label: "Age group", value: profileAgeGroupLabel(profile.ageGroup) },
  ];
}

const LATIN_LETTER = /[A-Za-z]/;

function parseXp(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 0;
  return Math.max(0, Math.round(raw));
}

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
    return {
      name: rawName,
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
      isSourceCodeAcademia:
        typeof row.isSourceCodeAcademia === "boolean"
          ? row.isSourceCodeAcademia
          : DEFAULT_PROFILE.isSourceCodeAcademia,
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
      xp: parseXp(row.xp),
      gender: parseProfileGender(row.gender),
      ageGroup: parseProfileAgeGroup(row.ageGroup),
      city: typeof row.city === "string" ? row.city : DEFAULT_PROFILE.city,
      country:
        typeof row.country === "string"
          ? row.country
          : DEFAULT_PROFILE.country,
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
