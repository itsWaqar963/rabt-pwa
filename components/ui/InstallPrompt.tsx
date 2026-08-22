"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const DISMISS_KEY = "rabt_install_dismissed";
const SHOW_DELAY_MS = 2000;
const SHOW_DELAY_REDUCED_MS = 400;
const INSTALL_CHECK_MS = 3500;
const IOS_HINT = "Tap 'Share' below, then 'Add to Home Screen'";
const EASE = [0.22, 1, 0.36, 1] as const;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type Readiness = "pending" | "native" | "manual" | "unsupported";

function readStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function InstallPrompt() {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mounted, setMounted] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [readiness, setReadiness] = useState<Readiness>("pending");
  const [visible, setVisible] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  const isHome = pathname === "/";
  const canOfferInstall =
    mounted && isHome && !isInstalled && !isDismissed;
  const canShowBanner =
    canOfferInstall && (readiness === "native" || readiness === "manual");

  useEffect(() => {
    setMounted(true);
    setIsInstalled(readStandalone());
    setIsDismissed(readDismissed());

    const media = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = () => {
      const installed = media.matches;
      setIsInstalled(installed);
      if (installed) {
        deferredPromptRef.current = null;
        setDeferredPrompt(null);
        setIsInstallable(false);
        setVisible(false);
      }
    };
    media.addEventListener("change", onDisplayModeChange);

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      deferredPromptRef.current = event;
      setDeferredPrompt(event);
      setIsInstallable(true);
      setReadiness("native");
      if (checkTimerRef.current) {
        clearTimeout(checkTimerRef.current);
        checkTimerRef.current = null;
      }
    };

    const onAppInstalled = () => {
      deferredPromptRef.current = null;
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      setVisible(false);
      setShowIosHint(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    checkTimerRef.current = setTimeout(() => {
      setReadiness((current) => {
        if (current === "native") return current;
        return isIOSDevice() ? "manual" : "unsupported";
      });
    }, INSTALL_CHECK_MS);

    return () => {
      media.removeEventListener("change", onDisplayModeChange);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!canShowBanner) {
      setVisible(false);
      return;
    }

    const delay = reducedMotion ? SHOW_DELAY_REDUCED_MS : SHOW_DELAY_MS;
    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [canShowBanner, reducedMotion]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // ignore storage failures
    }
    setIsDismissed(true);
    setVisible(false);
    setShowIosHint(false);
  }, []);

  const handleInstall = useCallback(async () => {
    if (isPrompting) return;

    const prompt = deferredPromptRef.current ?? deferredPrompt;
    if (prompt && isInstallable) {
      setIsPrompting(true);
      setShowIosHint(false);
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;

        deferredPromptRef.current = null;
        setDeferredPrompt(null);
        setIsInstallable(false);

        if (outcome === "accepted") {
          setIsInstalled(true);
          setVisible(false);
          setShowIosHint(false);
        } else {
          setReadiness("manual");
        }
      } catch {
        deferredPromptRef.current = null;
        setDeferredPrompt(null);
        setIsInstallable(false);
        setReadiness("manual");
      } finally {
        setIsPrompting(false);
      }
      return;
    }

    if (readiness === "manual") {
      setShowIosHint(true);
    }
  }, [deferredPrompt, isInstallable, isPrompting, readiness]);

  if (!canOfferInstall || readiness === "unsupported" || readiness === "pending") {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.aside
          key="install-prompt"
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

          <AnimatePresence initial={false}>
            {showIosHint && (
              <motion.p
                role="status"
                aria-live="polite"
                initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: reducedMotion ? 0.1 : 0.22, ease: EASE }}
                className="overflow-hidden text-[11px] leading-relaxed text-muted"
              >
                <span className="mt-3 block">{IOS_HINT}</span>
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-3 flex items-center gap-2">
            <motion.button
              type="button"
              onClick={handleInstall}
              disabled={isPrompting}
              whileTap={isPrompting ? undefined : { scale: 0.97 }}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-accent px-3 text-xs font-semibold text-[oklch(0.16_0.018_235)] transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
            >
              {isPrompting ? "Opening…" : "Install"}
            </motion.button>
            <button
              type="button"
              onClick={dismiss}
              disabled={isPrompting}
              className="inline-flex min-h-10 shrink-0 items-center justify-center px-2 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-50"
            >
              Not now
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
