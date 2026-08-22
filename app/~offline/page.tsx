"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const CACHED_MEETUPS = [
  {
    title: "Deen & Systems Walk",
    location: "Model Town Park · Lahore",
    mark: "01",
  },
  {
    title: "Builders' Study Circle",
    location: "Johar Town · Lahore",
    mark: "02",
  },
] as const;

const RIPPLE_EASE = [0.22, 0.61, 0.36, 1] as const;

function DisconnectedNode({ busy }: { busy: boolean }) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className="relative mx-auto mb-[38px] grid size-[142px] place-items-center rounded-full border border-[color-mix(in_oklch,var(--accent)_38%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] shadow-[inset_0_0_0_16px_color-mix(in_oklch,var(--bg)_18%,transparent)] max-[360px]:mb-[30px]"
      aria-hidden
    >
      {!reducedMotion && (
        <>
          <motion.span
            className="pointer-events-none absolute inset-[18px] rounded-full border border-[color-mix(in_oklch,var(--accent)_42%,transparent)]"
            initial={{ opacity: 0, scale: 0.72 }}
            animate={{ opacity: [0, 0.52, 0], scale: [0.72, 1.62, 1.62] }}
            transition={{
              duration: 3.8,
              ease: RIPPLE_EASE,
              repeat: Infinity,
              times: [0, 0.16, 1],
            }}
          />
          <motion.span
            className="pointer-events-none absolute inset-[18px] rounded-full border border-[color-mix(in_oklch,var(--accent)_42%,transparent)]"
            initial={{ opacity: 0, scale: 0.72 }}
            animate={{ opacity: [0, 0.52, 0], scale: [0.72, 1.62, 1.62] }}
            transition={{
              duration: 3.8,
              ease: RIPPLE_EASE,
              repeat: Infinity,
              delay: 1.9,
              times: [0, 0.16, 1],
            }}
          />
        </>
      )}

      {reducedMotion && (
        <>
          <span className="pointer-events-none absolute inset-[18px] scale-100 rounded-full border border-[color-mix(in_oklch,var(--accent)_42%,transparent)] opacity-40" />
          <span className="pointer-events-none absolute inset-[18px] scale-[1.34] rounded-full border border-[color-mix(in_oklch,var(--accent)_42%,transparent)] opacity-20" />
        </>
      )}

      <span
        className="absolute h-[30px] w-px rotate-45 bg-[color-mix(in_oklch,var(--muted)_65%,transparent)]"
        aria-hidden
      />

      <motion.span
        className="relative z-[1] grid size-[42px] place-items-center rounded-full border border-accent bg-accent shadow-[0_0_18px_color-mix(in_oklch,var(--accent)_24%,transparent)]"
        animate={
          reducedMotion
            ? undefined
            : {
                scale: busy ? 1.02 : [1, 1.05, 1],
                boxShadow: busy
                  ? "0 0 26px color-mix(in oklch, var(--accent) 36%, transparent)"
                  : [
                      "0 0 18px color-mix(in oklch, var(--accent) 24%, transparent)",
                      "0 0 26px color-mix(in oklch, var(--accent) 36%, transparent)",
                      "0 0 18px color-mix(in oklch, var(--accent) 24%, transparent)",
                    ],
              }
        }
        transition={
          reducedMotion
            ? undefined
            : { duration: 4.6, ease: "easeInOut", repeat: Infinity }
        }
      >
        <span className="absolute h-px w-[17px] rotate-45 bg-[var(--bg)]" />
        <span className="absolute h-px w-[17px] -rotate-45 bg-[var(--bg)]" />
      </motion.span>
    </div>
  );
}

