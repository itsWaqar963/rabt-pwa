import type { LearnLesson } from "@/lib/learn-earn-lessons";

/** @deprecated Re-export for UI; source of truth is Supabase lesson_submissions. */
export type { LessonContribution } from "@/lib/moderation-sync";

export const COMPLETED_KEY = "rabt_learn_completed";

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

export function splitApprovedLessons(
  lessons: ReadonlyArray<LearnLesson>,
  completedIds: ReadonlySet<string>,
): {
  pending: LearnLesson[];
  completed: LearnLesson[];
} {
  const pending: LearnLesson[] = [];
  const completed: LearnLesson[] = [];
  for (const lesson of lessons) {
    if (completedIds.has(lesson.id)) completed.push(lesson);
    else pending.push(lesson);
  }
  return { pending, completed };
}
