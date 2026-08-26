import { NextRequest, NextResponse } from "next/server";
import { ONLINE_THRESHOLD_MS } from "@/lib/presence";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import {
  getPushErrorStatus,
  isWebPushConfigured,
  sendPushToSubscription,
  type PushSubscriptionJSON,
} from "@/lib/web-push-server";

const BATCH_SIZE = 20;

type BroadcastTarget = "all" | "active";

type BroadcastBody = {
  title?: unknown;
  body?: unknown;
  target?: unknown;
  broadcastId?: unknown;
  url?: unknown;
};

function authorizeAdminBroadcast(req: NextRequest): boolean {
  const secret = process.env.ADMIN_BROADCAST_SECRET?.trim();
  if (!secret) {
    console.error("[admin-broadcast] ADMIN_BROADCAST_SECRET not set");
    return false;
  }

  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ") && bearer.slice(7).trim() === secret) {
    return true;
  }

  const headerSecret = req.headers
    .get("x-rabt-admin-broadcast-secret")
    ?.trim();
  return headerSecret === secret;
}

function parseTarget(raw: unknown): BroadcastTarget | null {
  if (raw === "all" || raw === "active") return raw;
  return null;
}

async function loadSubscriptions(
  target: BroadcastTarget,
): Promise<{ id: string; subscription_json: unknown }[]> {
  const admin = getSupabaseAdmin();

  switch (target) {
    case "all": {
      const { data, error } = await admin
        .from("push_subscriptions")
        .select("id, subscription_json");
      if (error) {
        console.error("[admin-broadcast] load all subs", error.message);
        return [];
      }
      return data ?? [];
    }
    case "active": {
      const since = new Date(Date.now() - ONLINE_THRESHOLD_MS).toISOString();
      const { data: profiles, error: profErr } = await admin
        .from("profiles")
        .select("id")
        .gte("last_seen_at", since);
      if (profErr) {
        console.error("[admin-broadcast] load active profiles", profErr.message);
        return [];
      }
      const userIds = (profiles ?? []).map((p) => p.id as string);
      if (userIds.length === 0) return [];

      const { data, error } = await admin
        .from("push_subscriptions")
        .select("id, subscription_json")
        .in("user_id", userIds);
      if (error) {
        console.error("[admin-broadcast] load active subs", error.message);
        return [];
      }
      return data ?? [];
    }
    default: {
      const _exhaustive: never = target;
      void _exhaustive;
      return [];
    }
  }
}

/**
 * POST /api/admin-broadcast
 *
 * Admin app → push fan-out. Header: Authorization: Bearer ${ADMIN_BROADCAST_SECRET}
 * or x-rabt-admin-broadcast-secret: ${ADMIN_BROADCAST_SECRET}
 */
export async function POST(req: NextRequest) {
  try {
    if (!authorizeAdminBroadcast(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isWebPushConfigured()) {
      return NextResponse.json(
        { error: "vapid_not_configured" },
        { status: 503 },
      );
    }

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        { error: "admin_not_configured" },
        { status: 503 },
      );
    }

    let json: BroadcastBody;
    try {
      json = (await req.json()) as BroadcastBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const title =
      typeof json.title === "string" ? json.title.trim() : "";
    const body =
      typeof json.body === "string" ? json.body.trim() : "";
    const target = parseTarget(json.target ?? "all");
    const broadcastId =
      typeof json.broadcastId === "string" && json.broadcastId.trim()
        ? json.broadcastId.trim()
        : undefined;
    const url =
      typeof json.url === "string" && json.url.trim()
        ? json.url.trim()
        : "/discover";

    if (!title || !body) {
      return NextResponse.json(
        { error: "title and body required" },
        { status: 400 },
      );
    }
    if (!target) {
      return NextResponse.json(
        { error: "target must be all|active" },
        { status: 400 },
      );
    }

    const rows = await loadSubscriptions(target);
    const admin = getSupabaseAdmin();
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (row) => {
          try {
            await sendPushToSubscription(
              row.subscription_json as PushSubscriptionJSON,
              {
                title,
                body,
                url,
                kind: "broadcast",
                broadcastId,
              },
            );
            return "sent" as const;
          } catch (err) {
            const status = getPushErrorStatus(err);
            if (status === 404 || status === 410) {
              try {
                await admin.from("push_subscriptions").delete().eq("id", row.id);
              } catch (deleteErr) {
                console.error("[admin-broadcast] prune subscription", deleteErr);
              }
            }
            return "failed" as const;
          }
        }),
      );
      for (const r of results) {
        if (r === "sent") sent += 1;
        else failed += 1;
      }
    }

    if (broadcastId) {
      try {
        await admin
          .from("broadcasts")
          .update({ push_sent: sent, push_failed: failed })
          .eq("id", broadcastId);
      } catch (updErr) {
        console.error("[admin-broadcast] update counters", updErr);
      }
    }

    console.info("[admin-broadcast] dispatch", {
      target,
      broadcastId,
      subscriptions: rows.length,
      sent,
      failed,
    });

    return NextResponse.json({ sent, failed });
  } catch (err) {
    console.error("[admin-broadcast]", err);
    return NextResponse.json({ error: "push_error" }, { status: 500 });
  }
}
