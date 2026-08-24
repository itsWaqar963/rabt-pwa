"use client";

import { useEffect, useState } from "react";
import { Calendar, MapPin, MessageCircle } from "lucide-react";
import { useChatNotify } from "@/components/providers/ChatNotifyProvider";
import { MeetupChatModal } from "@/components/ui/MeetupChatModal";
import type { JoinRequestStatus, MeetupRequester } from "@/lib/meetup-store";
import { joinStatusLabel } from "@/lib/meetup-store";
import { initialsFromName } from "@/lib/profile-store";

export type MeetupCardProps = {
  meetupId: string;
  kind: string;
  title: string;
  status: string;
  description: string;
  location: string;
  when: string;
  organizerName: string;
  organizerRole: string;
  /** Google / profile photo for host */
  hostAvatarUrl?: string;
  spotsLeft?: number;
  requested?: boolean;
  onRequestToggle?: () => void;
  /** Hide request CTA for events you host */
  hideRequest?: boolean;
  /** Blur/hide exact venue until host accepts */
  venueLocked?: boolean;
  /** Show secure meetup chat toggle (host or accepted) */
  showChatToggle?: boolean;
  joinStatus?: JoinRequestStatus;
  onHide?: () => void;
  requesters?: MeetupRequester[];
  onRespondRequester?: (
    requesterId: string,
    status: "accepted" | "declined",
  ) => void;
};

function RequesterAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string;
}) {
  const initials = initialsFromName(name);
  const src = avatarUrl?.trim() || undefined;
  return (
    <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-[color-mix(in_oklch,var(--accent)_35%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_14%,transparent)]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote profile avatar
        <img
          src={src}
          alt=""
          className="size-full object-cover rounded-full"
        />
      ) : (
        <span
          aria-hidden
          className="font-display text-[11px] font-semibold leading-none text-accent"
        >
          {initials}
        </span>
      )}
    </span>
  );
}

function HostAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string;
}) {
  const initials = initialsFromName(name);
  const src = avatarUrl?.trim() || undefined;
  return (
    <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-[color-mix(in_oklch,var(--accent)_35%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_14%,transparent)]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote host avatar
        <img
          src={src}
          alt=""
          className="size-full object-cover rounded-full"
        />
      ) : (
        <span
          aria-hidden
          className="font-display text-[11px] font-semibold leading-none text-accent"
        >
          {initials}
        </span>
      )}
    </span>
  );
}

