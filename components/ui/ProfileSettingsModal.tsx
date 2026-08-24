"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

export type ProfileSettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

type PreferenceKey = "notifications" | "meetupReminders" | "profileVisible";

const PREFERENCES: { key: PreferenceKey; label: string; description: string }[] =
  [
    {
      key: "notifications",
      label: "Push notifications",
      description: "Alerts for connect requests and meetup updates.",
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
}: ProfileSettingsModalProps) {
  const titleId = useId();
  const reducedMotion = useReducedMotion();
  const [shell, setShell] = useState<HTMLElement | null>(null);
  const [prefs, setPrefs] = useState<Record<PreferenceKey, boolean>>({
    notifications: true,
    meetupReminders: true,
    profileVisible: true,
  });

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
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!shell) return null;

  const duration = reducedMotion ? 0.01 : 0.28;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="absolute inset-0 z-[70] flex items-end justify-center p-4">
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
            className="relative z-[1] w-full max-w-[424px] rounded-[24px] border border-[color-mix(in_oklch,var(--accent)_48%,var(--border))] bg-[linear-gradient(165deg,color-mix(in_oklch,var(--accent)_10%,var(--surface)),var(--surface)_45%,var(--bg))] p-[22px] shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_18%,transparent),0_28px_80px_color-mix(in_oklch,var(--bg)_80%,transparent)]"
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
            <div className="flex items-start justify-between gap-3">
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

            <p className="mt-3 text-xs leading-[1.5] text-muted">
              Account preferences — toggles are placeholders for a future sync
              layer.
            </p>

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
                      {pref.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={prefs[pref.key]}
                    aria-label={pref.label}
                    onClick={() =>
                      setPrefs((prev) => ({
                        ...prev,
                        [pref.key]: !prev[pref.key],
                      }))
                    }
                    className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-[background,border-color] duration-200 ${
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

            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-[12px] border border-border px-3 text-sm text-foreground transition-colors hover:border-foreground"
            >
              Done
            </button>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    shell,
  );
}
