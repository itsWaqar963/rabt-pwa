"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type SplashScreenProps = {
  /** Fires when main content should appear (morph start). */
  onComplete?: () => void;
  done?: boolean;
  delayMs?: number;
};

const EASE = [0.22, 1, 0.36, 1] as const;

export function SplashScreen({
  onComplete,
  done,
  delayMs = 2000,
}: SplashScreenProps) {
  const reducedMotion = useReducedMotion();
  const onCompleteRef = useRef(onComplete);
  const [phase, setPhase] = useState<"idle" | "morph" | "exit" | "gone">(
    done ? "gone" : "idle",
  );

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (done) {
      setPhase("gone");
      return;
    }

    const hold = reducedMotion ? 200 : delayMs;
    const morphMs = reducedMotion ? 40 : 760;
    const fadeMs = reducedMotion ? 200 : 900;

    const t1 = window.setTimeout(() => {
      setPhase("morph");
      onCompleteRef.current?.();
    }, hold);
    const t2 = window.setTimeout(() => setPhase("exit"), hold + morphMs);
    const t3 = window.setTimeout(
      () => setPhase("gone"),
      hold + morphMs + fadeMs,
    );

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [delayMs, done, reducedMotion]);

  if (phase === "gone") return null;

  const morphing = phase === "morph" || phase === "exit";
  const exiting = phase === "exit";

  return (
    <motion.section
      aria-label="Rabt opening screen"
      aria-hidden={exiting}
      className="absolute inset-0 z-50 grid place-items-center overflow-hidden bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{
        duration: reducedMotion ? 0.2 : 0.9,
        ease: EASE,
      }}
      style={{ pointerEvents: exiting ? "none" : "auto" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute aspect-square w-[min(94vw,430px)] rounded-full opacity-70 blur-[18px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--accent) 10%, transparent), transparent 66%)",
        }}
      />
      <motion.div
        className="relative grid size-[156px] place-items-center rounded-full border border-accent/50 bg-surface/50"
        style={{
          boxShadow:
            "inset 0 0 38px color-mix(in oklch, var(--accent) 7%, transparent), 0 0 34px color-mix(in oklch, var(--accent) 20%, transparent), 0 0 90px color-mix(in oklch, var(--muted) 10%, transparent)",
        }}
        initial={{ y: 0, scale: 1, opacity: 1 }}
        animate={
          morphing
            ? {
                y: reducedMotion ? -180 : -220,
                scale: reducedMotion ? 0.55 : 0.42,
                opacity: exiting ? 0 : 1,
              }
            : { y: 0, scale: 1, opacity: 1 }
        }
        transition={{
          duration: reducedMotion ? 0.2 : 0.9,
          ease: EASE,
        }}
      >
        {!reducedMotion && phase === "idle" ? (
          <motion.span
            aria-hidden
            className="absolute -inset-3 rounded-full border border-muted/20"
            animate={{ scale: [1, 1.035, 1] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ) : (
          <span
            aria-hidden
            className="absolute -inset-3 rounded-full border border-muted/20"
          />
        )}
        <span
          lang="ar"
          className="font-display text-[76px] font-semibold leading-none tracking-[-0.04em] text-foreground [direction:rtl]"
          style={{
            textShadow:
              "0 0 18px color-mix(in oklch, var(--accent) 34%, transparent), 0 0 42px color-mix(in oklch, var(--accent) 22%, transparent)",
          }}
        >
          ربط
        </span>
      </motion.div>
    </motion.section>
  );
}
