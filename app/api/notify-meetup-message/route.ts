import { NextRequest, NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth-api";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import {
  getPushErrorStatus,
  isWebPushConfigured,
  sendPushToSubscription,
  type PushSubscriptionJSON,
} from "@/lib/web-push-server";

type NotifyBody = {
  meetupId?: string;
  title?: string;
  body?: string;
  url?: string;
};

async function resolveRecipientIds(
  meetupId: string,
  senderId: string,
): Promise<string[]> {
  const admin = getSupabaseAdmin();

  const { data: meetup, error: meetupErr } = await admin
    .from("meetups")
    .select("host_id")
    .eq("id", meetupId)
    .maybeSingle();

  if (meetupErr || !meetup?.host_id) return [];

  const { data: accepted } = await admin
    .from("join_requests")
    .select("requester_id")
    .eq("meetup_id", meetupId)
    .eq("status", "accepted");

  const ids = new Set<string>();
  ids.add(meetup.host_id as string);
  for (const row of accepted ?? []) {
    if (row.requester_id) ids.add(row.requester_id as string);
  }
  ids.delete(senderId);
  return [...ids];
}

async function sendToUser(
  userId: string,
  payload: { title: string; body: string; url?: string; meetupId?: string },
): Promise<{ sent: number; failed: number }> {
  const admin = getSupabaseAdmin();
  const { data: rows } = await admin
    .from("push_subscriptions")
    .select("id, subscription_json")
    .eq("user_id", userId);

  let sent = 0;
  let failed = 0;

  for (const row of rows ?? []) {
    try {
      await sendPushToSubscription(
        row.subscription_json as PushSubscriptionJSON,
        payload,
      );
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
 * POST /api/notify-meetup-message
 * Body: { meetupId, title, body, url? }
 * Resolves host + accepted requesters (excl. sender) and sends push.
 */
export async function POST(req: NextRequest) {
  const auth = await getUserFromBearer(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isWebPushConfigured() || !isSupabaseAdminConfigured()) {
    return NextResponse.json({ skipped: true, reason: "not_configured" });
  }

  let body: NotifyBody;
  try {
    body = (await req.json()) as NotifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const meetupId = body.meetupId?.trim();
  const title = body.title?.trim() || "RABT";
  const text = body.body?.trim();
  if (!meetupId || !text) {
    return NextResponse.json(
      { error: "meetupId and body required" },
      { status: 400 },
    );
  }

  const url =
    body.url?.trim() || `/meetups?chat=${encodeURIComponent(meetupId)}`;

  const recipients = await resolveRecipientIds(meetupId, auth.user.id);
  let sent = 0;
  let failed = 0;

  for (const userId of recipients) {
    const result = await sendToUser(userId, {
      title,
      body: text,
      url,
      meetupId,
    });
    sent += result.sent;
    failed += result.failed;
  }

  return NextResponse.json({ sent, failed, recipients: recipients.length });
}
