import type { HostedMeetup } from "@/lib/discovery-users";

export const MEETUP_ACKS_KEY = "rabt_meetup_acks";
export const CREATED_MEETUPS_KEY = "rabt_created_meetups";

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

export type MeetupAckState = {
  meetupIds: string[];
  connectIds: string[];
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

function isMeetupCategory(value: unknown): value is MeetupCategory {
  return (
    typeof value === "string" &&
    (MEETUP_CATEGORIES as string[]).includes(value)
  );
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
