"use client";

import type { SocialPlatformMeta } from "@/lib/social-links";
import { SocialPlatformIcon } from "@/components/ui/SocialPlatformIcons";
import type { SocialPlatform } from "@/lib/social-links";

type DigitalTrailIconProps = {
  platform: SocialPlatform;
  meta: SocialPlatformMeta;
  href: string;
  active?: boolean;
};

export function DigitalTrailIcon({
  platform,
  meta,
  href,
  active = true,
}: DigitalTrailIconProps) {
  const { label, shortLabel } = meta;

  const className =
    "group grid size-[52px] shrink-0 place-items-center rounded-full border transition-[border-color,background,transform,box-shadow] duration-150 " +
    (active
      ? "border-[color-mix(in_oklch,var(--accent)_55%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_10%,var(--surface))] text-accent shadow-[0_0_18px_color-mix(in_oklch,var(--accent)_22%,transparent)] hover:border-accent hover:bg-[color-mix(in_oklch,var(--accent)_16%,transparent)] active:scale-95"
      : "border-border bg-[color-mix(in_oklch,var(--surface)_60%,transparent)] text-muted opacity-50");

  const inner = (
    <>
      <SocialPlatformIcon platform={platform} className="size-[18px]" />
      <span className="sr-only">{label}</span>
    </>
  );

  if (!active) {
    return (
      <div className={className} aria-hidden title={shortLabel}>
        {inner}
      </div>
    );
  }

  return (
    <a
      href={href}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel={href.startsWith("mailto:") ? undefined : "noreferrer"}
      className={className}
      aria-label={label}
      title={label}
    >
      {inner}
    </a>
  );
}

type DigitalTrailRowProps = {
  links: { platform: SocialPlatform; meta: SocialPlatformMeta; href: string }[];
  showPlaceholders?: boolean;
};

export function DigitalTrailRow({
  links,
  showPlaceholders = false,
}: DigitalTrailRowProps) {
  if (links.length === 0 && !showPlaceholders) {
    return (
      <p className="text-[11px] text-muted">
        Add social links in Edit profile — all optional.
      </p>
    );
  }

  if (links.length === 0) {
    return null;
  }

  return (
    <div className="-mx-0.5 flex gap-3 overflow-x-auto px-0.5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {links.map(({ platform, meta, href }) => (
        <DigitalTrailIcon
          key={meta.key}
          platform={platform}
          meta={meta}
          href={href}
          active
        />
      ))}
    </div>
  );
}
