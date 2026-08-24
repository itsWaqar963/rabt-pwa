import type { NextRequest } from "next/server";

/**
 * Resolve public app origin for absolute deep-links (Web Push / openWindow).
 * Prefer NEXT_PUBLIC_APP_URL, then request Origin / forwarded host, then VERCEL_URL.
 */
export function resolveAppOrigin(req?: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (req) {
    const origin = req.headers.get("origin")?.trim();
    if (origin) return origin.replace(/\/$/, "");

    const host =
      req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      req.headers.get("host")?.trim();
    if (host) {
      const proto =
        req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
      return `${proto}://${host}`.replace(/\/$/, "");
    }
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  return "";
}

/** Absolute origin required for Web Push deep-links (PWA closed). Logs when missing. */
export function requireAbsoluteAppOrigin(req?: NextRequest): string {
  const origin = resolveAppOrigin(req);
  if (!origin) {
    console.error(
      "[app-url] NEXT_PUBLIC_APP_URL unset — push deep-links may fail. Set to your Vercel URL.",
    );
  }
  return origin;
}

/** Absolute `/meetups?chat=` URL when origin known; otherwise relative path. */
export function absoluteMeetupChatUrl(
  meetupId: string,
  req?: NextRequest,
): string {
  const path = `/meetups?chat=${encodeURIComponent(meetupId)}`;
  const origin = requireAbsoluteAppOrigin(req);
  return origin ? `${origin}${path}` : path;
}

/** If url is relative, prefix with app origin; leave absolute URLs unchanged. */
export function ensureAbsoluteUrl(
  url: string | undefined,
  req?: NextRequest,
  fallbackPath = "/meetups",
): string {
  const raw = (url?.trim() || fallbackPath).trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  const origin = resolveAppOrigin(req);
  return origin ? `${origin}${path}` : path;
}
