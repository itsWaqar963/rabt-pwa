import type { UserCardProps } from "@/components/ui/UserCard";
import type { DiscoveryFilters } from "@/lib/discovery-filters";

export type DiscoveryUser = UserCardProps & {
  country: string;
  city: string;
  gender: "women" | "men";
  ageGroup: "18-24" | "25-34" | "35-44";
};

export const DISCOVERY_USERS: DiscoveryUser[] = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
