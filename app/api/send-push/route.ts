import { NextRequest, NextResponse } from "next/server";
import { absoluteMeetupChatUrl, ensureAbsoluteUrl } from "@/lib/app-url";
import { getUserFromBearer } from "@/lib/auth-api";
import { sendPushToUser } from "@/lib/meetup-push-notify";
import { isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { isWebPushConfigured } from "@/lib/web-push-server";

type SendPushBody = {
  userId?: string;
  title?: string;
  body?: string;
  url?: string;
  meetupId?: string;
};

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

  const meetupId = body.meetupId?.trim();
  const url = meetupId
    ? body.url?.trim()
      ? ensureAbsoluteUrl(body.url, req)
      : absoluteMeetupChatUrl(meetupId, req)
    : ensureAbsoluteUrl(body.url, req);

  const result = await sendPushToUser(userId, {
    title,
    body: text,
    url,
    meetupId,
  });

  return NextResponse.json(result);
}
