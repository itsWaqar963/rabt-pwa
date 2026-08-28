"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { Pencil, Settings } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { AffiliationBadges } from "@/components/ui/AffiliationBadges";
import { DigitalTrailRow } from "@/components/ui/DigitalTrailIcons";
import { EditProfileModal } from "@/components/ui/EditProfileModal";
import { PresenceDot } from "@/components/ui/PresenceDot";
import { ProfileSettingsModal } from "@/components/ui/ProfileSettingsModal";
import {
  clusterSignalItems,
  DEFAULT_PROFILE,
  formatIntentMarquee,
  initialsFromName,
  loadProfile,
  overlayAuthIdentity,
  parseActiveIntents,
  saveProfile,
  type ProfileData,
} from "@/lib/profile-store";
import { ScreenPhilosophyHeader } from "@/components/ui/ScreenPhilosophyHeader";
import { useScreenTagline } from "@/lib/cms-taglines";
import {
  fetchProfileRow,
  mergeRemoteEditable,
  saveProfileRemote,
  type ProfileRow,
} from "@/lib/profile-sync";
import { getConfiguredSocialLinks } from "@/lib/social-links";
import { fetchApprovedContributionCount } from "@/lib/contributions-sync";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const tagline = useScreenTagline("profile");
  const reducedMotion = useReducedMotion();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [hydrated, setHydrated] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [contributionCount, setContributionCount] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayName = user?.name || profile.name;
  const displayInitial = initialsFromName(displayName);
  const avatarUrl = user?.avatarUrl;
  const intentText = formatIntentMarquee(profile.activeIntent);
  const intentFallback = parseActiveIntents(profile.activeIntent)[0] ?? "";
  const digitalTrail = getConfiguredSocialLinks(profile.socialUrls);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      let next = overlayAuthIdentity(loadProfile(), user);
      setProfile(next);
      setHydrated(true);
      if (!user) return;

      try {
        const row = await fetchProfileRow(user.id);
        if (cancelled) return;
        if (row) {
          next = overlayAuthIdentity(mergeRemoteEditable(next, row), user);
        } else {
          void saveProfileRemote(user.id, next, user);
        }
        setProfile(next);
        saveProfile(next);
      } catch {
        if (!cancelled) {
          setProfile(next);
          saveProfile(next);
        }
      }

      if (user?.id) {
        const count = await fetchApprovedContributionCount(user.id);
        if (!cancelled) setContributionCount(count);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`rabt-profile-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as ProfileRow;
          setProfile((prev) => {
            const next = overlayAuthIdentity(mergeRemoteEditable(prev, row), user);
            saveProfile(next);
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function persist(next: ProfileData) {
    const withIdentity = overlayAuthIdentity(next, user);
    setProfile(withIdentity);
    saveProfile(withIdentity);
    if (user) void saveProfileRemote(user.id, withIdentity, user);
  }

  function handleScoreChange(value: number) {
    persist({ ...profile, introvertExtrovert: value });
  }

  function showXpToast() {
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2400);
  }

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Account preferences"
              onClick={() => setSettingsOpen(true)}
              className="grid size-11 place-items-center rounded-full border border-border text-muted transition-[border-color,color,transform] duration-150 hover:border-foreground hover:text-foreground active:scale-[0.97]"
            >
              <Settings className="size-[18px]" strokeWidth={1.7} aria-hidden />
            </button>
            <button
              type="button"
              aria-label={`Show ${profile.xp} total XP`}
              onClick={showXpToast}
              className="flex min-h-11 items-center gap-2 rounded-full border border-[color-mix(in_oklch,var(--accent)_48%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_9%,var(--surface))] px-3 text-foreground transition-[border-color,background,transform] duration-150 hover:border-accent hover:bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] active:scale-[0.97]"
            >
              <span
                className="size-[7px] rounded-full bg-accent shadow-[0_0_12px_color-mix(in_oklch,var(--accent)_80%,transparent)]"
                aria-hidden
              />
              <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                XP
              </span>
              <span className="font-mono text-xs font-bold">{profile.xp}</span>
            </button>
          </div>
        </header>

        <ScreenPhilosophyHeader
          eyebrow="Your growth card · 04"
          titleLead={tagline.title_lead}
          titleAccent={tagline.title_accent}
          subtitle={tagline.subtitle}
        />

        <section className="rounded-[22px] border border-[color-mix(in_oklch,var(--accent)_48%,var(--border))] bg-[linear-gradient(140deg,color-mix(in_oklch,var(--accent)_10%,var(--surface)),var(--surface))] p-4 shadow-[0_20px_55px_color-mix(in_oklch,var(--bg)_78%,transparent)]">
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-[11px] text-foreground transition-[border-color,background] duration-150 hover:border-[color-mix(in_oklch,var(--accent)_45%,var(--border))] hover:bg-[color-mix(in_oklch,var(--accent)_8%,transparent)]"
            >
              <Pencil className="size-3.5 text-accent" strokeWidth={1.8} />
              Edit profile
            </button>
          </div>

          <div className="grid grid-cols-[66px_1fr_auto] items-center gap-3 max-[360px]:grid-cols-[58px_1fr_auto]">
            <div
              className="relative grid size-[66px] place-items-center overflow-hidden rounded-[20px] border border-[color-mix(in_oklch,var(--accent)_52%,var(--border))] font-display text-[28px] text-foreground max-[360px]:size-[58px]"
              style={{
                background:
                  "radial-gradient(circle at 72% 22%, color-mix(in oklch, var(--accent) 58%, var(--surface)), transparent 30%), radial-gradient(circle at 30% 75%, color-mix(in oklch, var(--muted) 34%, var(--surface)), transparent 50%), var(--surface)",
              }}
              aria-hidden
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                displayInitial
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-[7px]">
                <h2 className="font-body text-lg font-bold text-foreground">
                  {displayName}
                </h2>
                <AffiliationBadges
                  isImsStudent={profile.isImsStudent}
                  isSourceCodeAcademia={profile.isSourceCodeAcademia}
                  isVsila={profile.isVsila}
                  customAffiliation={profile.customAffiliation}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted">{profile.subline}</p>
            </div>
            <PresenceDot online size="md" />
          </div>

          <div className="mt-4 min-h-[60px] border-l-2 border-accent bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] px-3 py-[11px]">
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent">
              Active intent · rotating
            </p>
            <div className="relative mt-0.5 overflow-hidden whitespace-nowrap">
              {reducedMotion ? (
                <p className="truncate text-xs leading-[1.45] text-foreground">
                  {intentFallback}
                </p>
              ) : (
                <motion.p
                  className="whitespace-nowrap text-xs leading-[1.45] text-foreground"
                  animate={{ x: ["100%", "-100%"] }}
                  transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration: 18,
                  }}
                >
                  {intentText}
                </motion.p>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-3 px-0.5 pb-3 pt-[25px]">
            <h2 className="font-display text-[21px] text-foreground">
              How you connect
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
              signal · 01
            </span>
          </div>
          <div className="rounded-[18px] border border-border bg-[color-mix(in_oklch,var(--surface)_90%,transparent)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-[17px] text-foreground">
                  Introvert ↔ extrovert
                </h3>
                <p className="mt-1 max-w-[27ch] text-[11px] text-muted">
                  Give your next cluster a useful sense of your conversation
                  energy.
                </p>
              </div>
              <span className="shrink-0 font-mono text-base font-bold text-accent">
                {profile.introvertExtrovert}/10
              </span>
            </div>
            <div className="mt-[18px] flex items-center gap-2.5">
              <span className="shrink-0 whitespace-nowrap font-mono text-[9px] text-muted">
                Quiet
              </span>
              <input
                type="range"
                min={1}
                max={10}
                value={profile.introvertExtrovert}
                aria-label="Introvert to extrovert score"
                onChange={(e) => handleScoreChange(Number(e.target.value))}
                className="w-full cursor-pointer"
                style={{ accentColor: "var(--accent)" }}
              />
              <span className="shrink-0 whitespace-nowrap font-mono text-[9px] text-muted">
                Open
              </span>
            </div>
            <div
              className="mt-[7px] flex justify-between font-mono text-[9px] text-muted"
              aria-hidden
            >
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-3 px-0.5 pb-3 pt-[25px]">
            <h2 className="font-display text-[21px] text-foreground">
              Your cluster signals
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
              visible to matches
            </span>
          </div>
          <p className="mb-3 px-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            Total Contributions:{" "}
            <span className="font-bold text-accent">{contributionCount}</span>
          </p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-3">
            {clusterSignalItems(profile).map((item) => (
              <div
                key={item.label}
                className="min-h-[72px] rounded-[15px] border border-border bg-[color-mix(in_oklch,var(--surface)_84%,transparent)] p-3"
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                  {item.label}
                </span>
                <strong className="mt-[7px] block text-[13px] font-semibold text-foreground">
                  {item.value}
                </strong>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-3 px-0.5 pb-3 pt-[25px]">
            <h2 className="font-display text-[21px] text-foreground">
              What I bring
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
              skills · services
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pb-1">
            {profile.skills.length > 0 ? (
              profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex min-h-9 items-center rounded-full border border-[color-mix(in_oklch,var(--accent)_52%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_8%,transparent)] px-3 text-[11px] text-foreground"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-[11px] text-muted">
                Add skills in Edit profile to show what you offer.
              </p>
            )}
          </div>
        </section>

        <section className="mt-4">
          <div className="rounded-[18px] border border-border bg-[color-mix(in_oklch,var(--surface)_88%,transparent)] p-4">
            <div className="flex items-start justify-between gap-3.5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                  Community trust
                </p>
                <h2 className="mt-[3px] font-display text-[21px] text-foreground">
                  Reliability, reflected.
                </h2>
              </div>
              <div className="text-right font-mono text-xl font-bold text-muted">
                —
                <small className="mt-0.5 block text-[9px] font-normal text-muted">
                  / 5 trust rating
                </small>
              </div>
            </div>
            <div className="mt-[17px] grid grid-cols-2 gap-2 border-t border-[color-mix(in_oklch,var(--border)_78%,transparent)] pt-3.5">
              <div>
                <strong className="block font-mono text-lg text-foreground">
                  0
                </strong>
                <span className="mt-[3px] block text-[9px] text-muted">
                  Completed meetups
                </span>
              </div>
              <div>
                <strong className="block font-mono text-lg text-muted">
                  —
                </strong>
                <span className="mt-[3px] block text-[9px] text-muted">
                  Show-up rate
                </span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-3 px-0.5 pb-3 pt-[25px]">
            <h2 className="font-display text-[21px] text-foreground">
              Digital trail
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
              bridge the gap
            </span>
          </div>
          <DigitalTrailRow links={digitalTrail} />
        </section>
      </main>

      <div
        role="status"
        aria-live="polite"
        className={`absolute bottom-[88px] left-1/2 z-[5] max-w-[calc(100%-40px)] -translate-x-1/2 rounded-xl border border-[color-mix(in_oklch,var(--accent)_52%,var(--border))] bg-surface px-[13px] py-2.5 text-[11px] text-foreground shadow-[0_16px_44px_color-mix(in_oklch,var(--bg)_80%,transparent)] transition-opacity duration-300 ${
          toastVisible
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        {profile.xp} XP earned through showing up.
      </div>

      {hydrated ? (
        <>
          <EditProfileModal
            open={editOpen}
            profile={profile}
            onClose={() => setEditOpen(false)}
            onSave={persist}
          />
          <ProfileSettingsModal
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            profile={profile}
            onSaveAffiliations={(patch) =>
              persist({ ...profile, ...patch })
            }
          />
        </>
      ) : null}

      <BottomNav />
    </div>
    </AuthGuard>
  );
}
