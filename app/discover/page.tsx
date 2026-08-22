"use client";

import { useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { UserCard } from "@/components/ui/UserCard";

const FILTER_OPTIONS = {
  city: ["Lahore", "Karachi", "Islamabad"],
  country: ["Pakistan", "UAE", "UK"],
  gender: ["Any", "Women", "Men"],
  age: ["Any", "18-24", "25-34", "35-44"],
} as const;

type Filters = {
  city: (typeof FILTER_OPTIONS.city)[number];
  country: (typeof FILTER_OPTIONS.country)[number];
  gender: (typeof FILTER_OPTIONS.gender)[number];
  age: (typeof FILTER_OPTIONS.age)[number];
};

const SELECT_CLASS =
  "appearance-none inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border border-border bg-transparent bg-[length:0.7em] bg-[position:right_10px_center] bg-no-repeat px-[13px] pr-8 text-xs text-muted [color-scheme:dark] transition-[border-color,color,background] duration-150 hover:border-accent hover:bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] hover:text-foreground focus:border-accent focus:bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] focus:text-foreground focus:outline-none [background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath stroke='%23999' stroke-width='1.5' d='m1 1 5 5 5-5'/%3E%3C/svg%3E\")] [&_option]:bg-[var(--surface)] [&_option]:text-[var(--fg)]";
const USERS = [
  {
    name: "Sana Khalid",
    initial: "س",
    subline: "Design systems · 24",
    intents: [
      "Looking for a weekend physical meetup in Lahore",
      "Building a focused study circle for product designers",
    ],
    tags: ["Lahore", "Model Town"],
    avatarVariant: "default" as const,
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
    avatarVariant: "blue" as const,
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
    avatarVariant: "quiet" as const,
  },
];

export default function DiscoverPage() {
  const [filters, setFilters] = useState<Filters>({
    city: "Lahore",
    country: "Pakistan",
    gender: "Any",
    age: "Any",
  });
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_80%_4%,color-mix(in_oklch,var(--muted)_9%,transparent),transparent_20rem),var(--bg)]">
      <main className="relative z-[1] h-[100dvh] overflow-y-auto px-[18px] pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(18px,env(safe-area-inset-top))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <header className="relative z-10 flex min-h-12 items-center justify-between">
          <div className="flex items-baseline gap-2.5">
            <span
              lang="ar"
              className="font-display text-[48px] font-semibold leading-none tracking-[-0.04em] text-foreground [direction:rtl]"
              style={{
                textShadow:
                  "0 0 18px color-mix(in oklch, var(--accent) 34%, transparent), 0 0 42px color-mix(in oklch, var(--accent) 22%, transparent)",
              }}
            >
              ربط
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
              RABT
            </span>
          </div>
          <Link
            href="/profile"
            aria-label="Open your profile"
            className="grid size-11 place-items-center rounded-full border border-border bg-[color-mix(in_oklch,var(--surface)_72%,transparent)] text-foreground transition-[background,border-color,transform] duration-150 hover:border-foreground hover:bg-[color-mix(in_oklch,var(--fg)_6%,transparent)] active:scale-95"
          >
            <User className="size-[19px]" strokeWidth={1.6} aria-hidden />
          </Link>
        </header>

        <section className="flex items-end justify-between gap-4 px-0.5 pb-[19px] pt-[27px]">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              Home · 01
            </p>
            <h1 className="mt-1 max-w-[10ch] font-display text-[31px] leading-[1.08] text-foreground max-[360px]:text-[28px]">
              Find your <span className="text-accent">cluster.</span>
            </h1>
          </div>
          <p className="max-w-[17ch] text-right text-xs leading-[1.55] text-muted">
            Real people. Shared intent. A reason to meet offline.
          </p>
        </section>

        <section className="-mx-[18px] overflow-hidden border-y border-[color-mix(in_oklch,var(--border)_70%,transparent)] max-[360px]:-mx-3.5">
          <div
            role="group"
            aria-label="Discovery filters"
            className="flex gap-2 overflow-x-auto px-[18px] py-3 [scrollbar-width:none] max-[360px]:px-3.5 [&::-webkit-scrollbar]:hidden"
          >
            <label className="sr-only" htmlFor="filter-city">
              City
            </label>
            <select
              id="filter-city"
              className={SELECT_CLASS}
              value={filters.city}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  city: e.target.value as Filters["city"],
                }))
              }
              style={{
                color: "var(--fg)",
                backgroundColor:
                  "color-mix(in oklch, var(--accent) 14%, transparent)",
                borderColor: "var(--accent)",
              }}
            >
              {FILTER_OPTIONS.city.map((opt) => (
                <option key={opt} value={opt}>
                  City: {opt}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="filter-country">
              Country
            </label>
            <select
              id="filter-country"
              className={SELECT_CLASS}
              value={filters.country}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  country: e.target.value as Filters["country"],
                }))
              }
            >
              {FILTER_OPTIONS.country.map((opt) => (
                <option key={opt} value={opt}>
                  Country: {opt}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="filter-gender">
              Gender
            </label>
            <select
              id="filter-gender"
              className={SELECT_CLASS}
              value={filters.gender}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  gender: e.target.value as Filters["gender"],
                }))
              }
            >
              {FILTER_OPTIONS.gender.map((opt) => (
                <option key={opt} value={opt}>
                  Gender: {opt}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="filter-age">
              Age Group
            </label>
            <select
              id="filter-age"
              className={SELECT_CLASS}
              value={filters.age}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  age: e.target.value as Filters["age"],
                }))
              }
            >
              {FILTER_OPTIONS.age.map((opt) => (
                <option key={opt} value={opt}>
                  Age: {opt}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-3 px-0.5 pb-[13px] pt-6">
            <h2 className="font-display text-[21px] text-foreground">
              Nearby intentions
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
              3 clusters · {filters.city}
            </span>
          </div>

          <div className="grid gap-3 pb-[92px]">
            {USERS.map((user) => (
              <UserCard key={user.name} {...user} />
            ))}
          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