export default function OfflinePage() {
  const [busy, setBusy] = useState(false);
  const [statusLabel, setStatusLabel] = useState("Offline mode");
  const [feedback, setFeedback] = useState("");
  const [cachedOpen, setCachedOpen] = useState(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  function handleRetry() {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    setBusy(true);
    setStatusLabel("Syncing");
    setFeedback("Looking for a network signal…");

    retryTimer.current = setTimeout(() => {
      setBusy(false);
      setStatusLabel("Offline mode");
      setFeedback("Still offline. Your cached meetups are safe here.");
    }, 1200);
  }

  function handleCachedToggle() {
    const next = !cachedOpen;
    setCachedOpen(next);
    setFeedback(
      next ? "Showing meetups saved on this device." : "",
    );
  }

  return (
    <main className="flex h-[100dvh] flex-col overflow-y-auto overscroll-contain px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))] max-[360px]:px-4">
      <header className="flex min-h-12 items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span
            lang="ar"
            className="font-display text-[42px] font-semibold leading-none text-foreground [direction:rtl]"
            style={{
              textShadow:
                "0 0 16px color-mix(in oklch, var(--accent) 24%, transparent)",
            }}
          >
            ربط
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted">
            RABT
          </span>
        </div>

        <div className="inline-flex min-h-8 items-center gap-[7px] rounded-full border border-border px-2.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
          <span
            className={`size-1.5 rounded-full transition-[background,box-shadow] duration-150 ${
              busy
                ? "bg-accent shadow-[0_0_12px_color-mix(in_oklch,var(--accent)_70%,transparent)]"
                : "bg-muted shadow-[0_0_10px_color-mix(in_oklch,var(--muted)_55%,transparent)]"
            }`}
            aria-hidden
          />
          <span>{statusLabel}</span>
        </div>
      </header>

      <section className="flex flex-1 flex-col justify-center py-12 max-[360px]:pt-7 max-[360px]:pb-8">
        <DisconnectedNode busy={busy} />

        <div className="mx-auto max-w-[33ch] text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
            Connection paused
          </p>
          <h1 className="mt-2.5 font-display text-[clamp(40px,12vw,58px)] leading-[0.98] text-balance text-foreground max-[360px]:text-[40px]">
            Signal lost.
          </h1>
          <p className="mt-[18px] text-sm leading-[1.65] text-muted">
            The network is unreachable right now, but your intent remains.
            Check your connection to sync with your local clusters.
          </p>

          <div className="mt-[30px] grid gap-2.5">
            <button
              type="button"
              disabled={busy}
              onClick={handleRetry}
              className="min-h-[50px] w-full rounded-[10px] border border-accent bg-accent text-[13px] font-bold text-[var(--bg)] transition-[transform,background,border-color] duration-150 hover:bg-[color-mix(in_oklch,var(--accent)_88%,var(--bg))] active:translate-y-px disabled:opacity-90"
            >
              {busy ? "Checking connection…" : "Retry Connection"}
            </button>
            <button
              type="button"
              aria-expanded={cachedOpen}
              aria-controls="cached-panel"
              onClick={handleCachedToggle}
              className="min-h-[50px] w-full rounded-[10px] border border-border bg-[color-mix(in_oklch,var(--fg)_7%,transparent)] text-[13px] font-bold text-foreground transition-[transform,background,border-color] duration-150 hover:border-foreground hover:bg-[color-mix(in_oklch,var(--fg)_11%,transparent)] active:translate-y-px"
            >
              View Cached Meetups
            </button>
          </div>

          <p
            role="status"
            aria-live="polite"
            className="mt-3.5 min-h-[22px] text-center font-mono text-[10px] text-muted"
          >
            {feedback}
          </p>

          <AnimatePresence initial={false}>
            {cachedOpen && (
              <motion.section
                id="cached-panel"
                aria-labelledby="cached-title"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="mt-[22px] rounded-[10px] border border-border bg-surface p-[15px] text-left"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2
                    id="cached-title"
                    className="font-body text-sm font-normal text-foreground"
                  >
                    Saved for your next signal
                  </h2>
                  <span className="font-mono text-[10px] text-accent">
                    2 meetups
                  </span>
                </div>

                <div className="mt-2.5 grid">
                  {CACHED_MEETUPS.map((meetup) => (
                    <article
                      key={meetup.mark}
                      className="flex items-center justify-between gap-3 border-t border-border py-3 first:border-t-0"
                    >
                      <div>
                        <strong className="block text-xs">{meetup.title}</strong>
                        <span className="mt-0.5 block text-[10px] text-muted">
                          {meetup.location}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-accent">
                        {meetup.mark}
                      </span>
                    </article>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </section>

      <p className="mt-auto pt-[22px] text-center text-[10px] text-muted">
        Your cached intent stays on this device until the network returns.
      </p>
    </main>
  );
}
