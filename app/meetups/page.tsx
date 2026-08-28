"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { BottomNav } from "@/components/layout/BottomNav";
import { useChatNotify } from "@/components/providers/ChatNotifyProvider";
import { useMeetupStore } from "@/components/providers/MeetupStoreProvider";
import { CreateMeetupModal } from "@/components/ui/CreateMeetupModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterPills } from "@/components/ui/FilterPills";
import { MeetupCard } from "@/components/ui/MeetupCard";
import { ProfileHeaderButton } from "@/components/ui/ProfileHeaderButton";
import { useAuth } from "@/context/AuthContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  DEFAULT_FILTERS,
  getFilterMetaLabel,
  type DiscoveryFilters,
} from "@/lib/discovery-filters";
import { type HostedMeetup } from "@/lib/discovery-users";
import {
  countAcceptedRequesters,
  createdMeetupToHosted,
  filterHostedMeetups,
  isActiveJoinRequest,
  type JoinRequestStatus,
  type MeetupRequester,
} from "@/lib/meetup-store";

type Tab = "explore" | "events";

const EXPLORE_FILTER_KEYS = ["country", "city"] as const;

function renderMeetupCard(
  meetup: HostedMeetup,
  opts: {
    requested: boolean;
    onRequestToggle?: () => void;
    hideRequest?: boolean;
    venueLocked?: boolean;
    showChatToggle?: boolean;
    joinStatus?: JoinRequestStatus;
    onHide?: () => void;
    onDelete?: () => void;
    requesters?: MeetupRequester[];
    onRespondRequester?: (
      requesterId: string,
      status: "accepted" | "declined",
    ) => void;
  },
) {
  return (
    <MeetupCard
      key={meetup.id}
      meetupId={meetup.id}
      kind={meetup.kind}
      title={meetup.title}
      status={meetup.status}
      description={meetup.description}
      location={meetup.location}
      when={meetup.when}
      organizerName={meetup.organizerName}
      organizerRole={meetup.organizerRole}
      hostAvatarUrl={meetup.hostAvatarUrl}
      hostIsImsStudent={meetup.hostIsImsStudent}
      hostIsSourceCodeAcademia={meetup.hostIsSourceCodeAcademia}
      spotsLeft={meetup.spotsLeft}
      requested={opts.requested}
      onRequestToggle={opts.onRequestToggle}
      hideRequest={opts.hideRequest}
      venueLocked={opts.venueLocked}
      showChatToggle={opts.showChatToggle}
      joinStatus={opts.joinStatus}
      onHide={opts.onHide}
      onDelete={opts.onDelete}
      requesters={opts.requesters}
      onRespondRequester={opts.onRespondRequester}
    />
  );
}

export default function MeetupsPage() {
  return (
    <Suspense fallback={null}>
      <MeetupsPageContent />
    </Suspense>
  );
}

