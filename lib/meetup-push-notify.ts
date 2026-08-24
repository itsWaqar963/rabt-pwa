import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  getPushErrorStatus,
  sendPushToSubscription,
  type PushSubscriptionJSON,
} from "@/lib/web-push-server";

export async function resolveMeetupRecipientIds(
  meetupId: string,
  senderId: string,
): Promise<string[]> {
  try {
    const admin = getSupabaseAdmin();

    const { data: meetup, error: meetupErr } = await admin
      .from("meetups")
      .select("host_id, title")
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
  } catch (err) {
    console.error("[meetup-push-notify] resolveMeetupRecipientIds", err);
    return [];
  }
}

export async function fetchMeetupTitle(meetupId: string): Promise<string> {
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("meetups")
      .select("title")
      .eq("id", meetupId)
      .maybeSingle();
    const title = typeof data?.title === "string" ? data.title.trim() : "";
    return title || "RABT";
  } catch (err) {
    console.error("[meetup-push-notify] fetchMeetupTitle", err);
    return "RABT";
  }
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string; meetupId?: string },
): Promise<{ sent: number; failed: number }> {
  try {
    const admin = getSupabaseAdmin();
    const { data: rows, error: subErr } = await admin
      .from("push_subscriptions")
      .select("id, subscription_json")
      .eq("user_id", userId);

    if (subErr) {
      console.error("[meetup-push-notify] load subscriptions", subErr.message);
      return { sent: 0, failed: 0 };
    }

    if (!rows?.length) {
      console.info("[meetup-push-notify] no subscriptions for user", userId);
      return { sent: 0, failed: 0 };
    }

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
          try {
            await admin.from("push_subscriptions").delete().eq("id", row.id);
          } catch (deleteErr) {
            console.error("[meetup-push-notify] prune subscription", deleteErr);
          }
        }
      }
    }

    return { sent, failed };
  } catch (err) {
    console.error("[meetup-push-notify] sendPushToUser", err);
    return { sent: 0, failed: 0 };
  }
}
