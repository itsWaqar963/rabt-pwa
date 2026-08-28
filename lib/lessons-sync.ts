import { withJwtRetry } from "@/lib/auth-retry";
import type { LessonSubmissionRow } from "@/lib/database.types";
import {
  extractYoutubeId,
  type LearnLesson,
} from "@/lib/learn-earn-lessons";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

function parseOptions(raw: unknown): [string, string, string, string] | null {
  if (!Array.isArray(raw) || raw.length !== 4) return null;
  const options = raw.filter((o): o is string => typeof o === "string");
  if (options.length !== 4) return null;
  return options as [string, string, string, string];
}

function lessonTitle(question: string): string {
  const firstLine = question.trim().split("\n")[0]?.trim() ?? "";
  if (!firstLine) return "Lesson";
  return firstLine.length > 60 ? `${firstLine.slice(0, 57)}…` : firstLine;
}

export function submissionRowToLearnLesson(
  row: LessonSubmissionRow,
  contributor?: string | null,
): LearnLesson | null {
  const options = parseOptions(row.options);
  const youtubeId = extractYoutubeId(row.youtube_url);
  if (!options || !youtubeId) return null;
  if (row.correct_index < 0 || row.correct_index > 3) return null;

  const channelTitle =
    row.channel_title?.trim() || "YouTube";
  const channelAvatarUrl = row.channel_avatar_url?.trim() || undefined;

  return {
    id: row.id,
    title: lessonTitle(row.question),
    youtubeId,
    contributor: contributor?.trim() || "Community",
    channelTitle,
    channelAvatarUrl,
    question: row.question,
    options,
    correctIndex: row.correct_index,
  };
}

export async function fetchApprovedLessons(): Promise<LearnLesson[]> {
  if (!isSupabaseConfigured) return [];
  if (typeof navigator !== "undefined" && !navigator.onLine) return [];

  const result = await withJwtRetry(async () => {
    const { data, error } = await supabase
      .from("lesson_submissions")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    return { data: (data as LessonSubmissionRow[] | null) ?? null, error };
  });

  if (result.error || !result.data) {
    console.error("[lessons-sync] fetchApprovedLessons", result.error);
    return [];
  }

  const submitterIds = [
    ...new Set(result.data.map((row) => row.submitter_id)),
  ];
  const contributorById = new Map<string, string>();

  if (submitterIds.length > 0) {
    const profilesResult = await withJwtRetry(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", submitterIds);
      return { data, error };
    });

    if (!profilesResult.error && profilesResult.data) {
      for (const profile of profilesResult.data) {
        const name = profile.full_name;
        if (typeof name === "string" && name.trim()) {
          contributorById.set(profile.id as string, name.trim());
        }
      }
    }
  }

  return result.data.flatMap((row) => {
    const lesson = submissionRowToLearnLesson(
      row,
      contributorById.get(row.submitter_id),
    );
    return lesson ? [lesson] : [];
  });
}
