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
import {
  DarkSelectPopover,
  meetupFieldClass,
} from "@/components/ui/DarkSelectPopover";
import { SocialPlatformIcon } from "@/components/ui/SocialPlatformIcons";
import {
  FILTER_OPTIONS,
  getCityOptions,
  getFilterLabel,
} from "@/lib/discovery-filters";
import {
  parseProfileAgeGroup,
  parseProfileGender,
  parseSkillsInput,
  PROFILE_AGE_GROUP_OPTIONS,
  PROFILE_GENDER_OPTIONS,
  type ProfileAgeGroup,
  type ProfileData,
  type ProfileGender,
} from "@/lib/profile-store";
import {
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_META,
  trimSocialUrls,
  normalizeSocialUrls,
  type SocialUrls,
} from "@/lib/social-links";

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
  isImsStudent: boolean;
  isSourceCodeAcademia: boolean;
  gender: ProfileGender;
  ageGroup: ProfileAgeGroup;
  city: string;
  country: string;
};

type ClusterPopover = "country" | "city" | "gender" | "age" | null;

function toFormState(profile: ProfileData): FormState {
  return {
    activeIntent: profile.activeIntent,
    skills: [...profile.skills],
    skillInput: "",
    socialUrls: normalizeSocialUrls(profile.socialUrls),
    introvertExtrovert: profile.introvertExtrovert,
    isImsStudent: profile.isImsStudent,
    isSourceCodeAcademia: profile.isSourceCodeAcademia,
    gender: profile.gender,
    ageGroup: profile.ageGroup,
    city: profile.city,
    country: profile.country,
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
  const [openPopover, setOpenPopover] = useState<ClusterPopover>(null);

  useEffect(() => {
    setShell(
      document.querySelector<HTMLElement>(".max-w-md.mx-auto.min-h-screen"),
    );
  }, []);

  useEffect(() => {
    if (!open) return;
    setForm(toFormState(profile));
    setOpenPopover(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, profile]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (openPopover) {
        setOpenPopover(null);
        return;
      }
      onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, openPopover]);

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
      socialUrls: trimSocialUrls(form.socialUrls),
      introvertExtrovert: form.introvertExtrovert,
      isImsStudent: form.isImsStudent,
      isSourceCodeAcademia: form.isSourceCodeAcademia,
      gender: form.gender,
      ageGroup: form.ageGroup,
      city: form.city,
      country: form.country,
    });
    onClose();
  }

  const countryOptions = FILTER_OPTIONS.country.filter(
    (opt) => opt.value !== "all",
  );
  const cityOptions = getCityOptions(form.country).filter(
    (opt) => opt.value !== "all",
  );

  function setCountry(value: string) {
    setForm((prev) => {
      const cities = getCityOptions(value).filter((opt) => opt.value !== "all");
      const cityOk = cities.some((c) => c.value === prev.city);
      return {
        ...prev,
        country: value,
        city: cityOk ? prev.city : "",
      };
    });
  }

  if (!shell) return null;

  const duration = reducedMotion ? 0.01 : 0.28;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="rabt-modal-overlay absolute inset-0 z-[70] flex items-end justify-center px-4 pt-4">
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

            <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-visible px-[22px] pb-8 [scrollbar-width:thin]">
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
                  Cluster signals
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.07em] text-muted">
                      Country
                    </span>
                    <DarkSelectPopover
                      id="profile-country"
                      label="Country"
                      value={form.country}
                      options={countryOptions.map((opt) => ({
                        value: opt.value,
                        label: opt.label,
                      }))}
                      open={openPopover === "country"}
                      onOpenChange={(next) =>
                        setOpenPopover(next ? "country" : null)
                      }
                      onChange={setCountry}
                    />
                  </div>
                  <div>
                    <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.07em] text-muted">
                      City
                    </span>
                    <DarkSelectPopover
                      id="profile-city"
                      label="City"
                      value={form.city}
                      options={cityOptions.map((opt) => ({
                        value: opt.value,
                        label: getFilterLabel("city", opt.value),
                      }))}
                      open={openPopover === "city"}
                      onOpenChange={(next) =>
                        setOpenPopover(next ? "city" : null)
                      }
                      onChange={(value) =>
                        setForm((prev) => ({ ...prev, city: value }))
                      }
                    />
                  </div>
                  <div>
                    <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.07em] text-muted">
                      Gender
                    </span>
                    <DarkSelectPopover
                      id="profile-gender"
                      label="Gender"
                      value={form.gender}
                      options={PROFILE_GENDER_OPTIONS.map((opt) => ({
                        value: opt.value,
                        label: opt.label,
                      }))}
                      open={openPopover === "gender"}
                      onOpenChange={(next) =>
                        setOpenPopover(next ? "gender" : null)
                      }
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          gender: parseProfileGender(value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.07em] text-muted">
                      Age group
                    </span>
                    <DarkSelectPopover
                      id="profile-age"
                      label="Age group"
                      value={form.ageGroup}
                      options={PROFILE_AGE_GROUP_OPTIONS.map((opt) => ({
                        value: opt.value,
                        label: opt.label,
                      }))}
                      open={openPopover === "age"}
                      onOpenChange={(next) =>
                        setOpenPopover(next ? "age" : null)
                      }
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          ageGroup: parseProfileAgeGroup(value),
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

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

              <div>
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                  Digital trail
                </span>
                <p className="mb-3 text-[10px] leading-[1.45] text-muted">
                  All optional — add only the platforms you use.
                </p>
                <div className="space-y-2.5">
                  {SOCIAL_PLATFORMS.map((platform) => {
                    const meta = SOCIAL_PLATFORM_META[platform];
                    const filled = form.socialUrls[platform].trim().length > 0;
                    return (
                      <label
                        key={platform}
                        className={`flex items-center gap-3 rounded-[12px] border px-3 py-2.5 transition-[border-color,background] duration-150 ${
                          filled
                            ? "border-[color-mix(in_oklch,var(--accent)_45%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_6%,transparent)]"
                            : "border-border bg-black/30"
                        }`}
                      >
                        <span
                          className={`grid size-9 shrink-0 place-items-center rounded-full border ${
                            filled
                              ? "border-[color-mix(in_oklch,var(--accent)_50%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] text-accent"
                              : "border-border bg-[color-mix(in_oklch,var(--surface)_60%,transparent)] text-muted"
                          }`}
                          aria-hidden
                        >
                          <SocialPlatformIcon
                            platform={platform}
                            className="size-4"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.07em] text-muted">
                            {meta.label}
                          </span>
                          <input
                            type={meta.inputType}
                            value={form.socialUrls[platform]}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                socialUrls: {
                                  ...prev.socialUrls,
                                  [platform]: event.target.value,
                                },
                              }))
                            }
                            placeholder={meta.placeholder}
                            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-[color-mix(in_oklch,var(--muted)_72%,transparent)]"
                          />
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

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

              <fieldset className="rounded-[14px] border border-border bg-[color-mix(in_oklch,var(--surface)_72%,transparent)] p-3.5">
                <legend className="px-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                  Affiliations
                </legend>
                <label className="mt-1 flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.isImsStudent}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        isImsStudent: event.target.checked,
                      }))
                    }
                    className="mt-0.5 size-4 accent-[var(--accent)]"
                  />
                  <span>
                    <span className="block text-[13px] font-semibold text-foreground">
                      IMS
                    </span>
                    <span className="mt-0.5 block text-[10px] text-muted">
                      Show verified IMS badge on your card.
                    </span>
                  </span>
                </label>
                <label className="mt-3 flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.isSourceCodeAcademia}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        isSourceCodeAcademia: event.target.checked,
                      }))
                    }
                    className="mt-0.5 size-4 accent-[var(--accent)]"
                  />
                  <span>
                    <span className="block text-[13px] font-semibold text-foreground">
                      Source Code Academia
                    </span>
                    <span className="mt-0.5 block text-[10px] text-muted">
                      Show verified Source Code Academia badge.
                    </span>
                  </span>
                </label>
              </fieldset>
              <div className="h-8" aria-hidden />
            </div>

            <div className="rabt-modal-actions mt-0 flex shrink-0 gap-2 border-t border-[color-mix(in_oklch,var(--border)_70%,transparent)] px-[22px] pt-4 pb-[max(2rem,calc(env(safe-area-inset-bottom)+1.5rem))]">
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
