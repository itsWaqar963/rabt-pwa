"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";

type XpRewardProps = {
  amount?: number;
  onComplete?: () => void;
};

const PARTICLE_COUNT = 18;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => i);
const HOLD_MS = 2800;
const HOLD_REDUCED_MS = 1400;

export function XpReward({ amount = 50, onComplete }: XpRewardProps) {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    const enterDelay = window.setTimeout(
      () => setCelebrate(true),
      reducedMotion ? 80 : 320
    );
    const holdMs = reducedMotion ? HOLD_REDUCED_MS : HOLD_MS;
    const exitTimer = window.setTimeout(
      () => setVisible(false),
      holdMs + (reducedMotion ? 400 : 900)
    );

    return () => {
      window.clearTimeout(enterDelay);
      window.clearTimeout(exitTimer);
    };
  }, [reducedMotion]);

  const badgeVariants: Variants = reducedMotion
    ? {
        hidden: { opacity: 0, scale: 0.92 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.35 } },
      }
    : {
        hidden: { opacity: 0, scale: 0.35, y: 48 },
        visible: {
          opacity: 1,
          scale: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 420,
            damping: 22,
            mass: 0.85,
          },
        },
        exit: {
          opacity: 0,
          scale: 0.88,
          y: -36,
          transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
        },
      };

  return (
    <AnimatePresence mode="wait" onExitComplete={() => onComplete?.()}>
      {visible && (
        <motion.div
          key="xp-overlay"
          className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45 } }}
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-[color-mix(in_oklch,var(--bg)_55%,transparent)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.55, 0.35] }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {PARTICLES.map((i) => {
            const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
            const distance = 56 + (i % 5) * 14;
            const size = i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 3;
            const isCyan = i % 4 === 0;

            return (
              <motion.span
                key={i}
                className={`absolute rounded-full ${
                  isCyan
                    ? "bg-[color-mix(in_oklch,var(--muted)_85%,var(--accent))]"
                    : "bg-accent"
                }`}
                style={{ width: size, height: size }}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={
                  celebrate
                    ? {
                        opacity: [0, 1, 1, 0],
                        scale: [0, 1.3, 1, 0.2],
                        x: Math.cos(angle) * distance,
                        y: Math.sin(angle) * distance - 28,
                      }
                    : { opacity: 0, scale: 0, x: 0, y: 0 }
                }
                transition={{
                  duration: reducedMotion ? 0.7 : 1.35,
                  ease: [0.22, 1, 0.36, 1],
                  delay: reducedMotion ? 0 : i * 0.025,
                }}
              />
            );
          })}

          <motion.div
            variants={badgeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative flex flex-col items-center"
          >
            {!reducedMotion && (
              <>
                <motion.span
                  aria-hidden
                  className="absolute -inset-8 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--accent)_28%,transparent),transparent_70%)]"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{
                    opacity: [0, 0.9, 0.55],
                    scale: [0.6, 1.15, 1],
                  }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                />
                <motion.span
                  aria-hidden
                  className="absolute -inset-5 rounded-full border border-[color-mix(in_oklch,var(--accent)_45%,transparent)]"
                  animate={{
                    scale: [1, 1.18, 1],
                    opacity: [0.55, 0.15, 0.45],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: 1,
                    ease: "easeInOut",
                  }}
                />
              </>
            )}

            <motion.div
              className="relative flex min-w-[168px] flex-col items-center gap-2 rounded-[22px] border border-[color-mix(in_oklch,var(--accent)_55%,var(--border))] bg-[linear-gradient(145deg,color-mix(in_oklch,var(--accent)_18%,var(--surface)),color-mix(in_oklch,var(--muted)_8%,var(--surface)))] px-8 py-6 shadow-[0_0_48px_color-mix(in_oklch,var(--accent)_35%,transparent),0_24px_60px_color-mix(in_oklch,var(--bg)_80%,transparent)]"
              animate={
                reducedMotion
                  ? undefined
                  : {
                      boxShadow: [
                        "0 0 32px color-mix(in oklch, var(--accent) 28%, transparent), 0 24px 60px color-mix(in oklch, var(--bg) 80%, transparent)",
                        "0 0 56px color-mix(in oklch, var(--accent) 48%, transparent), 0 24px 60px color-mix(in oklch, var(--bg) 80%, transparent)",
                        "0 0 40px color-mix(in oklch, var(--accent) 34%, transparent), 0 24px 60px color-mix(in oklch, var(--bg) 80%, transparent)",
                      ],
                    }
              }
              transition={{ duration: 1.6, ease: "easeInOut" }}
            >
              <motion.span
                className="font-mono text-5xl font-bold leading-none text-accent drop-shadow-[0_0_28px_color-mix(in_oklch,var(--accent)_70%,transparent)]"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={
                  reducedMotion
                    ? { duration: 0.2 }
                    : {
                        type: "spring",
                        stiffness: 500,
                        damping: 18,
                        delay: 0.12,
                      }
                }
              >
                +{amount}
              </motion.span>
              <motion.span
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reducedMotion ? 0.15 : 0.45,
                  delay: reducedMotion ? 0.05 : 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                XP Unlocked
              </motion.span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
