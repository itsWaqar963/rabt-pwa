import { supabase } from "@/lib/supabase";

export type AppBanner = {
  id: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  created_at: string;
};

export async function fetchActiveBanner(): Promise<AppBanner | null> {
  const { data, error } = await supabase
    .from("app_banners")
    .select("id, image_url, link_url, is_active, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: String(data.id),
    image_url: String(data.image_url),
    link_url: String(data.link_url),
    is_active: Boolean(data.is_active),
    created_at: String(data.created_at),
  };
}

const DISMISSED_KEY = "rabt_dismissed_banners";

export function getDismissedBannerIds(): string[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function dismissBanner(id: string): void {
  if (typeof sessionStorage === "undefined") return;
  const ids = getDismissedBannerIds();
  if (ids.includes(id)) return;
  sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids, id]));
}

export function isBannerDismissed(id: string): boolean {
  return getDismissedBannerIds().includes(id);
}
