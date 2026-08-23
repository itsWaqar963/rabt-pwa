"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  meetupFieldActiveClass,
  meetupFieldClass,
} from "@/components/ui/DarkSelectPopover";

export type DatePopoverProps = {
  id: string;
  label: string;
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: string) => void;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toYmd(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function parseYmd(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]) - 1;
  const d = Number(match[3]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return null;
  }
  return { y, m, d };
}

function formatDisplay(value: string): string {
  const parsed = parseYmd(value);
  if (!parsed) return "Pick a date";
  const date = new Date(parsed.y, parsed.m, parsed.d);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DatePopover({
  id,
  label,
  value,
  open,
  onOpenChange,
  onChange,
}: DatePopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const parsed = parseYmd(value);
  const now = new Date();
  const [viewYear, setViewYear] = useState(
    () => parsed?.y ?? now.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    () => parsed?.m ?? now.getMonth(),
  );

  useEffect(() => {
    if (!open) return;
    const p = parseYmd(value);
    if (p) {
      setViewYear(p.y);
      setViewMonth(p.m);
    }
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onOpenChange(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, onOpenChange]);

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const out: Array<{ day: number; ymd: string } | null> = [];
    for (let i = 0; i < startPad; i++) out.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      out.push({ day, ymd: toYmd(viewYear, viewMonth, day) });
    }
    return out;
  }, [viewYear, viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    undefined,
    { month: "long", year: "numeric" },
  );

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        onClick={() => onOpenChange(!open)}
        className={`${meetupFieldClass} ${open ? meetupFieldActiveClass : ""} flex items-center justify-between gap-2`}
      >
        <span className={value ? "truncate" : "truncate text-muted"}>
          {formatDisplay(value)}
        </span>
        <CalendarDays
          className={`size-4 shrink-0 ${open ? "text-accent" : "text-muted"}`}
          strokeWidth={1.8}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={label}
          className="absolute left-0 z-20 mt-1.5 w-[min(100%,280px)] rounded-[12px] border border-[color-mix(in_oklch,var(--accent)_40%,var(--border))] bg-[color-mix(in_oklch,var(--surface)_92%,black)] p-3 shadow-[0_16px_40px_color-mix(in_oklch,var(--bg)_85%,transparent)] backdrop-blur-xl"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
              className="grid size-9 place-items-center rounded-[8px] border border-border bg-black/40 text-foreground transition-[border-color,background] hover:border-accent"
            >
              <ChevronLeft className="size-4" strokeWidth={1.8} aria-hidden />
            </button>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-foreground">
              {monthLabel}
            </p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
              className="grid size-9 place-items-center rounded-[8px] border border-border bg-black/40 text-foreground transition-[border-color,background] hover:border-accent"
            >
              <ChevronRight className="size-4" strokeWidth={1.8} aria-hidden />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((d) => (
              <span
                key={d}
                className="grid h-7 place-items-center font-mono text-[9px] uppercase tracking-wider text-muted"
              >
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((cell, index) => {
              if (!cell) {
                return <span key={`pad-${index}`} className="h-9" />;
              }
              const selected = cell.ymd === value;
              return (
                <button
                  key={cell.ymd}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    onChange(cell.ymd);
                    onOpenChange(false);
                  }}
                  className={`grid h-9 place-items-center rounded-[8px] text-sm transition-[background,color,box-shadow] duration-100 ${
                    selected
                      ? "bg-accent font-semibold text-[oklch(0.18_0.03_165)] shadow-[0_0_14px_color-mix(in_oklch,var(--accent)_45%,transparent)]"
                      : "text-foreground hover:bg-black/40 hover:text-accent"
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
