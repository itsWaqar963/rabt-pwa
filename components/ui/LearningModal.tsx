"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export const YOUTUBE_SHORT_ID = "Eefw88whnv8";

export type VideoFormat = "horizontal" | "vertical";

export type LearningModalProps = {
  isOpen: boolean;
  onComplete: () => void;
  videoFormat?: VideoFormat;
  youtubeId?: string;
  mandatory?: boolean;
  closeLabel?: string;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onStateChange?: (event: { data: number }) => void;
            onReady?: () => void;
          };
        }
      ) => { destroy: () => void };
      PlayerState: { ENDED: number; PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();

  return new Promise((resolve) => {
    const existing = document.getElementById("youtube-iframe-api");
    if (existing) {
      const check = setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      return;
    }

    window.onYouTubeIframeAPIReady = () => resolve();
    const script = document.createElement("script");
    script.id = "youtube-iframe-api";
    script.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(script);
  });
}

export function LearningModal({
  isOpen,
  onComplete,
  videoFormat = "vertical",
  youtubeId = YOUTUBE_SHORT_ID,
  mandatory = false,
  closeLabel = "Close / Skip",
}: LearningModalProps) {
  const playerHostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<{ destroy: () => void } | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [apiReady, setApiReady] = useState(false);

  const canDismiss = !mandatory || videoEnded;

  const handleComplete = useCallback(() => {
    playerRef.current?.destroy();
    playerRef.current = null;
    setVideoEnded(false);
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (!isOpen) {
      playerRef.current?.destroy();
      playerRef.current = null;
      setVideoEnded(false);
      setApiReady(false);
      return;
    }

    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !playerHostRef.current || !window.YT) return;

      playerRef.current?.destroy();
      playerRef.current = new window.YT.Player(playerHostRef.current, {
        videoId: youtubeId,
        playerVars: {
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            if (!cancelled) setApiReady(true);
          },
          onStateChange: (event) => {
            if (event.data === 0) setVideoEnded(true);
          },
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, youtubeId]);

  useEffect(() => {
    if (!isOpen || !mandatory) return;
    const fallback = window.setTimeout(() => setVideoEnded(true), 45000);
    return () => window.clearTimeout(fallback);
  }, [isOpen, mandatory]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && canDismiss) handleComplete();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, canDismiss, handleComplete]);

  const isVertical = videoFormat === "vertical";

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            key="learning-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-[50] bg-black/60 backdrop-blur-sm"
            onClick={canDismiss ? handleComplete : undefined}
            aria-hidden
          />

          <motion.section
            key="learning-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="learning-title"
            aria-describedby="learning-description"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.38, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute inset-x-2.5 bottom-[max(10px,env(safe-area-inset-bottom,0px))] z-[51] max-h-[calc(100%-20px)] overflow-y-auto rounded-3xl border border-[color-mix(in_oklch,var(--fg)_24%,var(--border))] bg-[color-mix(in_oklch,var(--surface)_97%,var(--bg))] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-[18px] shadow-[0_22px_70px_color-mix(in_oklch,var(--bg)_88%,transparent)] max-[360px]:inset-x-[7px] max-[360px]:bottom-[max(7px,env(safe-area-inset-bottom,0px))] max-[360px]:px-[13px]"
          >
            <div
              className="-mt-[3px] mx-auto mb-[17px] h-1 w-[38px] rounded-full bg-[color-mix(in_oklch,var(--muted)_68%,var(--border))]"
              aria-hidden
            />

            <div className="flex items-start justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">
                02:18 · Foundations
              </p>
              {canDismiss ? (
                <motion.button
                  type="button"
                  aria-label="Close learning modal"
                  onClick={handleComplete}
                  whileTap={{ scale: 0.95 }}
                  className="-mr-[7px] -mt-[7px] grid size-11 shrink-0 place-items-center rounded-full border border-border bg-transparent text-[22px] leading-none text-foreground transition-[border-color,background] duration-150 hover:border-foreground hover:bg-[color-mix(in_oklch,var(--fg)_6%,transparent)]"
                >
                  ×
                </motion.button>
              ) : (
                <span className="-mr-[7px] -mt-[7px] min-h-11 max-w-[140px] text-right font-mono text-[9px] uppercase leading-snug tracking-[0.06em] text-muted">
                  Watch concept to retry
                </span>
              )}
            </div>

            <div
              className={`relative mt-3.5 overflow-hidden rounded-[17px] border border-border bg-[color-mix(in_oklch,var(--bg)_90%,var(--surface))] ${
                isVertical
                  ? "mx-auto aspect-[9/16] max-h-[50vh] w-full max-w-[min(100%,calc(50vh*9/16))]"
                  : "aspect-video w-full"
              }`}
            >
              <div ref={playerHostRef} className="size-full" />
              {!apiReady && (
                <div className="absolute inset-0 grid place-items-center bg-[color-mix(in_oklch,var(--bg)_80%,transparent)] font-mono text-[10px] text-muted">
                  Loading video…
                </div>
              )}
            </div>

            <h1
              id="learning-title"
              className="mt-[17px] text-[22px] font-bold leading-[1.18] text-foreground max-[360px]:text-xl"
            >
              Deen: beyond private belief
            </h1>
            <p
              id="learning-description"
              className="mt-[9px] text-xs leading-[1.58] text-muted"
            >
              A short primer on Deen as a complete way of life, connecting inner
              growth with the systems we build together.
            </p>

            {canDismiss ? (
              <motion.button
                type="button"
                onClick={handleComplete}
                whileTap={{ scale: 0.98, y: 1 }}
                className="mt-[17px] min-h-12 w-full rounded-[13px] border border-accent bg-accent px-4 text-[13px] font-bold text-[oklch(0.18_0.03_165)] transition-[filter] duration-150 hover:brightness-110"
              >
                {closeLabel}
              </motion.button>
            ) : (
              <p className="mt-[17px] text-center font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                Finish the short to retry the question
              </p>
            )}
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
