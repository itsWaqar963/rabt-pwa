import { withJwtRetry } from "@/lib/auth-retry";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function fetchApprovedContributionCount(
  userId: string,
): Promise<number> {
  if (!isSupabaseConfigured || !userId) return 0;
  if (typeof navigator !== "undefined" && !navigator.onLine) return 0;

  const result = await withJwtRetry(async () => {
    const { count, error } = await supabase
      .from("lesson_submissions")
      .select("id", { count: "exact", head: true })
      .eq("submitter_id", userId)
      .eq("status", "approved");
    return { data: count, error };
  });

  if (result.error) {
    console.error("[contributions-sync] fetchApprovedContributionCount", result.error);
    return 0;
  }
  return result.data ?? 0;
}

export async function fetchApprovedContributionCounts(
  userIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!isSupabaseConfigured || userIds.length === 0) return counts;
  if (typeof navigator !== "undefined" && !navigator.onLine) return counts;

  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return counts;

  const result = await withJwtRetry(async () => {
    const { data, error } = await supabase
      .from("lesson_submissions")
      .select("submitter_id")
      .eq("status", "approved")
      .in("submitter_id", uniqueIds);
    return { data, error };
  });

  if (result.error || !result.data) {
    console.error("[contributions-sync] fetchApprovedContributionCounts", result.error);
    return counts;
  }

  for (const row of result.data) {
    const id = row.submitter_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}
