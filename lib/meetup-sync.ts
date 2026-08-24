import type { HostedMeetup } from "@/lib/discovery-users";
import {
  formatMeetupWhen,
  isMeetupCategory,
  type CreateMeetupInput,
  type CreatedMeetup,
  type JoinRequestStatus,
  type MeetupCategory,
  type MeetupRequester,
} from "@/lib/meetup-store";
import {
  parseProfileAgeGroup,
  parseProfileGender,
} from "@/lib/profile-store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const HOST_PROFILE_COLS =
  "id, full_name, avatar_url, subline, city, country, gender, age_group, active_intent, skills";

type HostProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  subline: string | null;
  city: string | null;
  country: string | null;
  gender: string | null;
  age_group: string | null;
  active_intent: string | null;
  skills: string[] | null;
};

type MeetupRow = {
  id: string;
  host_id: string;
  title: string;
  category: string | null;
  venue: string | null;
  date: string | null;
  time: string | null;
  max_spots: number | null;
  city: string | null;
  country: string | null;
  description: string | null;
  created_at: string;
  status?: string | null;
  profiles?: HostProfileRow | HostProfileRow[] | null;
};

type JoinRequestRow = {
  id: string;
  meetup_id: string;
  requester_id: string;
  status: string;
  created_at?: string;
  profiles?: HostProfileRow | HostProfileRow[] | null;
};

function logRemoteError(scope: string, error: unknown): void {
  console.error(`[meetup-sync] ${scope}`, error);
}

function asProfile(
  value: HostProfileRow | HostProfileRow[] | null | undefined,
): HostProfileRow | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toCategory(raw: string | null | undefined): MeetupCategory {
  if (raw && isMeetupCategory(raw)) return raw;
  return "Other";
}

function isJoinStatus(value: unknown): value is JoinRequestStatus {
  return value === "pending" || value === "accepted" || value === "declined";
}

function mapGenderToDiscovery(
  raw: string | null | undefined,
): "women" | "men" {
  const g = parseProfileGender(raw);
  switch (g) {
    case "woman":
      return "women";
    case "man":
      return "men";
    case "prefer-not":
    case "":
      return "men";
    default: {
      const _never: never = g;
      return _never;
    }
  }
}

function mapAgeToDiscovery(
  raw: string | null | undefined,
): "18-24" | "25-34" | "35-44" {
  const age = parseProfileAgeGroup(raw);
  switch (age) {
    case "18-22":
      return "18-24";
    case "23-27":
    case "28-32":
      return "25-34";
    case "33+":
      return "35-44";
    case "":
      return "25-34";
    default: {
      const _never: never = age;
      return _never;
    }
  }
}

function initialFromName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0);
}

/** Empty string from PostgREST counts as missing. */
function nonEmptyAvatar(
  url: string | null | undefined,
): string | undefined {
  const trimmed = url?.trim();
  return trimmed ? trimmed : undefined;
}

export function mapMeetupRowToHosted(
  row: MeetupRow,
  profile?: HostProfileRow | null,
): HostedMeetup {
  const host = profile ?? asProfile(row.profiles);
  const category = toCategory(row.category);
  const spots = typeof row.max_spots === "number" ? row.max_spots : 0;
  const date = row.date ?? "";
  const time = row.time ?? "";
  const venue = row.venue?.trim() || "Venue TBA";
  const name = host?.full_name?.trim() || "Host";
  const role = host?.subline?.split(" · ")[0]?.trim() || host?.subline || "Host";

  return {
    id: row.id,
    kind: `Physical gathering · ${category.toLowerCase()}`,
    title: row.title,
    status: `${spots} spots left`,
    description:
      row.description?.trim() ||
      host?.active_intent?.trim() ||
      `${category} meetup at ${venue}.`,
    location: venue,
    when: formatMeetupWhen(date, time),
    organizerName: name,
    organizerRole: role,
    hostUserId: row.host_id,
    spotsLeft: spots,
    city: (row.city || host?.city || "").toLowerCase() || "all",
    country: (row.country || host?.country || "").toLowerCase() || "all",
    source: "remote",
    hostGender: mapGenderToDiscovery(host?.gender),
    hostAgeGroup: mapAgeToDiscovery(host?.age_group),
    hostAvatarUrl: nonEmptyAvatar(host?.avatar_url),
    hostSubline: host?.subline ?? undefined,
    hostIntent: host?.active_intent ?? undefined,
    hostSkills: host?.skills ?? undefined,
    hostInitial: initialFromName(name),
    date,
    time,
    category,
    venue,
    maxSpots: spots,
    descriptionRaw: row.description ?? "",
    createdAt: row.created_at,
  };
}

