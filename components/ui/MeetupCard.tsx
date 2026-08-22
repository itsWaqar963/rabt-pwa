"use client";

import { Calendar, MapPin } from "lucide-react";

export type MeetupCardProps = {
  kind: string;
  title: string;
  status: string;
  description: string;
  location: string;
  when: string;
  organizerName: string;
  organizerRole: string;
  requested?: boolean;
  onRequestToggle?: () => void;
};

export function MeetupCard({
  kind,
  title,
  status,
  description,
  location,
  when,
  organizerName,
  organizerRole,
  requested = false,
  onRequestToggle,
}: MeetupCardProps) {
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
        <span className="shrink-0 rounded-full border border-border px-[7px] py-[5px] font-mono text-[9px] text-muted">
          {status}
        </span>
      </div>

      <p className="mt-[11px] text-xs leading-[1.55] text-muted">{description}</p>

      <div className="mt-[15px] grid gap-2 border-t border-[color-mix(in_oklch,var(--border)_72%,transparent)] pt-3.5">
        <div className="flex items-center gap-2 text-[11px] text-foreground">
          <MapPin className="size-4 shrink-0 text-accent" strokeWidth={1.7} aria-hidden />
          {location}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-foreground">
          <Calendar className="size-4 shrink-0 text-accent" strokeWidth={1.7} aria-hidden />
          {when}
        </div>
      </div>

      <p className="mt-3 text-[10px] text-muted">
        Hosted by <strong className="font-semibold text-foreground">{organizerName}</strong> · {organizerRole}
      </p>

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
    </article>
  );
}
