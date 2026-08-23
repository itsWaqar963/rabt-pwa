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
  ensureHostRequesters,
  isActiveJoinRequest,
  migrateJoinRequests,
  parseAckState,
  parseCreatedMeetups,
  parseHiddenIds,
  parseHostRequesters,
  parseJoinRequests,
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

type MeetupStoreValue = {
  hydrated: boolean;
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
  addCreatedMeetup: (input: CreateMeetupInput) => CreatedMeetup;
  getRequesters: (meetupId: string) => MeetupRequester[];
  respondToRequester: (
    meetupId: string,
    requesterId: string,
    status: "accepted" | "declined",
  ) => void;
  hideUser: (userId: string) => void;
  hideMeetup: (meetupId: string) => void;
};

const MeetupStoreContext = createContext<MeetupStoreValue | null>(null);

export function MeetupStoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
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
    (userId: string) => connectIds.has(userId),
    [connectIds],
  );

  const isUserHidden = useCallback(
    (userId: string) => hiddenUserIds.has(userId),
    [hiddenUserIds],
  );

  const isMeetupHidden = useCallback(
    (meetupId: string) => hiddenMeetupIds.has(meetupId),
    [hiddenMeetupIds],
  );

  const toggleMeetupRequest = useCallback((meetupId: string) => {
    setJoinRequests((prev) => {
      const current = prev[meetupId];
      if (current === "pending" || current === "accepted") {
        const next = { ...prev };
        delete next[meetupId];
        return next;
      }
      return { ...prev, [meetupId]: "pending" };
    });
  }, []);

  const toggleConnect = useCallback((userId: string) => {
    setAcks((prev) => ({
      ...prev,
      connectIds: toggleIdInList(prev.connectIds, userId),
    }));
  }, []);

  const addCreatedMeetup = useCallback((input: CreateMeetupInput) => {
    const next = buildCreatedMeetup(input);
    setCreatedMeetups((prev) => [next, ...prev]);
    setHostRequesters((prev) => ({
      ...prev,
      [next.id]: seedPendingRequesters(next.id),
    }));
    return next;
  }, []);

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
      setHostRequesters((prev) => {
        const list = prev[meetupId];
        if (!list) return prev;
        return {
          ...prev,
          [meetupId]: list.map((r) =>
            r.id === requesterId ? { ...r, status } : r,
          ),
        };
      });
      // Single-device demo: Accept mirrors attendee path for this meetup.
      if (status === "accepted") {
        setJoinRequests((prev) => ({ ...prev, [meetupId]: "accepted" }));
      }
    },
    [],
  );

  const hideUser = useCallback((userId: string) => {
    setHidden((prev) => ({
      ...prev,
      userIds: addIdOnce(prev.userIds, userId),
    }));
  }, []);

  const hideMeetup = useCallback((meetupId: string) => {
    setHidden((prev) => ({
      ...prev,
      meetupIds: addIdOnce(prev.meetupIds, meetupId),
    }));
  }, []);

  const value = useMemo<MeetupStoreValue>(
    () => ({
      hydrated,
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
    }),
    [
      hydrated,
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
