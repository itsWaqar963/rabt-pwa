"use client";

import { useEffect, useId, useRef } from "react";
import { ChevronDown } from "lucide-react";

export type DarkSelectOption = {
  value: string;
  label: string;
};

export type DarkSelectPopoverProps = {
  id: string;
  label: string;
  value: string;
  options: DarkSelectOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: string) => void;
  placeholder?: string;
};

const LIST_MASK =
  "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)";

export const meetupFieldClass =
  "w-full min-h-[46px] rounded-[10px] border border-border bg-black/40 px-3 text-left text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[color-mix(in_oklch,var(--muted)_72%,transparent)] focus:border-[color-mix(in_oklch,var(--accent)_55%,var(--border))] focus:shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_35%,transparent),0_0_18px_color-mix(in_oklch,var(--accent)_22%,transparent)]";

export const meetupFieldActiveClass =
  "border-[color-mix(in_oklch,var(--accent)_55%,var(--border))] shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_35%,transparent),0_0_18px_color-mix(in_oklch,var(--accent)_22%,transparent)]";

export function DarkSelectPopover({
  id,
  label,
  value,
  options,
  open,
  onOpenChange,
  onChange,
  placeholder = "Select",
}: DarkSelectPopoverProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selected = options.find((o) => o.value === value);

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
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-value="${CSS.escape(value)}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [open, value]);

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        onClick={() => onOpenChange(!open)}
        className={`${meetupFieldClass} ${open ? meetupFieldActiveClass : ""} flex items-center justify-between gap-2`}
      >
        <span className={selected ? "truncate" : "truncate text-muted"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted transition-transform duration-150 ${open ? "rotate-180 text-accent" : ""}`}
          strokeWidth={1.8}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          className="absolute left-0 right-0 z-20 mt-1.5 overflow-hidden rounded-[12px] border border-[color-mix(in_oklch,var(--accent)_40%,var(--border))] bg-[color-mix(in_oklch,var(--surface)_92%,black)] shadow-[0_16px_40px_color-mix(in_oklch,var(--bg)_85%,transparent),0_0_0_1px_color-mix(in_oklch,var(--accent)_12%,transparent)] backdrop-blur-xl"
          role="presentation"
        >
          <ul
            id={listId}
            ref={listRef}
            role="listbox"
            aria-label={label}
            className="max-h-[min(220px,40vh)] list-none overflow-y-auto overscroll-contain py-2 [scrollbar-width:thin]"
            style={{
              WebkitMaskImage: LIST_MASK,
              maskImage: LIST_MASK,
            }}
          >
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <li key={opt.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    data-value={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      onOpenChange(false);
                    }}
                    className={`flex min-h-[42px] w-full items-center px-3 text-left text-sm transition-[background,color,text-shadow] duration-100 ${
                      active
                        ? "bg-[color-mix(in_oklch,var(--accent)_16%,transparent)] font-semibold text-accent"
                        : "text-foreground hover:bg-black/35"
                    }`}
                    style={
                      active
                        ? {
                            textShadow:
                              "0 0 12px color-mix(in oklch, var(--accent) 45%, transparent)",
                          }
                        : undefined
                    }
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
