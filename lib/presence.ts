import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/** Online if last_seen_at within this window. */
export const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

/** Client heartbeat interval while tab is visible. */
export const PRESENCE_HEARTBEAT_MS = 50 * 1000;

export function isProfileOnline(
  lastSeenAt: string | null | undefined,
  options?: { forceOnline?: boolean },
): boolean {
  if (options?.forceOnline) return true;
  if (!lastSeenAt) return false;
  const t = Date.parse(lastSeenAt);
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= ONLINE_THRESHOLD_MS;
}

export async function touchLastSeen(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;
  try {
    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) {
      console.error("[presence] touchLastSeen", error);
    }
  } catch (error) {
    console.error("[presence] touchLastSeen", error);
  }
}

/** Clear presence so admin Online drops immediately on sign-out. */
export async function clearLastSeen(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        last_seen_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (error) {
      console.error("[presence] clearLastSeen", error);
    }
  } catch (error) {
    console.error("[presence] clearLastSeen", error);
  }
}
