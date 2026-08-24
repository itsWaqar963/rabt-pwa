"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { extractYoutubeId } from "@/lib/learn-earn-store";

export type ContributeLessonModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: {
    youtubeUrl: string;
    question: string;
    options: [string, string, string, string];
    correctIndex: number;
  }) => void;
};

type FormState = {
  youtubeUrl: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctIndex: string;
};

const INITIAL: FormState = {
  youtubeUrl: "",
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctIndex: "0",
};

export function ContributeLessonModal({
  open,
  onClose,
  onSubmit,
}: ContributeLessonModalProps) {
  const titleId = useId();
  const reducedMotion = useReducedMotion();
  const [shell, setShell] = useState<HTMLElement | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setShell(
      document.querySelector<HTMLElement>(".max-w-md.mx-auto.min-h-screen"),
    );
  }, []);

  useEffect(() => {
    if (!open) {
      setForm(INITIAL);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!extractYoutubeId(form.youtubeUrl)) {
      setError("Paste a valid YouTube Short URL.");
      return;
    }
    if (!form.question.trim()) {
      setError("Add a question.");
      return;
    }
    const options = [
      form.optionA.trim(),
      form.optionB.trim(),
      form.optionC.trim(),
      form.optionD.trim(),
    ] as [string, string, string, string];
    if (options.some((o) => !o)) {
      setError("Fill all four options.");
      return;
    }
    const correctIndex = Number(form.correctIndex);
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      setError("Pick the correct answer.");
      return;
    }
    onSubmit({
      youtubeUrl: form.youtubeUrl.trim(),
      question: form.question.trim(),
      options,
      correctIndex,
    });
    onClose();
  }

  if (!shell) return null;

  const fieldClass =
    "w-full min-h-[46px] rounded-[10px] border border-border bg-black/40 px-3 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[color-mix(in_oklch,var(--muted)_72%,transparent)] focus:border-[color-mix(in_oklch,var(--accent)_55%,var(--border))] focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--accent)_18%,transparent)]";

  const duration = reducedMotion ? 0.15 : 0.28;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <motion.button
            type="button"
            aria-label="Close contribute form"
            className="absolute inset-0 bg-[color-mix(in_oklch,var(--bg)_72%,transparent)] backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.form
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onSubmit={handleSubmit}
            className="relative z-[1] max-h-[calc(100dvh-24px)] w-full max-w-[424px] overflow-y-auto rounded-t-[24px] border border-[color-mix(in_oklch,var(--accent)_48%,var(--border))] bg-[linear-gradient(165deg,color-mix(in_oklch,var(--accent)_10%,var(--surface)),var(--surface)_45%,var(--bg))] p-[22px] shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_18%,transparent),0_28px_80px_color-mix(in_oklch,var(--bg)_80%,transparent)] sm:rounded-[24px] [scrollbar-width:thin]"
            initial={
              reducedMotion ? false : { opacity: 0, y: 28, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 16, scale: 0.98 }
            }
            transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                  Community
                </p>
                <h2
                  id={titleId}
                  className="mt-[3px] font-display text-[20px] leading-tight text-foreground"
                >
                  Contribute a lesson
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-[color-mix(in_oklch,var(--surface)_80%,transparent)] text-foreground"
              >
                <X className="size-4" strokeWidth={1.8} aria-hidden />
              </button>
            </div>

            <p className="mb-4 text-xs leading-[1.55] text-muted">
              Submit a Short, question, and answers for admin review.
            </p>

            <label className="grid gap-[7px]">
              <span className="font-mono text-[9px] uppercase tracking-[0.09em] text-muted">
                YouTube Short URL
              </span>
              <input
                value={form.youtubeUrl}
                onChange={(e) => setField("youtubeUrl", e.target.value)}
                placeholder="https://youtube.com/shorts/..."
                className={fieldClass}
              />
            </label>

            <label className="mt-3 grid gap-[7px]">
              <span className="font-mono text-[9px] uppercase tracking-[0.09em] text-muted">
                Question
              </span>
              <input
                value={form.question}
                onChange={(e) => setField("question", e.target.value)}
                placeholder="What should learners remember?"
                className={fieldClass}
              />
            </label>

            <div className="mt-3 grid gap-2">
              {(["optionA", "optionB", "optionC", "optionD"] as const).map(
                (key, index) => (
                  <label key={key} className="grid gap-[7px]">
                    <span className="font-mono text-[9px] uppercase tracking-[0.09em] text-muted">
                      Option {index + 1}
                    </span>
                    <input
                      value={form[key]}
                      onChange={(e) => setField(key, e.target.value)}
                      className={fieldClass}
                    />
                  </label>
                ),
              )}
            </div>

            <label className="mt-3 grid gap-[7px]">
              <span className="font-mono text-[9px] uppercase tracking-[0.09em] text-muted">
                Correct answer
              </span>
              <select
                value={form.correctIndex}
                onChange={(e) => setField("correctIndex", e.target.value)}
                className={fieldClass}
              >
                <option value="0">Option 1</option>
                <option value="1">Option 2</option>
                <option value="2">Option 3</option>
                <option value="3">Option 4</option>
              </select>
            </label>

            {error ? (
              <p className="mt-3 text-[11px] text-[oklch(0.75_0.13_25)]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-4 min-h-12 w-full rounded-[11px] border border-[color-mix(in_oklch,var(--accent)_65%,var(--border))] bg-accent font-bold text-[oklch(0.18_0.03_165)] transition-[filter] duration-150 hover:brightness-110"
            >
              Submit for review
            </button>
          </motion.form>
        </div>
      ) : null}
    </AnimatePresence>,
    shell,
  );
}
