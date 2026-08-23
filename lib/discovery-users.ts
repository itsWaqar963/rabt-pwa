import type { UserCardProps } from "@/components/ui/UserCard";
import type { DiscoveryFilters } from "@/lib/discovery-filters";

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
  source: "seed" | "created";
};

export const DISCOVERY_USERS: DiscoveryUser[] = [
  {
    id: "sana-khalid",
    name: "Sana Khalid",
    initial: "س",
    subline: "Design systems · 24",
    intents: [
      "Looking for a weekend physical meetup in Lahore",
      "Building a focused study circle for product designers",
    ],
    tags: ["Lahore", "Model Town"],
    avatarVariant: "default",
    country: "pakistan",
    city: "lahore",
    gender: "women",
    ageGroup: "18-24",
    personalityScore: 6,
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      contact: "https://wa.me/923001234567",
    },
    meetup: {
      id: "maghrib-read",
      title: "After Maghrib: Read & Reflect",
      venue: "Jamia Masjid Model Town",
      when: "Saturday · 7:30 PM",
      description:
        "A quiet reading circle for people making space for better questions and better work.",
      spotsLeft: 6,
      category: "study",
    },
  },
  {
    id: "hamza-rauf",
    name: "Hamza Rauf",
    initial: "ح",
    subline: "Civic tech · 26",
    intents: [
      "Looking for a small founder walk on Sunday",
      "Want to meet builders shipping in public",
    ],
    tags: ["Lahore", "Gulberg"],
    avatarVariant: "blue",
    country: "pakistan",
    city: "lahore",
    gender: "men",
    ageGroup: "25-34",
    personalityScore: 8,
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      contact: "https://wa.me/923001112233",
    },
    meetup: {
      id: "civic-tech-walk",
      title: "Sunday Civic Tech Walk",
      venue: "Racecourse Park, Lahore",
      when: "Sunday · 8:00 AM",
      description:
        "Walk, talk, and trade notes on the local problems worth building for.",
      spotsLeft: 4,
      category: "walk",
    },
  },
  {
    id: "maryam-saeed",
    name: "Maryam Saeed",
    initial: "م",
    subline: "Research · 23",
    intents: [
      "Searching for a women-led reading circle",
      "Planning a quiet Sunday coffee meetup",
    ],
    tags: ["Lahore", "DHA"],
    avatarVariant: "quiet",
    country: "pakistan",
    city: "lahore",
    gender: "women",
    ageGroup: "18-24",
    personalityScore: 4,
    links: {
      linkedin: "https://linkedin.com",
      contact: "https://wa.me/923004445566",
    },
  },
  {
    id: "bilal-khan",
    name: "Bilal Khan",
    initial: "ب",
    subline: "Fintech · 29",
    intents: [
      "Hosting a Karachi founders breakfast",
      "Looking for payment-ops peers to swap notes",
    ],
    tags: ["Karachi", "Clifton"],
    avatarVariant: "blue",
    country: "pakistan",
    city: "karachi",
    gender: "men",
    ageGroup: "25-34",
    personalityScore: 7,
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      contact: "https://wa.me/923007778899",
    },
    meetup: {
      id: "karachi-founders-breakfast",
      title: "Karachi Founders Breakfast",
      venue: "Clifton Beach Cafe",
      when: "Saturday · 9:00 AM",
      description:
        "Low-pressure breakfast for payment-ops and fintech builders swapping notes.",
      spotsLeft: 5,
      category: "builders",
    },
  },
  {
    id: "ayesha-noor",
    name: "Ayesha Noor",
    initial: "ع",
    subline: "Policy · 31",
    intents: [
      "Building an Islamabad civic reading group",
      "Want thoughtful weekend walks near F-6",
    ],
    tags: ["Islamabad", "F-6"],
    avatarVariant: "default",
    country: "pakistan",
    city: "islamabad",
    gender: "women",
    ageGroup: "25-34",
    personalityScore: 5,
    links: {
      linkedin: "https://linkedin.com",
      contact: "https://wa.me/923009998877",
    },
  },
  {
    id: "omar-farid",
    name: "Omar Farid",
    initial: "ع",
    subline: "Product · 27",
    intents: [
      "Looking for a Dubai design critique circle",
      "Planning a Friday maker meetup in Marina",
    ],
    tags: ["Dubai", "Marina"],
    avatarVariant: "quiet",
    country: "uae",
    city: "dubai",
    gender: "men",
    ageGroup: "25-34",
    personalityScore: 9,
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      contact: "https://wa.me/971501234567",
    },
    meetup: {
      id: "marina-maker-friday",
      title: "Friday Maker Meetup",
      venue: "Marina Walk Pavilion",
      when: "Friday · 6:00 PM",
      description:
        "Bring a WIP, critique kindly, leave with one next step.",
      spotsLeft: 8,
      category: "tech",
    },
  },
  {
    id: "layla-hassan",
    name: "Layla Hassan",
    initial: "ل",
    subline: "Brand · 22",
    intents: [
      "Searching for women creatives in Dubai",
      "Want a calm Sunday sketch session",
    ],
    tags: ["Dubai", "JLT"],
    avatarVariant: "default",
    country: "uae",
    city: "dubai",
    gender: "women",
    ageGroup: "18-24",
    personalityScore: 3,
    links: {
      linkedin: "https://linkedin.com",
      contact: "https://wa.me/971509876543",
    },
  },
  {
    id: "james-okonkwo",
    name: "James Okonkwo",
    initial: "ج",
    subline: "ML eng · 34",
    intents: [
      "Hosting a London AI ethics walk",
      "Looking for builders who ship thoughtfully",
    ],
    tags: ["London", "Shoreditch"],
    avatarVariant: "blue",
    country: "united-kingdom",
    city: "london",
    gender: "men",
    ageGroup: "25-34",
    personalityScore: 6,
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      contact: "https://wa.me/447700900123",
    },
    meetup: {
      id: "london-ai-ethics-walk",
      title: "AI Ethics Walk",
      venue: "Shoreditch Park",
      when: "Sunday · 10:00 AM",
      description:
        "A thoughtful walk for builders who care how models land in the world.",
      spotsLeft: 7,
      category: "walk",
    },
  },
  {
    id: "fatima-rahman",
    name: "Fatima Rahman",
    initial: "ف",
    subline: "Community · 28",
    intents: [
      "Building a women-led London dinner table",
      "Want quiet weekend book clubs",
    ],
    tags: ["London", "Hackney"],
    avatarVariant: "quiet",
    country: "united-kingdom",
    city: "london",
    gender: "women",
    ageGroup: "25-34",
    personalityScore: 5,
    links: {
      linkedin: "https://linkedin.com",
      contact: "https://wa.me/447700900456",
    },
  },
  {
    id: "noah-patel",
    name: "Noah Patel",
    initial: "ن",
    subline: "Systems · 36",
    intents: [
      "Looking for a Chicago infra coffee meetup",
      "Want peers debating distributed systems",
    ],
    tags: ["Chicago", "River North"],
    avatarVariant: "default",
    country: "united-states",
    city: "chicago",
    gender: "men",
    ageGroup: "35-44",
    personalityScore: 7,
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      contact: "https://wa.me/13125550123",
    },
    meetup: {
      id: "chicago-infra-coffee",
      title: "Infra Coffee",
      venue: "River North Roasters",
      when: "Thursday · 5:30 PM",
      description:
        "Distributed systems debate over coffee — bring a war story.",
      spotsLeft: 6,
      category: "coffee",
    },
  },
  {
    id: "sara-al-harbi",
    name: "Sara Al-Harbi",
    initial: "س",
    subline: "Architecture · 30",
    intents: [
      "Planning a Riyadh design walk",
      "Looking for women in the built environment",
    ],
    tags: ["Riyadh", "Olaya"],
    avatarVariant: "blue",
    country: "saudi-arabia",
    city: "riyadh",
    gender: "women",
    ageGroup: "25-34",
    personalityScore: 4,
    links: {
      linkedin: "https://linkedin.com",
      contact: "https://wa.me/966501234567",
    },
  },
];

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
