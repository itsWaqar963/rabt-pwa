import { NextRequest, NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth-api";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import {
  getPushErrorStatus,
  isWebPushConfigured,
  sendPushToSubscription,
  type PushSubscriptionJSON,
} from "@/lib/web-push-server";

type SendPushBody = {
  userId?: string;
  title?: string;
  body?: string;
  url?: string;
  meetupId?: string;
};

async function sendToUserSubscriptions(
  userId: string,
  payload: { title: string; body: string; url?: string; meetupId?: string },
): Promise<{ sent: number; failed: number }> {
  const admin = getSupabaseAdmin();
  const { data: rows, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, subscription_json")
    .eq("user_id", userId);

  if (error || !rows?.length) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const sub = row.subscription_json as PushSubscriptionJSON;
    try {
      await sendPushToSubscription(sub, payload);
      sent += 1;
    } catch (err) {
      failed += 1;
      const status = getPushErrorStatus(err);
      if (status === 404 || status === 410) {
        await admin.from("push_subscriptions").delete().eq("id", row.id);
      }
    }
  }

  return { sent, failed };
}

/**
 * POST /api/send-push
 * Body: { userId, title, body, url?, meetupId? }
 * Header: Authorization: Bearer <access_token>
 */
export async function POST(req: NextRequest) {
  const auth = await getUserFromBearer(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isWebPushConfigured()) {
    return NextResponse.json({ error: "VAPID not configured" }, { status: 503 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Server push store not configured" },
      { status: 503 },
    );
  }

  let body: SendPushBody;
  try {
    body = (await req.json()) as SendPushBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = body.userId?.trim();
  const title = body.title?.trim();
  const text = body.body?.trim();

  if (!userId || !title || !text) {
    return NextResponse.json(
      { error: "userId, title, and body required" },
      { status: 400 },
    );
  }

  const result = await sendToUserSubscriptions(userId, {
    title,
    body: text,
    url: body.url,
    meetupId: body.meetupId,
  });

  return NextResponse.json(result);
}
