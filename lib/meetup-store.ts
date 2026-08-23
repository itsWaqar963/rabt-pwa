import type { HostedMeetup } from "@/lib/discovery-users";

export const MEETUP_ACKS_KEY = "rabt_meetup_acks";
export const CREATED_MEETUPS_KEY = "rabt_created_meetups";
export const JOIN_REQUESTS_KEY = "rabt_join_requests";
export const HOST_REQUESTERS_KEY = "rabt_host_requesters";
export const HIDDEN_IDS_KEY = "rabt_hidden_ids";

export type MeetupCategory =
  | "Study"
  | "Walk"
  | "Tech"
  | "Coffee"
  | "Builders"
  | "Other";

export const MEETUP_CATEGORIES: MeetupCategory[] = [
  "Study",
  "Walk",
  "Tech",
  "Coffee",
  "Builders",
  "Other",
];

export type JoinRequestStatus = "pending" | "accepted" | "declined";

export type MeetupAckState = {
  /** @deprecated Migrated into joinRequests; kept for parse backward compat */
  meetupIds: string[];
  connectIds: string[];
};

export type JoinRequestsState = Record<string, JoinRequestStatus>;

export type MeetupRequester = {
  id: string;
  name: string;
  status: JoinRequestStatus;
};

export type HostRequestersState = Record<string, MeetupRequester[]>;

export type HiddenIdsState = {
  userIds: string[];
  meetupIds: string[];
};

export type CreatedMeetup = {
  id: string;
  title: string;
  category: MeetupCategory;
  venue: string;
  date: string;
  time: string;
  maxSpots: number;
  city: string;
  country: string;
  description: string;
  createdAt: string;
};

export type CreateMeetupInput = {
  title: string;
  category: MeetupCategory;
  venue: string;
  date: string;
  time: string;
  maxSpots: number;
  city: string;
  country: string;
  description?: string;
};

export const EMPTY_ACKS: MeetupAckState = {
  meetupIds: [],
  connectIds: [],
};

export const EMPTY_HIDDEN: HiddenIdsState = {
  userIds: [],
  meetupIds: [],
};

const DEMO_REQUESTER_NAMES = [
  "Ayesha Malik",
  "Hamza Raza",
  "Fatima Noor",
  "Bilal Hussain",
  "Zainab Iqbal",
  "Omar Farooq",
] as const;

function isMeetupCategory(value: unknown): value is MeetupCategory {
  return (
    typeof value === "string" &&
    (MEETUP_CATEGORIES as string[]).includes(value)
  );
}

function isJoinRequestStatus(value: unknown): value is JoinRequestStatus {
  return value === "pending" || value === "accepted" || value === "declined";
}

export function parseAckState(raw: string | null): MeetupAckState {
  if (!raw) return { ...EMPTY_ACKS, meetupIds: [], connectIds: [] };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { meetupIds: [], connectIds: [] };
    }
    const record = parsed as Record<string, unknown>;
    const meetupIds = Array.isArray(record.meetupIds)
      ? record.meetupIds.filter((id): id is string => typeof id === "string")
      : [];
    const connectIds = Array.isArray(record.connectIds)
      ? record.connectIds.filter((id): id is string => typeof id === "string")
      : [];
    return { meetupIds, connectIds };
  } catch {
    return { meetupIds: [], connectIds: [] };
  }
}

export function parseJoinRequests(raw: string | null): JoinRequestsState {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: JoinRequestsState = {};
    for (const [id, status] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (isJoinRequestStatus(status)) {
        out[id] = status;
      }
    }
    return out;
  } catch {
    return {};
  }
}

/** Migrate legacy meetupIds boolean acks into pending join requests. */
export function migrateJoinRequests(
  stored: JoinRequestsState,
  legacyMeetupIds: string[],
): JoinRequestsState {
  if (legacyMeetupIds.length === 0) return stored;
  const next = { ...stored };
  for (const id of legacyMeetupIds) {
    if (!(id in next)) {
      next[id] = "pending";
    }
  }
  return next;
}

export function parseHostRequesters(raw: string | null): HostRequestersState {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: HostRequestersState = {};
    for (const [meetupId, list] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (!Array.isArray(list)) continue;
      const requesters = list.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        if (
          typeof row.id !== "string" ||
          typeof row.name !== "string" ||
          !isJoinRequestStatus(row.status)
        ) {
          return [];
        }
        return [{ id: row.id, name: row.name, status: row.status }];
      });
      if (requesters.length > 0) {
        out[meetupId] = requesters;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function parseHiddenIds(raw: string | null): HiddenIdsState {
  if (!raw) return { userIds: [], meetupIds: [] };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { userIds: [], meetupIds: [] };
    }
    const record = parsed as Record<string, unknown>;
    return {
      userIds: Array.isArray(record.userIds)
        ? record.userIds.filter((id): id is string => typeof id === "string")
        : [],
      meetupIds: Array.isArray(record.meetupIds)
        ? record.meetupIds.filter((id): id is string => typeof id === "string")
        : [],
    };
  } catch {
    return { userIds: [], meetupIds: [] };
  }
}

