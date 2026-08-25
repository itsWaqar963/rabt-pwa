"use client";

import { CheckCircle } from "lucide-react";

export type AffiliationBadgesProps = {
  isImsStudent?: boolean;
  isSourceCodeAcademia?: boolean;
  /** Compact chips for MeetupCard host row */
  compact?: boolean;
};

export function AffiliationBadges({
  isImsStudent = false,
  isSourceCodeAcademia = false,
  compact = false,
}: AffiliationBadgesProps) {
  if (!isImsStudent && !isSourceCodeAcademia) return null;

  const chipClass = compact
    ? "inline-flex items-center gap-0.5 rounded-full border border-[color-mix(in_oklch,var(--accent)_45%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_10%,transparent)] px-1.5 py-[2px] font-mono text-[7px] uppercase tracking-[0.04em] text-accent"
    : "inline-flex items-center gap-1 rounded-full border border-[color-mix(in_oklch,var(--accent)_55%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] px-1.5 py-[3px] font-mono text-[8px] uppercase tracking-[0.04em] text-accent shadow-[0_0_14px_color-mix(in_oklch,var(--accent)_35%,transparent)]";

  const iconClass = compact ? "size-2.5" : "size-3";

  return (
    <>
      {isImsStudent ? (
        <span className={chipClass}>
          <CheckCircle className={iconClass} strokeWidth={2.2} aria-hidden />
          IMS
        </span>
      ) : null}
      {isSourceCodeAcademia ? (
        <span className={chipClass}>
          <CheckCircle className={iconClass} strokeWidth={2.2} aria-hidden />
          Source Code Academia
        </span>
      ) : null}
    </>
  );
}
