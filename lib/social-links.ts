export type SocialPlatform =
  | "github"
  | "linkedin"
  | "whatsapp"
  | "discord"
  | "twitter"
  | "email"
  | "youtube"
  | "website";

export type SocialUrls = Record<SocialPlatform, string>;

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "github",
  "linkedin",
  "whatsapp",
  "discord",
  "twitter",
  "email",
  "youtube",
  "website",
];

export type SocialPlatformMeta = {
  key: SocialPlatform;
  label: string;
  shortLabel: string;
  placeholder: string;
  inputType: "url" | "text" | "email";
};

export const SOCIAL_PLATFORM_META: Record<SocialPlatform, SocialPlatformMeta> = {
  github: {
    key: "github",
    label: "GitHub",
    shortLabel: "GitHub",
    placeholder: "https://github.com/username",
    inputType: "url",
  },
  linkedin: {
    key: "linkedin",
    label: "LinkedIn",
    shortLabel: "LinkedIn",
    placeholder: "https://linkedin.com/in/username",
    inputType: "url",
  },
  whatsapp: {
    key: "whatsapp",
    label: "WhatsApp",
    shortLabel: "WhatsApp",
    placeholder: "+923001234567 or wa.me link",
    inputType: "text",
  },
  discord: {
    key: "discord",
    label: "Discord",
    shortLabel: "Discord",
    placeholder: "https://discord.gg/invite",
    inputType: "url",
  },
  twitter: {
    key: "twitter",
    label: "Twitter / X",
    shortLabel: "X",
    placeholder: "https://x.com/username",
    inputType: "url",
  },
  email: {
    key: "email",
    label: "Email",
    shortLabel: "Email",
    placeholder: "you@example.com",
    inputType: "email",
  },
  youtube: {
    key: "youtube",
    label: "YouTube",
    shortLabel: "YouTube",
    placeholder: "https://youtube.com/@channel",
    inputType: "url",
  },
  website: {
    key: "website",
    label: "Website / Portfolio",
    shortLabel: "Site",
    placeholder: "https://yourportfolio.com",
    inputType: "url",
  },
};

export const EMPTY_SOCIAL_URLS: SocialUrls = {
  github: "",
  linkedin: "",
  whatsapp: "",
  discord: "",
  twitter: "",
  email: "",
  youtube: "",
  website: "",
};

function ensureHttps(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function resolveSocialHref(
  platform: SocialPlatform,
  raw: string,
): string | null {
  const value = raw.trim();
  if (!value) return null;

  switch (platform) {
    case "email": {
      if (value.startsWith("mailto:")) return value;
      return `mailto:${value.replace(/^mailto:/i, "")}`;
    }
    case "whatsapp": {
      if (/^https?:\/\//i.test(value)) return value;
      const digits = value.replace(/\D/g, "");
      if (!digits) return null;
      return `https://wa.me/${digits}`;
    }
    case "discord":
    case "github":
    case "linkedin":
    case "twitter":
    case "youtube":
    case "website":
      return ensureHttps(value);
    default: {
      const _exhaustive: never = platform;
      return _exhaustive;
    }
  }
}

export function getConfiguredSocialLinks(
  urls: SocialUrls,
): { platform: SocialPlatform; href: string; meta: SocialPlatformMeta }[] {
  return SOCIAL_PLATFORMS.flatMap((platform) => {
    const href = resolveSocialHref(platform, urls[platform]);
    if (!href) return [];
    return [{ platform, href, meta: SOCIAL_PLATFORM_META[platform] }];
  });
}

export function normalizeSocialUrls(raw: unknown): SocialUrls {
  const next = { ...EMPTY_SOCIAL_URLS };
  if (!raw || typeof raw !== "object") return next;
  const row = raw as Record<string, unknown>;

  for (const platform of SOCIAL_PLATFORMS) {
    const value = row[platform];
    if (typeof value === "string") next[platform] = value.trim();
  }

  if (!next.website && typeof row.portfolio === "string") {
    next.website = row.portfolio.trim();
  }

  return next;
}

export function trimSocialUrls(urls: SocialUrls): SocialUrls {
  const next = { ...EMPTY_SOCIAL_URLS };
  for (const platform of SOCIAL_PLATFORMS) {
    next[platform] = urls[platform].trim();
  }
  return next;
}