export function hostedToCreatedMeetup(
  meetup: HostedMeetup,
): CreatedMeetup | null {
  if (!meetup.date || !meetup.time || !meetup.category) return null;
  return {
    id: meetup.id,
    title: meetup.title,
    category: meetup.category,
    venue: meetup.venue ?? meetup.location,
    date: meetup.date,
    time: meetup.time,
    maxSpots: meetup.maxSpots ?? meetup.spotsLeft,
    city: meetup.city,
    country: meetup.country,
    description: meetup.descriptionRaw ?? meetup.description,
    createdAt: meetup.createdAt ?? new Date().toISOString(),
    hostUserId: meetup.hostUserId,
  };
}

async function fetchProfilesByIds(
  ids: string[],
): Promise<Map<string, HostProfileRow>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, HostProfileRow>();
  if (unique.length === 0) return map;

  const { data, error } = await supabase
    .from("profiles")
    .select(HOST_PROFILE_COLS)
    .in("id", unique);

  if (error) {
    logRemoteError("fetchProfilesByIds", error);
    return map;
  }

  for (const row of (data ?? []) as HostProfileRow[]) {
    map.set(row.id, row);
  }
  return map;
}

export async function fetchMeetupsWithHosts(): Promise<HostedMeetup[]> {
  if (!isSupabaseConfigured) return [];

  try {
    // host_id FK targets auth.users, not profiles — embed hints 400 without 009_profiles_fk_for_embeds.
    const { data, error } = await supabase
      .from("meetups")
      .select("*")
      .or("status.eq.open,status.is.null")
      .order("created_at", { ascending: false });

    if (error) {
      logRemoteError("fetchMeetupsWithHosts", error);
      return [];
    }

    const rows = (data ?? []) as MeetupRow[];
    const openRows = rows.filter(
      (row) => !row.status || row.status === "open",
    );

    const profileMap = await fetchProfilesByIds(openRows.map((r) => r.host_id));

    let mapped = openRows.map((row) =>
      mapMeetupRowToHosted(row, profileMap.get(row.host_id) ?? null),
    );

    // Fill stale embeds that have host but no avatar_url
    const gapHostIds = mapped
      .filter((m) => !nonEmptyAvatar(m.hostAvatarUrl))
      .map((m) => m.hostUserId)
      .filter(Boolean);
    if (gapHostIds.length > 0) {
      const gapMap = await fetchProfilesByIds(gapHostIds);
      mapped = mapped.map((m) => {
        if (nonEmptyAvatar(m.hostAvatarUrl)) return m;
        const filled = nonEmptyAvatar(gapMap.get(m.hostUserId)?.avatar_url);
        return filled ? { ...m, hostAvatarUrl: filled } : m;
      });
    }

    return mapped;
  } catch (err) {
    logRemoteError("fetchMeetupsWithHosts", err);
    return [];
  }
}

export async function insertMeetup(
  userId: string,
  input: CreateMeetupInput,
): Promise<CreatedMeetup | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const payload = {
      host_id: userId,
      title: input.title.trim(),
      category: input.category,
      venue: input.venue.trim(),
      date: input.date,
      time: input.time,
      max_spots: input.maxSpots,
      city: input.city,
      country: input.country,
      description: (input.description ?? "").trim(),
      status: "open",
    };

    const { data, error } = await supabase
      .from("meetups")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      // Retry without status if column not migrated yet
      if (error.message?.includes("status") || error.code === "PGRST204") {
        const withoutStatus = {
          host_id: payload.host_id,
          title: payload.title,
          category: payload.category,
          venue: payload.venue,
          date: payload.date,
          time: payload.time,
          max_spots: payload.max_spots,
          city: payload.city,
          country: payload.country,
          description: payload.description,
        };
        const retry = await supabase
          .from("meetups")
          .insert(withoutStatus)
          .select("*")
          .single();
        if (retry.error) {
          logRemoteError("insertMeetup", retry.error);
          return null;
        }
        const row = retry.data as MeetupRow;
        return {
          id: row.id,
          title: row.title,
          category: toCategory(row.category),
          venue: row.venue ?? input.venue,
          date: row.date ?? input.date,
          time: row.time ?? input.time,
          maxSpots: row.max_spots ?? input.maxSpots,
          city: row.city ?? input.city,
          country: row.country ?? input.country,
          description: row.description ?? "",
          createdAt: row.created_at,
          hostUserId: row.host_id,
        };
      }
      logRemoteError("insertMeetup", error);
      return null;
    }

    const row = data as MeetupRow;
    return {
      id: row.id,
      title: row.title,
      category: toCategory(row.category),
      venue: row.venue ?? input.venue,
      date: row.date ?? input.date,
      time: row.time ?? input.time,
      maxSpots: row.max_spots ?? input.maxSpots,
      city: row.city ?? input.city,
      country: row.country ?? input.country,
      description: row.description ?? "",
      createdAt: row.created_at,
      hostUserId: row.host_id,
    };
  } catch (err) {
    logRemoteError("insertMeetup", err);
    return null;
  }
}

