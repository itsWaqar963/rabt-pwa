import { supabase } from "@/lib/supabase";

type ErrorLike = {
  code?: string;
  message?: string;
};

export function isJwtClockSkewError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as ErrorLike;
  if (e.code === "PGRST303") return true;
  const msg = (e.message ?? "").toLowerCase();
  return (
    msg.includes("jwt issued at future") ||
    msg.includes("issued at future") ||
    (msg.includes("jwt") && msg.includes("future"))
  );
}

/**
 * Refresh auth session when PostgREST rejects JWT for clock skew (PGRST303).
 * Returns true if a refresh was attempted successfully.
 */
export async function recoverFromJwtClockSkew(
  error: unknown,
): Promise<boolean> {
  if (!isJwtClockSkewError(error)) return false;

  console.warn("[auth] JWT clock skew detected — refreshing session", {
    code: (error as ErrorLike).code,
    message: (error as ErrorLike).message,
  });

  // Brief pause: device clock slightly ahead of Auth server
  await new Promise((r) => setTimeout(r, 1200));

  const { data, error: refreshErr } = await supabase.auth.refreshSession();
  if (refreshErr || !data.session) {
    console.error("[auth] refreshSession after clock skew failed", refreshErr);
    return false;
  }
  return true;
}

/**
 * Run a Supabase query once; on PGRST303 refresh session and retry once.
 */
export async function withJwtRetry<T>(
  run: () => Promise<{ data: T; error: unknown }>,
): Promise<{ data: T; error: unknown }> {
  const first = await run();
  if (!first.error || !isJwtClockSkewError(first.error)) {
    return first;
  }
  const ok = await recoverFromJwtClockSkew(first.error);
  if (!ok) return first;
  return run();
}
