"use client";

import { useMemo, useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { useMeetupStore } from "@/components/providers/MeetupStoreProvider";
import { CreateMeetupModal } from "@/components/ui/CreateMeetupModal";
import { FilterPills } from "@/components/ui/FilterPills";
import { MeetupCard } from "@/components/ui/MeetupCard";
import {
  DEFAULT_FILTERS,
  getFilterMetaLabel,
  type DiscoveryFilters,
} from "@/lib/discovery-filters";
import {
  DISCOVERY_USERS,
  getHostedMeetups,
  type HostedMeetup,
} from "@/lib/discovery-users";
import {
  createdMeetupToHosted,
  filterHostedMeetups,
} from "@/lib/meetup-store";

type Tab = "explore" | "events";

const EXPLORE_FILTER_KEYS = ["country", "city"] as const;

function renderMeetupCard(
  meetup: HostedMeetup,
  opts: {
    requested: boolean;
    onRequestToggle?: () => void;
    hideRequest?: boolean;
  },
) {
  return (
    <MeetupCard
      key={meetup.id}
      kind={meetup.kind}
      title={meetup.title}
      status={meetup.status}
      description={meetup.description}
      location={meetup.location}
      when={meetup.when}
      organizerName={meetup.organizerName}
      organizerRole={meetup.organizerRole}
      spotsLeft={meetup.spotsLeft}
      requested={opts.requested}
      onRequestToggle={opts.onRequestToggle}
      hideRequest={opts.hideRequest}
    />
  );
}

export default function MeetupsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("explore");
  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters] = useState<DiscoveryFilters>(DEFAULT_FILTERS);

  const {
    createdMeetups,
    meetupIds,
    isMeetupRequested,
    toggleMeetupRequest,
    addCreatedMeetup,
  } = useMeetupStore();

  const seedMeetups = useMemo(
    () => getHostedMeetups(DISCOVERY_USERS),
    [],
  );

  const createdAsHosted = useMemo(
    () => createdMeetups.map(createdMeetupToHosted),
    [createdMeetups],
  );

  const allExplore = useMemo(
    () => [...createdAsHosted, ...seedMeetups],
    [createdAsHosted, seedMeetups],
  );

  const exploreMeetups = useMemo(
    () => filterHostedMeetups(allExplore, filters.country, filters.city),
    [allExplore, filters.country, filters.city],
  );

  const joinedMeetups = useMemo(
    () => allExplore.filter((m) => meetupIds.has(m.id)),
    [allExplore, meetupIds],
  );

  const metaLabel = getFilterMetaLabel(filters);
  const isExplore = activeTab === "explore";

  function openCreate() {
    setCreateOpen(true);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_80%_4%,color-mix(in_oklch,var(--muted)_9%,transparent),transparent_20rem),var(--bg)]">
      <main className="relative z-[1] h-[100dvh] overflow-y-auto px-[18px] pb-[max(88px,calc(env(safe-area-inset-bottom)+72px))] pt-[max(18px,env(safe-area-inset-top))] [scrollbar-width:none] max-[360px]:px-3.5 [&::-webkit-scrollbar]:hidden">
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
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-11 items-center gap-[7px] rounded-[11px] border border-[color-mix(in_oklch,var(--accent)_60%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] px-3 text-[11px] font-semibold text-accent transition-[background,border-color] duration-150 hover:bg-[color-mix(in_oklch,var(--accent)_22%,transparent)] max-[360px]:px-2.5"
          >
            <span className="text-lg font-normal leading-none">+</span>
            Create Meetup
          </button>
        </header>

        <section className="px-0.5 pb-5 pt-[27px]">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            Offline · 02
          </p>
          <h1 className="mt-1 max-w-[12ch] font-display text-[31px] leading-[1.08] text-foreground max-[360px]:text-[28px]">
            Meet with <span className="text-accent">intent.</span>
          </h1>
          <p className="mt-[11px] max-w-[34ch] text-xs leading-[1.55] text-muted">
            Small gatherings for useful conversations, shared practice, and a
            reason to show up.
          </p>
        </section>

        <section
          role="tablist"
          aria-label="Meetup views"
          className="grid grid-cols-2 gap-1 rounded-[14px] border border-border bg-[color-mix(in_oklch,var(--surface)_72%,transparent)] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={isExplore}
            onClick={() => setActiveTab("explore")}
            className={`min-h-11 rounded-[10px] text-xs transition-[background,color,box-shadow] duration-150 ${
              isExplore
                ? "bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--accent)_32%,transparent)]"
                : "bg-transparent text-muted"
            }`}
          >
            Explore Meetups
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isExplore}
            onClick={() => setActiveTab("events")}
            className={`min-h-11 rounded-[10px] text-xs transition-[background,color,box-shadow] duration-150 ${
              !isExplore
                ? "bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--accent)_32%,transparent)]"
                : "bg-transparent text-muted"
            }`}
          >
            My Events
          </button>
        </section>

        <section aria-live="polite">
          {isExplore ? (
            <>
              <div className="-mx-[18px] mt-4 border-y border-[color-mix(in_oklch,var(--accent)_35%,var(--border))] max-[360px]:-mx-3.5">
                <FilterPills
                  filters={filters}
                  onChange={setFilters}
                  keys={[...EXPLORE_FILTER_KEYS]}
                  pillDividers
                />
              </div>

              <div className="flex items-end justify-between gap-3 px-0.5 pb-[13px] pt-6">
                <h2 className="font-display text-[21px] text-foreground">
                  Near you
                </h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                  {exploreMeetups.length} meetups · {metaLabel}
                </span>
              </div>

              {exploreMeetups.length === 0 ? (
                <div className="border border-dashed border-border px-5 py-8 text-center text-xs text-muted">
                  No meetups match these filters. Try another city or broadcast
                  one.
                </div>
              ) : (
                <div className="grid gap-3 pb-2">
                  {exploreMeetups.map((meetup) =>
                    renderMeetupCard(meetup, {
                      requested: isMeetupRequested(meetup.id),
                      onRequestToggle: () => toggleMeetupRequest(meetup.id),
                      hideRequest: meetup.source === "created",
                    }),
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-end justify-between gap-3 px-0.5 pb-[13px] pt-6">
                <h2 className="font-display text-[21px] text-foreground">
                  Your calendar
                </h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                  {createdAsHosted.length + joinedMeetups.length} saved
                </span>
              </div>

              <div className="grid gap-6 pb-2">
                <section>
                  <h3 className="mb-3 px-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                    Hosted
                  </h3>
                  {createdAsHosted.length === 0 ? (
                    <div className="border border-dashed border-border px-5 py-6 text-center text-xs text-muted">
                      You have not hosted a meetup yet. Create one to see it
                      here.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {createdAsHosted.map((meetup) =>
                        renderMeetupCard(meetup, {
                          requested: false,
                          hideRequest: true,
                        }),
                      )}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="mb-3 px-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                    Joined / Requested
                  </h3>
                  {joinedMeetups.length === 0 ? (
                    <div className="border border-dashed border-border px-5 py-6 text-center text-xs text-muted">
                      No join requests yet. Explore a gathering and request a
                      spot.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {joinedMeetups.map((meetup) =>
                        renderMeetupCard(meetup, {
                          requested: true,
                          onRequestToggle: () =>
                            toggleMeetupRequest(meetup.id),
                        }),
                      )}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </section>
      </main>

      <BottomNav />

      <CreateMeetupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={addCreatedMeetup}
      />
    </div>
  );
}
