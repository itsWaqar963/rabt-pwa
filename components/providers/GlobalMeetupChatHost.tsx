"use client";

import { useEffect, useState } from "react";
import { useChatNotify } from "@/components/providers/ChatNotifyProvider";
import { MeetupChatModal } from "@/components/ui/MeetupChatModal";

/**
 * Single shared MeetupChatModal for toast / SW / deep-link / card chat opens.
 * Lives under ChatNotifyProvider so it works on any route.
 */
export function GlobalMeetupChatHost() {
  const { pendingOpenChat, clearPendingOpenChat } = useChatNotify();
  const [open, setOpen] = useState(false);
  const [meetupId, setMeetupId] = useState("");
  const [title, setTitle] = useState("Meetup");

  useEffect(() => {
    if (!pendingOpenChat) return;
    setMeetupId(pendingOpenChat.meetupId);
    setTitle(pendingOpenChat.title || "Meetup");
    setOpen(true);
    clearPendingOpenChat();
  }, [pendingOpenChat, clearPendingOpenChat]);

  if (!meetupId) return null;

  return (
    <MeetupChatModal
      open={open}
      onClose={() => setOpen(false)}
      meetupId={meetupId}
      meetupTitle={title}
      canChat
    />
  );
}
