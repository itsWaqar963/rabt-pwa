"use client";

import { Radio } from "lucide-react";

export type EmptyClustersProps = {
  onReset: () => void;
};

export function EmptyClusters({ onReset }: EmptyClustersProps) {
  return (
    <div
      className="relative overflow-hidden rounded-[22px] border border-border bg-[color-mix(in_oklch,var(--surface)_88%,transparent)] px-5 py-10 text-center shadow-[0_18px_48px_color-mix(in_oklch,var(--bg)_76%,transparent)]"
      role="status"
    >
      <div
        className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl border border-[color-mix(in_oklch,var(--accent)_40%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] text-accent"
        style={{
          boxShadow:
            "0 0 18px color-mix(in oklch, var(--accent) 40%, transparent), 0 0 42px color-mix(in oklch, var(--accent) 18%, transparent)",
        }}
      >
        <Radio className="size-6" strokeWidth={1.5} aria-hidden />
      </div>
      <p className="mx-auto max-w-[28ch] text-sm leading-[1.55] text-muted">
        No active clusters or intentions found for this filter yet
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[11px] border border-[color-mix(in_oklch,var(--accent)_55%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-accent transition-[border-color,background,transform] duration-150 hover:border-accent hover:bg-[color-mix(in_oklch,var(--accent)_20%,transparent)] active:scale-[0.98]"
      >
        Reset Filters
      </button>
    </div>
  );
}
