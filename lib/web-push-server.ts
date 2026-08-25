import webpush from "web-push";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  meetupId?: string;
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
      TTL: 60 * 60,
      urgency: "high",
      topic: payload.meetupId ? `rabt-${payload.meetupId}`.slice(0, 32) : undefined,
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
