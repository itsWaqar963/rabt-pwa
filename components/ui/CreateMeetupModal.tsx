"use client";

import {
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import {
  DarkSelectPopover,
  meetupFieldClass,
} from "@/components/ui/DarkSelectPopover";
import { DatePopover } from "@/components/ui/DatePopover";
import { TimePopover } from "@/components/ui/TimePopover";
import {
  FILTER_OPTIONS,
  getCityOptions,
  getFilterLabel,
} from "@/lib/discovery-filters";
import {
  getContentWarningMessage,
  textsContainRestrictedContent,
} from "@/lib/content-guard";
import {
  MEETUP_CATEGORIES,
  type CreateMeetupInput,
  type MeetupCategory,
} from "@/lib/meetup-store";

export type CreateMeetupModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateMeetupInput) => void;
};

type FormState = {
  title: string;
  category: MeetupCategory;
  venue: string;
  date: string;
  time: string;
  maxSpots: string;
  city: string;
  country: string;
};

type PopoverId = "category" | "date" | "time" | "country" | "city" | null;

const INITIAL_FORM: FormState = {
  title: "",
  category: "Study",
  venue: "",
  date: "",
  time: "",
  maxSpots: "8",
  city: "lahore",
  country: "pakistan",
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.title.trim()) errors.title = "Title is needed.";
  if (!form.venue.trim()) errors.venue = "Venue is needed.";
  if (!form.date) errors.date = "Date is needed.";
  if (!form.time) errors.time = "Time is needed.";
  const spots = Number(form.maxSpots);
  if (!Number.isFinite(spots) || spots < 1 || spots > 99) {
    errors.maxSpots = "Enter spots between 1 and 99.";
  }
  if (!form.country || form.country === "all") {
    errors.country = "Country is needed.";
  }
  if (!form.city || form.city === "all") {
    errors.city = "City is needed.";
  }
  return errors;
}

