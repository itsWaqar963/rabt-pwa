"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { FilterOption } from "@/lib/discovery-filters";

export type FilterDrawerProps = {
  open: boolean;
  title: string;
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

/** Edge fade; center band fully opaque — GOAT wheel mask */
const LIST_MASK =
  "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)";

const CENTER_GLOW =
  "0 0 12px color-mix(in oklch, var(--accent) 55%, transparent), 0 0 28px color-mix(in oklch, var(--accent) 28%, transparent)";

/** Half-height (px) of influence band for scale/opacity falloff */
const FALLOFF_PX = 120;
const SCALE_MIN = 0.82;
const SCALE_MAX = 1.18;
const OPACITY_MIN = 0.35;
const OPACITY_MAX = 1;

type ItemStyle = {
  scale: number;
  opacity: number;
  isCenter: boolean;
};

function styleFromDistance(distancePx: number): ItemStyle {
  const t = Math.min(1, Math.abs(distancePx) / FALLOFF_PX);
  const ease = 1 - (1 - t) * (1 - t);
  return {
    scale: SCALE_MAX - ease * (SCALE_MAX - SCALE_MIN),
    opacity: OPACITY_MAX - ease * (OPACITY_MAX - OPACITY_MIN),
    isCenter: Math.abs(distancePx) < 28,
  };
}

export function FilterDrawer({
  open,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: FilterDrawerProps) {
  const reduceMotion = useReducedMotion();
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const centerIndexRef = useRef(0);
  const [centerIndex, setCenterIndex] = useState(0);
  const [itemStyles, setItemStyles] = useState<ItemStyle[]>(() =>
    options.map(() => ({
      scale: SCALE_MIN,
      opacity: OPACITY_MIN,
      isCenter: false,
    })),
  );

  const updateFromScroll = useCallback(() => {
    const list = listRef.current;
    if (!list) return;

    const listRect = list.getBoundingClientRect();
    const midY = listRect.top + listRect.height / 2;

    let nearest = 0;
    let nearestDist = Number.POSITIVE_INFINITY;
    const next: ItemStyle[] = [];

    for (let i = 0; i < options.length; i++) {
      const el = itemRefs.current[i];
      if (!el) {
        next.push({ scale: SCALE_MIN, opacity: OPACITY_MIN, isCenter: false });
        continue;
      }
      const rect = el.getBoundingClientRect();
      const itemMid = rect.top + rect.height / 2;
      const dist = itemMid - midY;
      next.push(styleFromDistance(dist));
      const abs = Math.abs(dist);
      if (abs < nearestDist) {
        nearestDist = abs;
        nearest = i;
      }
    }

    // Exactly one center highlight: nearest to mid-line
    next.forEach((s, i) => {
      s.isCenter = i === nearest;
      if (s.isCenter) {
        s.scale = SCALE_MAX;
        s.opacity = OPACITY_MAX;
      }
    });

    centerIndexRef.current = nearest;
    setCenterIndex(nearest);
    setItemStyles(next);
  }, [options.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset styles when options change; scroll committed selection to center on open
  useEffect(() => {
    if (!open) return;

    itemRefs.current = itemRefs.current.slice(0, options.length);
    const selectedIdx = Math.max(
      0,
      options.findIndex((o) => o.value === selectedValue),
    );
    centerIndexRef.current = selectedIdx;
    setCenterIndex(selectedIdx);

    const id = window.requestAnimationFrame(() => {
      const el = itemRefs.current[selectedIdx];
      el?.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: reduceMotion ? "auto" : "smooth",
      });
      updateFromScroll();
    });

    return () => window.cancelAnimationFrame(id);
  }, [open, selectedValue, options, reduceMotion, updateFromScroll]);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateFromScroll);
    };

    list.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateFromScroll();

    return () => {
      cancelAnimationFrame(raf);
      list.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, updateFromScroll]);

  const commitIndex = (index: number) => {
    const opt = options[index];
    if (opt) onSelect(opt.value);
  };

  const handleItemClick = (index: number) => {
    // Tap any item commits that value; center tap is primary confirm gesture
    commitIndex(index);
  };

  const duration = reduceMotion ? 0.01 : 0.28;

  return (
    <AnimatePresence>
      {open ? (
        <div className="absolute inset-0 z-50" role="presentation">
          <motion.button
            type="button"
            aria-label="Close filter picker"
            className="absolute inset-0 bg-black/55 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="pointer-events-none absolute inset-y-0 right-0 flex h-full w-[38%] max-w-[10.5rem] min-w-[7.5rem] flex-col"
            initial={reduceMotion ? false : { x: 36, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { x: 36, opacity: 0 }}
            transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="pointer-events-none absolute top-[max(16px,env(safe-area-inset-top))] right-3 z-10 font-mono text-[9px] uppercase tracking-[0.2em] text-muted/80">
              {title}
            </p>

            {/*
              Wheel rail: py-[40vh] lets first/last (and short lists) sit mid-shell.
              Mask fades edges; scroll position drives magnified center preview.
            */}
            <ul
              ref={listRef}
              className="pointer-events-auto h-full min-h-0 list-none overflow-y-auto overscroll-contain touch-pan-y scroll-smooth snap-y snap-proximity py-[40vh] pr-3 pl-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
              style={{
                WebkitMaskImage: LIST_MASK,
                maskImage: LIST_MASK,
              }}
            >
              {options.map((opt, index) => {
                const style = itemStyles[index] ?? {
                  scale: SCALE_MIN,
                  opacity: OPACITY_MIN,
                  isCenter: false,
                };
                const active = style.isCenter || index === centerIndex;
                return (
                  <li
                    key={opt.value}
                    ref={(node) => {
                      itemRefs.current[index] = node;
                    }}
                    className="snap-center"
                  >
                    <button
                      type="button"
                      aria-current={active ? "true" : undefined}
                      onClick={() => handleItemClick(index)}
                      className={`block w-full origin-right py-[13px] text-right font-sans leading-snug tracking-[-0.01em] will-change-transform ${
                        active
                          ? "font-semibold text-accent"
                          : "font-normal text-foreground"
                      }`}
                      style={{
                        transform: `scale(${style.scale})`,
                        opacity: style.opacity,
                        textShadow: active ? CENTER_GLOW : undefined,
                        fontSize: active ? "17px" : "15px",
                        transition: reduceMotion
                          ? undefined
                          : "transform 80ms linear, opacity 80ms linear, font-size 80ms linear, color 120ms ease",
                      }}
                    >
                      {opt.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
