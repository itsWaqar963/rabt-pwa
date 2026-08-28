"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type AppScreen = "discover" | "meetups" | "reflect" | "profile";

export type ScreenTagline = {
  title_lead: string;
  title_accent: string;
  subtitle: string;
};

export const SCREEN_TAGLINE_FALLBACKS: Record<AppScreen, ScreenTagline> = {
  discover: {
    title_lead: "Find your ",
    title_accent: "cluster.",
    subtitle: "Real people. Shared intent. A reason to meet offline.",
  },
  meetups: {
    title_lead: "Meet with ",
    title_accent: "intent.",
    subtitle:
      "Small gatherings for useful conversations, shared practice, and a reason to show up.",
  },
  reflect: {
    title_lead: "Reflect ",
    title_accent: "& grow.",
    subtitle:
      "Verify your physical meetups, build community trust, and claim your growth XP.",
  },
  profile: {
    title_lead: "Show up as ",
    title_accent: "yourself.",
    subtitle:
      "A clear signal for people who want to turn shared intent into real local connection.",
  },
};

function isAppScreen(value: string): value is AppScreen {
  return (
    value === "discover" ||
    value === "meetups" ||
    value === "reflect" ||
    value === "profile"
  );
}

export async function fetchScreenTaglines(
  screen: AppScreen,
): Promise<ScreenTagline> {
  const fallback = SCREEN_TAGLINE_FALLBACKS[screen];
  const { data, error } = await supabase
    .from("app_screen_taglines")
    .select("title_lead, title_accent, subtitle")
    .eq("screen", screen)
    .maybeSingle();

  if (error || !data) return fallback;

  return {
    title_lead: String(data.title_lead ?? fallback.title_lead),
    title_accent: String(data.title_accent ?? fallback.title_accent),
    subtitle: String(data.subtitle ?? fallback.subtitle),
  };
}

export function useScreenTagline(screen: AppScreen): ScreenTagline {
  const [tagline, setTagline] = useState<ScreenTagline>(
    SCREEN_TAGLINE_FALLBACKS[screen],
  );

  useEffect(() => {
    let cancelled = false;
    void fetchScreenTaglines(screen).then((next) => {
      if (!cancelled) setTagline(next);
    });
    return () => {
      cancelled = true;
    };
  }, [screen]);

  return tagline;
}

export function parseAppScreen(value: string): AppScreen | null {
  return isAppScreen(value) ? value : null;
}
