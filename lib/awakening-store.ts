import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const AWAKENING_COMPLETE_KEY = "rabt_awakening_complete";

export function isAwakeningCompleteLocal(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(AWAKENING_COMPLETE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markAwakeningCompleteLocal(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AWAKENING_COMPLETE_KEY, "true");
  } catch {
    /* private mode / quota */
  }
}

/** Pull remote completion into localStorage (e.g. after login on new device). */
export async function syncAwakeningFromRemote(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("awakening_completed_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.info("[awakening] remote sync soft-fail", error.message);
      return false;
    }

    const completed = Boolean(
      data &&
        typeof data === "object" &&
        "awakening_completed_at" in data &&
        data.awakening_completed_at,
    );

    if (completed) {
      markAwakeningCompleteLocal();
      return true;
    }
    return false;
  } catch (err) {
    console.info("[awakening] remote sync soft-fail", err);
    return false;
  }
}

/** Persist completion to profile when authenticated. */
export async function persistAwakeningRemote(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;
  const now = new Date().toISOString();
  try {
    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        awakening_completed_at: now,
        updated_at: now,
      },
      { onConflict: "id" },
    );
    if (error) {
      console.info("[awakening] remote persist soft-fail", error.message);
    }
  } catch (err) {
    console.info("[awakening] remote persist soft-fail", err);
  }
}

/** Local + optional remote when user id known. */
export function markAwakeningComplete(userId?: string | null): void {
  markAwakeningCompleteLocal();
  if (userId) {
    void persistAwakeningRemote(userId);
  }
}