export function parseCreatedMeetups(raw: string | null): CreatedMeetup[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      if (
        typeof row.id !== "string" ||
        typeof row.title !== "string" ||
        !isMeetupCategory(row.category) ||
        typeof row.venue !== "string" ||
        typeof row.date !== "string" ||
        typeof row.time !== "string" ||
        typeof row.maxSpots !== "number" ||
        typeof row.city !== "string" ||
        typeof row.country !== "string" ||
        typeof row.createdAt !== "string"
      ) {
        return [];
      }
      return [
        {
          id: row.id,
          title: row.title,
          category: row.category,
          venue: row.venue,
          date: row.date,
          time: row.time,
          maxSpots: row.maxSpots,
          city: row.city,
          country: row.country,
          description:
            typeof row.description === "string" ? row.description : "",
          createdAt: row.createdAt,
        },
      ];
    });
  } catch {
    return [];
  }
}

export function toggleIdInList(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

export function addIdOnce(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids : [...ids, id];
}

export function formatMeetupWhen(date: string, time: string): string {
  const iso = `${date}T${time}`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return `${date} · ${time}`;
  }
  const day = parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const clock = parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} · ${clock}`;
}

export function createdMeetupToHosted(meetup: CreatedMeetup): HostedMeetup {
  return {
    id: meetup.id,
    kind: `Physical gathering · ${meetup.category.toLowerCase()}`,
    title: meetup.title,
    status: `${meetup.maxSpots} spots left`,
    description:
      meetup.description.trim() ||
      `${meetup.category} meetup at ${meetup.venue}.`,
    location: meetup.venue,
    when: formatMeetupWhen(meetup.date, meetup.time),
    organizerName: "You",
    organizerRole: "Host",
    hostUserId: "self",
    spotsLeft: meetup.maxSpots,
    city: meetup.city,
    country: meetup.country,
    source: "created",
  };
}

export function buildCreatedMeetup(input: CreateMeetupInput): CreatedMeetup {
  const stamp = Date.now();
  return {
    id: `created-${stamp}`,
    title: input.title.trim(),
    category: input.category,
    venue: input.venue.trim(),
    date: input.date,
    time: input.time,
    maxSpots: input.maxSpots,
    city: input.city,
    country: input.country,
    description: (input.description ?? "").trim(),
    createdAt: new Date(stamp).toISOString(),
  };
}

/** Seed 2–3 demo IMS students as pending join requesters. */
export function seedPendingRequesters(meetupId: string): MeetupRequester[] {
  const hash = Array.from(meetupId).reduce(
    (acc, ch) => acc + ch.charCodeAt(0),
    0,
  );
  const count = 2 + (hash % 2);
  const start = hash % DEMO_REQUESTER_NAMES.length;
  const names: string[] = [];
  for (let i = 0; i < count; i += 1) {
    names.push(
      DEMO_REQUESTER_NAMES[(start + i) % DEMO_REQUESTER_NAMES.length]!,
    );
  }
  return names.map((name, index) => ({
    id: `${meetupId}-req-${index}`,
    name,
    status: "pending" as const,
  }));
}

export function ensureHostRequesters(
  createdMeetups: CreatedMeetup[],
  existing: HostRequestersState,
): HostRequestersState {
  let changed = false;
  const next = { ...existing };
  for (const meetup of createdMeetups) {
    if (!next[meetup.id] || next[meetup.id]!.length === 0) {
      next[meetup.id] = seedPendingRequesters(meetup.id);
      changed = true;
    }
  }
  return changed ? next : existing;
}

export function filterHostedMeetups(
  meetups: HostedMeetup[],
  country: string,
  city: string,
): HostedMeetup[] {
  return meetups.filter((meetup) => {
    if (country !== "all" && meetup.country !== country) return false;
    if (city !== "all" && meetup.city !== city) return false;
    return true;
  });
}

export function isActiveJoinRequest(
  status: JoinRequestStatus | undefined,
): boolean {
  return status === "pending" || status === "accepted";
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled join status: ${String(value)}`);
}

export function joinStatusLabel(status: JoinRequestStatus): string {
  switch (status) {
    case "pending":
      return "Pending approval";
    case "accepted":
      return "Joined";
    case "declined":
      return "Declined";
    default:
      return assertNever(status);
  }
}
