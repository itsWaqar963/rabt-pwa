import { NextRequest, NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth-api";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import type { PushSubscriptionJSON } from "@/lib/web-push-server";

type SubscribeBody = {
  subscription?: PushSubscriptionJSON;
};

/**
 * POST /api/push-subscribe
 * Body: { subscription: PushSubscriptionJSON }
 * Header: Authorization: Bearer <access_token>
 */
export async function POST(req: NextRequest) {
  const auth = await getUserFromBearer(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Server push store not configured" },
      { status: 503 },
    );
  }

  let body: SubscribeBody;
  try {
    body = (await req.json()) as SubscribeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json(
      { error: "Invalid subscription" },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { error } = await admin.from("push_subscriptions").upsert(
    {
      user_id: auth.user.id,
      endpoint: sub.endpoint,
      subscription_json: sub,
      updated_at: now,
    },
    { onConflict: "user_id,endpoint" },
  );

  if (error) {
    console.error("[push-subscribe]", error.message);
    return NextResponse.json({ error: "Upsert failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
