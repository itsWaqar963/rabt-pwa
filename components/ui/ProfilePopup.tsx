"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Link2, MessageCircle, X } from "lucide-react";
import { getFilterLabel } from "@/lib/discovery-filters";
import type { DiscoveryUser } from "@/lib/discovery-users";

export type ProfilePopupProps = {
  user: DiscoveryUser | null;
  open: boolean;
  onClose: () => void;
  onHide?: () => void;
};

const AVATAR_BG: Record<
  NonNullable<DiscoveryUser["avatarVariant"]>,
  string
> = {
  default:
    "radial-gradient(circle at 72% 22%, color-mix(in oklch, var(--accent) 58%, var(--surface)), transparent 30%), radial-gradient(circle at 30% 75%, color-mix(in oklch, var(--muted) 34%, var(--surface)), transparent 50%), var(--surface)",
  blue: "radial-gradient(circle at 20% 18%, color-mix(in oklch, var(--muted) 42%, var(--surface)), transparent 30%), radial-gradient(circle at 80% 80%, color-mix(in oklch, var(--accent) 38%, var(--surface)), transparent 50%), var(--surface)",
  quiet:
    "radial-gradient(circle at 70% 20%, color-mix(in oklch, var(--fg) 28%, var(--surface)), transparent 32%), radial-gradient(circle at 28% 78%, color-mix(in oklch, var(--muted) 46%, var(--surface)), transparent 50%), var(--surface)",
};

function clampScore(score: number): number {
  return Math.min(10, Math.max(1, Math.round(score)));
}

