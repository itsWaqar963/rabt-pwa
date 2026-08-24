import { createClient, type User } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

/**
 * Extract Bearer access token from Authorization header.
 */
export function getBearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

/**
 * Verify JWT via anon client + getUser(token). Returns user or null.
 */
export async function getUserFromBearer(
  req: NextRequest,
): Promise<{ user: User; token: string } | null> {
  const token = getBearerToken(req);
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return null;

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { user: data.user, token };
}
