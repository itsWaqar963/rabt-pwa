"use client";

import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { AffiliationBadges } from "@/components/ui/AffiliationBadges";
import { PresenceDot } from "@/components/ui/PresenceDot";

export type UserCardMeetup = {
  id: string;
  title?: string;
  venue: string;
  when: string;
  description?: string;
  spotsLeft?: number;
  category?: string;
};

export type UserCardProps = {
  name: string;
  initial: string;
  subline: string;
  intents: string[];
  tags: string[];
  /** Google / profile photo URL */
  avatarUrl?: string;
  avatarVariant?: "default" | "blue" | "quiet";
  status?: string;
  personalityScore?: number;
  cityLabel?: string;
  countryLabel?: string;
  meetup?: UserCardMeetup;
  primaryAcked?: boolean;
  onPrimaryAction?: () => void;
  onViewProfile?: () => void;
  onHide?: () => void;
  isImsStudent?: boolean;
  isSourceCodeAcademia?: boolean;
  isVsila?: boolean;
  customAffiliation?: string;
  isOnline?: boolean;
};

const AVATAR_BG: Record<NonNullable<UserCardProps["avatarVariant"]>, string> = {
  default:
    "radial-gradient(circle at 72% 22%, color-mix(in oklch, var(--accent) 58%, var(--surface)), transparent 30%), radial-gradient(circle at 30% 75%, color-mix(in oklch, var(--muted) 34%, var(--surface)), transparent 50%), var(--surface)",
  blue: "radial-gradient(circle at 20% 18%, color-mix(in oklch, var(--muted) 42%, var(--surface)), transparent 30%), radial-gradient(circle at 80% 80%, color-mix(in oklch, var(--accent) 38%, var(--surface)), transparent 50%), var(--surface)",
  quiet:
    "radial-gradient(circle at 70% 20%, color-mix(in oklch, var(--fg) 28%, var(--surface)), transparent 32%), radial-gradient(circle at 28% 78%, color-mix(in oklch, var(--muted) 46%, var(--surface)), transparent 50%), var(--surface)",
};

function clampScore(score: number): number {
  return Math.min(10, Math.max(1, Math.round(score)));
}

