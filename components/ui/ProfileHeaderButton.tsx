"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { initialsFromName } from "@/lib/profile-store";

type ProfileHeaderButtonProps = {
  ariaLabel?: string;
};

export function ProfileHeaderButton({
  ariaLabel = "Open your profile",
}: ProfileHeaderButtonProps) {
  const reducedMotion = useReducedMotion();
  const { user } = useAuth();
  const avatarUrl = user?.avatarUrl;
  const initials = initialsFromName(user?.name ?? "");

  return (
    <div className="relative grid size-[52px] shrink-0 place-items-center">
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0%, color-mix(in oklch, var(--accent) 88%, transparent) 18%, color-mix(in oklch, var(--accent) 42%, white) 38%, transparent 55%, color-mix(in oklch, var(--accent) 72%, transparent) 78%, transparent 100%)",
          padding: "1.5px",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          boxShadow:
            "0 0 10px color-mix(in oklch, var(--accent) 38%, transparent), 0 0 22px color-mix(in oklch, var(--accent) 22%, transparent)",
        }}
        animate={
          reducedMotion
            ? { opacity: 0.72 }
            : { rotate: 360, opacity: [0.62, 1, 0.62] }
        }
        transition={
          reducedMotion
            ? { duration: 0 }
            : {
                rotate: { duration: 5, repeat: Infinity, ease: "linear" },
                opacity: {
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }
        }
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[3px] rounded-full shadow-[0_0_14px_color-mix(in_oklch,var(--accent)_28%,transparent)]"
      />
      <Link
        href="/profile"
        aria-label={ariaLabel}
        className="relative z-10 grid size-11 place-items-center overflow-hidden rounded-full border border-border bg-[color-mix(in_oklch,var(--surface)_72%,transparent)] text-foreground transition-[background,border-color,transform] duration-150 hover:border-foreground hover:bg-[color-mix(in_oklch,var(--fg)_6%,transparent)] active:scale-95"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote OAuth avatar
          <img
            src={avatarUrl}
            alt=""
            className="size-full object-cover rounded-full"
          />
        ) : (
          <span
            aria-hidden
            className="grid size-full place-items-center bg-[color-mix(in_oklch,var(--accent)_16%,transparent)] font-display text-[13px] font-semibold leading-none text-accent"
          >
            {initials}
          </span>
        )}
      </Link>
    </div>
  );
}
