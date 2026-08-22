"use client";

import { useEffect, useState, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronUp } from "lucide-react";

export type BackToTopFabProps = {
  scrollRef: RefObject<HTMLElement | null>;
};

export function BackToTopFab({ scrollRef }: BackToTopFabProps) {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      setVisible(el.scrollTop > el.clientHeight);
    };

    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef]);

  const scrollToTop = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      top: 0,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          aria-label="Back to top"
          onClick={scrollToTop}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0, scale: 0.85 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 420, damping: 28 }
          }
          className="absolute bottom-[calc(max(14px,env(safe-area-inset-bottom))+5.5rem)] right-[18px] z-40 grid size-11 place-items-center rounded-full border border-[color-mix(in_oklch,var(--accent)_35%,var(--border))] bg-[color-mix(in_oklch,var(--surface)_88%,transparent)] text-foreground shadow-[0_12px_32px_color-mix(in_oklch,var(--bg)_70%,transparent)] backdrop-blur-md transition-[border-color,background] duration-150 hover:border-accent hover:bg-[color-mix(in_oklch,var(--accent)_12%,var(--surface))] active:scale-95 max-[360px]:right-3.5"
        >
          <ChevronUp className="size-5" strokeWidth={1.8} aria-hidden />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
