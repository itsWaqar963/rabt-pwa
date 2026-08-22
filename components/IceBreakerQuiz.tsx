"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const OPTIONS = [
  { key: "A", value: "Nizam", correct: false },
  { key: "B", value: "Deen", correct: true },
  { key: "C", value: "Tareeqa", correct: false },
] as const;

type OptionKey = (typeof OPTIONS)[number]["key"];

export function IceBreakerQuiz() {
  const [selected, setSelected] = useState<OptionKey | null>(null);

  return (
    <article className="rounded-[24px] border border-border bg-surface p-6 shadow-[0_24px_70px_color-mix(in_oklch,var(--bg)_86%,transparent)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted">
          ICE-BREAKER · 1 OF 3
        </p>
        <div
          className="h-[3px] w-[74px] overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-label="Quiz progress"
          aria-valuemin={0}
          aria-valuemax={3}
          aria-valuenow={1}
        >
          <div className="h-full w-[34%] bg-accent" />
        </div>
      </div>

      <h2
        id="quiz-title"
        className="mb-[22px] max-w-[19ch] font-body text-[22px] font-semibold leading-[1.35] tracking-[-0.025em] text-foreground"
      >
        Quran mein &quot;System&quot; ke liye konsa lafz istemal hua hai?
      </h2>

      <div className="grid gap-2.5" role="group" aria-label="Answer choices">
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.key;
          const showCorrect = isSelected && opt.correct;
          const showWrong = isSelected && !opt.correct;

          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSelected(opt.key)}
              className={[
                "grid min-h-[54px] w-full grid-cols-[34px_1fr_24px] items-center gap-3 rounded-full border px-[14px] py-2 pl-[9px] text-left text-foreground transition-[transform,border-color,background] duration-150",
                "active:scale-[0.985]",
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
              <span
                className="text-center text-base text-muted"
                aria-hidden
              >
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
        {selected ? (
          <motion.div
            key="feedback"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="pt-4"
          >
            <p className="mb-3 text-[13px] text-muted">
              Close, but the Quranic concept reaches beyond structure.
            </p>
            <button
              type="button"
              className="flex min-h-12 w-full items-center justify-between rounded-[14px] border border-border bg-transparent px-[15px] text-[13px] font-semibold text-foreground transition-colors hover:border-foreground hover:bg-[color-mix(in_oklch,var(--fg)_6%,transparent)]"
            >
              Want to know the deeper concept?
              <ArrowUpRight className="size-4 shrink-0 opacity-80" aria-hidden />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}
