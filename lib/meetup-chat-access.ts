import { useMemo } from "react";
import { useMeetupStore } from "@/components/providers/MeetupStoreProvider";
import { useAuth } from "@/context/AuthContext";

/** Host or accepted attendee — same gate as MeetupCard `showChatToggle`. */
export function useMeetupChatEligible(meetupId: string): boolean {
  const { user } = useAuth();
  const { hydrated, createdMeetups, joinRequests, remoteMeetups } =
    useMeetupStore();
  const myId = user?.id;

  return useMemo(() => {
    if (!meetupId.trim()) return false;
    // Optimistic until local meetup state hydrates; RLS remains authoritative.
    if (!hydrated) return true;
    if (!myId) return false;

    if (createdMeetups.some((m) => m.id === meetupId)) return true;
    if (remoteMeetups.some((m) => m.id === meetupId && m.hostUserId === myId)) {
      return true;
    }
    return joinRequests[meetupId] === "accepted";
  }, [createdMeetups, hydrated, joinRequests, meetupId, myId, remoteMeetups]);
}
