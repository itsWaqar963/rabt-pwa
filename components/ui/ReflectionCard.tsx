"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const FEEDBACK_TAGS = [
  "Punctual",
  "Great communication",
  "Inspiring",
  "Non-serious",
] as const;

export type ReflectionCardProps = {
  id: string;
  avatar: string;
  kicker?: string;
  title: string;
  date: string;
  location: string;
  memberCount: number;
};

export function ReflectionCard({
  id,
  avatar,
  kicker = "Physical meetup · attended",
  title,
  date,
  location,
  memberCount,
}: ReflectionCardProps) {
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  function handleStarClick(value: number) {
    setRating(value);
    setFeedback("");
    setIsSuccess(false);
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }

  function handleSubmit() {
    if (!rating) {
      setFeedback("Choose a rating before claiming your XP.");
      setIsSuccess(false);
      return;
    }
    setDone(true);
    setFeedback("Thank you. Your reflection strengthens the network.");
    setIsSuccess(true);
  }

  return (
    <article
      data-review={id}
      className={`rounded-[18px] border bg-[color-mix(in_oklch,var(--surface)_90%,transparent)] p-4 shadow-[0_18px_48px_color-mix(in_oklch,var(--bg)_76%,transparent)] transition-[border-color,transform] duration-200 ${
        done
          ? "border-[color-mix(in_oklch,var(--accent)_62%,var(--border))]"
          : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="grid size-[42px] shrink-0 place-items-center rounded-full border border-[color-mix(in_oklch,var(--accent)_42%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_13%,var(--surface))] font-display text-[21px] text-accent"
          aria-hidden
        >
          {avatar}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-accent">
            {kicker}
          </p>
          <h3 className="mt-1 font-display text-[19px] leading-[1.15] text-foreground">
            {title}
          </h3>
        </div>
        <span className="ml-auto shrink-0 whitespace-nowrap rounded-full border border-border px-[7px] py-[5px] font-mono text-[9px] text-muted max-[360px]:text-[8px]">
          {date}
        </span>
      </div>

      <p className="ml-[54px] mt-[13px] text-[11px] text-muted">
        {location} · with{" "}
        <strong className="font-semibold text-foreground">
          {memberCount} members
        </strong>
      </p>

      <p className="mt-[17px] font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
        How did it feel?
      </p>
      <div
        role="radiogroup"
        aria-label={`Rate ${title}`}
        className="mt-[7px] flex gap-[5px]"
      >
        {[1, 2, 3, 4, 5].map((value) => {
          const selected = value <= rating;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected && value === rating}
              aria-label={`${value} out of 5`}
              disabled={done}
              onClick={() => handleStarClick(value)}
              className={`grid size-11 place-items-center rounded-[10px] border text-[22px] transition-[border-color,background,color] duration-150 ${
                selected
                  ? "border-[color-mix(in_oklch,var(--accent)_66%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] text-accent"
                  : "border-border bg-transparent text-muted hover:border-[color-mix(in_oklch,var(--accent)_66%,var(--border))] hover:bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] hover:text-accent"
              } disabled:cursor-default disabled:opacity-70`}
            >
              ★
            </button>
          );
        })}
      </div>

      <p className="mt-3.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
        What stood out?
      </p>
      <div className="mt-[7px] flex flex-wrap gap-[7px]">
        {FEEDBACK_TAGS.map((tag) => {
          const active = selectedTags.has(tag);
          return (
            <button
              key={tag}
              type="button"
              disabled={done}
              onClick={() => toggleTag(tag)}
              className={`min-h-11 rounded-full border px-2.5 text-[10px] transition-[border-color,background,color] duration-150 ${
                active
                  ? "border-[color-mix(in_oklch,var(--accent)_58%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] text-foreground"
                  : "border-border bg-transparent text-muted hover:border-[color-mix(in_oklch,var(--accent)_58%,var(--border))] hover:bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] hover:text-foreground"
              } disabled:cursor-default disabled:opacity-70`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <textarea
        className="mt-[13px] min-h-[62px] w-full resize-y rounded-[10px] border border-border bg-[color-mix(in_oklch,var(--bg)_42%,var(--surface))] px-[11px] py-2.5 text-[11px] text-foreground placeholder:text-[color-mix(in_oklch,var(--muted)_78%,transparent)] focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[color-mix(in_oklch,var(--accent)_70%,var(--fg))] focus-visible:outline-offset-[3px] disabled:opacity-70"
        placeholder="Add an optional note for the group…"
        aria-label="Optional written review"
        value={note}
        disabled={done}
        onChange={(e) => setNote(e.target.value)}
      />

      <motion.button
        type="button"
        disabled={done}
        onClick={handleSubmit}
        whileTap={done ? undefined : { scale: 0.97 }}
        className="mt-3 min-h-[46px] w-full rounded-[11px] border border-[color-mix(in_oklch,var(--accent)_65%,var(--border))] bg-accent text-[11px] font-bold text-[color-mix(in_oklch,var(--bg)_82%,var(--accent))] transition-[filter] duration-150 hover:brightness-110 disabled:cursor-default disabled:border-border disabled:bg-transparent disabled:text-muted disabled:filter-none"
      >
        {done ? "+50 XP claimed" : "Submit Review & Claim XP"}
      </motion.button>

      <p
        aria-live="polite"
        className={`mt-2 min-h-[15px] text-[10px] ${isSuccess ? "text-accent" : "text-muted"}`}
      >
        {feedback}
      </p>
    </article>
  );
}
