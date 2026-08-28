"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { BottomNav } from "@/components/layout/BottomNav";
import { LearnEarnSection } from "@/components/ui/LearnEarnSection";
import { ProfileHeaderButton } from "@/components/ui/ProfileHeaderButton";
import { useAuth } from "@/context/AuthContext";
import {
  loadProfile,
  overlayAuthIdentity,
  saveProfile,
  type ProfileData,
} from "@/lib/profile-store";
import { ScreenPhilosophyHeader } from "@/components/ui/ScreenPhilosophyHeader";
import { useScreenTagline } from "@/lib/cms-taglines";
import { fetchProfileRow, mergeRemoteEditable } from "@/lib/profile-sync";

export default function ReflectPage() {
  const tagline = useScreenTagline("reflect");
  const { user } = useAuth();
  const [xpTotal, setXpTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadXp() {
      let profile: ProfileData = overlayAuthIdentity(loadProfile(), user);
      if (user) {
        try {
          const row = await fetchProfileRow(user.id);
          if (cancelled) return;
          if (row) {
            profile = overlayAuthIdentity(mergeRemoteEditable(profile, row), user);
            saveProfile(profile);
          }
        } catch {
          /* keep local */
        }
      }
      if (!cancelled) setXpTotal(profile.xp);
    }

    void loadXp();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <AuthGuard>
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_80%_4%,color-mix(in_oklch,var(--muted)_9%,transparent),transparent_20rem),var(--bg)]">
      <main className="relative z-[1] h-[100dvh] overflow-y-auto px-[18px] pb-[max(96px,calc(max(20px,env(safe-area-inset-bottom,0px))+80px))] pt-[max(18px,env(safe-area-inset-top))] [scrollbar-width:none] max-[360px]:px-3.5 [&::-webkit-scrollbar]:hidden">
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
          <ProfileHeaderButton ariaLabel="Open profile" />
        </header>

        <ScreenPhilosophyHeader
          eyebrow="After the gathering · 03"
          titleLead={tagline.title_lead}
          titleAccent={tagline.title_accent}
          subtitle={tagline.subtitle}
        />

        <section className="rounded-[18px] border border-[color-mix(in_oklch,var(--accent)_46%,var(--border))] bg-[linear-gradient(140deg,color-mix(in_oklch,var(--accent)_10%,var(--surface)),var(--surface))] p-4 shadow-[0_18px_46px_color-mix(in_oklch,var(--bg)_72%,transparent)]">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                Your standing
              </p>
              <h2 className="mt-[3px] font-display text-[21px] leading-[1.15] text-foreground">
                Trust, earned in person.
              </h2>
            </div>
            <div
              className="flex size-[62px] shrink-0 flex-col items-center justify-center rounded-full border border-[color-mix(in_oklch,var(--accent)_62%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_10%,var(--surface))] text-center shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_20%,transparent),0_0_22px_color-mix(in_oklch,var(--accent)_28%,transparent)]"
              aria-label="Trust rating not available yet"
            >
              <span className="font-mono text-[15px] font-bold leading-none text-muted">
                —
              </span>
              <span className="mt-1 font-mono text-[7px] uppercase leading-none tracking-[0.06em] text-muted">
                Beta
              </span>
            </div>
          </div>
          <div className="mt-[17px] grid grid-cols-3 gap-2 border-t border-[color-mix(in_oklch,var(--border)_78%,transparent)] pt-3.5">
            <div>
              <strong className="block font-mono text-lg font-semibold text-foreground">
                0
              </strong>
              <span className="mt-[3px] block text-[9px] text-muted">
                Completed meetups
              </span>
            </div>
            <div>
              <strong className="block font-mono text-lg font-semibold text-foreground">
                {xpTotal}
              </strong>
              <span className="mt-[3px] block text-[9px] text-muted">
                Total XP
              </span>
            </div>
            <div>
              <strong className="block font-mono text-lg font-semibold text-muted">
                —
              </strong>
              <span className="mt-[3px] block text-[9px] text-muted">
                Show-up rate
              </span>
            </div>
          </div>
        </section>

        <LearnEarnSection />

        <section>
          <div className="flex items-end justify-between gap-3 px-0.5 pb-3 pt-[25px]">
            <h2 className="font-display text-[21px] text-foreground">
              Close the loop
            </h2>
          </div>
          <div className="border border-dashed border-border px-5 py-8 text-center text-xs text-muted">
            No pending reviews yet. After your first meetup, you can verify
            attendance and leave feedback here.
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
    </AuthGuard>
  );
}
