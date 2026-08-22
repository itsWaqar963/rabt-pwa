"use client";

import { motion } from "framer-motion";

type XpRewardProps = {
  amount?: number;
  onComplete?: () => void;
};

const PARTICLES = Array.from({ length: 8 }, (_, i) => i);

export function XpReward({ amount = 50, onComplete }: XpRewardProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
      {PARTICLES.map((i) => (
        <motion.span
          key={i}
          className="absolute size-1.5 rounded-full bg-accent"
          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0, 1.2, 0.4],
            x: Math.cos((i / 8) * Math.PI * 2) * (40 + i * 6),
            y: Math.sin((i / 8) * Math.PI * 2) * (40 + i * 6) - 20,
          }}
          transition={{ duration: 0.9, ease: "easeOut", delay: i * 0.03 }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.6, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: -40 }}
        exit={{ opacity: 0, scale: 0.8, y: -80 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={() => onComplete?.()}
        className="flex flex-col items-center gap-1"
      >
        <span className="font-mono text-4xl font-bold text-accent drop-shadow-[0_0_24px_color-mix(in_oklch,var(--accent)_60%,transparent)]">
          +{amount}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          XP Unlocked
        </span>
      </motion.div>
    </div>
  );
}
