"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Play, Plus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { ContributeLessonModal } from "@/components/ui/ContributeLessonModal";
import { LessonQuizModal } from "@/components/ui/LessonQuizModal";
import { XpReward } from "@/components/ui/XpReward";
import { useAuth } from "@/context/AuthContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { DAILY_QUIZ_GOAL } from "@/lib/learn-earn-lessons";
import type { LearnLesson } from "@/lib/learn-earn-lessons";
import {
  loadCompletedIds,
  saveCompletedIds,
  splitLessons,
} from "@/lib/learn-earn-store";
import {
  fetchMyLessonSubmissions,
  submitLessonContribution,
  type LessonContribution,
} from "@/lib/moderation-sync";
import {
  incrementProfileXp,
} from "@/lib/profile-sync";
import {
  loadProfile,
  saveProfile,
} from "@/lib/profile-store";
import { isSupabaseConfigured } from "@/lib/supabase";

const LESSON_XP_REWARD = 50;
const PAGE_SIZE = 20;

function LessonThumbPlaceholder() {
  return (
    <div
      className="absolute inset-0 grid place-items-center border border-[color-mix(in_oklch,var(--accent)_40%,var(--border))] bg-[color-mix(in_oklch,var(--bg)_90%,var(--accent))] shadow-[inset_0_0_32px_color-mix(in_oklch,var(--accent)_18%,transparent)]"
      aria-hidden
    >
      <span className="grid size-9 place-items-center rounded-full border border-[color-mix(in_oklch,var(--accent)_50%,var(--border))] bg-[color-mix(in_oklch,var(--bg)_60%,transparent)] text-accent shadow-[0_0_16px_color-mix(in_oklch,var(--accent)_30%,transparent)]">
        <Play className="size-4 fill-current" />
      </span>
    </div>
  );
}

function LessonThumb({
  lesson,
  completed,
  onClick,
}: {
  lesson: LearnLesson;
  completed?: boolean;
  onClick?: () => void;
}) {
  const { isOffline } = useNetworkStatus();
  const [imgFailed, setImgFailed] = useState(false);
  const showPlaceholder = isOffline || imgFailed;

  useEffect(() => {
    setImgFailed(false);
  }, [lesson.youtubeId, isOffline]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={completed}
      className={`group relative w-[108px] shrink-0 overflow-hidden rounded-[16px] border text-left transition-[border-color,transform] duration-150 ${
        completed
          ? "border-border opacity-70"
          : "border-[color-mix(in_oklch,var(--accent)_45%,var(--border))] hover:border-accent active:scale-[0.98]"
      }`}
    >
      <div className="relative aspect-[9/16] bg-[color-mix(in_oklch,var(--bg)_70%,black)]">
        {showPlaceholder ? (
          <LessonThumbPlaceholder />
        ) : (
          <>
            <img
              src={`https://img.youtube.com/vi/${lesson.youtubeId}/hqdefault.jpg`}
              alt=""
              className="size-full object-cover"
              onError={() => setImgFailed(true)}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,color-mix(in_oklch,var(--bg)_88%,transparent))]" />
            {!completed ? (
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid size-9 place-items-center rounded-full border border-[color-mix(in_oklch,var(--accent)_55%,var(--border))] bg-[color-mix(in_oklch,var(--bg)_55%,transparent)] text-accent shadow-[0_0_16px_color-mix(in_oklch,var(--accent)_35%,transparent)]">
                  <Play className="size-4 fill-current" aria-hidden />
                </span>
              </span>
            ) : null}
          </>
        )}
      </div>
      <div className="px-2 py-2">
        <p className="line-clamp-2 text-[10px] font-semibold leading-[1.35] text-foreground">
          {lesson.title}
        </p>
        <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.06em] text-muted">
          {completed ? "Completed" : "Pending"}
        </p>
      </div>
    </button>
  );
}

