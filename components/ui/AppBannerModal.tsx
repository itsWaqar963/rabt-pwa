"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import {
  dismissBanner,
  fetchActiveBanner,
  isBannerDismissed,
  type AppBanner,
} from "@/lib/app-banners";

function isExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin !== window.location.origin;
  } catch {
    return false;
  }
}

function AppBannerModal({
  banner,
  onDismiss,
}: {
  banner: AppBanner;
  onDismiss: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const [shell, setShell] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setShell(
      document.querySelector<HTMLElement>(".max-w-md.mx-auto.min-h-screen"),
    );
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!shell) return null;

  const duration = reducedMotion ? 0.01 : 0.28;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="banner-backdrop"
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration }}
        onClick={onDismiss}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="App announcement"
          className="relative w-full max-w-[min(100%,320px)] overflow-hidden rounded-2xl border border-[color-mix(in_oklch,var(--accent)_40%,var(--border))] bg-surface shadow-[0_24px_60px_color-mix(in_oklch,var(--bg)_80%,transparent)]"
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss banner"
            className="absolute right-2.5 top-2.5 z-10 flex size-9 items-center justify-center rounded-full border border-border bg-black/70 text-foreground shadow-lg transition-colors hover:border-[color-mix(in_oklch,var(--accent)_50%,var(--border))]"
          >
            <X className="size-5" aria-hidden />
          </button>
          <a
            href={banner.link_url}
            target={isExternalUrl(banner.link_url) ? "_blank" : undefined}
            rel={isExternalUrl(banner.link_url) ? "noreferrer" : undefined}
            className="block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner.image_url}
              alt=""
              className="block w-full object-cover"
            />
          </a>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    shell,
  );
}

export function AppBannerHost() {
  const [banner, setBanner] = useState<AppBanner | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchActiveBanner().then((active) => {
      if (cancelled || !active) return;
      if (isBannerDismissed(active.id)) return;
      setBanner(active);
      setVisible(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleDismiss() {
    if (banner) dismissBanner(banner.id);
    setVisible(false);
  }

  if (!visible || !banner) return null;

  return <AppBannerModal banner={banner} onDismiss={handleDismiss} />;
}
