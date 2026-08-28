"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronUp, ExternalLink, Link2, MessageCircle, X } from "lucide-react";
import { AffiliationBadges } from "@/components/ui/AffiliationBadges";
import { PresenceDot } from "@/components/ui/PresenceDot";
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
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setShell(
      document.querySelector<HTMLElement>(".max-w-md.mx-auto.min-h-screen"),
    );
  }, []);

  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

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
  const online = user?.isOnline === true;
  const status = user?.status ?? (online ? "active" : "away");
  const photoUrl = user?.avatarUrl?.trim() || undefined;
  const skills = user?.skills ?? [];

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
                <div className="px-5 pt-6 pb-4">
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="relative grid size-[88px] place-items-center overflow-hidden rounded-[26px] border border-[color-mix(in_oklch,var(--accent)_52%,var(--border))] font-display text-[36px] text-foreground shadow-[0_0_32px_color-mix(in_oklch,var(--accent)_30%,transparent)]"
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
                          <span className="pointer-events-none absolute inset-x-4 top-3 h-[15px] rounded-full bg-[color-mix(in_oklch,var(--fg)_72%,transparent)] opacity-55" />
                          <span className="relative z-[1] mt-3">
                            {user.initial}
                          </span>
                        </>
                      )}
                    </div>

                    <h2
                      id="profile-popup-name"
                      className="mt-4 font-body text-[22px] font-semibold tracking-[-0.02em] text-foreground"
                    >
                      {user.name}
                    </h2>

                    <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                      <AffiliationBadges
                        isImsStudent={user.isImsStudent === true}
                        isSourceCodeAcademia={
                          user.isSourceCodeAcademia === true
                        }
                        isVsila={user.isVsila === true}
                        customAffiliation={user.customAffiliation}
                      />
                      <PresenceDot online={online} label={status} />
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

                  <AnimatePresence initial={false}>
                    {expanded ? (
                      <motion.div
                        key="expanded"
                        initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        transition={{ duration: reducedMotion ? 0.01 : 0.28 }}
                        className="overflow-hidden"
                      >
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

                        <div className="mt-5 rounded-[18px] border border-border bg-[color-mix(in_oklch,var(--surface)_88%,transparent)] p-4">
                          <div className="flex items-start justify-between gap-3.5">
                            <div>
                              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                                Community trust
                              </p>
                              <h3 className="mt-[3px] font-display text-[17px] text-foreground">
                                Reliability, reflected.
                              </h3>
                            </div>
                            <div className="text-right font-mono text-xl font-bold text-muted">
                              —
                              <small className="mt-0.5 block text-[9px] font-normal text-muted">
                                / 5 trust rating
                              </small>
                            </div>
                          </div>
                          <div className="mt-[17px] grid grid-cols-2 gap-2 border-t border-[color-mix(in_oklch,var(--border)_78%,transparent)] pt-3.5">
                            <div>
                              <strong className="block font-mono text-lg text-foreground">
                                0
                              </strong>
                              <span className="mt-[3px] block text-[9px] text-muted">
                                Completed meetups
                              </span>
                            </div>
                            <div>
                              <strong className="block font-mono text-lg text-muted">
                                —
                              </strong>
                              <span className="mt-[3px] block text-[9px] text-muted">
                                Show-up rate
                              </span>
                            </div>
                          </div>
                        </div>

                        {linkItems.length > 0 ? (
                          <div className="mt-5">
                            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                              Digital trail
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

                        <div className="mt-5">
                          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                            What I bring / Vibes
                          </p>
                          {skills.length > 0 ? (
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              {skills.map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-full border border-[color-mix(in_oklch,var(--accent)_40%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_10%,transparent)] px-2.5 py-1 text-[11px] text-foreground"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-[11px] text-muted">
                              No skills listed yet.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

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

              <div className="shrink-0 border-t border-[color-mix(in_oklch,var(--border)_78%,transparent)] bg-[color-mix(in_oklch,var(--surface)_92%,transparent)] px-5 py-3">
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-[color-mix(in_oklch,var(--accent)_45%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_8%,transparent)] text-sm font-medium text-foreground transition-[border-color,background] hover:border-accent hover:bg-[color-mix(in_oklch,var(--accent)_14%,transparent)]"
                >
                  {expanded ? (
                    <>
                      See less
                      <ChevronUp className="size-4 text-muted" aria-hidden />
                    </>
                  ) : (
                    <>
                      See more
                      <ChevronDown className="size-4 text-muted" aria-hidden />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>,
    shell,
  );
}
