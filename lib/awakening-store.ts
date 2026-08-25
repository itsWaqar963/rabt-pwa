import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/** Legacy global key — never treat as complete for a known userId. */
export const AWAKENING_COMPLETE_KEY = "rabt_awakening_complete";
const AWAKENING_GUEST_KEY = "rabt_awakening_complete:guest";

function perUserKey(userId: string): string {
  return `${AWAKENING_COMPLETE_KEY}:${userId}`;
}

/**
 * Per-user local completion. With userId: only that user's key (never legacy
 * global — new accounts must not inherit another user's quiz). Without userId
 * (pre-auth): guest key or legacy global for anonymous quiz continuity.
 */
export function isAwakeningCompleteLocal(userId?: string | null): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (userId) {
      return localStorage.getItem(perUserKey(userId)) === "true";
    }
    return (
      localStorage.getItem(AWAKENING_GUEST_KEY) === "true" ||
      localStorage.getItem(AWAKENING_COMPLETE_KEY) === "true"
    );
  } catch {
    return false;
  }
}

export function markAwakeningCompleteLocal(userId?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (userId) {
      localStorage.setItem(perUserKey(userId), "true");
      return;
    }
    localStorage.setItem(AWAKENING_GUEST_KEY, "true");
    localStorage.setItem(AWAKENING_COMPLETE_KEY, "true");
  } catch {
    /* private mode / quota */
  }
}

/** Pull remote completion into per-user localStorage (e.g. after login on new device). */
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
      markAwakeningCompleteLocal(userId);
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
  markAwakeningCompleteLocal(userId);
  if (userId) {
    void persistAwakeningRemote(userId);
  }
}

/** True if local or remote awakening is done for this user. */
export async function resolveAwakeningComplete(
  userId: string,
): Promise<boolean> {
  if (isAwakeningCompleteLocal(userId)) return true;
  return syncAwakeningFromRemote(userId);
}
