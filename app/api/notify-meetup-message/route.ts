import { NextRequest, NextResponse } from "next/server";
import { absoluteMeetupChatUrl, ensureAbsoluteUrl } from "@/lib/app-url";
import { getUserFromBearer } from "@/lib/auth-api";
import {
  resolveMeetupRecipientIds,
  sendPushToUser,
} from "@/lib/meetup-push-notify";
import { isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { isWebPushConfigured } from "@/lib/web-push-server";

type NotifyBody = {
  meetupId?: string;
  title?: string;
  body?: string;
  url?: string;
  messageId?: string;
};

/**
 * POST /api/notify-meetup-message
 * Body: { meetupId, title, body, url? }
 * Resolves host + accepted requesters (excl. sender) and sends push.
 */
export async function POST(req: NextRequest) {
  try {
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
    const messageId = body.messageId?.trim() || undefined;
    if (!meetupId || !text) {
      return NextResponse.json(
        { error: "meetupId and body required" },
        { status: 400 },
      );
    }

    const url = body.url?.trim()
      ? ensureAbsoluteUrl(
          body.url,
          req,
          `/meetups?chat=${encodeURIComponent(meetupId)}`,
        )
      : absoluteMeetupChatUrl(meetupId, req);

    const recipients = await resolveMeetupRecipientIds(meetupId, auth.user.id);
    let sent = 0;
    let failed = 0;

    for (const userId of recipients) {
      const result = await sendPushToUser(userId, {
        title,
        body: text,
        url,
        meetupId,
        messageId,
      });
      sent += result.sent;
      failed += result.failed;
    }

    return NextResponse.json({ sent, failed, recipients: recipients.length });
  } catch (err) {
    console.error("[notify-meetup-message]", err);
    return NextResponse.json({ skipped: true, reason: "push_error" });
  }
}
