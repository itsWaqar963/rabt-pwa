"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, Home, User, Users } from "lucide-react";

const TABS = [
  { href: "/discover", label: "Discover", Icon: Home },
  { href: "/meetups", label: "Meetups", Icon: Users },
  { href: "/reflect", label: "Reflect", Icon: CheckSquare },
  { href: "/profile", label: "Profile", Icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="pointer-events-auto fixed bottom-[max(20px,env(safe-area-inset-bottom,0px))] left-1/2 z-40 flex min-h-[58px] w-[min(calc(100%-36px),424px)] max-w-[calc(28rem-36px)] -translate-x-1/2 items-center justify-around rounded-[18px] border border-[color-mix(in_oklch,var(--accent)_35%,var(--border))] border-t-[color-mix(in_oklch,var(--accent)_45%,var(--border))] bg-black/80 p-1.5 pb-[max(6px,env(safe-area-inset-bottom,0px))] shadow-[0_18px_45px_color-mix(in_oklch,var(--bg)_78%,transparent)] backdrop-blur-xl"
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`grid min-h-11 min-w-[54px] justify-items-center gap-0.5 rounded-xl px-2 py-[5px] font-mono text-[9px] transition-colors ${
              active
                ? "bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] text-accent"
                : "bg-transparent text-muted"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-[17px]" strokeWidth={1.6} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
