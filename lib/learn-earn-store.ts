import {
  DEFAULT_COMPLETED_IDS,
  SEED_LESSONS,
  type LearnLesson,
} from "@/lib/learn-earn-lessons";

export const COMPLETED_KEY = "rabt_learn_completed";
export const CONTRIBUTIONS_KEY = "rabt_learn_contributions";

export type LessonContribution = {
  id: string;
  youtubeUrl: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  status: "pending";
  submittedAt: string;
};

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

function parseContributions(raw: string | null): LessonContribution[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      if (
        typeof row.id !== "string" ||
        typeof row.youtubeUrl !== "string" ||
        typeof row.question !== "string" ||
        !Array.isArray(row.options) ||
        row.options.length !== 4 ||
        typeof row.correctIndex !== "number" ||
        row.status !== "pending" ||
        typeof row.submittedAt !== "string"
      ) {
        return [];
      }
      const options = row.options.filter(
        (o): o is string => typeof o === "string",
      );
      if (options.length !== 4) return [];
      return [
        {
          id: row.id,
          youtubeUrl: row.youtubeUrl,
          question: row.question,
          options: options as [string, string, string, string],
          correctIndex: row.correctIndex,
          status: "pending",
          submittedAt: row.submittedAt,
        },
      ];
    });
  } catch {
    return [];
  }
}

export function loadCompletedIds(): string[] {
  if (typeof window === "undefined") return [...DEFAULT_COMPLETED_IDS];
  const stored = parseStringArray(localStorage.getItem(COMPLETED_KEY));
  if (stored.length === 0) {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(DEFAULT_COMPLETED_IDS));
    return [...DEFAULT_COMPLETED_IDS];
  }
  return stored;
}

export function saveCompletedIds(ids: string[]): void {
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(ids));
}

export function loadContributions(): LessonContribution[] {
  if (typeof window === "undefined") return [];
  return parseContributions(localStorage.getItem(CONTRIBUTIONS_KEY));
}

export function saveContributions(items: LessonContribution[]): void {
  localStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(items));
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
