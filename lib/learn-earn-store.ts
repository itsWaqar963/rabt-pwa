import { SEED_LESSONS, type LearnLesson } from "@/lib/learn-earn-lessons";

export const COMPLETED_KEY = "rabt_learn_completed";

/** @deprecated Re-export for UI; source of truth is Supabase lesson_submissions. */
export type { LessonContribution } from "@/lib/moderation-sync";

function parseStringArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function loadCompletedIds(): string[] {
  if (typeof window === "undefined") return [];
  return parseStringArray(localStorage.getItem(COMPLETED_KEY));
}

export function saveCompletedIds(ids: string[]): void {
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(ids));
}

export function extractYoutubeId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (shortMatch?.[1]) return shortMatch[1];
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (watchMatch?.[1]) return watchMatch[1];
  const shortsMatch = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]{6,})/);
  if (shortsMatch?.[1]) return shortsMatch[1];
  if (/^[a-zA-Z0-9_-]{6,}$/.test(trimmed)) return trimmed;
  return null;
}

export function getAllLessons(): LearnLesson[] {
  return SEED_LESSONS;
}

export function splitLessons(completedIds: ReadonlySet<string>): {
  pending: LearnLesson[];
  completed: LearnLesson[];
} {
  const pending: LearnLesson[] = [];
  const completed: LearnLesson[] = [];
  for (const lesson of SEED_LESSONS) {
    if (completedIds.has(lesson.id)) completed.push(lesson);
    else pending.push(lesson);
  }
  return { pending, completed };
}
