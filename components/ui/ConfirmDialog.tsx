"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const reducedMotion = useReducedMotion();
  const [shell, setShell] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setShell(
      document.querySelector<HTMLElement>(".max-w-md.mx-auto.min-h-screen"),
    );
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!shell) return null;

  const duration = reducedMotion ? 0.01 : 0.24;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="rabt-modal-overlay absolute inset-0 z-[80] flex items-center justify-center px-5">
          <motion.button
            type="button"
            aria-label="Dismiss"
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.18 }}
            onClick={() => {
              if (!busy) onCancel();
            }}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-[1] w-full max-w-[320px] rounded-[20px] border border-[color-mix(in_oklch,var(--accent)_40%,var(--border))] bg-[linear-gradient(165deg,color-mix(in_oklch,var(--accent)_10%,var(--surface)),var(--surface)_50%,var(--bg))] p-5 shadow-[0_28px_80px_color-mix(in_oklch,var(--bg)_80%,transparent)]"
            initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.97, y: 8 }
            }
            transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id={titleId}
              className="font-display text-[18px] text-foreground"
            >
              {title}
            </h2>
            <p className="mt-2 text-[12px] leading-[1.5] text-muted">
              {description}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={onCancel}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[11px] border border-border px-3 text-[12px] text-muted transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onConfirm}
                className={
                  danger
                    ? "inline-flex min-h-11 flex-1 items-center justify-center rounded-[11px] border border-[color-mix(in_oklch,oklch(0.65_0.18_25)_55%,var(--border))] bg-[color-mix(in_oklch,oklch(0.65_0.18_25)_16%,transparent)] px-3 text-[12px] font-semibold text-[oklch(0.78_0.12_25)] transition-[background] duration-150 hover:bg-[color-mix(in_oklch,oklch(0.65_0.18_25)_24%,transparent)] disabled:opacity-50"
                    : "inline-flex min-h-11 flex-1 items-center justify-center rounded-[11px] border border-[color-mix(in_oklch,var(--accent)_60%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_16%,transparent)] px-3 text-[12px] font-semibold text-accent disabled:opacity-50"
                }
              >
                {busy ? "Working…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    shell,
  );
}