export function CreateMeetupModal({
  open,
  onClose,
  onSubmit,
}: CreateMeetupModalProps) {
  const titleId = useId();
  const reducedMotion = useReducedMotion();
  const [shell, setShell] = useState<HTMLElement | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [contentWarning, setContentWarning] = useState<string | null>(null);
  const [openPopover, setOpenPopover] = useState<PopoverId>(null);

  useEffect(() => {
    setShell(
      document.querySelector<HTMLElement>(".max-w-md.mx-auto.min-h-screen"),
    );
  }, []);

  useEffect(() => {
    if (!open) return;
    setForm(INITIAL_FORM);
    setErrors({});
    setContentWarning(null);
    setOpenPopover(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
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

  const cityOptions = getCityOptions(form.country).filter(
    (opt) => opt.value !== "all",
  );
  const countryOptions = FILTER_OPTIONS.country.filter(
    (opt) => opt.value !== "all",
  );
  const categoryOptions = MEETUP_CATEGORIES.map((category) => ({
    value: category,
    label: category,
  }));

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "country") {
        const cities = getCityOptions(String(value)).filter(
          (opt) => opt.value !== "all",
        );
        if (!cities.some((c) => c.value === next.city)) {
          next.city = cities[0]?.value ?? "";
        }
      }
      return next;
    });
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setContentWarning(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setOpenPopover(null);
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (textsContainRestrictedContent(form.title, form.venue)) {
      setContentWarning(getContentWarningMessage());
      return;
    }
    setContentWarning(null);

    onSubmit({
      title: form.title,
      category: form.category,
      venue: form.venue,
      date: form.date,
      time: form.time,
      maxSpots: Number(form.maxSpots),
      city: form.city,
      country: form.country,
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
            aria-label="Close create meetup"
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
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                  Broadcast · new
                </p>
                <h2
                  id={titleId}
                  className="mt-[3px] font-display text-[23px] leading-tight text-foreground"
                >
                  Create a meetup.
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-[color-mix(in_oklch,var(--surface)_80%,transparent)] text-foreground transition-[border-color,background,transform] duration-150 hover:border-foreground hover:bg-[color-mix(in_oklch,var(--fg)_8%,transparent)] active:scale-95"
              >
                <X className="size-4" strokeWidth={1.8} aria-hidden />
              </button>
            </div>

            <p className="mb-[17px] text-xs leading-[1.55] text-muted">
              Give people a clear place, time, and reason to gather.
            </p>

            <Field
              label="Title"
              error={errors.title}
              htmlFor="meetup-title"
            >
              <input
                id="meetup-title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="e.g. Quiet reading circle"
                className={meetupFieldClass}
              />
            </Field>

            <Field
              label="Category"
              error={errors.category}
              htmlFor="meetup-category"
            >
              <DarkSelectPopover
                id="meetup-category"
                label="Category"
                value={form.category}
                options={categoryOptions}
                open={openPopover === "category"}
                onOpenChange={(next) =>
                  setOpenPopover(next ? "category" : null)
                }
                onChange={(v) => setField("category", v as MeetupCategory)}
              />
            </Field>

            <Field
              label="Venue"
              error={errors.venue}
              htmlFor="meetup-venue"
            >
              <input
                id="meetup-venue"
                value={form.venue}
                onChange={(e) => setField("venue", e.target.value)}
                placeholder="e.g. Model Town Park"
                className={meetupFieldClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Date" error={errors.date} htmlFor="meetup-date">
                <DatePopover
                  id="meetup-date"
                  label="Date"
                  value={form.date}
                  open={openPopover === "date"}
                  onOpenChange={(next) =>
                    setOpenPopover(next ? "date" : null)
                  }
                  onChange={(v) => setField("date", v)}
                />
              </Field>
              <Field label="Time" error={errors.time} htmlFor="meetup-time">
                <TimePopover
                  id="meetup-time"
                  label="Time"
                  value={form.time}
                  open={openPopover === "time"}
                  onOpenChange={(next) =>
                    setOpenPopover(next ? "time" : null)
                  }
                  onChange={(v) => setField("time", v)}
                />
              </Field>
            </div>

            <Field
              label="Max spots"
              error={errors.maxSpots}
              htmlFor="meetup-spots"
            >
              <input
                id="meetup-spots"
                type="number"
                min={1}
                max={99}
                value={form.maxSpots}
                onChange={(e) => setField("maxSpots", e.target.value)}
                className={meetupFieldClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Country"
                error={errors.country}
                htmlFor="meetup-country"
              >
                <DarkSelectPopover
                  id="meetup-country"
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
                  onChange={(v) => setField("country", v)}
                />
              </Field>
              <Field label="City" error={errors.city} htmlFor="meetup-city">
                <DarkSelectPopover
                  id="meetup-city"
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
                  onChange={(v) => setField("city", v)}
                />
              </Field>
            </div>

            {contentWarning ? (
              <p
                role="alert"
                className="mt-3 rounded-[11px] border border-[color-mix(in_oklch,oklch(0.75_0.13_25)_45%,var(--border))] bg-[color-mix(in_oklch,oklch(0.75_0.13_25)_12%,transparent)] px-3 py-2.5 text-[11px] leading-[1.45] text-[oklch(0.82_0.1_25)]"
              >
                {contentWarning}
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-4 min-h-12 w-full rounded-[11px] border border-[color-mix(in_oklch,var(--accent)_65%,var(--border))] bg-accent px-3 font-bold text-[oklch(0.18_0.03_165)] transition-[filter,box-shadow] duration-150 hover:brightness-110 hover:shadow-[0_0_22px_color-mix(in_oklch,var(--accent)_35%,transparent)]"
            >
              Broadcast Meetup
            </button>
          </motion.form>
        </div>
      ) : null}
    </AnimatePresence>,
    shell,
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-[13px] grid gap-[7px]">
      <label
        htmlFor={htmlFor}
        className="font-mono text-[9px] uppercase tracking-[0.09em] text-muted"
      >
        {label}
      </label>
      {children}
      <span className="min-h-[14px] text-[10px] text-[oklch(0.75_0.13_25)]">
        {error ?? ""}
      </span>
    </div>
  );
}
