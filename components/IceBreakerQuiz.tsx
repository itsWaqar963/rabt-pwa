"use client";

import { motion, AnimatePresence } from "framer-motion";

export const QUIZ_OPTIONS = [
  { key: "A", value: "Nizam", correct: false },
  { key: "B", value: "Deen", correct: true },
  { key: "C", value: "Tareeqa", correct: false },
] as const;

export type OptionKey = (typeof QUIZ_OPTIONS)[number]["key"];

type IceBreakerQuizProps = {
  selected: OptionKey | null;
  disabled?: boolean;
  showSuccessCheck?: boolean;
  onSelect: (key: OptionKey) => void;
};

export function IceBreakerQuiz({
  selected,
  disabled = false,
  showSuccessCheck = false,
  onSelect,
}: IceBreakerQuizProps) {
  return (
    <article className="rounded-[24px] border border-border bg-surface p-6 shadow-[0_24px_70px_color-mix(in_oklch,var(--bg)_86%,transparent)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted">
          ICE-BREAKER · 1 OF 1
        </p>
        <div
          className="h-[3px] w-[74px] overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-label="Quiz progress"
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={1}
        >
          <div className="h-full w-full bg-accent" />
        </div>
      </div>

      <h2
        id="quiz-title"
        className="mb-[22px] max-w-[19ch] font-body text-[22px] font-semibold leading-[1.35] tracking-[-0.025em] text-foreground"
      >
        Quran mein &quot;System&quot; ke liye konsa lafz istemal hua hai?
      </h2>

      <div className="grid gap-2.5" role="group" aria-label="Answer choices">
        {QUIZ_OPTIONS.map((opt) => {
          const isSelected = selected === opt.key;
          const showCorrect = isSelected && opt.correct;
          const showWrong = isSelected && !opt.correct;

          return (
            <button
              key={opt.key}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(opt.key)}
              className={[
                "grid min-h-[54px] w-full grid-cols-[34px_1fr_24px] items-center gap-3 rounded-full border px-[14px] py-2 pl-[9px] text-left text-foreground transition-[transform,border-color,background,opacity] duration-150",
                disabled ? "cursor-not-allowed opacity-70" : "active:scale-[0.985]",
                showCorrect
                  ? "border-accent bg-[color-mix(in_oklch,var(--accent)_14%,transparent)]"
                  : showWrong
                    ? "border-foreground/40 bg-[color-mix(in_oklch,var(--surface)_82%,var(--fg))]"
                    : "border-border bg-[color-mix(in_oklch,var(--surface)_93%,var(--fg))] hover:border-foreground/45",
              ].join(" ")}
            >
              <span
                className={[
                  "grid size-[34px] place-items-center rounded-full border font-mono text-[11px]",
                  showCorrect
                    ? "border-accent text-accent"
                    : "border-border text-muted",
                ].join(" ")}
              >
                {opt.key}
              </span>
              <span className="font-medium">{opt.value}</span>
              <span className="text-center text-base text-muted" aria-hidden>
                {showCorrect ? (
                  <span className="text-accent">✓</span>
                ) : showWrong ? (
                  <span className="text-foreground">×</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {showSuccessCheck && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 flex items-center justify-center gap-2 rounded-[14px] border border-[color-mix(in_oklch,var(--accent)_48%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_10%,transparent)] py-3 font-mono text-xs uppercase tracking-[0.1em] text-accent"
          >
            <span className="text-lg">✓</span>
            Correct — welcome to ربط
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
