import { NextRequest, NextResponse } from "next/server";
import { absoluteMeetupChatUrl } from "@/lib/app-url";
import {
  fetchMeetupTitle,
  resolveMeetupRecipientIds,
  sendPushToUser,
} from "@/lib/meetup-push-notify";
import { isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { isWebPushConfigured } from "@/lib/web-push-server";

type MessageRecord = {
  id?: string;
  meetup_id?: string;
  sender_id?: string;
  body?: string;
};

type WebhookBody = {
  type?: string;
  table?: string;
  record?: MessageRecord;
  /** Simplified shape also accepted */
  meetup_id?: string;
  sender_id?: string;
  body?: string;
  id?: string;
};

function authorizeWebhook(req: NextRequest): boolean {
  const secret = process.env.PUSH_WEBHOOK_SECRET?.trim();
  if (!secret) return false;

  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ") && bearer.slice(7).trim() === secret) {
    return true;
  }

  const headerSecret = req.headers.get("x-rabt-webhook-secret")?.trim();
  return headerSecret === secret;
}

function extractRecord(body: WebhookBody): MessageRecord | null {
  if (body.record && typeof body.record === "object") {
    return body.record;
  }
  if (body.meetup_id && body.sender_id && body.body) {
    return {
      id: body.id,
      meetup_id: body.meetup_id,
      sender_id: body.sender_id,
      body: body.body,
    };
  }
  return null;
}

/**
 * POST /api/hooks/message-inserted
 *
 * Supabase Database Webhook on `messages` INSERT (or simplified JSON).
 * Auth: Authorization: Bearer ${PUSH_WEBHOOK_SECRET}
 *    or x-rabt-webhook-secret: ${PUSH_WEBHOOK_SECRET}
 *
 * Setup: Dashboard → Database → Webhooks → Create → table `messages`,
 * event INSERT → URL https://<app>/api/hooks/message-inserted
 * → HTTP Header Authorization: Bearer <PUSH_WEBHOOK_SECRET>
 */
export async function POST(req: NextRequest) {
  if (!authorizeWebhook(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isWebPushConfigured() || !isSupabaseAdminConfigured()) {
    return NextResponse.json({ skipped: true, reason: "not_configured" });
  }

  let body: WebhookBody;
  try {
    body = (await req.json()) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const record = extractRecord(body);
  const meetupId = record?.meetup_id?.trim();
  const senderId = record?.sender_id?.trim();
  const text = record?.body?.trim();

  if (!meetupId || !senderId || !text) {
    return NextResponse.json(
      { error: "meetup_id, sender_id, and body required" },
      { status: 400 },
    );
  }

  const title = await fetchMeetupTitle(meetupId);
  const url = absoluteMeetupChatUrl(meetupId, req);
  const preview = text.length > 80 ? `${text.slice(0, 77)}...` : text;

  const recipients = await resolveMeetupRecipientIds(meetupId, senderId);
  let sent = 0;
  let failed = 0;

  for (const userId of recipients) {
    const result = await sendPushToUser(userId, {
      title,
      body: preview,
      url,
      meetupId,
    });
    sent += result.sent;
    failed += result.failed;
  }

  return NextResponse.json({ sent, failed, recipients: recipients.length });
}