function MeetupsPageContent() {
  const [activeTab, setActiveTab] = useState<Tab>("explore");
  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters] = useState<DiscoveryFilters>(DEFAULT_FILTERS);
  const [deleteTarget, setDeleteTarget] = useState<HostedMeetup | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const { requestOpenChat } = useChatNotify();
  const chatDeepLinkHandled = useRef<string | null>(null);

  const {
    createdMeetups,
    remoteMeetups,
    loading,
    hydrated,
    isMeetupRequested,
    getJoinStatus,
    toggleMeetupRequest,
    addCreatedMeetup,
    getRequesters,
    respondToRequester,
    hideMeetup,
    isMeetupHidden,
    deleteHostedMeetup,
  } = useMeetupStore();
  const { isOffline } = useNetworkStatus();

  const createdAsHosted = useMemo(
    () =>
      createdMeetups
        .map((m) =>
          createdMeetupToHosted(
            m,
            countAcceptedRequesters(getRequesters(m.id)),
          ),
        )
        .filter((m) => !isMeetupHidden(m.id)),
    [createdMeetups, isMeetupHidden, getRequesters],
  );

  const allExplore = useMemo(() => {
    const byId = new Map<string, HostedMeetup>();
    for (const m of remoteMeetups) {
      if (!isMeetupHidden(m.id)) byId.set(m.id, m);
    }
    for (const m of createdAsHosted) {
      if (!byId.has(m.id)) byId.set(m.id, m);
    }
    return [...byId.values()];
  }, [remoteMeetups, createdAsHosted, isMeetupHidden]);

  useEffect(() => {
    if (!hydrated) return;
    const chatId = searchParams.get("chat")?.trim();
    if (!chatId) return;
    if (chatDeepLinkHandled.current === chatId) return;
    chatDeepLinkHandled.current = chatId;
    const title =
      allExplore.find((m) => m.id === chatId)?.title ??
      createdMeetups.find((m) => m.id === chatId)?.title ??
      "Meetup chat";
    requestOpenChat(chatId, title);
  }, [
    hydrated,
    searchParams,
    allExplore,
    createdMeetups,
    requestOpenChat,
  ]);

  const exploreMeetups = useMemo(
    () => filterHostedMeetups(allExplore, filters.country, filters.city),
    [allExplore, filters.country, filters.city],
  );

  const hostedMine = useMemo(() => {
    const authId = user?.id;
    return allExplore.filter((m) => {
      if (authId && m.hostUserId === authId) return true;
      if (m.hostUserId === "self" && createdMeetups.some((c) => c.id === m.id)) {
        return true;
      }
      return m.source === "created";
    });
  }, [allExplore, user?.id, createdMeetups]);

  const joinedMeetups = useMemo(
    () =>
      allExplore.filter((m) => {
        const status = getJoinStatus(m.id);
        if (!isActiveJoinRequest(status)) return false;
        // Exclude own hosted from Joined section
        if (user?.id && m.hostUserId === user.id) return false;
        if (m.source === "created" && m.hostUserId === "self") return false;
        return true;
      }),
    [allExplore, getJoinStatus, user?.id],
  );

  const goingMeetups = useMemo(
    () => joinedMeetups.filter((m) => getJoinStatus(m.id) === "accepted"),
    [joinedMeetups, getJoinStatus],
  );

  const awaitingMeetups = useMemo(
    () => joinedMeetups.filter((m) => getJoinStatus(m.id) === "pending"),
    [joinedMeetups, getJoinStatus],
  );

  const metaLabel = getFilterMetaLabel(filters);
  const isExplore = activeTab === "explore";

  function openCreate() {
    setCreateOpen(true);
  }

  return (
    <AuthGuard>
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_80%_4%,color-mix(in_oklch,var(--muted)_9%,transparent),transparent_20rem),var(--bg)]">
      <main className="relative z-[1] h-[100dvh] overflow-y-auto px-[18px] pb-[max(96px,calc(max(20px,env(safe-area-inset-bottom,0px))+80px))] pt-[max(18px,env(safe-area-inset-top))] [scrollbar-width:none] max-[360px]:px-3.5 [&::-webkit-scrollbar]:hidden">
        <header className="relative z-10 flex min-h-12 items-center justify-between gap-2">
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
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={openCreate}
              disabled={isOffline}
              className={`inline-flex min-h-11 items-center gap-[7px] rounded-[11px] border px-3 text-[11px] font-semibold transition-[background,border-color] duration-150 max-[360px]:px-2.5 ${
                isOffline
                  ? "cursor-not-allowed border-border bg-transparent text-muted opacity-50"
                  : "border-[color-mix(in_oklch,var(--accent)_60%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] text-accent hover:bg-[color-mix(in_oklch,var(--accent)_22%,transparent)]"
              }`}
            >
              {!isOffline ? (
                <span className="text-lg font-normal leading-none">+</span>
              ) : null}
              {isOffline ? "Requires Internet" : "Create Meetup"}
            </button>
            <ProfileHeaderButton />
          </div>
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
                  {loading
                    ? "Loading…"
                    : `${exploreMeetups.length} meetups · ${metaLabel}`}
                </span>
              </div>

              {loading && exploreMeetups.length === 0 ? (
                <div className="grid gap-3 pb-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-36 animate-pulse rounded-[14px] border border-border bg-[color-mix(in_oklch,var(--surface)_60%,transparent)]"
                    />
                  ))}
                </div>
              ) : exploreMeetups.length === 0 ? (
                <div className="border border-dashed border-border px-5 py-8 text-center text-xs text-muted">
                  No meetups match these filters. Try another city or broadcast
                  one.
                </div>
              ) : (
                <div className="grid gap-3 pb-2">
                  {exploreMeetups.map((meetup) => {
                    const isHost =
                      (user?.id && meetup.hostUserId === user.id) ||
                      meetup.source === "created";
                    const accepted =
                      getJoinStatus(meetup.id) === "accepted";
                    return renderMeetupCard(meetup, {
                      requested: isMeetupRequested(meetup.id),
                      onRequestToggle: () => toggleMeetupRequest(meetup.id),
                      hideRequest: isHost,
                      venueLocked: isHost ? false : !accepted,
                      onHide: () => hideMeetup(meetup.id),
                    });
                  })}
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
                  {hostedMine.length +
                    goingMeetups.length +
                    awaitingMeetups.length}{" "}
                  saved
                </span>
              </div>

              <div className="grid gap-6 pb-2">
                <section>
                  <h3 className="mb-3 px-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                    Hosted
                  </h3>
                  {hostedMine.length === 0 ? (
                    <div className="border border-dashed border-border px-5 py-6 text-center text-xs text-muted">
                      You have not hosted a meetup yet. Create one to see it
                      here.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {hostedMine.map((meetup) =>
                        renderMeetupCard(meetup, {
                          requested: false,
                          hideRequest: true,
                          showChatToggle: true,
                          requesters: getRequesters(meetup.id),
                          onRespondRequester: (requesterId, status) =>
                            respondToRequester(meetup.id, requesterId, status),
                          onHide: () => hideMeetup(meetup.id),
                          onDelete: () => setDeleteTarget(meetup),
                        }),
                      )}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="mb-3 px-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                    Going
                  </h3>
                  {goingMeetups.length === 0 ? (
                    <div className="border border-dashed border-border px-5 py-6 text-center text-xs text-muted">
                      No accepted meetups yet. When a host accepts you, it
                      shows here with the venue unlocked.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {goingMeetups.map((meetup) =>
                        renderMeetupCard(meetup, {
                          requested: true,
                          onRequestToggle: () =>
                            toggleMeetupRequest(meetup.id),
                          venueLocked: false,
                          showChatToggle: true,
                          joinStatus: "accepted",
                          onHide: () => hideMeetup(meetup.id),
                        }),
                      )}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="mb-3 px-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                    Awaiting Host Approval
                  </h3>
                  {awaitingMeetups.length === 0 ? (
                    <div className="border border-dashed border-border px-5 py-6 text-center text-xs text-muted">
                      No pending requests. Explore a gathering and request a
                      spot.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {awaitingMeetups.map((meetup) =>
                        renderMeetupCard(meetup, {
                          requested: true,
                          onRequestToggle: () =>
                            toggleMeetupRequest(meetup.id),
                          venueLocked: true,
                          showChatToggle: false,
                          joinStatus: "pending",
                          onHide: () => hideMeetup(meetup.id),
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
        onSubmit={(input) => {
          void addCreatedMeetup(input);
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete meetup?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be removed for everyone. Join requests and chat messages are deleted too.`
            : ""
        }
        confirmLabel="Delete"
        danger
        busy={deleteBusy}
        onCancel={() => {
          if (!deleteBusy) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (!deleteTarget) return;
          setDeleteBusy(true);
          void deleteHostedMeetup(deleteTarget.id).then((ok) => {
            setDeleteBusy(false);
            if (ok) setDeleteTarget(null);
          });
        }}
      />
    </div>
    </AuthGuard>
  );
}
