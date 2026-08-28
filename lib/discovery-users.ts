import type { UserCardProps } from "@/components/ui/UserCard";
import type { DiscoveryFilters } from "@/lib/discovery-filters";
import type { MeetupCategory } from "@/lib/meetup-store";
import {
  normalizeSocialUrls,
  socialUrlsToDiscoveryLinks,
} from "@/lib/social-links";

export type DiscoveryUserLinks = {
  github?: string;
  linkedin?: string;
  contact?: string;
};

export type DiscoveryMeetup = {
  id: string;
  title?: string;
  venue: string;
  when: string;
  description?: string;
  /** Static seed display — never decremented on request */
  spotsLeft: number;
  category?: string;
};

export type DiscoveryUser = UserCardProps & {
  id: string;
  country: string;
  city: string;
  gender: "women" | "men";
  ageGroup: "18-24" | "25-34" | "35-44";
  personalityScore: number;
  links: DiscoveryUserLinks;
  meetup?: DiscoveryMeetup;
  isImsStudent?: boolean;
  isSourceCodeAcademia?: boolean;
  isVsila?: boolean;
  customAffiliation?: string;
  skills?: string[];
  isOnline?: boolean;
  lastSeenAt?: string;
};

export type HostedMeetup = {
  id: string;
  kind: string;
  title: string;
  status: string;
  description: string;
  location: string;
  when: string;
  organizerName: string;
  organizerRole: string;
  hostUserId: string;
  spotsLeft: number;
  city: string;
  country: string;
  source: "seed" | "created" | "remote";
  /** Host profile signals for Discover filters (remote) */
  hostGender?: "women" | "men";
  hostAgeGroup?: "18-24" | "25-34" | "35-44";
  hostAvatarUrl?: string;
  hostSubline?: string;
  hostIntent?: string;
  hostSkills?: string[];
  hostInitial?: string;
  hostIntrovertExtrovert?: number;
  hostIsImsStudent?: boolean;
  hostIsSourceCodeAcademia?: boolean;
  hostIsVsila?: boolean;
  hostCustomAffiliation?: string;
  hostSocialUrls?: ReturnType<typeof normalizeSocialUrls>;
  hostLastSeenAt?: string;
  hostIsOnline?: boolean;
  /** Raw create fields when available */
  date?: string;
  time?: string;
  category?: MeetupCategory;
  venue?: string;
  maxSpots?: number;
  descriptionRaw?: string;
  createdAt?: string;
  acceptedCount?: number;
};

export function filterDiscoveryUsers(
  users: DiscoveryUser[],
  filters: DiscoveryFilters,
): DiscoveryUser[] {
  return users.filter((user) => {
    if (filters.country !== "all" && user.country !== filters.country) {
      return false;
    }
    if (filters.city !== "all" && user.city !== filters.city) {
      return false;
    }
    if (filters.gender !== "all" && user.gender !== filters.gender) {
      return false;
    }
    if (filters.age !== "all" && user.ageGroup !== filters.age) {
      return false;
    }
    return true;
  });
}

export function findDiscoveryUser(
  users: DiscoveryUser[],
  id: string | null,
): DiscoveryUser | null {
  if (!id) return null;
  return users.find((u) => u.id === id) ?? null;
}

export function getHostedMeetups(users: DiscoveryUser[]): HostedMeetup[] {
  return users.flatMap((user) => {
    if (!user.meetup) return [];
    const role = user.subline.split(" · ")[0]?.trim() || user.subline;
    const category = user.meetup.category ?? "host";
    return [
      {
        id: user.meetup.id,
        kind: `Physical gathering · ${category}`,
        title: user.meetup.title ?? `${user.name}'s meetup`,
        status: `${user.meetup.spotsLeft} spots left`,
        description:
          user.meetup.description ?? user.intents[0] ?? "Hosted meetup",
        location: user.meetup.venue,
        when: user.meetup.when,
        organizerName: user.name,
        organizerRole: role,
        hostUserId: user.id,
        spotsLeft: user.meetup.spotsLeft,
        city: user.city,
        country: user.country,
        source: "seed",
      },
    ];
  });
}

/** Build people-first Discover cards from remote open meetups + host profile. */
export function hostedMeetupToDiscoveryUser(
  meetup: HostedMeetup,
): DiscoveryUser {
  const name = meetup.organizerName || "Host";
  const intent =
    meetup.hostIntent?.trim() ||
    meetup.description ||
    `Hosting ${meetup.title}`;
  const skills = (meetup.hostSkills ?? []).slice(0, 4);
  const tags = [
    meetup.city,
    meetup.country,
    ...skills,
  ].filter(Boolean);
  const personalityScore =
    typeof meetup.hostIntrovertExtrovert === "number"
      ? meetup.hostIntrovertExtrovert
      : 5;

  return {
    id: meetup.id,
    name,
    initial: meetup.hostInitial || name.charAt(0) || "?",
    avatarUrl: meetup.hostAvatarUrl,
    subline: meetup.hostSubline || meetup.organizerRole || "Host",
    intents: [intent, meetup.title],
    tags,
    avatarVariant: "default",
    country: meetup.country,
    city: meetup.city,
    gender: meetup.hostGender ?? "men",
    ageGroup: meetup.hostAgeGroup ?? "25-34",
    personalityScore,
    isImsStudent: meetup.hostIsImsStudent === true,
    isSourceCodeAcademia: meetup.hostIsSourceCodeAcademia === true,
    isVsila: meetup.hostIsVsila === true,
    customAffiliation: meetup.hostCustomAffiliation,
    skills: meetup.hostSkills ?? [],
    isOnline: meetup.hostIsOnline === true,
    lastSeenAt: meetup.hostLastSeenAt,
    links: socialUrlsToDiscoveryLinks(
      meetup.hostSocialUrls ?? normalizeSocialUrls(null),
    ),
    meetup: {
      id: meetup.id,
      title: meetup.title,
      venue: meetup.location,
      when: meetup.when,
      description: meetup.description,
      spotsLeft: meetup.spotsLeft,
      category: meetup.category?.toLowerCase(),
    },
  };
}
