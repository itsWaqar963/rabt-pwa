"use client";

import {
  useEffect,
  useId,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { meetupFieldClass } from "@/components/ui/DarkSelectPopover";
import {
  parseSkillsInput,
  type ProfileData,
  type SocialUrls,
} from "@/lib/profile-store";

export type EditProfileModalProps = {
  open: boolean;
  profile: ProfileData;
  onClose: () => void;
  onSave: (profile: ProfileData) => void;
};

type FormState = {
  activeIntent: string;
  skills: string[];
  skillInput: string;
  socialUrls: SocialUrls;
  introvertExtrovert: number;
};

function toFormState(profile: ProfileData): FormState {
  return {
    activeIntent: profile.activeIntent,
    skills: [...profile.skills],
    skillInput: "",
    socialUrls: { ...profile.socialUrls },
    introvertExtrovert: profile.introvertExtrovert,
  };
}

export function EditProfileModal({
  open,
  profile,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const titleId = useId();
  const reducedMotion = useReducedMotion();
  const [shell, setShell] = useState<HTMLElement | null>(null);
  const [form, setForm] = useState<FormState>(() => toFormState(profile));

  useEffect(() => {
    setShell(
      document.querySelector<HTMLElement>(".max-w-md.mx-auto.min-h-screen"),
    );
  }, []);

  useEffect(() => {
    if (!open) return;
    setForm(toFormState(profile));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, profile]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function addSkill(raw: string) {
    const next = parseSkillsInput(raw);
    if (next.length === 0) return;
    setForm((prev) => ({
      ...prev,
      skills: [...new Set([...prev.skills, ...next])],
      skillInput: "",
    }));
  }

  function removeSkill(skill: string) {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((item) => item !== skill),
    }));
  }

  function handleSkillKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSkill(form.skillInput);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSave({
      ...profile,
      activeIntent: form.activeIntent.trim(),
      skills: form.skills,
      socialUrls: {
        github: form.socialUrls.github.trim(),
        linkedin: form.socialUrls.linkedin.trim(),
        portfolio: form.socialUrls.portfolio.trim(),
      },
      introvertExtrovert: form.introvertExtrovert,
    });
    onClose();
  }

  if (!shell) return null;

  const duration = reducedMotion ? 0.01 : 0.28;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="absolute inset-0 z-[70] flex items-end justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close edit profile"
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.22 }}
            onClick={onClose}
          />

          <motion.form
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onSubmit={handleSubmit}
            className="relative z-[1] max-h-[calc(100dvh-32px)] w-full max-w-[424px] overflow-y-auto overflow-x-visible rounded-[24px] border border-[color-mix(in_oklch,var(--accent)_48%,var(--border))] bg-[linear-gradient(165deg,color-mix(in_oklch,var(--accent)_10%,var(--surface)),var(--surface)_45%,var(--bg))] p-[22px] shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_18%,transparent),0_28px_80px_color-mix(in_oklch,var(--bg)_80%,transparent)] [scrollbar-width:thin]"
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
                  Growth card
                </p>
                <h2
                  id={titleId}
                  className="mt-1 font-display text-[22px] text-foreground"
                >
                  Edit profile
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

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                  Active intent
                </span>
                <textarea
                  value={form.activeIntent}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      activeIntent: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="One intent, or separate with | for marquee rotation"
                  className={`${meetupFieldClass} min-h-[88px] resize-none py-2.5`}
                />
                <span className="mt-1 block text-[10px] text-muted">
                  Use | between intents to match the rotating marquee.
                </span>
              </label>

              <div>
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                  Skills &amp; services
                </span>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {form.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_oklch,var(--accent)_48%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_8%,transparent)] px-2 py-1 text-[10px] text-foreground"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        aria-label={`Remove ${skill}`}
                        className="text-muted transition-colors hover:text-foreground"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={form.skillInput}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      skillInput: event.target.value,
                    }))
                  }
                  onKeyDown={handleSkillKeyDown}
                  onBlur={() => addSkill(form.skillInput)}
                  placeholder="Add skill, press Enter or comma"
                  className={meetupFieldClass}
                />
              </div>

              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                  GitHub URL
                </span>
                <input
                  type="url"
                  value={form.socialUrls.github}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      socialUrls: {
                        ...prev.socialUrls,
                        github: event.target.value,
                      },
                    }))
                  }
                  placeholder="https://github.com/..."
                  className={meetupFieldClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                  LinkedIn URL
                </span>
                <input
                  type="url"
                  value={form.socialUrls.linkedin}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      socialUrls: {
                        ...prev.socialUrls,
                        linkedin: event.target.value,
                      },
                    }))
                  }
                  placeholder="https://linkedin.com/in/..."
                  className={meetupFieldClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                  Portfolio URL
                </span>
                <input
                  type="url"
                  value={form.socialUrls.portfolio}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      socialUrls: {
                        ...prev.socialUrls,
                        portfolio: event.target.value,
                      },
                    }))
                  }
                  placeholder="https://..."
                  className={meetupFieldClass}
                />
              </label>

              <div className="rounded-[14px] border border-border bg-[color-mix(in_oklch,var(--surface)_72%,transparent)] p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                    Introvert ↔ extrovert
                  </span>
                  <span className="font-mono text-sm font-bold text-accent">
                    {form.introvertExtrovert}/10
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2.5">
                  <span className="shrink-0 font-mono text-[9px] text-muted">
                    Quiet
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={form.introvertExtrovert}
                    aria-label="Introvert to extrovert score"
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        introvertExtrovert: Number(event.target.value),
                      }))
                    }
                    className="w-full cursor-pointer"
                    style={{ accentColor: "var(--accent)" }}
                  />
                  <span className="shrink-0 font-mono text-[9px] text-muted">
                    Open
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[12px] border border-border px-3 text-sm text-muted transition-colors hover:border-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[12px] border border-[color-mix(in_oklch,var(--accent)_60%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_16%,transparent)] px-3 text-sm font-semibold text-accent transition-[background,border-color] duration-150 hover:bg-[color-mix(in_oklch,var(--accent)_24%,transparent)]"
              >
                Save profile
              </button>
            </div>
          </motion.form>
        </div>
      ) : null}
    </AnimatePresence>,
    shell,
  );
}