export function UserCard({
  name,
  initial,
  subline,
  intents,
  tags,
  avatarUrl,
  avatarVariant = "default",
  status,
  personalityScore,
  cityLabel,
  countryLabel,
  meetup,
  primaryAcked = false,
  onPrimaryAction,
  onViewProfile,
  onHide,
  isImsStudent = false,
  isSourceCodeAcademia = false,
  isVsila = false,
  customAffiliation = "",
  isOnline = false,
}: UserCardProps) {
  const reducedMotion = useReducedMotion();
  const intentText = intents.join("  ·  ") || "";
  const hosted = Boolean(meetup);
  const score =
    personalityScore !== undefined ? clampScore(personalityScore) : null;
  const scorePct = score !== null ? ((score - 1) / 9) * 100 : 0;
  const photoUrl = avatarUrl?.trim() || undefined;
  const statusLabel = status ?? (isOnline ? "active" : "away");

  const viewProfileClassName =
    "inline-flex min-h-11 flex-1 items-center justify-center rounded-[11px] border border-border bg-transparent px-3 text-[11px] text-foreground transition-[border-color,background] duration-150 hover:border-foreground hover:bg-[color-mix(in_oklch,var(--fg)_6%,transparent)]";

  const primaryClassName = primaryAcked
    ? "inline-flex min-h-11 flex-1 items-center justify-center rounded-[11px] border border-border bg-transparent px-3 text-[11px] font-semibold text-muted transition-[background,border-color,color] duration-150"
    : "inline-flex min-h-11 flex-1 items-center justify-center rounded-[11px] border border-[color-mix(in_oklch,var(--accent)_60%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] px-3 text-[11px] font-semibold text-accent transition-[background,border-color] duration-150 hover:bg-[color-mix(in_oklch,var(--accent)_22%,transparent)]";

  const primaryLabel = hosted
    ? primaryAcked
      ? "Request sent"
      : "Request to Join"
    : primaryAcked
      ? "Reach out sent"
      : "Connect / Reach Out";

  const locationLine = [cityLabel, countryLabel].filter(Boolean).join(" · ");

  return (
    <article className="relative overflow-hidden rounded-[22px] border border-border bg-[color-mix(in_oklch,var(--surface)_88%,transparent)] p-4 shadow-[0_18px_48px_color-mix(in_oklch,var(--bg)_76%,transparent)]">
      <div className="grid grid-cols-[52px_1fr_auto] items-center gap-3 max-[360px]:grid-cols-[48px_1fr]">
        <div
          className="relative grid size-[52px] place-items-center overflow-hidden rounded-2xl border border-[color-mix(in_oklch,var(--fg)_24%,var(--border))] font-display text-[21px] text-foreground max-[360px]:size-12"
          style={{ background: AVATAR_BG[avatarVariant] }}
          aria-hidden
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote profile avatar
            <img
              src={photoUrl}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <>
              <span className="pointer-events-none absolute inset-x-3 top-2 h-[13px] rounded-full bg-[color-mix(in_oklch,var(--fg)_72%,transparent)] opacity-55" />
              <span className="relative z-[1] mt-[11px]">{initial}</span>
            </>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-[7px]">
            <h3 className="font-body text-[15px] font-semibold tracking-[-0.01em] text-foreground">
              {name}
            </h3>
            <AffiliationBadges
              isImsStudent={isImsStudent}
              isSourceCodeAcademia={isSourceCodeAcademia}
              isVsila={isVsila}
              customAffiliation={customAffiliation}
            />
          </div>
          <p className="mt-[3px] text-[11px] text-muted">{subline}</p>
          {locationLine ? (
            <p className="mt-1 font-mono text-[10px] text-muted">{locationLine}</p>
          ) : null}
        </div>

        <PresenceDot
          online={isOnline}
          label={statusLabel}
          className="max-[360px]:col-start-2"
        />
      </div>

      {score !== null ? (
        <div className="mt-3.5 rounded-[14px] border border-border bg-[color-mix(in_oklch,var(--surface)_72%,transparent)] px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
              Introvert ↔ Extrovert
            </p>
            <span className="font-mono text-[11px] font-bold text-accent">
              {score}/10
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="shrink-0 font-mono text-[8px] text-muted">Quiet</span>
            <div
              className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[color-mix(in_oklch,var(--fg)_10%,transparent)]"
              role="meter"
              aria-label="Personality score"
              aria-valuemin={1}
              aria-valuemax={10}
              aria-valuenow={score}
            >
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-accent shadow-[0_0_10px_color-mix(in_oklch,var(--accent)_60%,transparent)]"
                initial={false}
                animate={{ width: `${scorePct}%` }}
                transition={{
                  duration: reducedMotion ? 0 : 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </div>
            <span className="shrink-0 font-mono text-[8px] text-muted">Social</span>
          </div>
        </div>
      ) : null}

      <div className="mt-[15px] min-h-12 border-l-2 border-accent bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] px-3 py-2.5">
        <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent">
          Active intent
        </p>
        <div className="relative mt-0.5 overflow-hidden">
          {reducedMotion ? (
            <p className="truncate text-xs leading-[1.4] text-foreground">
              {intentText}
            </p>
          ) : (
            <motion.p
              className="whitespace-nowrap text-xs leading-[1.4] text-foreground"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                repeat: Infinity,
                ease: "linear",
                duration: Math.max(12, intentText.length * 0.35),
              }}
            >
              {intentText}
              <span className="px-8" aria-hidden>
                ·
              </span>
              {intentText}
            </motion.p>
          )}
        </div>
      </div>

      {meetup ? (
        <div className="mt-3.5 rounded-[14px] border border-[color-mix(in_oklch,var(--accent)_35%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_8%,transparent)] px-3 py-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent">
            Hosted meetup
          </p>
          {meetup.title ? (
            <h4 className="mt-1 font-display text-[15px] leading-[1.2] text-foreground">
              {meetup.title}
            </h4>
          ) : null}
          {meetup.description ? (
            <p className="mt-1.5 text-[11px] leading-[1.45] text-muted">
              {meetup.description}
            </p>
          ) : null}
          <div className="mt-2.5 grid gap-1.5">
            <div className="flex items-center gap-2 text-[11px] text-foreground">
              <MapPin
                className="size-3.5 shrink-0 text-accent"
                strokeWidth={1.7}
                aria-hidden
              />
              {meetup.venue}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-foreground">
              <Calendar
                className="size-3.5 shrink-0 text-accent"
                strokeWidth={1.7}
                aria-hidden
              />
              {meetup.when}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-[15px] flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center whitespace-nowrap rounded-full border border-border px-2 py-1 text-[10px] text-muted"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3.5 flex gap-2">
        {onPrimaryAction ? (
          <button
            type="button"
            onClick={onPrimaryAction}
            className={primaryClassName}
          >
            {primaryLabel}
          </button>
        ) : null}
        {onViewProfile ? (
          <button
            type="button"
            onClick={onViewProfile}
            className={viewProfileClassName}
          >
            View profile
          </button>
        ) : (
          <Link href="/profile" className={viewProfileClassName}>
            View profile
          </Link>
        )}
      </div>

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