export function ProfilePopup({ user, open, onClose, onHide }: ProfilePopupProps) {
  const reducedMotion = useReducedMotion();
  const [shell, setShell] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setShell(
      document.querySelector<HTMLElement>(".max-w-md.mx-auto.min-h-screen"),
    );
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleBackdrop = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!shell) return null;

  const duration = reducedMotion ? 0.01 : 0.32;
  const score = user ? clampScore(user.personalityScore) : 1;
  const scorePct = ((score - 1) / 9) * 100;
  const intentText = user?.intents.join("  ·  ") || "";
  const avatarVariant = user?.avatarVariant ?? "default";
  const status = user?.status ?? "active";

  const cluster = user
    ? [
        { label: "City", value: getFilterLabel("city", user.city) },
        { label: "Country", value: getFilterLabel("country", user.country) },
        { label: "Gender", value: getFilterLabel("gender", user.gender) },
        {
          label: "Age Group",
          value: getFilterLabel("age", user.ageGroup),
        },
      ]
    : [];

  const linkItems = user
    ? (
        [
          {
            key: "github",
            label: "GitHub",
            href: user.links.github,
            Icon: Link2,
          },
          {
            key: "linkedin",
            label: "LinkedIn",
            href: user.links.linkedin,
            Icon: ExternalLink,
          },
          {
            key: "contact",
            label: "WhatsApp",
            href: user.links.contact,
            Icon: MessageCircle,
          },
        ] as const
      ).filter((item) => Boolean(item.href))
    : [];

  return createPortal(
    <AnimatePresence>
      {open && user ? (
        <div className="absolute inset-0 z-[60]" role="presentation">
          <motion.button
            type="button"
            aria-label="Close profile"
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.22 }}
            onClick={handleBackdrop}
          />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 py-[max(20px,env(safe-area-inset-top))]">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-popup-name"
              className="pointer-events-auto relative flex max-h-[min(88dvh,720px)] w-full max-w-[340px] flex-col overflow-hidden rounded-[28px] border border-[color-mix(in_oklch,var(--accent)_55%,var(--border))] bg-[linear-gradient(160deg,color-mix(in_oklch,var(--accent)_12%,var(--surface)),var(--surface)_42%,var(--bg))] shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_22%,transparent),0_0_48px_color-mix(in_oklch,var(--accent)_28%,transparent),0_28px_64px_color-mix(in_oklch,var(--bg)_85%,transparent)]"
              initial={
                reducedMotion ? false : { opacity: 0, scale: 0.92, y: 28 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.94, y: 20 }
              }
              transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full border border-border bg-[color-mix(in_oklch,var(--surface)_80%,transparent)] text-foreground transition-[border-color,background,transform] duration-150 hover:border-foreground hover:bg-[color-mix(in_oklch,var(--fg)_8%,transparent)] active:scale-95"
              >
                <X className="size-4" strokeWidth={1.8} aria-hidden />
              </button>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[color-mix(in_oklch,var(--accent)_40%,transparent)]">
                <div className="px-5 pt-6 pb-7">
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="relative grid size-[88px] place-items-center overflow-hidden rounded-[26px] border border-[color-mix(in_oklch,var(--accent)_52%,var(--border))] font-display text-[36px] text-foreground shadow-[0_0_32px_color-mix(in_oklch,var(--accent)_30%,transparent)]"
                      style={{ background: AVATAR_BG[avatarVariant] }}
                      aria-hidden
                    >
                      <span className="pointer-events-none absolute inset-x-4 top-3 h-[15px] rounded-full bg-[color-mix(in_oklch,var(--fg)_72%,transparent)] opacity-55" />
                      <span className="relative z-[1] mt-3">{user.initial}</span>
                    </div>

                    <h2
                      id="profile-popup-name"
                      className="mt-4 font-body text-[22px] font-semibold tracking-[-0.02em] text-foreground"
                    >
                      {user.name}
                    </h2>

                    <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_oklch,var(--accent)_45%,var(--border))] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.04em] text-accent before:text-[10px] before:content-['✓']">
                        IMS student
                      </span>
                      <span className="flex items-center gap-[5px] whitespace-nowrap font-mono text-[10px] text-muted before:size-1.5 before:rounded-full before:bg-accent before:shadow-[0_0_12px_color-mix(in_oklch,var(--accent)_76%,transparent)] before:content-['']">
                        {status}
                      </span>
                    </div>

                    <p className="mt-2 text-[12px] text-muted">{user.subline}</p>
                  </div>

                  <div className="mt-5 min-h-12 border-l-2 border-accent bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] px-3 py-2.5 text-left">
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

                  <div className="mt-5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                      Cluster
                    </p>
                    <dl className="mt-2.5 grid grid-cols-2 gap-2">
                      {cluster.map((row) => (
                        <div
                          key={row.label}
                          className="rounded-[14px] border border-border bg-[color-mix(in_oklch,var(--surface)_72%,transparent)] px-3 py-2.5"
                        >
                          <dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
                            {row.label}
                          </dt>
                          <dd className="mt-1 text-[13px] font-medium text-foreground">
                            {row.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div className="mt-5 rounded-[18px] border border-border bg-[color-mix(in_oklch,var(--surface)_88%,transparent)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-[16px] text-foreground">
                          Introvert ↔ Extrovert
                        </h3>
                        <p className="mt-1 text-[11px] text-muted">
                          Conversation energy signal
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-base font-bold text-accent">
                        {score}/10
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2.5">
                      <span className="shrink-0 font-mono text-[9px] text-muted">
                        Quiet
                      </span>
                      <div
                        className="relative h-2 flex-1 overflow-hidden rounded-full bg-[color-mix(in_oklch,var(--fg)_10%,transparent)]"
                        role="meter"
                        aria-label="Personality score"
                        aria-valuemin={1}
                        aria-valuemax={10}
                        aria-valuenow={score}
                      >
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full bg-accent shadow-[0_0_14px_color-mix(in_oklch,var(--accent)_70%,transparent)]"
                          initial={false}
                          animate={{ width: `${scorePct}%` }}
                          transition={{
                            duration: reducedMotion ? 0 : 0.45,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        />
                      </div>
                      <span className="shrink-0 font-mono text-[9px] text-muted">
                        Social
                      </span>
                    </div>
                  </div>

                  {linkItems.length > 0 ? (
                    <div className="mt-5">
                      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                        Links
                      </p>
                      <div className="mt-2.5 flex flex-col gap-2">
                        {linkItems.map(({ key, label, href, Icon }) => (
                          <a
                            key={key}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 items-center gap-2.5 rounded-[14px] border border-border bg-[color-mix(in_oklch,var(--surface)_70%,transparent)] px-3.5 text-[13px] text-foreground transition-[border-color,background] duration-150 hover:border-accent hover:bg-[color-mix(in_oklch,var(--accent)_10%,transparent)]"
                          >
                            <Icon
                              className="size-4 text-accent"
                              strokeWidth={1.7}
                              aria-hidden
                            />
                            <span className="flex-1">{label}</span>
                            <span className="font-mono text-[10px] text-muted">
                              ↗
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {onHide ? (
                    <button
                      type="button"
                      onClick={onHide}
                      className="mt-5 w-full py-2 text-center font-mono text-[9px] uppercase tracking-[0.08em] text-muted transition-colors hover:text-foreground"
                    >
                      Report / Hide
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>,
    shell,
  );
}
