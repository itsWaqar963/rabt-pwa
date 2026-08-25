"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { ProfileData } from "@/lib/profile-store";
import {
  hasPushSubscription,
  isVapidPublicConfigured,
  registerPushSubscription,
} from "@/lib/push-subscribe";

export type ProfileSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  profile?: ProfileData;
  onSaveAffiliations?: (patch: {
    isImsStudent: boolean;
    isSourceCodeAcademia: boolean;
  }) => void;
};

type PreferenceKey = "notifications" | "meetupReminders" | "profileVisible";

const PREFERENCES: { key: PreferenceKey; label: string; description: string }[] =
  [
    {
      key: "notifications",
      label: "Enable notifications",
      description: "OS alerts for meetup chat when the app is in the background.",
    },
    {
      key: "meetupReminders",
      label: "Meetup reminders",
      description: "Nudge before hosted or joined events.",
    },
    {
      key: "profileVisible",
      label: "Discover visibility",
      description: "Show your growth card in local clusters.",
    },
  ];

export function ProfileSettingsModal({
  open,
  onClose,
  profile,
  onSaveAffiliations,
}: ProfileSettingsModalProps) {
  const titleId = useId();
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  const { logout } = useAuth();
  const [shell, setShell] = useState<HTMLElement | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [prefs, setPrefs] = useState<Record<PreferenceKey, boolean>>({
    notifications: false,
    meetupReminders: true,
    profileVisible: true,
  });
  const [isImsStudent, setIsImsStudent] = useState(
    profile?.isImsStudent ?? false,
  );
  const [isSourceCodeAcademia, setIsSourceCodeAcademia] = useState(
    profile?.isSourceCodeAcademia ?? false,
  );

  const syncNotificationPref = useCallback(async () => {
    if (typeof Notification === "undefined" || !isVapidPublicConfigured()) {
      setPrefs((prev) => ({ ...prev, notifications: false }));
      return;
    }
    if (Notification.permission !== "granted") {
      setPrefs((prev) => ({ ...prev, notifications: false }));
      return;
    }
    const sub = await hasPushSubscription();
    setPrefs((prev) => ({ ...prev, notifications: sub }));
  }, []);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await logout();
      onClose();
      router.replace("/welcome");
    } finally {
      setSigningOut(false);
    }
  }

  async function handleNotificationToggle() {
    if (notifyBusy || typeof Notification === "undefined") return;
    if (!isVapidPublicConfigured()) return;

    if (prefs.notifications) {
      setNotifyBusy(true);
      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager?.getSubscription();
          if (sub) await sub.unsubscribe();
        }
        setPrefs((prev) => ({ ...prev, notifications: false }));
      } catch (err) {
        console.info("[settings] push unsubscribe soft-fail", err);
      } finally {
        setNotifyBusy(false);
      }
      return;
    }

    setNotifyBusy(true);
    try {
      if (Notification.permission === "denied") {
        setPrefs((prev) => ({ ...prev, notifications: false }));
        return;
      }
      let result: NotificationPermission = Notification.permission;
      if (result !== "granted") {
        result = await Notification.requestPermission();
      }
      if (result !== "granted" || !("serviceWorker" in navigator)) {
        setPrefs((prev) => ({ ...prev, notifications: false }));
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const ok = await registerPushSubscription(reg);
      setPrefs((prev) => ({ ...prev, notifications: ok }));
    } catch (err) {
      console.info("[settings] enable notifications soft-fail", err);
      setPrefs((prev) => ({ ...prev, notifications: false }));
    } finally {
      setNotifyBusy(false);
    }
  }

  useEffect(() => {
    setShell(
      document.querySelector<HTMLElement>(".max-w-md.mx-auto.min-h-screen"),
    );
  }, []);

  useEffect(() => {
    if (!open || !profile) return;
    setIsImsStudent(profile.isImsStudent);
    setIsSourceCodeAcademia(profile.isSourceCodeAcademia);
  }, [open, profile]);

  useEffect(() => {
    if (!open) return;
    void syncNotificationPref();
  }, [open, syncNotificationPref]);

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
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!shell) return null;

  const duration = reducedMotion ? 0.01 : 0.28;

  function persistAffiliations(nextIms: boolean, nextSca: boolean) {
    onSaveAffiliations?.({
      isImsStudent: nextIms,
      isSourceCodeAcademia: nextSca,
    });
  }

  function onPrefClick(key: PreferenceKey) {
    switch (key) {
      case "notifications":
        void handleNotificationToggle();
        return;
      case "meetupReminders":
      case "profileVisible":
        setPrefs((prev) => ({
          ...prev,
          [key]: !prev[key],
        }));
        return;
      default: {
        const _exhaustive: never = key;
        return _exhaustive;
      }
    }
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="rabt-modal-overlay absolute inset-0 z-[70] flex items-end justify-center px-4 pt-4">
          <motion.button
            type="button"
            aria-label="Close settings"
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.22 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="rabt-modal-sheet relative z-[1] flex w-full max-w-[424px] flex-col overflow-hidden rounded-[24px] border border-[color-mix(in_oklch,var(--accent)_48%,var(--border))] bg-[linear-gradient(165deg,color-mix(in_oklch,var(--accent)_10%,var(--surface)),var(--surface)_45%,var(--bg))] shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_18%,transparent),0_28px_80px_color-mix(in_oklch,var(--bg)_80%,transparent)]"
            initial={
              reducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 16, scale: 0.98 }
            }
            transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 px-[22px] pt-[22px]">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                  Account
                </p>
                <h2
                  id={titleId}
                  className="mt-1 font-display text-[22px] text-foreground"
                >
                  Preferences
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-9 place-items-center rounded-full border border-border text-muted transition-colors hover:border-foreground hover:text-foreground"
              >
                <X className="size-4" strokeWidth={1.8} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-[22px] [scrollbar-width:thin]">
              <p className="mt-3 text-xs leading-[1.5] text-muted">
                Enable notifications uses a user gesture so the browser can show
                its permission prompt.
              </p>

              {onSaveAffiliations ? (
                <fieldset className="mt-5 space-y-3 rounded-[14px] border border-border bg-[color-mix(in_oklch,var(--surface)_72%,transparent)] p-3.5">
                  <legend className="px-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                    Affiliations
                  </legend>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isImsStudent}
                      onChange={(event) => {
                        const next = event.target.checked;
                        setIsImsStudent(next);
                        persistAffiliations(next, isSourceCodeAcademia);
                      }}
                      className="mt-0.5 size-4 accent-[var(--accent)]"
                    />
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        IMS
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted">
                        Verified IMS badge on Discover cards.
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSourceCodeAcademia}
                      onChange={(event) => {
                        const next = event.target.checked;
                        setIsSourceCodeAcademia(next);
                        persistAffiliations(isImsStudent, next);
                      }}
                      className="mt-0.5 size-4 accent-[var(--accent)]"
                    />
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        Source Code Academia
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted">
                        Verified Source Code Academia badge.
                      </span>
                    </span>
                  </label>
                </fieldset>
              ) : null}

              <ul className="mt-5 space-y-3">
                {PREFERENCES.map((pref) => (
                  <li
                    key={pref.key}
                    className="flex items-start justify-between gap-3 rounded-[14px] border border-border bg-[color-mix(in_oklch,var(--surface)_72%,transparent)] p-3.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {pref.label}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-[1.45] text-muted">
                        {pref.key === "notifications" &&
                        typeof Notification !== "undefined" &&
                        Notification.permission === "denied"
                          ? "Blocked in browser settings — allow notifications for this site, then toggle again."
                          : pref.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={prefs[pref.key]}
                      aria-label={pref.label}
                      disabled={pref.key === "notifications" && notifyBusy}
                      onClick={() => onPrefClick(pref.key)}
                      className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-[background,border-color] duration-200 disabled:opacity-50 ${
                        prefs[pref.key]
                          ? "border-[color-mix(in_oklch,var(--accent)_55%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_28%,transparent)]"
                          : "border-border bg-black/30"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 size-5 rounded-full bg-foreground shadow transition-[left] duration-200 ${
                          prefs[pref.key] ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rabt-modal-actions shrink-0 flex flex-col gap-2 px-[22px] pt-4">
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={signingOut}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-[color-mix(in_oklch,oklch(0.65_0.18_25)_40%,var(--border))] px-3 text-sm text-[oklch(0.78_0.12_25)] transition-colors hover:border-[oklch(0.7_0.15_25)] disabled:opacity-50"
              >
                <LogOut className="size-4" strokeWidth={1.8} />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-[12px] border border-border px-3 text-sm text-foreground transition-colors hover:border-foreground"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    shell,
  );
}
