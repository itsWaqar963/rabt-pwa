"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { PhilosophyCard } from "@/components/PhilosophyCard";
import {
  IceBreakerQuiz,
  type OptionKey,
  QUIZ_OPTIONS,
} from "@/components/IceBreakerQuiz";
import { LearningModal } from "@/components/ui/LearningModal";
import { XpReward } from "@/components/ui/XpReward";
import { useAuth } from "@/context/AuthContext";
import {
  isAwakeningCompleteLocal,
  markAwakeningComplete,
  resolveAwakeningComplete,
} from "@/lib/awakening-store";

type ModalMode = "discover" | "retry";

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [gateReady, setGateReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [selected, setSelected] = useState<OptionKey | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [quizLocked, setQuizLocked] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMandatory, setModalMandatory] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("discover");
  const [showXp, setShowXp] = useState(false);
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveGate() {
      // Authenticated: only THIS userId local/remote — never legacy global.
      if (user?.id) {
        const done = await resolveAwakeningComplete(user.id);
        if (cancelled) return;
        if (done) {
          router.replace("/discover");
          return;
        }
        setGateReady(true);
        return;
      }

      // Pre-auth: guest/legacy local only (does not unlock post-login for new users).
      if (isAwakeningCompleteLocal(null)) {
        router.replace("/discover");
        return;
      }

      if (!cancelled) setGateReady(true);
    }

    if (authLoading) return;
    void resolveGate();

    return () => {
      cancelled = true;
    };
  }, [authLoading, router, user?.id]);

  const openModal = useCallback(
    (mandatory: boolean, mode: ModalMode) => {
      setModalMandatory(mandatory);
      setModalMode(mode);
      setModalOpen(true);
    },
    [],
  );

  const finishAwakening = useCallback(() => {
    markAwakeningComplete(user?.id ?? null);
  }, [user?.id]);

  const handleSelect = useCallback(
    (key: OptionKey) => {
      if (quizLocked) return;

      setQuizLocked(true);
      setSelected(key);
      setShowSuccessCheck(false);

      const option = QUIZ_OPTIONS.find((o) => o.key === key);
      const isCorrect = option?.correct ?? false;

      if (isCorrect) {
        if (attempts === 0) {
          setShowXp(true);
        } else {
          finishAwakening();
          setShowXp(true);
          setShowSuccessCheck(true);
          setTimeout(() => router.push("/discover"), 1600);
        }
        return;
      }

      setAttempts((n) => n + 1);
      openModal(true, "retry");
    },
    [attempts, finishAwakening, openModal, quizLocked, router],
  );

  const handleXpComplete = useCallback(() => {
    setShowXp(false);
    if (attempts === 0) {
      openModal(false, "discover");
    }
  }, [attempts, openModal]);

  const handleModalComplete = useCallback(() => {
    setModalOpen(false);

    if (modalMode === "discover") {
      finishAwakening();
      router.push("/discover");
      return;
    }

    setSelected(null);
    setQuizLocked(false);
  }, [finishAwakening, modalMode, router]);

  if (!gateReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg)" }}
        aria-busy="true"
        aria-label="Loading"
      />
    );
  }

  return (
    <>
      <SplashScreen
        done={isAwakeningCompleteLocal(user?.id ?? null)}
        onComplete={() => setSplashDone(true)}
      />

      <AnimatePresence>
        {showXp && <XpReward amount={50} onComplete={handleXpComplete} />}
      </AnimatePresence>

      <LearningModal
        isOpen={modalOpen}
        mandatory={modalMandatory}
        videoFormat="vertical"
        closeLabel={
          modalMode === "discover" ? "Close / Skip" : "Continue to Quiz"
        }
        onComplete={handleModalComplete}
      />

      <motion.main
        className="relative z-10 min-h-screen overflow-y-auto px-[18px] pb-7 pt-[max(18px,env(safe-area-inset-top))]"
        initial={{ opacity: 0, y: 10 }}
        animate={
          splashDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
        }
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
        aria-hidden={!splashDone}
      >
        <header className="relative z-10 flex min-h-11 items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Awakening · 01
          </span>
          <span className="flex items-center gap-2 text-xs text-muted">
            <span
              aria-hidden
              className="size-[7px] rounded-full bg-muted shadow-[0_0_14px_color-mix(in_oklch,var(--muted)_55%,transparent)]"
            />
            Cluster ready
          </span>
        </header>

        <section
          className="relative z-10 grid justify-items-center px-1 pb-[30px] pt-[42px] text-center"
          aria-labelledby="rabt-title"
        >
          <div className="relative mb-[23px] grid size-[130px] place-items-center">
            <span
              aria-hidden
              className="absolute inset-1 rounded-full border border-muted/40 shadow-[inset_0_0_40px_color-mix(in_oklch,var(--muted)_8%,transparent)]"
            />
            <span
              aria-hidden
              className="rabt-orbit-dot absolute top-2.5 size-[7px] rounded-full bg-accent shadow-[0_0_18px_color-mix(in_oklch,var(--accent)_80%,transparent)]"
              style={{
                transformOrigin: "3px 55px",
                animation: "rabt-orbit 8s linear infinite",
              }}
            />
            <div>
              <h1
                id="rabt-title"
                lang="ar"
                className="font-display text-[70px] font-semibold leading-none tracking-[-0.04em] text-foreground [direction:rtl]"
                style={{
                  textShadow:
                    "0 0 28px color-mix(in oklch, var(--muted) 40%, transparent)",
                }}
              >
                ربط
              </h1>
              <p className="mt-[7px] font-mono text-[10px] uppercase tracking-[0.36em] text-muted">
                RABT
              </p>
            </div>
          </div>

          <PhilosophyCard />
        </section>

        <section className="relative z-10" aria-labelledby="quiz-title">
          <IceBreakerQuiz
            selected={selected}
            disabled={quizLocked}
            showSuccessCheck={showSuccessCheck}
            onSelect={handleSelect}
          />
          <p className="flex justify-center gap-2 pt-[18px] font-mono text-[10px] tracking-[0.05em] text-muted">
            <span>●</span>
            <span>Reflection syncs with your local cluster</span>
          </p>
        </section>
      </motion.main>
    </>
  );
}
