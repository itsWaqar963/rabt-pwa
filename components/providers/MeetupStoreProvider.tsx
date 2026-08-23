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
  MEETUP_ACKS_KEY,
  buildCreatedMeetup,
  parseAckState,
  parseCreatedMeetups,
  toggleIdInList,
  type CreateMeetupInput,
  type CreatedMeetup,
  type MeetupAckState,
} from "@/lib/meetup-store";

type MeetupStoreValue = {
  hydrated: boolean;
  meetupIds: ReadonlySet<string>;
  connectIds: ReadonlySet<string>;
  createdMeetups: CreatedMeetup[];
  isMeetupRequested: (meetupId: string) => boolean;
  isConnectAcked: (userId: string) => boolean;
  toggleMeetupRequest: (meetupId: string) => void;
  toggleConnect: (userId: string) => void;
  addCreatedMeetup: (input: CreateMeetupInput) => CreatedMeetup;
};

const MeetupStoreContext = createContext<MeetupStoreValue | null>(null);

export function MeetupStoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [acks, setAcks] = useState<MeetupAckState>(EMPTY_ACKS);
  const [createdMeetups, setCreatedMeetups] = useState<CreatedMeetup[]>([]);

  useEffect(() => {
    setAcks(parseAckState(window.localStorage.getItem(MEETUP_ACKS_KEY)));
    setCreatedMeetups(
      parseCreatedMeetups(window.localStorage.getItem(CREATED_MEETUPS_KEY)),
    );
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(MEETUP_ACKS_KEY, JSON.stringify(acks));
  }, [acks, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      CREATED_MEETUPS_KEY,
      JSON.stringify(createdMeetups),
    );
  }, [createdMeetups, hydrated]);

  const meetupIds = useMemo(() => new Set(acks.meetupIds), [acks.meetupIds]);
  const connectIds = useMemo(() => new Set(acks.connectIds), [acks.connectIds]);

  const isMeetupRequested = useCallback(
    (meetupId: string) => meetupIds.has(meetupId),
    [meetupIds],
  );

  const isConnectAcked = useCallback(
    (userId: string) => connectIds.has(userId),
    [connectIds],
  );

  const toggleMeetupRequest = useCallback((meetupId: string) => {
    setAcks((prev) => ({
      ...prev,
      meetupIds: toggleIdInList(prev.meetupIds, meetupId),
    }));
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
    return next;
  }, []);

  const value = useMemo<MeetupStoreValue>(
    () => ({
      hydrated,
      meetupIds,
      connectIds,
      createdMeetups,
      isMeetupRequested,
      isConnectAcked,
      toggleMeetupRequest,
      toggleConnect,
      addCreatedMeetup,
    }),
    [
      hydrated,
      meetupIds,
      connectIds,
      createdMeetups,
      isMeetupRequested,
      isConnectAcked,
      toggleMeetupRequest,
      toggleConnect,
      addCreatedMeetup,
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
