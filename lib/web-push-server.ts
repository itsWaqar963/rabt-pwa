import webpush from "web-push";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  meetupId?: string;
  /** Unique per message — SW uses for notification tag (avoids collapse). */
  messageId?: string;
  /** Admin announce — SW uses broadcast tag + /discover default. */
  kind?: "broadcast" | "meetup";
  broadcastId?: string;
};

export type PushSubscriptionJSON = {
  endpoint: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

function getVapidConfig(): {
  subject: string;
  publicKey: string;
  privateKey: string;
} | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject =
    process.env.VAPID_SUBJECT?.trim() || "mailto:admin@example.com";
  if (!publicKey || !privateKey) return null;
  return { subject, publicKey, privateKey };
}

export function isWebPushConfigured(): boolean {
  return getVapidConfig() !== null;
}

/** First 8 chars of public VAPID key for mismatch debugging — never log private key. */
export function getVapidPublicKeyPrefix(): string | null {
  const cfg = getVapidConfig();
  if (!cfg) return null;
  return cfg.publicKey.slice(0, 8);
}

/**
 * Normalize DB `subscription_json` to PushSubscriptionJSON.
 * Handles nested `{ subscription: {...} }` and stringified JSON.
 */
export function normalizePushSubscription(
  raw: unknown,
): PushSubscriptionJSON | null {
  let value: unknown = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;

  const obj = value as Record<string, unknown>;
  const nested = obj.subscription;
  if (nested && typeof nested === "object") {
    return normalizePushSubscription(nested);
  }

  const endpoint = typeof obj.endpoint === "string" ? obj.endpoint : "";
  const keys =
    obj.keys && typeof obj.keys === "object"
      ? (obj.keys as { p256dh?: string; auth?: string })
      : undefined;

  if (!endpoint) return null;
  return {
    endpoint,
    expirationTime:
      typeof obj.expirationTime === "number" || obj.expirationTime === null
        ? (obj.expirationTime as number | null)
        : undefined,
    keys,
  };
}

export function endpointHostFromSubscription(
  subscription: PushSubscriptionJSON | null,
): string | null {
  if (!subscription?.endpoint) return null;
  try {
    return new URL(subscription.endpoint).hostname;
  } catch {
    return null;
  }
}

let configured = false;

function ensureVapidConfigured(): boolean {
  if (configured) return true;
  const cfg = getVapidConfig();
  if (!cfg) return false;
  webpush.setVapidDetails(cfg.subject, cfg.publicKey, cfg.privateKey);
  configured = true;
  return true;
}

/**
 * Send a Web Push notification to a PushSubscription JSON object.
 * Throws on hard failures; caller should treat statusCode 410 as gone.
 */
export async function sendPushToSubscription(
  subscription: PushSubscriptionJSON,
  payload: PushPayload,
): Promise<void> {
  if (!ensureVapidConfigured()) {
    throw new Error("VAPID keys not configured");
  }
  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    throw new Error("Invalid push subscription");
  }

  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    },
    JSON.stringify(payload),
    {
      // No `topic` — FCM/web-push topic collapses consecutive pushes per key.
      TTL: 60 * 60,
      urgency: "high",
    },
  );
}

export function getPushErrorStatus(err: unknown): number | null {
  if (
    err &&
    typeof err === "object" &&
    "statusCode" in err &&
    typeof (err as { statusCode: unknown }).statusCode === "number"
  ) {
    return (err as { statusCode: number }).statusCode;
  }
  return null;
}

export function getPushErrorBody(err: unknown): string | undefined {
  if (!err || typeof err !== "object" || !("body" in err)) return undefined;
  const body = (err as { body: unknown }).body;
  if (typeof body === "string") return body.slice(0, 500);
  if (body == null) return undefined;
  try {
    return String(body).slice(0, 500);
  } catch {
    return undefined;
  }
}

export function isInvalidSubscriptionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Invalid push subscription") ||
    msg.includes("missing keys") ||
    (/p256dh|auth/i.test(msg) && /missing|required|invalid/i.test(msg))
  );
}
