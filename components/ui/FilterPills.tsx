"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Globe2,
  MapPin,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { FilterDrawer } from "@/components/ui/FilterDrawer";
import {
  FILTER_KEYS,
  FILTER_OPTIONS,
  FILTER_TITLES,
  applyFilterChange,
  getCityOptions,
  getFilterCode,
  type DiscoveryFilters,
  type FilterKey,
} from "@/lib/discovery-filters";

const FILTER_ICONS: Record<FilterKey, LucideIcon> = {
  country: Globe2,
  city: MapPin,
  gender: UserRound,
  age: CalendarDays,
};

export type FilterPillsProps = {
  filters: DiscoveryFilters;
  onChange: (next: DiscoveryFilters) => void;
  /** Subset of pills; defaults to all discovery keys */
  keys?: FilterKey[];
  /** Subtle emerald dividers between pills (Meetups explore bar) */
  pillDividers?: boolean;
};

export function FilterPills({
  filters,
  onChange,
  keys = FILTER_KEYS,
  pillDividers = false,
}: FilterPillsProps) {
  const [activeKey, setActiveKey] = useState<FilterKey | null>(null);
  const [drawerKey, setDrawerKey] = useState<FilterKey>("country");
  const [shell, setShell] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setShell(
      document.querySelector<HTMLElement>(".max-w-md.mx-auto.min-h-screen"),
    );
  }, []);

  useEffect(() => {
    if (activeKey === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [activeKey]);

  const closeDrawer = useCallback(() => setActiveKey(null), []);

  const handleSelect = useCallback(
    (value: string) => {
      onChange(applyFilterChange(filters, drawerKey, value));
      setActiveKey(null);
    },
    [drawerKey, filters, onChange],
  );

  const openDrawer = (key: FilterKey) => {
    setDrawerKey(key);
    setActiveKey(key);
  };

  const drawerOptions =
    drawerKey === "city"
      ? getCityOptions(filters.country)
      : FILTER_OPTIONS[drawerKey];

  return (
    <>
      <div
        role="group"
        aria-label="Discovery filters"
        className={`flex w-full items-center overflow-x-auto px-[18px] py-2.5 [scrollbar-width:none] max-[360px]:px-3.5 [&::-webkit-scrollbar]:hidden ${
          pillDividers
            ? "justify-center gap-4"
            : "justify-evenly gap-1.5 max-[360px]:justify-center max-[360px]:gap-1"
        }`}
      >
        {keys.map((key, index) => {
          const code = getFilterCode(key, filters[key]);
          const isOpen = activeKey === key;
          const Icon = FILTER_ICONS[key];
          return (
            <Fragment key={key}>
              {pillDividers && index > 0 ? (
                <span
                  aria-hidden
                  className="h-5 w-px shrink-0 bg-[color-mix(in_oklch,var(--accent)_48%,var(--border))] shadow-[0_0_10px_color-mix(in_oklch,var(--accent)_38%,transparent)]"
                />
              ) : null}
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-label={`${FILTER_TITLES[key]}: ${code}`}
                onClick={() => openDrawer(key)}
                className={`inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-[border-color,background,color] duration-150 ${
                  isOpen
                    ? "border-accent bg-[color-mix(in_oklch,var(--accent)_16%,transparent)] text-accent"
                    : "border-[color-mix(in_oklch,var(--accent)_55%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_10%,transparent)] text-foreground hover:border-accent hover:bg-[color-mix(in_oklch,var(--accent)_14%,transparent)]"
                }`}
              >
                <Icon aria-hidden className="size-3.5 shrink-0" strokeWidth={2} />
                {code}
              </button>
            </Fragment>
          );
        })}
      </div>

      {shell
        ? createPortal(
            <FilterDrawer
              open={activeKey !== null}
              title={FILTER_TITLES[drawerKey]}
              options={drawerOptions}
              selectedValue={filters[drawerKey]}
              onSelect={handleSelect}
              onClose={closeDrawer}
            />,
            shell,
          )
        : null}
    </>
  );
}
