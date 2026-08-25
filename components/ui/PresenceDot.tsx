"use client";

export type PresenceDotProps = {
  online: boolean;
  /** When true, render status text beside the dot (UserCard / ProfilePopup). */
  label?: string;
  size?: "sm" | "md";
  className?: string;
};

export function PresenceDot({
  online,
  label,
  size = "sm",
  className = "",
}: PresenceDotProps) {
  const dotSize = size === "md" ? "size-[9px]" : "size-1.5";
  const onlineDot =
    "rounded-full bg-accent shadow-[0_0_12px_color-mix(in_oklch,var(--accent)_76%,transparent)]";
  const offlineDot = "rounded-full bg-muted opacity-70";

  if (label !== undefined) {
    return (
      <span
        className={`flex items-center gap-[5px] whitespace-nowrap font-mono text-[9px] text-muted ${className}`}
      >
        <span
          className={`${dotSize} shrink-0 ${online ? onlineDot : offlineDot}`}
          aria-hidden
        />
        {label}
      </span>
    );
  }

  return (
    <span
      className={`${dotSize} ${online ? onlineDot : offlineDot} ${className}`}
      title={online ? "Online" : "Offline"}
      role="img"
      aria-label={online ? "Online" : "Offline"}
    />
  );
}
