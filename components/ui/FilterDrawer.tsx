"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";
import type { FilterOption } from "@/lib/discovery-filters";

export type FilterDrawerProps = {
  open: boolean;
  title: string;
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

export function FilterDrawer({
  open,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: FilterDrawerProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const duration = reduceMotion ? 0.01 : 0.28;

  return (
    <AnimatePresence>
      {open ? (
        <div className="absolute inset-0 z-40" role="presentation">
          <motion.button
            type="button"
            aria-label="Close filter drawer"
            className="absolute inset-0 backdrop-blur-md bg-black/40"
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
            className="absolute inset-y-0 right-0 flex w-[min(86%,20rem)] flex-col border-l border-border bg-[color-mix(in_oklch,var(--surface)_96%,var(--bg))] shadow-[-18px_0_48px_color-mix(in_oklch,var(--bg)_70%,transparent)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[color-mix(in_oklch,var(--border)_80%,transparent)] px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))]">
              <h2 className="font-display text-lg leading-none text-foreground">
                {title}
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="grid size-9 place-items-center rounded-full border border-border text-muted transition-[border-color,color,background] duration-150 hover:border-foreground hover:text-foreground"
              >
                <X className="size-4" strokeWidth={1.6} aria-hidden />
              </button>
            </header>

            <ul className="min-h-0 flex-1 list-none overflow-y-auto overscroll-contain px-2 py-2 [scrollbar-width:thin]">
              {options.map((opt) => {
                const selected = opt.value === selectedValue;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => onSelect(opt.value)}
                      className={`flex w-full items-center justify-between gap-3 rounded-[12px] px-3 py-3 text-left transition-[background,border-color,color] duration-150 ${
                        selected
                          ? "bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] text-foreground"
                          : "text-muted hover:bg-[color-mix(in_oklch,var(--fg)_5%,transparent)] hover:text-foreground"
                      }`}
                    >
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate text-[13px] font-medium leading-tight">
                          {opt.label}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                          {opt.code}
                        </span>
                      </span>
                      {selected ? (
                        <Check
                          className="size-4 shrink-0 text-accent"
                          strokeWidth={2}
                          aria-hidden
                        />
                      ) : null}
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
