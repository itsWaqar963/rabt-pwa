import { withJwtRetry } from "@/lib/auth-retry";
import type {
  LessonSubmissionInsert,
  LessonSubmissionRow,
  LessonSubmissionStatus,
  MeetupReportInsert,
  MeetupReportRow,
  UserReportInsert,
  UserReportRow,
} from "@/lib/database.types";
import type { HiddenIdsState } from "@/lib/meetup-store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/** Reason stored when user hides a profile or meetup (Report / Hide). */
export const HIDE_REASON = "hidden";

export type LessonContributionInput = {
  youtubeUrl: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
};

export type LessonContribution = {
  id: string;
  youtubeUrl: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  status: LessonSubmissionStatus;
  submittedAt: string;
};

function logRemoteError(scope: string, error: unknown): void {
  console.error(`[moderation-sync] ${scope}`, error);
}

function parseOptions(raw: unknown): [string, string, string, string] | null {
  if (!Array.isArray(raw) || raw.length !== 4) return null;
  const options = raw.filter((o): o is string => typeof o === "string");
  if (options.length !== 4) return null;
  return options as [string, string, string, string];
}

function rowToContribution(row: LessonSubmissionRow): LessonContribution | null {
  const options = parseOptions(row.options);
  if (!options) return null;
  return {
    id: row.id,
    youtubeUrl: row.youtube_url,
    question: row.question,
    options,
    correctIndex: row.correct_index,
    status: row.status,
    submittedAt: row.created_at,
  };
}

export async function submitLessonContribution(
  submitterId: string,
  input: LessonContributionInput,
): Promise<
  { ok: true; contribution: LessonContribution } | { ok: false; error: string }
> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "Cloud sync is not configured." };
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { ok: false, error: "Requires Internet" };
  }

  const payload: LessonSubmissionInsert = {
    youtube_url: input.youtubeUrl,
    question: input.question,
    options: input.options,
    correct_index: input.correctIndex,
    status: "pending",
    submitter_id: submitterId,
  };

  const result = await withJwtRetry(async () => {
    const { data, error } = await supabase
      .from("lesson_submissions")
      .insert(payload)
      .select("*")
      .single();
    return { data: data as LessonSubmissionRow | null, error };
  });

  if (result.error || !result.data) {
    logRemoteError("submitLessonContribution", result.error);
    return { ok: false, error: "Could not submit lesson. Try again." };
  }

  const contribution = rowToContribution(result.data);
  if (!contribution) {
    return { ok: false, error: "Could not submit lesson. Try again." };
  }
  return { ok: true, contribution };
}

export async function fetchMyLessonSubmissions(
  submitterId: string,
): Promise<LessonContribution[]> {
  if (!isSupabaseConfigured) return [];
  if (typeof navigator !== "undefined" && !navigator.onLine) return [];

  const result = await withJwtRetry(async () => {
    const { data, error } = await supabase
      .from("lesson_submissions")
      .select("*")
      .eq("submitter_id", submitterId)
      .order("created_at", { ascending: false });
    return { data: (data as LessonSubmissionRow[] | null) ?? null, error };
  });

  if (result.error || !result.data) {
    logRemoteError("fetchMyLessonSubmissions", result.error);
    return [];
  }

  return result.data.flatMap((row) => {
    const mapped = rowToContribution(row);
    return mapped ? [mapped] : [];
  });
}

export async function fetchMyHiddenIds(
  reporterId: string,
): Promise<HiddenIdsState> {
  const empty: HiddenIdsState = { userIds: [], meetupIds: [] };
  if (!isSupabaseConfigured) return empty;
  if (typeof navigator !== "undefined" && !navigator.onLine) return empty;

  const [usersResult, meetupsResult] = await Promise.all([
    withJwtRetry(async () => {
      const { data, error } = await supabase
        .from("user_reports")
        .select("reported_user_id")
        .eq("reporter_id", reporterId);
      return {
        data:
          (data as Pick<UserReportRow, "reported_user_id">[] | null) ?? null,
        error,
      };
    }),
    withJwtRetry(async () => {
      const { data, error } = await supabase
        .from("meetup_reports")
        .select("meetup_id")
        .eq("reporter_id", reporterId);
      return {
        data: (data as Pick<MeetupReportRow, "meetup_id">[] | null) ?? null,
        error,
      };
    }),
  ]);

  if (usersResult.error) {
    logRemoteError("fetchMyHiddenIds.user_reports", usersResult.error);
  }
  if (meetupsResult.error) {
    logRemoteError("fetchMyHiddenIds.meetup_reports", meetupsResult.error);
  }

  return {
    userIds: (usersResult.data ?? []).map((r) => r.reported_user_id),
    meetupIds: (meetupsResult.data ?? []).map((r) => r.meetup_id),
  };
}

export async function upsertUserReport(
  reporterId: string,
  reportedUserId: string,
  reason: string | null = HIDE_REASON,
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  if (reporterId === reportedUserId) return false;

  const payload: UserReportInsert = {
    reporter_id: reporterId,
    reported_user_id: reportedUserId,
    reason,
  };

  const result = await withJwtRetry(async () => {
    const { error } = await supabase.from("user_reports").upsert(payload, {
      onConflict: "reporter_id,reported_user_id",
      ignoreDuplicates: true,
    });
    return { data: null, error };
  });

  if (result.error) {
    logRemoteError("upsertUserReport", result.error);
    return false;
  }
  return true;
}

export async function upsertMeetupReport(
  reporterId: string,
  meetupId: string,
  reason: string | null = HIDE_REASON,
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;

  const payload: MeetupReportInsert = {
    reporter_id: reporterId,
    meetup_id: meetupId,
    reason,
  };

  const result = await withJwtRetry(async () => {
    const { error } = await supabase.from("meetup_reports").upsert(payload, {
      onConflict: "reporter_id,meetup_id",
      ignoreDuplicates: true,
    });
    return { data: null, error };
  });

  if (result.error) {
    logRemoteError("upsertMeetupReport", result.error);
    return false;
  }
  return true;
}

/** One-time: push legacy localStorage hidden ids into reports tables. */
export async function migrateLocalHiddenIds(
  reporterId: string,
  local: HiddenIdsState,
): Promise<HiddenIdsState> {
  if (!isSupabaseConfigured || !reporterId) return local;

  const remote = await fetchMyHiddenIds(reporterId);
  const remoteUsers = new Set(remote.userIds);
  const remoteMeetups = new Set(remote.meetupIds);

  const pendingUsers = local.userIds.filter(
    (id) => id && id !== reporterId && !remoteUsers.has(id),
  );
  const pendingMeetups = local.meetupIds.filter(
    (id) => id && !remoteMeetups.has(id),
  );

  await Promise.all([
    ...pendingUsers.map((id) => upsertUserReport(reporterId, id, HIDE_REASON)),
    ...pendingMeetups.map((id) =>
      upsertMeetupReport(reporterId, id, HIDE_REASON),
    ),
  ]);

  return fetchMyHiddenIds(reporterId);
}
