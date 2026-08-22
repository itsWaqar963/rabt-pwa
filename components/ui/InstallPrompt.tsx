"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const DISMISS_KEY = "rabt_install_dismissed";
const SHOW_DELAY_MS = 2000;
const SHOW_DELAY_REDUCED_MS = 400;
const IOS_HINT = "Tap 'Share' below, then 'Add to Home Screen'";
const EASE = [0.22, 1, 0.36, 1] as const;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(display-mode: standalone)").matches;
}

function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  const shouldAllow =
    pathname === "/" && !isStandalone() && !isDismissed();

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (!shouldAllow) {
      setVisible(false);
      setShowIosHint(false);
      return;
    }

    const delay = reducedMotion ? SHOW_DELAY_REDUCED_MS : SHOW_DELAY_MS;
    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [shouldAllow, reducedMotion]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // ignore
    }
    setVisible(false);
    setShowIosHint(false);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        if (outcome === "accepted") {
          setVisible(false);
          setShowIosHint(false);
        }
      } catch {
        setDeferredPrompt(null);
      }
      return;
    }

    setShowIosHint(true);
  };

  if (!shouldAllow) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          role="dialog"
          aria-labelledby="install-prompt-title"
          aria-describedby="install-prompt-desc"
          className="fixed bottom-[calc(max(14px,env(safe-area-inset-bottom))+74px)] left-1/2 z-[50] w-[min(calc(100%-36px),424px)] max-w-[calc(28rem-36px)] -translate-x-1/2 rounded-[18px] border border-border bg-[color-mix(in_oklch,var(--surface)_92%,transparent)] p-4 shadow-[0_18px_45px_color-mix(in_oklch,var(--bg)_78%,transparent)] backdrop-blur-[16px]"
          initial={reducedMotion ? { opacity: 0 } : { y: 96, opacity: 0 }}
          animate={reducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={
            reducedMotion
              ? { opacity: 0, transition: { duration: 0.15 } }
              : { y: 72, opacity: 0, transition: { duration: 0.28, ease: EASE } }
          }
          transition={
            reducedMotion
              ? { duration: 0.15 }
              : { duration: 0.38, ease: EASE }
          }
        >
          <div className="flex gap-3">
            <span
              lang="ar"
              className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-[color-mix(in_oklch,var(--accent)_10%,transparent)] font-display text-xl font-semibold leading-none text-foreground"
              aria-hidden
            >
              ربط
            </span>
            <div className="min-w-0 flex-1">
              <h2
                id="install-prompt-title"
                className="text-sm font-semibold text-foreground"
              >
                Install RABT
              </h2>
              <p
                id="install-prompt-desc"
                className="mt-0.5 text-xs leading-relaxed text-muted"
              >
                Keep your intents and cached meetups available offline
              </p>
            </div>
          </div>

          {showIosHint && (
            <p
              role="status"
              aria-live="polite"
              className="mt-3 text-[11px] leading-relaxed text-muted"
            >
              {IOS_HINT}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstall}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-accent px-3 text-xs font-semibold text-[oklch(0.16_0.018_235)] transition-opacity hover:opacity-90"
            >
              Install
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-10 shrink-0 items-center justify-center px-2 text-xs text-muted transition-colors hover:text-foreground"
            >
              Not now
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
