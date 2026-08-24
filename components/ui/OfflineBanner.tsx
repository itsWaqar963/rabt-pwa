"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

const EASE = [0.22, 1, 0.36, 1] as const;

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOffline ? (
        <motion.div
          key="offline-banner"
          role="status"
          aria-live="polite"
          initial={reducedMotion ? false : { opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -14 }}
          transition={{ duration: reducedMotion ? 0.12 : 0.32, ease: EASE }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-3 pt-[max(10px,env(safe-area-inset-top,0px))]"
        >
          <div className="flex w-full max-w-[calc(28rem-24px)] items-center gap-2.5 rounded-[11px] border border-[color-mix(in_oklch,oklch(0.72_0.16_45)_55%,var(--border))] bg-[color-mix(in_oklch,oklch(0.22_0.04_35)_88%,var(--surface))] px-3.5 py-2.5 shadow-[0_0_0_1px_color-mix(in_oklch,oklch(0.72_0.16_45)_22%,transparent),0_0_28px_color-mix(in_oklch,oklch(0.72_0.16_45)_28%,transparent),0_8px_24px_color-mix(in_oklch,var(--bg)_75%,transparent)] backdrop-blur-md">
            <WifiOff
              className="size-3.5 shrink-0 text-[oklch(0.78_0.14_45)]"
              strokeWidth={2}
              aria-hidden
            />
            <p className="text-[11px] font-medium leading-snug text-[oklch(0.88_0.06_45)]">
              You are offline. Showing cached clusters.
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
