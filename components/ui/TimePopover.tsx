"use client";

import { useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import {
  meetupFieldActiveClass,
  meetupFieldClass,
} from "@/components/ui/DarkSelectPopover";

export type TimePopoverProps = {
  id: string;
  label: string;
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: string) => void;
};

const LIST_MASK =
  "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function parseHm(value: string): { h: number; m: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

function formatDisplay(value: string): string {
  const parsed = parseHm(value);
  if (!parsed) return "Pick a time";
  const date = new Date();
  date.setHours(parsed.h, parsed.m, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export function TimePopover({
  id,
  label,
  value,
  open,
  onOpenChange,
  onChange,
}: TimePopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const parsed = parseHm(value);
  const hour = parsed?.h ?? 18;
  const minute = parsed ? (Math.round(parsed.m / 5) * 5) % 60 : 0;

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

  useEffect(() => {
    if (!open) return;
    const hourEl = hourRef.current?.querySelector<HTMLElement>(
      `[data-hour="${hour}"]`,
    );
    const minuteEl = minuteRef.current?.querySelector<HTMLElement>(
      `[data-minute="${minute}"]`,
    );
    hourEl?.scrollIntoView({ block: "center" });
    minuteEl?.scrollIntoView({ block: "center" });
  }, [open, hour, minute]);

  function commit(nextH: number, nextM: number) {
    onChange(`${pad2(nextH)}:${pad2(nextM)}`);
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
        <Clock
          className={`size-4 shrink-0 ${open ? "text-accent" : "text-muted"}`}
          strokeWidth={1.8}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={label}
          className="absolute right-0 z-20 mt-1.5 w-[min(100%,220px)] rounded-[12px] border border-[color-mix(in_oklch,var(--accent)_40%,var(--border))] bg-[color-mix(in_oklch,var(--surface)_92%,black)] p-3 shadow-[0_16px_40px_color-mix(in_oklch,var(--bg)_85%,transparent)] backdrop-blur-xl"
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.09em] text-muted">
                Hour
              </p>
              <div
                ref={hourRef}
                role="listbox"
                aria-label="Hour"
                className="max-h-[180px] overflow-y-auto overscroll-contain rounded-[10px] border border-border bg-black/40 py-1 [scrollbar-width:thin]"
                style={{
                  WebkitMaskImage: LIST_MASK,
                  maskImage: LIST_MASK,
                }}
              >
                {HOURS.map((h) => {
                  const active = h === hour;
                  return (
                    <button
                      key={h}
                      type="button"
                      role="option"
                      aria-selected={active}
                      data-hour={h}
                      onClick={() => commit(h, minute)}
                      className={`flex min-h-[40px] w-full items-center justify-center px-2 text-sm tabular-nums transition-[background,color] duration-100 ${
                        active
                          ? "bg-[color-mix(in_oklch,var(--accent)_16%,transparent)] font-semibold text-accent"
                          : "text-foreground hover:bg-black/35"
                      }`}
                    >
                      {pad2(h)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.09em] text-muted">
                Minute
              </p>
              <div
                ref={minuteRef}
                role="listbox"
                aria-label="Minute"
                className="max-h-[180px] overflow-y-auto overscroll-contain rounded-[10px] border border-border bg-black/40 py-1 [scrollbar-width:thin]"
                style={{
                  WebkitMaskImage: LIST_MASK,
                  maskImage: LIST_MASK,
                }}
              >
                {MINUTES.map((m) => {
                  const active = m === minute;
                  return (
                    <button
                      key={m}
                      type="button"
                      role="option"
                      aria-selected={active}
                      data-minute={m}
                      onClick={() => {
                        commit(hour, m);
                        onOpenChange(false);
                      }}
                      className={`flex min-h-[40px] w-full items-center justify-center px-2 text-sm tabular-nums transition-[background,color] duration-100 ${
                        active
                          ? "bg-[color-mix(in_oklch,var(--accent)_16%,transparent)] font-semibold text-accent"
                          : "text-foreground hover:bg-black/35"
                      }`}
                    >
                      {pad2(m)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