export function MeetupCard({
  meetupId,
  kind,
  title,
  status,
  description,
  location,
  when,
  organizerName,
  organizerRole,
  hostAvatarUrl,
  spotsLeft,
  requested = false,
  onRequestToggle,
  hideRequest = false,
  venueLocked = false,
  showChatToggle = false,
  joinStatus,
  onHide,
  requesters,
  onRespondRequester,
}: MeetupCardProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const { pendingOpenChat, clearPendingOpenChat } = useChatNotify();

  useEffect(() => {
    if (pendingOpenChat?.meetupId !== meetupId) return;
    if (!showChatToggle) return;
    setChatOpen(true);
    clearPendingOpenChat();
  }, [pendingOpenChat, meetupId, showChatToggle, clearPendingOpenChat]);

  const statusLabel =
    spotsLeft !== undefined ? `${spotsLeft} spots left` : status;

  const pendingRequesters =
    requesters?.filter((r) => r.status === "pending") ?? [];
  const decidedRequesters =
    requesters?.filter((r) => r.status !== "pending") ?? [];

  return (
    <article
      className={`rounded-[18px] border border-border bg-[color-mix(in_oklch,var(--surface)_88%,transparent)] p-4 shadow-[0_18px_48px_color-mix(in_oklch,var(--bg)_76%,transparent)] transition-[border-color] duration-150 hover:border-[color-mix(in_oklch,var(--fg)_44%,var(--border))] ${
        requested ? "is-requested" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent">
            {kind}
          </p>
          <h3 className="mt-[5px] font-display text-xl leading-[1.15] text-foreground">
            {title}
          </h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="rounded-full border border-border px-[7px] py-[5px] font-mono text-[9px] text-muted">
            {statusLabel}
          </span>
          {joinStatus ? (
            <span className="rounded-full border border-[color-mix(in_oklch,var(--accent)_40%,var(--border))] px-[7px] py-[3px] font-mono text-[8px] uppercase tracking-[0.06em] text-accent">
              {joinStatusLabel(joinStatus)}
            </span>
          ) : null}
        </div>
      </div>

      <p className="mt-[11px] text-xs leading-[1.55] text-muted">{description}</p>

      <div className="mt-[15px] grid gap-2 border-t border-[color-mix(in_oklch,var(--border)_72%,transparent)] pt-3.5">
        <div className="flex items-center gap-2 text-[11px] text-foreground">
          <MapPin className="size-4 shrink-0 text-accent" strokeWidth={1.7} aria-hidden />
          {venueLocked ? (
            <span
              className="select-none blur-[5px] opacity-70"
              aria-label="Venue hidden until approved"
              title="Venue unlocks after the host accepts"
            >
              Exact venue pending approval
            </span>
          ) : (
            location
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-foreground">
          <Calendar className="size-4 shrink-0 text-accent" strokeWidth={1.7} aria-hidden />
          {when}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        <HostAvatar name={organizerName} avatarUrl={hostAvatarUrl} />
        <p className="min-w-0 text-[10px] text-muted">
          Hosted by{" "}
          <strong className="font-semibold text-foreground">
            {organizerName}
          </strong>{" "}
          · {organizerRole}
        </p>
      </div>

      {showChatToggle ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[11px] border border-[color-mix(in_oklch,var(--accent)_45%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_10%,transparent)] px-3 text-[11px] font-semibold text-accent transition-[background] duration-150 hover:bg-[color-mix(in_oklch,var(--accent)_18%,transparent)]"
          >
            <MessageCircle className="size-3.5" strokeWidth={1.8} aria-hidden />
            Open meetup chat
          </button>
          <MeetupChatModal
            open={chatOpen}
            onClose={() => setChatOpen(false)}
            meetupId={meetupId}
            meetupTitle={title}
            canChat={showChatToggle}
          />
        </div>
      ) : null}

      {requesters && requesters.length > 0 ? (
        <div className="mt-3.5 rounded-[12px] border border-border bg-[color-mix(in_oklch,var(--surface)_70%,transparent)] px-3 py-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
            Join requests
          </p>
          {pendingRequesters.length === 0 && decidedRequesters.length === 0 ? (
            <p className="mt-2 text-[11px] text-muted">No requesters yet.</p>
          ) : null}
          <ul className="mt-2 grid gap-2">
            {pendingRequesters.map((requester) => (
              <li
                key={requester.id}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <RequesterAvatar
                    name={requester.name}
                    avatarUrl={requester.avatarUrl}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-foreground">
                      {requester.name}
                    </p>
                    <p className="font-mono text-[8px] uppercase tracking-[0.06em] text-accent">
                      Pending
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onRespondRequester?.(requester.id, "accepted")
                    }
                    className="min-h-9 rounded-[9px] border border-[color-mix(in_oklch,var(--accent)_55%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] px-2.5 text-[10px] font-semibold text-accent"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onRespondRequester?.(requester.id, "declined")
                    }
                    className="min-h-9 rounded-[9px] border border-border bg-transparent px-2.5 text-[10px] font-semibold text-muted"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
            {decidedRequesters.map((requester) => (
              <li
                key={requester.id}
                className="flex items-center justify-between gap-2 text-[11px]"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <RequesterAvatar
                    name={requester.name}
                    avatarUrl={requester.avatarUrl}
                  />
                  <span className="truncate text-foreground">
                    {requester.name}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.06em] text-muted">
                  {joinStatusLabel(requester.status)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hideRequest ? null : (
        <button
          type="button"
          onClick={onRequestToggle}
          className={`mt-[15px] min-h-11 w-full rounded-[11px] border text-[11px] font-semibold transition-[background,border-color,color] duration-150 ${
            requested
              ? "border-border bg-transparent text-muted"
              : "border-[color-mix(in_oklch,var(--accent)_60%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] text-accent hover:bg-[color-mix(in_oklch,var(--accent)_22%,transparent)]"
          }`}
        >
          {requested ? "Request sent" : "Request to Join"}
        </button>
      )}

      {onHide ? (
        <button
          type="button"
          onClick={onHide}
          className="mt-2 w-full py-1 text-center font-mono text-[9px] uppercase tracking-[0.08em] text-muted transition-colors hover:text-foreground"
        >
          Report / Hide
        </button>
      ) : null}
    </article>
  );
}
