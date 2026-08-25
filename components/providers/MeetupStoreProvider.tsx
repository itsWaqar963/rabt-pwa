"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import type { HostedMeetup } from "@/lib/discovery-users";
import {
  CREATED_MEETUPS_KEY,
  EMPTY_ACKS,
  EMPTY_HIDDEN,
  HIDDEN_IDS_KEY,
  HOST_REQUESTERS_KEY,
  JOIN_REQUESTS_KEY,
  MEETUP_ACKS_KEY,
  addIdOnce,
  buildCreatedMeetup,
  computeSpotsLeft,
  countAcceptedRequesters,
  ensureHostRequesters,
  isActiveJoinRequest,
  isLocalCreatedMeetupId,
  migrateJoinRequests,
  parseAckState,
  parseCreatedMeetups,
  parseHiddenIds,
  parseHostRequesters,
  parseJoinRequests,
  purgeMeetupLocalMaps,
  seedPendingRequesters,
  toggleIdInList,
  type CreateMeetupInput,
  type CreatedMeetup,
  type HiddenIdsState,
  type HostRequestersState,
  type JoinRequestStatus,
  type JoinRequestsState,
  type MeetupAckState,
  type MeetupRequester,
} from "@/lib/meetup-store";
import {
  deleteMeetup as deleteMeetupRemote,
  deletePendingJoinRequest,
  fetchHostJoinRequests,
  fetchMeetupsWithHosts,
  fetchMyJoinRequests,
  hostedToCreatedMeetup,
  insertJoinRequest,
  insertMeetup,
  updateJoinRequestStatus,
} from "@/lib/meetup-sync";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type MeetupStoreValue = {
  hydrated: boolean;
  loading: boolean;
  remoteMeetups: HostedMeetup[];
  meetupIds: ReadonlySet<string>;
  connectIds: ReadonlySet<string>;
  createdMeetups: CreatedMeetup[];
  joinRequests: JoinRequestsState;
  hostRequesters: HostRequestersState;
  hiddenUserIds: ReadonlySet<string>;
  hiddenMeetupIds: ReadonlySet<string>;
  isMeetupRequested: (meetupId: string) => boolean;
  getJoinStatus: (meetupId: string) => JoinRequestStatus | undefined;
  isConnectAcked: (userId: string) => boolean;
  isUserHidden: (userId: string) => boolean;
  isMeetupHidden: (meetupId: string) => boolean;
  toggleMeetupRequest: (meetupId: string) => void;
  toggleConnect: (userId: string) => void;
  addCreatedMeetup: (input: CreateMeetupInput) => Promise<CreatedMeetup>;
  getRequesters: (meetupId: string) => MeetupRequester[];
  respondToRequester: (
    meetupId: string,
    requesterId: string,
    status: "accepted" | "declined",
  ) => void;
  hideUser: (userId: string) => void;
  hideMeetup: (meetupId: string) => void;
  deleteHostedMeetup: (meetupId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const MeetupStoreContext = createContext<MeetupStoreValue | null>(null);

function canUseRemote(userId: string | undefined | null): boolean {
  return Boolean(isSupabaseConfigured && userId);
}

export function MeetupStoreProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remoteMeetups, setRemoteMeetups] = useState<HostedMeetup[]>([]);
  const [acks, setAcks] = useState<MeetupAckState>(EMPTY_ACKS);
  const [createdMeetups, setCreatedMeetups] = useState<CreatedMeetup[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequestsState>({});
  const [hostRequesters, setHostRequesters] = useState<HostRequestersState>(
    {},
  );
  const [hidden, setHidden] = useState<HiddenIdsState>(EMPTY_HIDDEN);

  useEffect(() => {
    const ackState = parseAckState(
      window.localStorage.getItem(MEETUP_ACKS_KEY),
    );
    const created = parseCreatedMeetups(
      window.localStorage.getItem(CREATED_MEETUPS_KEY),
    );
    const storedJoins = parseJoinRequests(
      window.localStorage.getItem(JOIN_REQUESTS_KEY),
    );
    const joins = migrateJoinRequests(storedJoins, ackState.meetupIds);
    const requesters = ensureHostRequesters(
      created,
      parseHostRequesters(window.localStorage.getItem(HOST_REQUESTERS_KEY)),
    );
    const hiddenIds = parseHiddenIds(
      window.localStorage.getItem(HIDDEN_IDS_KEY),
    );

    setAcks({ meetupIds: [], connectIds: ackState.connectIds });
    setCreatedMeetups(created);
    setJoinRequests(joins);
    setHostRequesters(requesters);
    setHidden(hiddenIds);
    setHydrated(true);
  }, []);

  const refresh = useCallback(async () => {
    if (!canUseRemote(userId) || !userId) {
      setRemoteMeetups([]);
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return;
    }

    setLoading(true);
    try {
      const [meetups, myJoins, hostReqs] = await Promise.all([
        fetchMeetupsWithHosts(),
        fetchMyJoinRequests(userId),
        fetchHostJoinRequests(userId),
      ]);

      setRemoteMeetups(meetups);

      const hostedMine = meetups.filter((m) => m.hostUserId === userId);
      const remoteCreated = hostedMine
        .map(hostedToCreatedMeetup)
        .filter((m): m is CreatedMeetup => m !== null);

      setCreatedMeetups((prev) => {
        const localOnly = prev.filter((m) => isLocalCreatedMeetupId(m.id));
        const byId = new Map<string, CreatedMeetup>();
        for (const m of remoteCreated) byId.set(m.id, m);
        for (const m of localOnly) {
          if (!byId.has(m.id)) byId.set(m.id, m);
        }
        return [...byId.values()];
      });

      setJoinRequests((prev) => ({ ...prev, ...myJoins }));

      setHostRequesters((prev) => {
        const next: HostRequestersState = { ...prev };
        for (const meetup of hostedMine) {
          next[meetup.id] = hostReqs[meetup.id] ?? [];
        }
        for (const [meetupId, list] of Object.entries(hostReqs)) {
          next[meetupId] = list;
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!hydrated || authLoading) return;
    void refresh();
  }, [hydrated, authLoading, refresh]);

  useEffect(() => {
    if (!hydrated || !canUseRemote(userId)) return;

    const onFocus = () => {
      void refresh();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hydrated, userId, refresh]);

  // Supabase Dashboard → Database → Replication must enable `meetups` + `join_requests` for realtime.
  useEffect(() => {
    if (!hydrated || !canUseRemote(userId)) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void refresh();
      }, 300);
    };

    const dropMeetupLocally = (meetupId: string) => {
      setRemoteMeetups((prev) => prev.filter((m) => m.id !== meetupId));
      setCreatedMeetups((prev) => {
        const purged = purgeMeetupLocalMaps(meetupId, prev, {}, {});
        return purged.created;
      });
      setJoinRequests((prev) => {
        const next = { ...prev };
        delete next[meetupId];
        return next;
      });
      setHostRequesters((prev) => {
        const next = { ...prev };
        delete next[meetupId];
        return next;
      });
    };

    const channel = supabase
      .channel("rabt-meetups")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meetups" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as { id?: string } | null)?.id;
            if (id) {
              dropMeetupLocally(id);
              return;
            }
          }
          scheduleRefresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "join_requests" },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      void supabase.removeChannel(channel);
    };
  }, [hydrated, userId, refresh]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      MEETUP_ACKS_KEY,
      JSON.stringify({
        meetupIds: Object.keys(joinRequests),
        connectIds: acks.connectIds,
      }),
    );
  }, [acks.connectIds, joinRequests, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      CREATED_MEETUPS_KEY,
      JSON.stringify(createdMeetups),
    );
  }, [createdMeetups, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      JOIN_REQUESTS_KEY,
      JSON.stringify(joinRequests),
    );
  }, [joinRequests, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      HOST_REQUESTERS_KEY,
      JSON.stringify(hostRequesters),
    );
  }, [hostRequesters, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(HIDDEN_IDS_KEY, JSON.stringify(hidden));
  }, [hidden, hydrated]);

  const meetupIds = useMemo(
    () =>
      new Set(
        Object.entries(joinRequests)
          .filter(([, status]) => isActiveJoinRequest(status))
          .map(([id]) => id),
      ),
    [joinRequests],
  );
  const connectIds = useMemo(() => new Set(acks.connectIds), [acks.connectIds]);
  const hiddenUserIds = useMemo(
    () => new Set(hidden.userIds),
    [hidden.userIds],
  );
  const hiddenMeetupIds = useMemo(
    () => new Set(hidden.meetupIds),
    [hidden.meetupIds],
  );

  const isMeetupRequested = useCallback(
    (meetupId: string) => meetupIds.has(meetupId),
    [meetupIds],
  );

  const getJoinStatus = useCallback(
    (meetupId: string) => joinRequests[meetupId],
    [joinRequests],
  );

  const isConnectAcked = useCallback(
    (userIdArg: string) => connectIds.has(userIdArg),
    [connectIds],
  );

  const isUserHidden = useCallback(
    (id: string) => hiddenUserIds.has(id),
    [hiddenUserIds],
  );

  const isMeetupHidden = useCallback(
    (meetupId: string) => hiddenMeetupIds.has(meetupId),
    [hiddenMeetupIds],
  );

  const toggleMeetupRequest = useCallback(
    (meetupId: string) => {
      const current = joinRequests[meetupId];

      if (current === "pending" || current === "accepted") {
        // Optimistic local cancel; remote delete only for pending (may RLS-fail)
        setJoinRequests((prev) => {
          const next = { ...prev };
          delete next[meetupId];
          return next;
        });
        if (
          current === "pending" &&
          canUseRemote(userId) &&
          userId &&
          typeof navigator !== "undefined" &&
          navigator.onLine
        ) {
          void deletePendingJoinRequest(meetupId, userId);
        }
        return;
      }

      setJoinRequests((prev) => ({ ...prev, [meetupId]: "pending" }));

      if (
        !canUseRemote(userId) ||
        !userId ||
        typeof navigator === "undefined" ||
        !navigator.onLine
      ) {
        return;
      }

      void insertJoinRequest(meetupId, userId).then((status) => {
        if (!status) {
          console.error(
            "[meetup-store] insertJoinRequest failed; keeping local pending",
          );
          return;
        }
        setJoinRequests((prev) => ({ ...prev, [meetupId]: status }));
      });
    },
    [joinRequests, userId],
  );

  const toggleConnect = useCallback((connectUserId: string) => {
    setAcks((prev) => ({
      ...prev,
      connectIds: toggleIdInList(prev.connectIds, connectUserId),
    }));
  }, []);

  const addCreatedMeetup = useCallback(
    async (input: CreateMeetupInput): Promise<CreatedMeetup> => {
      const applyLocal = (next: CreatedMeetup, seed: boolean) => {
        setCreatedMeetups((prev) => [next, ...prev.filter((m) => m.id !== next.id)]);
        if (seed) {
          setHostRequesters((prev) => ({
            ...prev,
            [next.id]: seedPendingRequesters(next.id),
          }));
        } else {
          setHostRequesters((prev) => ({
            ...prev,
            [next.id]: prev[next.id] ?? [],
          }));
        }
        return next;
      };

      if (
        canUseRemote(userId) &&
        userId &&
        typeof navigator !== "undefined" &&
        navigator.onLine
      ) {
        const remote = await insertMeetup(userId, input);
        if (remote) {
          const hosted = await fetchMeetupsWithHosts();
          if (hosted.length > 0) {
            setRemoteMeetups(hosted);
          } else {
            const asHosted: HostedMeetup = {
              id: remote.id,
              kind: `Physical gathering · ${remote.category.toLowerCase()}`,
              title: remote.title,
              status: `${remote.maxSpots} spots left`,
              description:
                remote.description.trim() ||
                `${remote.category} meetup at ${remote.venue}.`,
              location: remote.venue,
              when: `${remote.date} · ${remote.time}`,
              organizerName: user?.name ?? "You",
              organizerRole: "Host",
              hostUserId: userId,
              hostAvatarUrl: user?.avatarUrl,
              spotsLeft: remote.maxSpots,
              acceptedCount: 0,
              city: remote.city,
              country: remote.country,
              source: "remote",
              date: remote.date,
              time: remote.time,
              category: remote.category,
              venue: remote.venue,
              maxSpots: remote.maxSpots,
              descriptionRaw: remote.description,
              createdAt: remote.createdAt,
              hostIsOnline: true,
            };
            setRemoteMeetups((prev) =>
              prev.some((m) => m.id === remote.id)
                ? prev
                : [asHosted, ...prev],
            );
          }
          return applyLocal(remote, false);
        }
        console.error(
          "[meetup-store] insertMeetup failed; falling back to local create",
        );
      }

      const next = buildCreatedMeetup(input);
      if (userId) {
        next.hostUserId = userId;
      }
      return applyLocal(next, true);
    },
    [userId, user?.name],
  );

  const getRequesters = useCallback(
    (meetupId: string) => hostRequesters[meetupId] ?? [],
    [hostRequesters],
  );

  const respondToRequester = useCallback(
    (
      meetupId: string,
      requesterId: string,
      status: "accepted" | "declined",
    ) => {
      const list = hostRequesters[meetupId];
      const existing = list?.find((r) => r.id === requesterId);

      setHostRequesters((prev) => {
        const current = prev[meetupId];
        if (!current) return prev;
        return {
          ...prev,
          [meetupId]: current.map((r) =>
            r.id === requesterId ? { ...r, status } : r,
          ),
        };
      });

      // Optimistic spotsLeft on accept/decline
      setRemoteMeetups((prev) =>
        prev.map((m) => {
          if (m.id !== meetupId) return m;
          const nextList = (list ?? []).map((r) =>
            r.id === requesterId ? { ...r, status } : r,
          );
          const accepted = countAcceptedRequesters(nextList);
          const max = m.maxSpots ?? m.spotsLeft + (m.acceptedCount ?? 0);
          const spotsLeft = computeSpotsLeft(max, accepted);
          return {
            ...m,
            acceptedCount: accepted,
            spotsLeft,
            status: `${spotsLeft} spots left`,
            maxSpots: max,
          };
        }),
      );

      // Same-device: if I accepted myself as requester, mirror join status
      if (status === "accepted" && requesterId === userId) {
        setJoinRequests((prev) => ({ ...prev, [meetupId]: "accepted" }));
      }

      if (
        canUseRemote(userId) &&
        typeof navigator !== "undefined" &&
        navigator.onLine
      ) {
        void updateJoinRequestStatus(
          existing?.requestId
            ? { requestId: existing.requestId, status }
            : { meetupId, requesterId, status },
        ).then((ok) => {
          if (!ok) {
            console.error(
              "[meetup-store] updateJoinRequestStatus failed; local state kept",
            );
          }
        });
      }
    },
    [hostRequesters, userId],
  );

  const hideUser = useCallback((id: string) => {
    setHidden((prev) => ({
      ...prev,
      userIds: addIdOnce(prev.userIds, id),
    }));
  }, []);

  const hideMeetup = useCallback((meetupId: string) => {
    setHidden((prev) => ({
      ...prev,
      meetupIds: addIdOnce(prev.meetupIds, meetupId),
    }));
  }, []);

  const deleteHostedMeetup = useCallback(
    async (meetupId: string): Promise<boolean> => {
      const applyLocalPurge = () => {
        setRemoteMeetups((prev) => prev.filter((m) => m.id !== meetupId));
        setCreatedMeetups((prev) => {
          const purged = purgeMeetupLocalMaps(
            meetupId,
            prev,
            joinRequests,
            hostRequesters,
          );
          setJoinRequests(purged.joinRequests);
          setHostRequesters(purged.hostRequesters);
          return purged.created;
        });
      };

      if (
        canUseRemote(userId) &&
        typeof navigator !== "undefined" &&
        navigator.onLine &&
        !meetupId.startsWith("created-")
      ) {
        const ok = await deleteMeetupRemote(meetupId);
        if (!ok) return false;
        applyLocalPurge();
        return true;
      }

      // Local-only meetup
      applyLocalPurge();
      return true;
    },
    [userId, joinRequests, hostRequesters],
  );

  const value = useMemo<MeetupStoreValue>(
    () => ({
      hydrated,
      loading,
      remoteMeetups,
      meetupIds,
      connectIds,
      createdMeetups,
      joinRequests,
      hostRequesters,
      hiddenUserIds,
      hiddenMeetupIds,
      isMeetupRequested,
      getJoinStatus,
      isConnectAcked,
      isUserHidden,
      isMeetupHidden,
      toggleMeetupRequest,
      toggleConnect,
      addCreatedMeetup,
      getRequesters,
      respondToRequester,
      hideUser,
      hideMeetup,
      deleteHostedMeetup,
      refresh,
    }),
    [
      hydrated,
      loading,
      remoteMeetups,
      meetupIds,
      connectIds,
      createdMeetups,
      joinRequests,
      hostRequesters,
      hiddenUserIds,
      hiddenMeetupIds,
      isMeetupRequested,
      getJoinStatus,
      isConnectAcked,
      isUserHidden,
      isMeetupHidden,
      toggleMeetupRequest,
      toggleConnect,
      addCreatedMeetup,
      getRequesters,
      respondToRequester,
      hideUser,
      hideMeetup,
      deleteHostedMeetup,
      refresh,
    ],
  );

  return (
    <MeetupStoreContext.Provider value={value}>
      {children}
    </MeetupStoreContext.Provider>
  );
}

export function useMeetupStore(): MeetupStoreValue {
  const ctx = useContext(MeetupStoreContext);
  if (!ctx) {
    throw new Error("useMeetupStore must be used within MeetupStoreProvider");
  }
  return ctx;
}