export async function insertJoinRequest(
  meetupId: string,
  requesterId: string,
): Promise<JoinRequestStatus | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const existing = await supabase
      .from("join_requests")
      .select("id, status")
      .eq("meetup_id", meetupId)
      .eq("requester_id", requesterId)
      .maybeSingle();

    if (existing.error) {
      logRemoteError("insertJoinRequest.select", existing.error);
    } else if (existing.data) {
      const status = existing.data.status;
      if (isJoinStatus(status)) {
        if (status === "pending" || status === "accepted") {
          return status;
        }
        // declined → re-request as pending
        const upd = await supabase
          .from("join_requests")
          .update({ status: "pending" })
          .eq("id", existing.data.id)
          .select("status")
          .single();
        if (upd.error) {
          logRemoteError("insertJoinRequest.reopen", upd.error);
          return null;
        }
        return "pending";
      }
    }

    const { error } = await supabase.from("join_requests").insert({
      meetup_id: meetupId,
      requester_id: requesterId,
      status: "pending",
    });

    if (error) {
      // Unique race — treat as pending
      if (error.code === "23505") return "pending";
      logRemoteError("insertJoinRequest", error);
      return null;
    }
    return "pending";
  } catch (err) {
    logRemoteError("insertJoinRequest", err);
    return null;
  }
}

export async function deletePendingJoinRequest(
  meetupId: string,
  requesterId: string,
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase
      .from("join_requests")
      .delete()
      .eq("meetup_id", meetupId)
      .eq("requester_id", requesterId)
      .eq("status", "pending");

    if (error) {
      logRemoteError("deletePendingJoinRequest", error);
      return false;
    }
    return true;
  } catch (err) {
    logRemoteError("deletePendingJoinRequest", err);
    return false;
  }
}

export async function fetchMyJoinRequests(
  userId: string,
): Promise<Record<string, JoinRequestStatus>> {
  if (!isSupabaseConfigured) return {};

  try {
    const { data, error } = await supabase
      .from("join_requests")
      .select("meetup_id, status")
      .eq("requester_id", userId);

    if (error) {
      logRemoteError("fetchMyJoinRequests", error);
      return {};
    }

    const out: Record<string, JoinRequestStatus> = {};
    for (const row of data ?? []) {
      if (typeof row.meetup_id === "string" && isJoinStatus(row.status)) {
        out[row.meetup_id] = row.status;
      }
    }
    return out;
  } catch (err) {
    logRemoteError("fetchMyJoinRequests", err);
    return {};
  }
}

export async function fetchHostJoinRequests(
  hostId: string,
): Promise<Record<string, MeetupRequester[]>> {
  if (!isSupabaseConfigured) return {};

  try {
    const { data: hosted, error: hostedErr } = await supabase
      .from("meetups")
      .select("id")
      .eq("host_id", hostId);

    if (hostedErr) {
      logRemoteError("fetchHostJoinRequests.meetups", hostedErr);
      return {};
    }

    const meetupIds = (hosted ?? [])
      .map((r) => r.id)
      .filter((id): id is string => typeof id === "string");
    if (meetupIds.length === 0) return {};

    let rows: JoinRequestRow[] = [];

    const { data, error } = await supabase
      .from("join_requests")
      .select("id, meetup_id, requester_id, status")
      .in("meetup_id", meetupIds);

    if (error) {
      logRemoteError("fetchHostJoinRequests", error);
      return {};
    }

    rows = (data ?? []) as JoinRequestRow[];

    const profileMap = await fetchProfilesByIds(rows.map((r) => r.requester_id));

    const out: Record<string, MeetupRequester[]> = {};
    for (const row of rows) {
      if (!isJoinStatus(row.status)) continue;
      const profile = profileMap.get(row.requester_id) ?? null;
      const name = profile?.full_name?.trim() || "Requester";
      const list = out[row.meetup_id] ?? [];
      list.push({
        id: row.requester_id,
        name,
        status: row.status,
        requestId: row.id,
        avatarUrl: nonEmptyAvatar(profile?.avatar_url),
      });
      out[row.meetup_id] = list;
    }
    return out;
  } catch (err) {
    logRemoteError("fetchHostJoinRequests", err);
    return {};
  }
}

export async function updateJoinRequestStatus(
  args:
    | { requestId: string; status: "accepted" | "declined" }
    | {
        meetupId: string;
        requesterId: string;
        status: "accepted" | "declined";
      },
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    let query = supabase
      .from("join_requests")
      .update({ status: args.status });

    if ("requestId" in args) {
      query = query.eq("id", args.requestId);
    } else {
      query = query
        .eq("meetup_id", args.meetupId)
        .eq("requester_id", args.requesterId);
    }

    const { error } = await query;
    if (error) {
      logRemoteError("updateJoinRequestStatus", error);
      return false;
    }
    return true;
  } catch (err) {
    logRemoteError("updateJoinRequestStatus", err);
    return false;
  }
}
