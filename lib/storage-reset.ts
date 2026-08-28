import { AWAKENING_COMPLETE_KEY } from "@/lib/awakening-store";
import { COMPLETED_KEY } from "@/lib/learn-earn-store";
import {
  CREATED_MEETUPS_KEY,
  HIDDEN_IDS_KEY,
  HOST_REQUESTERS_KEY,
  JOIN_REQUESTS_KEY,
  MEETUP_ACKS_KEY,
} from "@/lib/meetup-store";
import { PROFILE_KEY } from "@/lib/profile-store";

export const STORAGE_RESET_VERSION = "beta-1";
export const STORAGE_VERSION_KEY = "rabt_storage_version";

const PRESERVED_KEYS = new Set([
  "rabt_install_dismissed",
  "rabt_push_subscription",
  "rabt_notify_banner_session_dismissed",
]);

const LEGACY_KEYS_TO_CLEAR = [
  PROFILE_KEY,
  COMPLETED_KEY,
  "rabt_learn_contributions",
  MEETUP_ACKS_KEY,
  CREATED_MEETUPS_KEY,
  JOIN_REQUESTS_KEY,
  HOST_REQUESTERS_KEY,
  HIDDEN_IDS_KEY,
  AWAKENING_COMPLETE_KEY,
  `${AWAKENING_COMPLETE_KEY}:guest`,
];

export function runStorageResetIfNeeded(): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(STORAGE_VERSION_KEY);
    if (stored === STORAGE_RESET_VERSION) return;

    for (const key of LEGACY_KEYS_TO_CLEAR) {
      localStorage.removeItem(key);
    }

    const extraKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith("rabt_")) continue;
      if (key === STORAGE_VERSION_KEY) continue;
      if (PRESERVED_KEYS.has(key)) continue;
      extraKeys.push(key);
    }
    for (const key of extraKeys) {
      localStorage.removeItem(key);
    }

    localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_RESET_VERSION);
  } catch {
    /* private mode / quota */
  }
}