export function LearnEarnSection() {
  const reducedMotion = useReducedMotion();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [hydrated, setHydrated] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [contributions, setContributions] = useState<LessonContribution[]>([]);
  const [activeLesson, setActiveLesson] = useState<LearnLesson | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [visiblePendingCount, setVisiblePendingCount] = useState(PAGE_SIZE);
  const [showXp, setShowXp] = useState(false);
  const [submitAck, setSubmitAck] = useState(false);

  useEffect(() => {
    setCompletedIds(loadCompletedIds());
    try {
      window.localStorage.removeItem("rabt_learn_contributions");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!userId || !isSupabaseConfigured) {
      setContributions([]);
      return;
    }
    let cancelled = false;
    void fetchMyLessonSubmissions(userId).then((rows) => {
      if (!cancelled) setContributions(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const { pending, completed } = useMemo(
    () => splitLessons(completedSet),
    [completedSet],
  );

  const completedCount = completed.length;
  const total = pending.length + completed.length;
  const visiblePending = pending.slice(0, visiblePendingCount);
  const hasMorePending = pending.length > visiblePendingCount;
  const progressPct = Math.min(
    100,
    (completedCount / DAILY_QUIZ_GOAL) * 100,
  );

  const markComplete = useCallback(
    (lessonId: string) => {
      setCompletedIds((prev) => {
        if (prev.includes(lessonId)) return prev;
        const next = [...prev, lessonId];
        saveCompletedIds(next);
        return next;
      });
      setQuizOpen(false);
      setActiveLesson(null);
      setShowXp(true);

      if (userId) {
        void incrementProfileXp(userId, LESSON_XP_REWARD).then((nextXp) => {
          if (nextXp === null) return;
          const profile = loadProfile();
          saveProfile({ ...profile, xp: nextXp });
        });
      }
    },
    [userId],
  );

  async function handleContribute(input: {
    youtubeUrl: string;
    question: string;
    options: [string, string, string, string];
    correctIndex: number;
  }): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!userId) {
      return { ok: false, error: "Sign in to submit a lesson." };
    }
    const result = await submitLessonContribution(userId, input);
    if (!result.ok) return result;
    setContributions((prev) => [result.contribution, ...prev]);
    setSubmitAck(true);
    window.setTimeout(() => setSubmitAck(false), 2600);
    return { ok: true };
  }

  if (!hydrated) {
    return (
      <section className="mt-5 rounded-[18px] border border-border bg-[color-mix(in_oklch,var(--surface)_72%,transparent)] p-4">
        <div className="h-24 animate-pulse rounded-[12px] bg-[color-mix(in_oklch,var(--fg)_6%,transparent)]" />
      </section>
    );
  }

  return (
    <>
      <section className="mt-5 rounded-[18px] border border-[color-mix(in_oklch,var(--accent)_40%,var(--border))] bg-[linear-gradient(145deg,color-mix(in_oklch,var(--accent)_8%,var(--surface)),var(--surface))] p-4 shadow-[0_18px_46px_color-mix(in_oklch,var(--bg)_72%,transparent)]">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              Learn &amp; Earn
            </p>
            <h2 className="mt-[3px] font-display text-[21px] text-foreground">
              Daily Growth
            </h2>
          </div>
          {submitAck ? (
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-accent">
              Submitted
            </span>
          ) : null}
        </div>

        <div className="mt-3.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            Total Available Questions: {total} | Completed: {completedCount}
          </p>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
              Daily Quizzes: {completedCount}/{DAILY_QUIZ_GOAL} Completed
            </p>
            <span className="font-mono text-[11px] font-bold text-accent">
              {Math.round(progressPct)}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_oklch,var(--fg)_10%,transparent)]">
            <motion.div
              className="h-full rounded-full bg-accent shadow-[0_0_12px_color-mix(in_oklch,var(--accent)_55%,transparent)]"
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{
                duration: reducedMotion ? 0 : 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </div>
        </div>

        <div className="-mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visiblePending.map((lesson) => (
            <LessonThumb
              key={lesson.id}
              lesson={lesson}
              onClick={() => {
                setActiveLesson(lesson);
                setQuizOpen(true);
              }}
            />
          ))}
        </div>

        {hasMorePending ? (
          <button
            type="button"
            onClick={() =>
              setVisiblePendingCount((count) => count + PAGE_SIZE)
            }
            className="mt-2 w-full py-2 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-accent transition-colors hover:text-foreground"
          >
            See more
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setContributeOpen(true)}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-dashed border-[color-mix(in_oklch,var(--accent)_45%,var(--border))] bg-black/30 px-3 text-sm font-semibold text-foreground transition-[border-color,background] duration-150 hover:border-accent hover:bg-[color-mix(in_oklch,var(--accent)_8%,transparent)]"
        >
          <Plus className="size-4 text-accent" aria-hidden />
          Contribute a Lesson
        </button>

        {completed.length > 0 ? (
          <div className="mt-4 border-t border-[color-mix(in_oklch,var(--border)_78%,transparent)] pt-3">
            <button
              type="button"
              onClick={() => setCompletedOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                Completed ({completed.length})
              </span>
              {completedOpen ? (
                <ChevronUp className="size-4 text-muted" aria-hidden />
              ) : (
                <ChevronDown className="size-4 text-muted" aria-hidden />
              )}
            </button>
            {completedOpen ? (
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {completed.map((lesson) => (
                  <LessonThumb key={lesson.id} lesson={lesson} completed />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {(() => {
          const pendingCount = contributions.filter(
            (c) => c.status === "pending",
          ).length;
          if (pendingCount === 0) return null;
          return (
            <p className="mt-3 text-[10px] text-muted">
              {pendingCount} lesson
              {pendingCount === 1 ? "" : "s"} pending admin review.
            </p>
          );
        })()}
      </section>

      <LessonQuizModal
        open={quizOpen}
        lesson={activeLesson}
        onClose={() => {
          setQuizOpen(false);
          setActiveLesson(null);
        }}
        onCorrect={() => {
          if (activeLesson) markComplete(activeLesson.id);
        }}
      />

      <ContributeLessonModal
        open={contributeOpen}
        onClose={() => setContributeOpen(false)}
        onSubmit={handleContribute}
      />

      {showXp ? (
        <XpReward
          amount={LESSON_XP_REWARD}
          onComplete={() => setShowXp(false)}
        />
      ) : null}
    </>
  );
}
