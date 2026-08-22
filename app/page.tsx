"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { PhilosophyCard } from "@/components/PhilosophyCard";
import { IceBreakerQuiz } from "@/components/IceBreakerQuiz";

export default function Home() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      <SplashScreen onComplete={() => setSplashDone(true)} />

      <motion.main
        className="relative z-10 min-h-screen overflow-y-auto px-[18px] pb-7 pt-[max(18px,env(safe-area-inset-top))]"
        initial={{ opacity: 0, y: 10 }}
        animate={
          splashDone
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 10 }
        }
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
        aria-hidden={!splashDone}
      >
        <header className="relative z-10 flex min-h-11 items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Awakening · 01
          </span>
          <span className="flex items-center gap-2 text-xs text-muted">
            <span
              aria-hidden
              className="size-[7px] rounded-full bg-muted shadow-[0_0_14px_color-mix(in_oklch,var(--muted)_55%,transparent)]"
            />
            Cluster ready
          </span>
        </header>

        <section
          className="relative z-10 grid justify-items-center px-1 pb-[30px] pt-[42px] text-center"
          aria-labelledby="rabt-title"
        >
          <div className="relative mb-[23px] grid size-[130px] place-items-center">
            <span
              aria-hidden
              className="absolute inset-1 rounded-full border border-muted/40 shadow-[inset_0_0_40px_color-mix(in_oklch,var(--muted)_8%,transparent)]"
            />
            <span
              aria-hidden
              className="rabt-orbit-dot absolute top-2.5 size-[7px] rounded-full bg-accent shadow-[0_0_18px_color-mix(in_oklch,var(--accent)_80%,transparent)]"
              style={{
                transformOrigin: "3px 55px",
                animation: "rabt-orbit 8s linear infinite",
              }}
            />
            <div>
              <h1
                id="rabt-title"
                lang="ar"
                className="font-display text-[70px] font-semibold leading-none tracking-[-0.04em] text-foreground [direction:rtl]"
                style={{
                  textShadow:
                    "0 0 28px color-mix(in oklch, var(--muted) 40%, transparent)",
                }}
              >
                ربط
              </h1>
              <p className="mt-[7px] font-mono text-[10px] uppercase tracking-[0.36em] text-muted">
                RABT
              </p>
            </div>
          </div>

          <PhilosophyCard />
        </section>

        <section className="relative z-10" aria-labelledby="quiz-title">
          <IceBreakerQuiz />
          <p className="flex justify-center gap-2 pt-[18px] font-mono text-[10px] tracking-[0.05em] text-muted">
            <span>●</span>
            <span>Reflection syncs with your local cluster</span>
          </p>
        </section>
      </motion.main>
    </>
  );
}
