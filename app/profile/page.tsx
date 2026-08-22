"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BottomNav } from "@/components/layout/BottomNav";

const XP_TOTAL = 860;
const INTENTS = [
  "Looking for a weekend physical meetup in Lahore",
  "Building a focused study circle for product designers",
  "Open to a quiet coffee and systems conversation",
] as const;

const CLUSTER = [
  { label: "City", value: "Lahore" },
  { label: "Country", value: "Pakistan" },
  { label: "Gender", value: "Woman" },
  { label: "Age group", value: "23–27" },
] as const;

const LINKS = [
  { label: "GitHub ↗", href: "https://github.com" },
  { label: "LinkedIn ↗", href: "https://linkedin.com" },
  { label: "Portfolio ↗", href: "https://example.com" },
] as const;

export default function ProfilePage() {
  const reducedMotion = useReducedMotion();
  const [score, setScore] = useState(7);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentText = INTENTS.join("  ·  ");

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showXpToast() {
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2400);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_80%_4%,color-mix(in_oklch,var(--muted)_9%,transparent),transparent_20rem),var(--bg)]">
      <main className="relative z-[1] h-[100dvh] overflow-y-auto px-[18px] pb-[max(88px,calc(env(safe-area-inset-bottom)+72px))] pt-[max(18px,env(safe-area-inset-top))] [scrollbar-width:none] max-[360px]:px-3.5 [&::-webkit-scrollbar]:hidden">
        <header className="relative z-10 flex min-h-12 items-center justify-between">
          <div className="flex items-baseline gap-2.5">
            <span
              lang="ar"
              className="font-display text-[48px] font-semibold leading-none tracking-[-0.04em] text-foreground [direction:rtl]"
              style={{
                textShadow:
                  "0 0 18px color-mix(in oklch, var(--accent) 34%, transparent), 0 0 42px color-mix(in oklch, var(--accent) 22%, transparent)",
              }}
            >
              ربط
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
              RABT
            </span>
          </div>
          <button
            type="button"
            aria-label={`Show ${XP_TOTAL} total XP`}
            onClick={showXpToast}
            className="flex min-h-11 items-center gap-2 rounded-full border border-[color-mix(in_oklch,var(--accent)_48%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_9%,var(--surface))] px-3 text-foreground transition-[border-color,background,transform] duration-150 hover:border-accent hover:bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] active:scale-[0.97]"
          >
            <span
              className="size-[7px] rounded-full bg-accent shadow-[0_0_12px_color-mix(in_oklch,var(--accent)_80%,transparent)]"
              aria-hidden
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
              XP
            </span>
            <span className="font-mono text-xs font-bold">{XP_TOTAL}</span>
          </button>
        </header>

        <section className="px-0.5 pb-[17px] pt-[27px]">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            Your growth card · 04
          </p>
          <h1 className="mt-1 max-w-[12ch] font-display text-[32px] leading-[1.08] text-foreground max-[360px]:text-[29px]">
            Show up as <span className="text-accent">yourself.</span>
          </h1>
          <p className="mt-2.5 max-w-[34ch] text-xs leading-[1.58] text-muted">
            A clear signal for people who want to turn shared intent into real
            local connection.
          </p>
        </section>

        <section className="rounded-[22px] border border-[color-mix(in_oklch,var(--accent)_48%,var(--border))] bg-[linear-gradient(140deg,color-mix(in_oklch,var(--accent)_10%,var(--surface)),var(--surface))] p-4 shadow-[0_20px_55px_color-mix(in_oklch,var(--bg)_78%,transparent)]">
          <div className="grid grid-cols-[66px_1fr_auto] items-center gap-3 max-[360px]:grid-cols-[58px_1fr_auto]">
            <div
              className="grid size-[66px] place-items-center rounded-[20px] border border-[color-mix(in_oklch,var(--accent)_52%,var(--border))] font-display text-[28px] text-foreground max-[360px]:size-[58px]"
              style={{
                background:
                  "radial-gradient(circle at 72% 22%, color-mix(in oklch, var(--accent) 58%, var(--surface)), transparent 30%), radial-gradient(circle at 30% 75%, color-mix(in oklch, var(--muted) 34%, var(--surface)), transparent 50%), var(--surface)",
              }}
              aria-hidden
            >
              س
            </div>
            <div className="min-w-0">
              <h2 className="font-body text-lg font-bold text-foreground">
                Sana Khalid
              </h2>
              <p className="mt-1 text-[11px] text-muted">
                IMS Student · Builder
              </p>
            </div>
            <span
              className="size-[9px] rounded-full bg-accent shadow-[0_0_14px_color-mix(in_oklch,var(--accent)_80%,transparent)]"
              title="Active now"
              role="img"
              aria-label="Active now"
            />
          </div>

          <div className="mt-4 min-h-[60px] border-l-2 border-accent bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] px-3 py-[11px]">
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent">
              Active intent · rotating
            </p>
            <div className="relative mt-0.5 overflow-hidden whitespace-nowrap">
              {reducedMotion ? (
                <p className="truncate text-xs leading-[1.45] text-foreground">
                  {INTENTS[0]}
                </p>
              ) : (
                <motion.p
                  className="whitespace-nowrap text-xs leading-[1.45] text-foreground"
                  animate={{ x: ["100%", "-100%"] }}
                  transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration: 18,
                  }}
                >
                  {intentText}
                </motion.p>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-3 px-0.5 pb-3 pt-[25px]">
            <h2 className="font-display text-[21px] text-foreground">
              How you connect
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
              signal · 01
            </span>
          </div>
          <div className="rounded-[18px] border border-border bg-[color-mix(in_oklch,var(--surface)_90%,transparent)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-[17px] text-foreground">
                  Introvert ↔ extrovert
                </h3>
                <p className="mt-1 max-w-[27ch] text-[11px] text-muted">
                  Give your next cluster a useful sense of your conversation
                  energy.
                </p>
              </div>
              <span className="shrink-0 font-mono text-base font-bold text-accent">
                {score}/10
              </span>
            </div>
            <div className="mt-[18px] flex items-center gap-2.5">
              <span className="shrink-0 whitespace-nowrap font-mono text-[9px] text-muted">
                Quiet
              </span>
              <input
                type="range"
                min={1}
                max={10}
                value={score}
                aria-label="Introvert to extrovert score"
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full cursor-pointer"
                style={{ accentColor: "var(--accent)" }}
              />
              <span className="shrink-0 whitespace-nowrap font-mono text-[9px] text-muted">
                Open
              </span>
            </div>
            <div
              className="mt-[7px] flex justify-between font-mono text-[9px] text-muted"
              aria-hidden
            >
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-3 px-0.5 pb-3 pt-[25px]">
            <h2 className="font-display text-[21px] text-foreground">
              Your cluster signals
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
              visible to matches
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-3">
            {CLUSTER.map((item) => (
              <div
                key={item.label}
                className="min-h-[72px] rounded-[15px] border border-border bg-[color-mix(in_oklch,var(--surface)_84%,transparent)] p-3"
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                  {item.label}
                </span>
                <strong className="mt-[7px] block text-[13px] font-semibold text-foreground">
                  {item.value}
                </strong>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4">
          <div className="rounded-[18px] border border-border bg-[color-mix(in_oklch,var(--surface)_88%,transparent)] p-4">
            <div className="flex items-start justify-between gap-3.5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                  Community trust
                </p>
                <h2 className="mt-[3px] font-display text-[21px] text-foreground">
                  Reliability, reflected.
                </h2>
              </div>
              <div className="text-right font-mono text-xl font-bold text-accent">
                4.9
                <small className="mt-0.5 block text-[9px] font-normal text-muted">
                  / 5 trust rating
                </small>
              </div>
            </div>
            <div className="mt-[17px] grid grid-cols-2 gap-2 border-t border-[color-mix(in_oklch,var(--border)_78%,transparent)] pt-3.5">
              <div>
                <strong className="block font-mono text-lg text-foreground">
                  12
                </strong>
                <span className="mt-[3px] block text-[9px] text-muted">
                  Completed meetups
                </span>
              </div>
              <div>
                <strong className="block font-mono text-lg text-foreground">
                  96%
                </strong>
                <span className="mt-[3px] block text-[9px] text-muted">
                  Show-up rate
                </span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-3 px-0.5 pb-3 pt-[25px]">
            <h2 className="font-display text-[21px] text-foreground">
              Digital trail
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
              bridge the gap
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pb-2">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-[13px] font-mono text-[10px] text-foreground transition-[border-color,background] duration-150 hover:border-foreground hover:bg-[color-mix(in_oklch,var(--fg)_6%,transparent)]"
              >
                {link.label}
              </a>
            ))}
          </div>
        </section>
      </main>

      <div
        role="status"
        aria-live="polite"
        className={`absolute bottom-[88px] left-1/2 z-[5] max-w-[calc(100%-40px)] -translate-x-1/2 rounded-xl border border-[color-mix(in_oklch,var(--accent)_52%,var(--border))] bg-surface px-[13px] py-2.5 text-[11px] text-foreground shadow-[0_16px_44px_color-mix(in_oklch,var(--bg)_80%,transparent)] transition-opacity duration-300 ${
          toastVisible
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        {XP_TOTAL} XP earned through showing up.
      </div>

      <BottomNav />
    </div>
  );
}
