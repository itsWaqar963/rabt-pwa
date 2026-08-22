"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type VideoFormat = "horizontal" | "vertical";

export type LearningModalProps = {
  isOpen: boolean;
  onClose: () => void;
  videoFormat: VideoFormat;
};

export function LearningModal({
  isOpen,
  onClose,
  videoFormat,
}: LearningModalProps) {
  const [playing, setPlaying] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => {
    setPlaying(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      setPlaying(false);
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  const isVertical = videoFormat === "vertical";

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            key="learning-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-[50] bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden
          />

          <motion.section
            key="learning-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="learning-title"
            aria-describedby="learning-description"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.38, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute inset-x-2.5 bottom-2.5 z-[51] max-h-[calc(100%-20px)] overflow-y-auto rounded-3xl border border-[color-mix(in_oklch,var(--fg)_24%,var(--border))] bg-[color-mix(in_oklch,var(--surface)_97%,var(--bg))] px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-[18px] shadow-[0_22px_70px_color-mix(in_oklch,var(--bg)_88%,transparent)] max-[360px]:inset-x-[7px] max-[360px]:bottom-[7px] max-[360px]:px-[13px]"
          >
            <div
              className="-mt-[3px] mx-auto mb-[17px] h-1 w-[38px] rounded-full bg-[color-mix(in_oklch,var(--muted)_68%,var(--border))]"
              aria-hidden
            />

            <div className="flex items-start justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">
                02:18 · Foundations
              </p>
              <motion.button
                ref={closeButtonRef}
                type="button"
                aria-label="Close learning modal"
                onClick={handleClose}
                whileTap={{ scale: 0.95 }}
                className="-mr-[7px] -mt-[7px] grid size-11 shrink-0 place-items-center rounded-full border border-border bg-transparent text-[22px] leading-none text-foreground transition-[border-color,background] duration-150 hover:border-foreground hover:bg-[color-mix(in_oklch,var(--fg)_6%,transparent)]"
              >
                ×
              </motion.button>
            </div>

            <div
              className={`relative mt-3.5 grid place-items-center overflow-hidden rounded-[17px] border border-border bg-[radial-gradient(circle_at_68%_28%,color-mix(in_oklch,var(--accent)_28%,transparent),transparent_30%),radial-gradient(circle_at_20%_76%,color-mix(in_oklch,var(--muted)_22%,transparent),transparent_38%),color-mix(in_oklch,var(--bg)_90%,var(--surface))] ${
                isVertical
                  ? "mx-auto aspect-[9/16] max-h-[50vh] w-full max-w-[min(100%,calc(50vh*9/16))]"
                  : "aspect-video w-full"
              }`}
            >
              <div
                className="pointer-events-none absolute -right-16 -top-[90px] size-[190px] rotate-[-22deg] rounded-full border border-[color-mix(in_oklch,var(--accent)_24%,transparent)]"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-[67px] -left-[60px] size-[135px] rotate-[-22deg] rounded-full border border-[color-mix(in_oklch,var(--accent)_24%,transparent)]"
                aria-hidden
              />

              <span className="absolute left-[13px] top-3 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                Rabt micro-learning
              </span>

              <motion.button
                type="button"
                aria-label={playing ? "Pause video" : "Play video"}
                onClick={() => setPlaying((prev) => !prev)}
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.06 }}
                className={`relative z-[1] grid size-[58px] place-items-center rounded-full border border-accent bg-accent pl-1 text-[oklch(0.16_0.018_235)] transition-[box-shadow] duration-150 ${
                  playing
                    ? "shadow-[0_0_18px_color-mix(in_oklch,var(--accent)_32%,transparent)]"
                    : "shadow-[0_0_28px_color-mix(in_oklch,var(--accent)_45%,transparent)] hover:shadow-[0_0_38px_color-mix(in_oklch,var(--accent)_60%,transparent)]"
                }`}
              >
                {playing ? (
                  <span
                    className="h-4 w-3 border-x-[3px] border-[oklch(0.16_0.018_235)]"
                    aria-hidden
                  />
                ) : (
                  <span
                    className="ml-0.5 h-0 w-0 border-y-8 border-l-[12px] border-y-transparent border-l-[oklch(0.16_0.018_235)]"
                    aria-hidden
                  />
                )}
              </motion.button>

              <span className="absolute bottom-[11px] right-3 rounded-[5px] bg-[color-mix(in_oklch,var(--bg)_86%,transparent)] px-[7px] py-1 font-mono text-[10px] text-foreground">
                {playing ? "Playing · 00:42" : "02:18"}
              </span>
            </div>

            <h1
              id="learning-title"
              className="mt-[17px] text-[22px] font-bold leading-[1.18] text-foreground max-[360px]:text-xl"
            >
              Deen: beyond private belief
            </h1>
            <p
              id="learning-description"
              className="mt-[9px] text-xs leading-[1.58] text-muted"
            >
              A short primer on Deen as a complete way of life, connecting inner
              growth with the systems we build together.
            </p>

            <motion.button
              type="button"
              onClick={handleClose}
              whileTap={{ scale: 0.98, y: 1 }}
              className="mt-[17px] min-h-12 w-full rounded-[13px] border border-accent bg-accent px-4 text-[13px] font-bold text-[oklch(0.18_0.03_165)] transition-[filter] duration-150 hover:brightness-110"
            >
              Got it, Return to Quiz / Discovery
            </motion.button>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
