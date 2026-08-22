"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { ReflectionCard } from "@/components/ui/ReflectionCard";

const REVIEWS = [
  {
    id: "sana",
    avatar: "س",
    title: "Meetup with Sana Khalid",
    date: "18 Aug",
    location: "Model Town Park, Lahore",
    memberCount: 3,
  },
  {
    id: "hamza",
    avatar: "ح",
    title: "Sunday Civic Tech Walk",
    date: "11 Aug",
    location: "Racecourse Park, Lahore",
    memberCount: 5,
  },
] as const;

export default function ReflectPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_80%_4%,color-mix(in_oklch,var(--muted)_9%,transparent),transparent_20rem),var(--bg)]">
      <main className="relative z-[1] h-[100dvh] overflow-y-auto px-[18px] pb-[max(88px,calc(env(safe-area-inset-bottom)+72px))] pt-[max(18px,env(safe-area-inset-top))] [scrollbar-width:none] max-[360px]:px-3.5 [&::-webkit-scrollbar]:hidden">
        <header className="relative z-10 flex min-h-12 items-center justify-between">
          <div className="flex items-baseline gap-2.5">
            <span
              lang="ar"
              className="font-display text-[48px] font-semibold leading-none tracking-[-0.04em] text-foreground [direction:rtl]"
              style={{
                textShadow:
                  "0 0 18px color-mix(in oklch, var(--accent) 34%, transparent), 0 0 42px color-mix(in oklch, var(--accent) 22%, transparent)",
              }}
            >
              ربط
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
              RABT
            </span>
          </div>
          <Link
            href="/profile"
            aria-label="Open profile"
            className="grid size-11 place-items-center rounded-full border border-border bg-[color-mix(in_oklch,var(--fg)_6%,transparent)] text-foreground transition-[background,border-color,transform] duration-150 hover:border-foreground hover:bg-[color-mix(in_oklch,var(--fg)_6%,transparent)] active:scale-95"
          >
            <User className="size-[18px]" strokeWidth={1.6} aria-hidden />
          </Link>
        </header>

        <section className="px-0.5 pb-[18px] pt-[27px]">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            After the gathering · 03
          </p>
          <h1 className="mt-1 max-w-[13ch] font-display text-[32px] leading-[1.08] text-foreground max-[360px]:text-[29px]">
            Reflect <span className="text-accent">&amp; grow.</span>
          </h1>
          <p className="mt-[11px] max-w-[35ch] text-xs leading-[1.58] text-muted">
            Verify your physical meetups, build community trust, and claim your
            growth XP.
          </p>
        </section>

        <section className="rounded-[18px] border border-[color-mix(in_oklch,var(--accent)_46%,var(--border))] bg-[linear-gradient(140deg,color-mix(in_oklch,var(--accent)_10%,var(--surface)),var(--surface))] p-4 shadow-[0_18px_46px_color-mix(in_oklch,var(--bg)_72%,transparent)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                Your standing
              </p>
              <h2 className="mt-[3px] font-display text-[21px] text-foreground">
                Trust, earned in person.
              </h2>
            </div>
            <div className="grid min-h-[58px] min-w-[58px] place-items-center rounded-full border border-[color-mix(in_oklch,var(--accent)_58%,var(--border))] text-center font-mono text-[13px] font-bold leading-[1.1] text-accent">
              4.9
              <small className="mt-0 block text-[8px] font-normal text-muted">
                / 5 rating
              </small>
            </div>
          </div>
          <div className="mt-[17px] grid grid-cols-3 gap-2 border-t border-[color-mix(in_oklch,var(--border)_78%,transparent)] pt-3.5">
            <div>
              <strong className="block font-mono text-lg font-semibold text-foreground">
                12
              </strong>
              <span className="mt-[3px] block text-[9px] text-muted">
                Completed meetups
              </span>
            </div>
            <div>
              <strong className="block font-mono text-lg font-semibold text-foreground">
                860
              </strong>
              <span className="mt-[3px] block text-[9px] text-muted">
                Total XP
              </span>
            </div>
            <div>
              <strong className="block font-mono text-lg font-semibold text-foreground">
                96%
              </strong>
              <span className="mt-[3px] block text-[9px] text-muted">
                Show-up rate
              </span>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-3 px-0.5 pb-3 pt-[25px]">
            <h2 className="font-display text-[21px] text-foreground">
              Close the loop
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              2 waiting
            </span>
          </div>
          <div className="grid gap-3 pb-2">
            {REVIEWS.map((review) => (
              <ReflectionCard key={review.id} {...review} />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
