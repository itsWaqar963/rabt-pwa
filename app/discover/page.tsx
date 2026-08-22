"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { BackToTopFab } from "@/components/ui/BackToTopFab";
import { EmptyClusters } from "@/components/ui/EmptyClusters";
import { FilterPills } from "@/components/ui/FilterPills";
import { ProfilePopup } from "@/components/ui/ProfilePopup";
import { UserCard } from "@/components/ui/UserCard";
import {
  DEFAULT_FILTERS,
  getFilterMetaLabel,
  type DiscoveryFilters,
} from "@/lib/discovery-filters";
import {
  DISCOVERY_USERS,
  filterDiscoveryUsers,
  findDiscoveryUser,
} from "@/lib/discovery-users";

export default function DiscoverPage() {
  const [filters, setFilters] = useState<DiscoveryFilters>(DEFAULT_FILTERS);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [filterBarStuck, setFilterBarStuck] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const filterSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = mainRef.current;
    const sentinel = filterSentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setFilterBarStuck(!entry.isIntersecting);
      },
      { root, threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const feed = useMemo(
    () => filterDiscoveryUsers(DISCOVERY_USERS, filters),
    [filters],
  );
  const metaLabel = getFilterMetaLabel(filters);
  const selectedUser = findDiscoveryUser(DISCOVERY_USERS, selectedUserId);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_80%_4%,color-mix(in_oklch,var(--muted)_9%,transparent),transparent_20rem),var(--bg)]">
      <main
        ref={mainRef}
        className="relative z-[1] h-[100dvh] overflow-y-auto px-[18px] pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(18px,env(safe-area-inset-top))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
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

        <div ref={filterSentinelRef} aria-hidden className="h-px w-full shrink-0" />
        <section
          className={[
            "sticky top-0 z-30 -mx-[18px] border-b border-transparent bg-transparent max-[360px]:-mx-3.5",
            "transition-[background-color,border-color,backdrop-filter,box-shadow] duration-200 ease-out",
            filterBarStuck
              ? "border-[color-mix(in_oklch,var(--accent)_35%,var(--border))] bg-black/80 shadow-lg backdrop-blur-md"
              : "backdrop-blur-none shadow-none",
          ].join(" ")}
        >
          <FilterPills filters={filters} onChange={setFilters} />
        </section>

        <section>
          <div className="flex items-center justify-between gap-3 px-0.5 pb-[13px] pt-6">
            <h2 className="font-display text-[21px] text-foreground">
              Nearby intentions
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
              {feed.length} clusters · {metaLabel}
            </span>
          </div>

          <div className="grid gap-3 pb-[92px]">
            {feed.length === 0 ? (
              <EmptyClusters onReset={() => setFilters(DEFAULT_FILTERS)} />
            ) : (
              feed.map((user) => (
                <UserCard
                  key={user.id}
                  name={user.name}
                  initial={user.initial}
                  subline={user.subline}
                  intents={user.intents}
                  tags={user.tags}
                  avatarVariant={user.avatarVariant}
                  status={user.status}
                  onViewProfile={() => setSelectedUserId(user.id)}
                />
              ))
            )}
          </div>
        </section>
      </main>

      <BackToTopFab scrollRef={mainRef} />
      <BottomNav />

      <ProfilePopup
        user={selectedUser}
        open={selectedUserId !== null && selectedUser !== null}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}
