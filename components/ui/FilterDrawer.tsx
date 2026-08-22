"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { FilterOption } from "@/lib/discovery-filters";

export type FilterDrawerProps = {
  open: boolean;
  title: string;
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

const LIST_MASK =
  "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)";

export function FilterDrawer({
  open,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: FilterDrawerProps) {
  const reduceMotion = useReducedMotion();
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      selectedRef.current?.scrollIntoView({
        block: "center",
        behavior: reduceMotion ? "auto" : "smooth",
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, [open, selectedValue, reduceMotion]);

  const duration = reduceMotion ? 0.01 : 0.28;

  return (
    <AnimatePresence>
      {open ? (
        <div className="absolute inset-0 z-50" role="presentation">
          <motion.button
            type="button"
            aria-label="Close filter picker"
            className="absolute inset-0 bg-black/55 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="pointer-events-none absolute inset-y-0 right-0 flex w-[38%] max-w-[10.5rem] min-w-[7.5rem] flex-col pt-[max(20px,env(safe-area-inset-top))] pb-[max(16px,env(safe-area-inset-bottom))]"
            initial={reduceMotion ? false : { x: 36, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { x: 36, opacity: 0 }}
            transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="pointer-events-none mb-2 shrink-0 pr-3 text-right font-mono text-[9px] uppercase tracking-[0.2em] text-muted/80">
              {title}
            </p>

            <ul
              className="pointer-events-auto min-h-0 flex-1 list-none overflow-y-auto overscroll-contain touch-pan-y pr-3 pl-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
              style={{
                WebkitMaskImage: LIST_MASK,
                maskImage: LIST_MASK,
              }}
            >
              {options.map((opt) => {
                const selected = opt.value === selectedValue;
                return (
                  <li key={opt.value}>
                    <button
                      ref={selected ? selectedRef : undefined}
                      type="button"
                      onClick={() => onSelect(opt.value)}
                      className={`block w-full py-[13px] text-right font-sans text-[15px] leading-snug tracking-[-0.01em] transition-colors duration-150 ${
                        selected
                          ? "text-accent [text-shadow:0_0_16px_color-mix(in_oklch,var(--accent)_42%,transparent)]"
                          : "text-foreground/88 hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
