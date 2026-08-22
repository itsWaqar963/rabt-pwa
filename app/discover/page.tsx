"use client";

import { useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { FilterPills } from "@/components/ui/FilterPills";
import { UserCard } from "@/components/ui/UserCard";
import {
  DEFAULT_FILTERS,
  getFilterLabel,
  type DiscoveryFilters,
} from "@/lib/discovery-filters";

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
  const [filters, setFilters] = useState<DiscoveryFilters>(DEFAULT_FILTERS);
  const cityLabel = getFilterLabel("city", filters.city);
  const matched = USERS.filter((u) =>
    u.tags.some((t) => t.toLowerCase() === cityLabel.toLowerCase()),
  );
  const feed = matched.length > 0 ? matched : USERS;

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

        <section className="-mx-[18px] border-y border-[color-mix(in_oklch,var(--border)_70%,transparent)] max-[360px]:-mx-3.5">
          <FilterPills filters={filters} onChange={setFilters} />
        </section>

        <section>
          <div className="flex items-center justify-between gap-3 px-0.5 pb-[13px] pt-6">
            <h2 className="font-display text-[21px] text-foreground">
              Nearby intentions
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
              {feed.length} clusters · {cityLabel}
            </span>
          </div>

          <div className="grid gap-3 pb-[92px]">
            {feed.map((user) => (
              <UserCard key={user.name} {...user} />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
