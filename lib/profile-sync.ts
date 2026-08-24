import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  normalizeSocialUrls,
  trimSocialUrls,
  type SocialUrls,
} from "@/lib/social-links";
import {
  parseProfileAgeGroup,
  parseProfileGender,
  type ProfileData,
} from "@/lib/profile-store";

export type AuthProfileUser = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
};

export type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  active_intent: string | null;
  skills: string[] | null;
  social_urls: unknown;
  introvert_extrovert: number | null;
  subline: string | null;
  is_ims_student: boolean | null;
  gender: string | null;
  age_group: string | null;
  city: string | null;
  country: string | null;
  updated_at: string | null;
};

const PROFILE_COLUMNS =
  "id, full_name, email, avatar_url, active_intent, skills, social_urls, introvert_extrovert, subline, is_ims_student, gender, age_group, city, country, updated_at";

function clampScore(score: number): number {
  return Math.min(10, Math.max(1, Math.round(score)));
}

function logRemoteError(scope: string, error: unknown): void {
  console.error(`[profile-sync] ${scope}`, error);
}

export function mergeRemoteEditable(
  local: ProfileData,
  row: ProfileRow,
): ProfileData {
  const skills = Array.isArray(row.skills)
    ? row.skills.filter((item): item is string => typeof item === "string")
    : local.skills;
  const socialUrls: SocialUrls =
    row.social_urls != null
      ? normalizeSocialUrls(row.social_urls)
      : local.socialUrls;

  return {
    ...local,
    activeIntent:
      typeof row.active_intent === "string"
        ? row.active_intent
        : local.activeIntent,
    skills,
    socialUrls,
    introvertExtrovert:
      typeof row.introvert_extrovert === "number"
        ? clampScore(row.introvert_extrovert)
        : local.introvertExtrovert,
    subline: typeof row.subline === "string" ? row.subline : local.subline,
    isImsStudent:
      typeof row.is_ims_student === "boolean"
        ? row.is_ims_student
        : local.isImsStudent,
    gender:
      typeof row.gender === "string"
        ? parseProfileGender(row.gender)
        : local.gender,
    ageGroup:
      typeof row.age_group === "string"
        ? parseProfileAgeGroup(row.age_group)
        : local.ageGroup,
    city: typeof row.city === "string" ? row.city : local.city,
    country: typeof row.country === "string" ? row.country : local.country,
  };
}

export async function upsertProfileFromAuth(
  user: AuthProfileUser,
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: user.name,
        email: user.email ?? null,
        avatar_url: user.avatarUrl ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) logRemoteError("upsertProfileFromAuth", error);
  } catch (error) {
    logRemoteError("upsertProfileFromAuth", error);
  }
}

/** `null` = no row. Throws after logging on network / missing-table errors. */
export async function fetchProfileRow(
  userId: string,
): Promise<ProfileRow | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return (data as ProfileRow | null) ?? null;
  } catch (error) {
    logRemoteError("fetchProfileRow", error);
    throw error;
  }
}

export async function saveProfileRemote(
  userId: string,
  profile: ProfileData,
  identity?: Pick<AuthProfileUser, "email" | "avatarUrl" | "name">,
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const payload: Record<string, unknown> = {
      id: userId,
      full_name: identity?.name ?? profile.name,
      active_intent: profile.activeIntent,
      skills: profile.skills,
      social_urls: trimSocialUrls(profile.socialUrls),
      introvert_extrovert: clampScore(profile.introvertExtrovert),
      subline: profile.subline,
      is_ims_student: profile.isImsStudent,
      gender: profile.gender,
      age_group: profile.ageGroup,
      city: profile.city,
      country: profile.country,
      updated_at: new Date().toISOString(),
    };
    if (identity?.email !== undefined) payload.email = identity.email ?? null;
    if (identity?.avatarUrl !== undefined) {
      payload.avatar_url = identity.avatarUrl ?? null;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });
    if (error) logRemoteError("saveProfileRemote", error);
  } catch (error) {
    logRemoteError("saveProfileRemote", error);
  }
}
