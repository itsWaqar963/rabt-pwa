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

/** Edge fade; center band fully opaque — GOAT wheel mask */
const LIST_MASK =
  "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)";

const SELECTED_GLOW =
  "0 0 12px color-mix(in oklch, var(--accent) 55%, transparent), 0 0 28px color-mix(in oklch, var(--accent) 28%, transparent)";

export function FilterDrawer({
  open,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: FilterDrawerProps) {
  const reduceMotion = useReducedMotion();
  const listRef = useRef<HTMLUListElement>(null);
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
        inline: "nearest",
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
            className="pointer-events-none absolute inset-y-0 right-0 flex h-full w-[38%] max-w-[10.5rem] min-w-[7.5rem] flex-col"
            initial={reduceMotion ? false : { x: 36, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { x: 36, opacity: 0 }}
            transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="pointer-events-none absolute top-[max(16px,env(safe-area-inset-top))] right-3 z-10 font-mono text-[9px] uppercase tracking-[0.2em] text-muted/80">
              {title}
            </p>

            {/*
              Wheel rail: py-[40vh] lets first/last (and short lists) sit mid-shell.
              Mask fades edges; snap proximity nudges without fighting free scroll.
            */}
            <ul
              ref={listRef}
              className="pointer-events-auto h-full min-h-0 list-none overflow-y-auto overscroll-contain touch-pan-y scroll-smooth snap-y snap-proximity py-[40vh] pr-3 pl-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
              style={{
                WebkitMaskImage: LIST_MASK,
                maskImage: LIST_MASK,
              }}
            >
              {options.map((opt) => {
                const selected = opt.value === selectedValue;
                return (
                  <li key={opt.value} className="snap-center">
                    <button
                      ref={selected ? selectedRef : undefined}
                      type="button"
                      onClick={() => onSelect(opt.value)}
                      className={`block w-full py-[13px] text-right font-sans text-[15px] leading-snug tracking-[-0.01em] transition-[color,text-shadow,opacity] duration-150 ${
                        selected
                          ? "text-accent opacity-100"
                          : "text-foreground/70 opacity-80 hover:text-foreground hover:opacity-100"
                      }`}
                      style={
                        selected
                          ? { textShadow: SELECTED_GLOW }
                          : undefined
                      }
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
