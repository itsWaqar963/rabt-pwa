"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export type UserCardProps = {
  name: string;
  initial: string;
  subline: string;
  intents: string[];
  tags: string[];
  avatarVariant?: "default" | "blue" | "quiet";
  status?: string;
  onViewProfile?: () => void;
};

const AVATAR_BG: Record<NonNullable<UserCardProps["avatarVariant"]>, string> = {
  default:
    "radial-gradient(circle at 72% 22%, color-mix(in oklch, var(--accent) 58%, var(--surface)), transparent 30%), radial-gradient(circle at 30% 75%, color-mix(in oklch, var(--muted) 34%, var(--surface)), transparent 50%), var(--surface)",
  blue: "radial-gradient(circle at 20% 18%, color-mix(in oklch, var(--muted) 42%, var(--surface)), transparent 30%), radial-gradient(circle at 80% 80%, color-mix(in oklch, var(--accent) 38%, var(--surface)), transparent 50%), var(--surface)",
  quiet:
    "radial-gradient(circle at 70% 20%, color-mix(in oklch, var(--fg) 28%, var(--surface)), transparent 32%), radial-gradient(circle at 28% 78%, color-mix(in oklch, var(--muted) 46%, var(--surface)), transparent 50%), var(--surface)",
};

export function UserCard({
  name,
  initial,
  subline,
  intents,
  tags,
  avatarVariant = "default",
  status = "active",
  onViewProfile,
}: UserCardProps) {
  const reducedMotion = useReducedMotion();
  const intentText = intents.join("  ·  ") || "";
  const viewProfileClassName =
    "inline-flex min-h-11 shrink-0 items-center rounded-[11px] border border-border bg-transparent px-3 text-[11px] text-foreground transition-[border-color,background] duration-150 hover:border-foreground hover:bg-[color-mix(in_oklch,var(--fg)_6%,transparent)]";

  return (
    <article className="relative overflow-hidden rounded-[22px] border border-border bg-[color-mix(in_oklch,var(--surface)_88%,transparent)] p-4 shadow-[0_18px_48px_color-mix(in_oklch,var(--bg)_76%,transparent)]">
      <div className="grid grid-cols-[52px_1fr_auto] items-center gap-3 max-[360px]:grid-cols-[48px_1fr]">
        <div
          className="relative grid size-[52px] place-items-center overflow-hidden rounded-2xl border border-[color-mix(in_oklch,var(--fg)_24%,var(--border))] font-display text-[21px] text-foreground max-[360px]:size-12"
          style={{ background: AVATAR_BG[avatarVariant] }}
          aria-hidden
        >
          <span className="pointer-events-none absolute inset-x-3 top-2 h-[13px] rounded-full bg-[color-mix(in_oklch,var(--fg)_72%,transparent)] opacity-55" />
          <span className="relative z-[1] mt-[11px]">{initial}</span>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-[7px]">
            <h3 className="font-body text-[15px] font-semibold tracking-[-0.01em] text-foreground">
              {name}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_oklch,var(--accent)_45%,var(--border))] px-1.5 py-[3px] font-mono text-[8px] uppercase tracking-[0.04em] text-accent before:text-[9px] before:content-['✓']">
              IMS student
            </span>
          </div>
          <p className="mt-[3px] text-[11px] text-muted">{subline}</p>
        </div>

        <span className="flex items-center gap-[5px] whitespace-nowrap font-mono text-[9px] text-muted before:size-1.5 before:rounded-full before:bg-accent before:shadow-[0_0_12px_color-mix(in_oklch,var(--accent)_76%,transparent)] before:content-[''] max-[360px]:col-start-2">
          {status}
        </span>
      </div>

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
              animate={{ x: ["100%", "-100%"] }}
              transition={{
                repeat: Infinity,
                ease: "linear",
                duration: 15,
              }}
            >
              {intentText}
            </motion.p>
          )}
        </div>
      </div>

      <div className="mt-[15px] flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center whitespace-nowrap rounded-full border border-border px-2 py-1 text-[10px] text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
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
    </article>
  );
}
