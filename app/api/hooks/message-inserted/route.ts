import { NextRequest, NextResponse } from "next/server";
import { absoluteMeetupChatUrl } from "@/lib/app-url";
import {
  fetchMeetupTitle,
  resolveMeetupRecipientIds,
  sendPushToUser,
} from "@/lib/meetup-push-notify";
import { isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { isWebPushConfigured } from "@/lib/web-push-server";
import {
  extractMessageInsertRecord,
  isMessagesInsertEvent,
} from "@/lib/webhook-payload";

function authorizeWebhook(req: NextRequest): boolean {
  const secret = process.env.PUSH_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("[hooks/message-inserted] PUSH_WEBHOOK_SECRET not set");
    return false;
  }

  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ") && bearer.slice(7).trim() === secret) {
    return true;
  }

  const headerSecret = req.headers.get("x-rabt-webhook-secret")?.trim();
  return headerSecret === secret;
}

/**
 * POST /api/hooks/message-inserted
 *
 * Supabase Dashboard → Database → Webhooks → messages INSERT (async).
 * Header: Authorization: Bearer ${PUSH_WEBHOOK_SECRET}
 *
 * Never blocks client INSERT — runs after commit via Dashboard webhook only.
 */
export async function POST(req: NextRequest) {
  try {
    if (!authorizeWebhook(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isWebPushConfigured()) {
      console.error("[hooks/message-inserted] VAPID keys not configured");
      return NextResponse.json({ skipped: true, reason: "vapid_not_configured" });
    }

    if (!isSupabaseAdminConfigured()) {
      console.error("[hooks/message-inserted] SUPABASE_SERVICE_ROLE_KEY not set");
      return NextResponse.json({ skipped: true, reason: "admin_not_configured" });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!isMessagesInsertEvent(body)) {
      return NextResponse.json({ skipped: true, reason: "not_messages_insert" });
    }

    const record = extractMessageInsertRecord(body);
    const meetupId = record?.meetup_id?.trim();
    const senderId = record?.sender_id?.trim();
    const text = record?.body?.trim();

    if (!meetupId || !senderId || !text) {
      console.error("[hooks/message-inserted] missing fields", {
        meetupId: Boolean(meetupId),
        senderId: Boolean(senderId),
        body: Boolean(text),
      });
      return NextResponse.json(
        { error: "meetup_id, sender_id, and body required" },
        { status: 400 },
      );
    }

    const title = await fetchMeetupTitle(meetupId);
    const url = absoluteMeetupChatUrl(meetupId, req);
    const preview = text.length > 80 ? `${text.slice(0, 77)}...` : text;

    const recipients = await resolveMeetupRecipientIds(meetupId, senderId);

    if (recipients.length === 0) {
      return NextResponse.json({
        sent: 0,
        failed: 0,
        recipients: 0,
        skipped: true,
        reason: "no_recipients",
      });
    }

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

    console.info("[hooks/message-inserted] push dispatch", {
      meetupId,
      recipients: recipients.length,
      sent,
      failed,
      url,
    });

    return NextResponse.json({ sent, failed, recipients: recipients.length, url });
  } catch (err) {
    console.error("[hooks/message-inserted]", err);
    return NextResponse.json({ skipped: true, reason: "push_error" });
  }
}
