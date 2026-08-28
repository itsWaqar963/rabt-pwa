"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";
import type { LearnLesson } from "@/lib/learn-earn-lessons";

export type LessonQuizModalProps = {
  open: boolean;
  lesson: LearnLesson | null;
  onClose: () => void;
  onCorrect: () => void;
};

export function LessonQuizModal({
  open,
  lesson,
  onClose,
  onCorrect,
}: LessonQuizModalProps) {
  const titleId = useId();
  const reducedMotion = useReducedMotion();
  const feedbackRef = useRef<HTMLDivElement>(null);
  const [shell, setShell] = useState<HTMLElement | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  useEffect(() => {
    setShell(
      document.querySelector<HTMLElement>(".max-w-md.mx-auto.min-h-screen"),
    );
  }, []);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setWrongIndex(null);
      setSucceeded(false);
    }
  }, [open, lesson?.id]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (wrongIndex === null && !succeeded) return;
    feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [wrongIndex, succeeded]);

  function handleSelect(index: number) {
    if (!lesson || succeeded) return;
    setSelected(index);
    if (index === lesson.correctIndex) {
      setWrongIndex(null);
      setSucceeded(true);
      window.setTimeout(() => onCorrect(), 900);
      return;
    }
    setWrongIndex(index);
    window.setTimeout(() => {
      setWrongIndex(null);
      setSelected(null);
    }, 700);
  }

  if (!shell || !lesson) return null;

  const duration = reducedMotion ? 0.15 : 0.28;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="rabt-modal-overlay fixed inset-0 z-[70] flex items-end justify-center px-4 pt-4 sm:items-center">
          <motion.button
            type="button"
            aria-label="Close lesson"
            className="absolute inset-0 bg-[color-mix(in_oklch,var(--bg)_72%,transparent)] backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="rabt-modal-sheet relative z-[1] flex max-h-[min(92dvh,720px)] w-full max-w-[424px] flex-col overflow-hidden rounded-t-[24px] border border-[color-mix(in_oklch,var(--accent)_48%,var(--border))] bg-[linear-gradient(165deg,color-mix(in_oklch,var(--accent)_10%,var(--surface)),var(--surface)_45%,var(--bg))] shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_18%,transparent),0_28px_80px_color-mix(in_oklch,var(--bg)_80%,transparent)] sm:rounded-[24px]"
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
            <div className="flex shrink-0 items-center justify-between gap-3 px-4 pt-4 pb-2">
              <p
                id={titleId}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted"
              >
                Daily quiz
              </p>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-[color-mix(in_oklch,var(--surface)_80%,transparent)] text-foreground transition-[border-color,background] duration-150 hover:border-foreground"
              >
                <X className="size-4" strokeWidth={1.8} aria-hidden />
              </button>
            </div>

            <div className="aspect-video w-full shrink-0 overflow-hidden border-y border-[color-mix(in_oklch,var(--accent)_35%,var(--border))] bg-black">
              <iframe
                title={lesson.title}
                src={`https://www.youtube.com/embed/${lesson.youtubeId}?playsinline=1&rel=0&modestbranding=1`}
                className="size-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pb-4 [scrollbar-width:thin]">
              <p className="mt-2.5 text-center font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                Contributed by{" "}
                <span className="text-accent">{lesson.contributor}</span>
              </p>

              <div className="mt-4 rounded-[14px] border border-border bg-black/40 p-3.5">
                <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent">
                  Quick check
                </p>
                <p className="mt-1.5 text-sm leading-[1.45] text-foreground">
                  {lesson.question}
                </p>
                <div className="mt-3 grid gap-3">
                  {lesson.options.map((option, index) => {
                    const isSelected = selected === index;
                    const isCorrect =
                      succeeded && index === lesson.correctIndex;
                    const isWrong = wrongIndex === index;
                    return (
                      <motion.button
                        key={option}
                        type="button"
                        disabled={succeeded}
                        onClick={() => handleSelect(index)}
                        animate={
                          isCorrect
                            ? {
                                scale: reducedMotion ? 1 : [1, 1.03, 1],
                                transition: { duration: 0.4 },
                              }
                            : isWrong
                              ? {
                                  scale: reducedMotion ? 1 : [1, 0.97, 1],
                                  transition: { duration: 0.35 },
                                }
                              : { scale: 1 }
                        }
                        className={`min-h-12 rounded-[10px] border px-4 py-3.5 text-left text-xs transition-[border-color,background,color] duration-150 ${
                          isCorrect
                            ? "border-accent bg-[color-mix(in_oklch,var(--accent)_18%,transparent)] text-accent"
                            : isWrong
                              ? "border-[oklch(0.75_0.13_25)] bg-[color-mix(in_oklch,var(--fg)_6%,transparent)] text-[oklch(0.75_0.13_25)]"
                              : isSelected
                                ? "border-[color-mix(in_oklch,var(--accent)_55%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_10%,transparent)] text-foreground"
                                : "border-border bg-[color-mix(in_oklch,var(--bg)_42%,var(--surface))] text-foreground hover:border-[color-mix(in_oklch,var(--accent)_45%,var(--border))]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {isCorrect ? (
                            <Check className="size-3.5 shrink-0" aria-hidden />
                          ) : null}
                          {option}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
                <div ref={feedbackRef}>
                  {succeeded ? (
                    <p className="mt-3 text-center font-mono text-sm font-bold text-accent">
                      +50 XP Earned
                    </p>
                  ) : wrongIndex !== null ? (
                    <p className="mt-3 text-center text-[11px] text-muted">
                      Not quite — try again.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    shell,
  );
}
