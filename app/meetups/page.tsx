"use client";

import { useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { MeetupCard } from "@/components/ui/MeetupCard";

type Tab = "explore" | "events";

const MEETUPS = [
  {
    id: "maghrib-read",
    kind: "Physical gathering · study",
    title: "After Maghrib: Read & Reflect",
    status: "6 spots left",
    description:
      "A quiet reading circle for people making space for better questions and better work.",
    location: "Jamia Masjid, Model Town",
    when: "Saturday, 24 Aug · 7:30 PM",
    organizerName: "Sana Khalid",
    organizerRole: "Design systems",
  },
  {
    id: "civic-tech-walk",
    kind: "Physical gathering · builders",
    title: "Sunday Civic Tech Walk",
    status: "4 spots left",
    description:
      "Walk, talk, and trade notes on the local problems worth building for.",
    location: "Racecourse Park, Lahore",
    when: "Sunday, 25 Aug · 8:00 AM",
    organizerName: "Hamza Rauf",
    organizerRole: "Civic tech",
  },
  {
    id: "make-small",
    kind: "Physical gathering · coffee",
    title: "Make Something Small",
    status: "8 spots left",
    description:
      "A low-pressure cafe session for sharing what you are making and what is stuck.",
    location: "Second Cup, Gulberg III",
    when: "Tuesday, 27 Aug · 6:30 PM",
    organizerName: "Maryam Saeed",
    organizerRole: "Research",
  },
] as const;

export default function MeetupsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("explore");
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [broadcastAck, setBroadcastAck] = useState(false);

  function toggleRequest(id: string) {
    setRequestedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleBroadcast() {
    setBroadcastAck(true);
    window.setTimeout(() => setBroadcastAck(false), 2200);
  }

  const isExplore = activeTab === "explore";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_80%_4%,color-mix(in_oklch,var(--muted)_9%,transparent),transparent_20rem),var(--bg)]">
      <main className="relative z-[1] h-[100dvh] overflow-y-auto px-[18px] pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(18px,env(safe-area-inset-top))] [scrollbar-width:none] max-[360px]:px-3.5 [&::-webkit-scrollbar]:hidden">
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
          <button
            type="button"
            onClick={handleBroadcast}
            className="inline-flex min-h-11 items-center gap-[7px] rounded-[11px] border border-[color-mix(in_oklch,var(--accent)_60%,var(--border))] bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] px-3 text-[11px] font-semibold text-accent transition-[background,border-color] duration-150 hover:bg-[color-mix(in_oklch,var(--accent)_22%,transparent)] max-[360px]:px-2.5"
          >
            <span className="text-lg font-normal leading-none">+</span>
            {broadcastAck ? "Meetup broadcast" : "Create Meetup"}
          </button>
        </header>

        <section className="px-0.5 pb-5 pt-[27px]">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            Offline · 02
          </p>
          <h1 className="mt-1 max-w-[12ch] font-display text-[31px] leading-[1.08] text-foreground max-[360px]:text-[28px]">
            Meet with <span className="text-accent">intent.</span>
          </h1>
          <p className="mt-[11px] max-w-[34ch] text-xs leading-[1.55] text-muted">
            Small gatherings for useful conversations, shared practice, and a
            reason to show up.
          </p>

          <button
            type="button"
            onClick={handleBroadcast}
            className="mt-5 min-h-12 w-full rounded-[11px] border border-[color-mix(in_oklch,var(--accent)_65%,var(--border))] bg-accent font-bold text-[oklch(0.18_0.03_165)] transition-[filter] duration-150 hover:brightness-110"
          >
            {broadcastAck ? "Intent broadcast" : "Broadcast your intent"}
          </button>
        </section>

        <section
          role="tablist"
          aria-label="Meetup views"
          className="grid grid-cols-2 gap-1 rounded-[14px] border border-border bg-[color-mix(in_oklch,var(--surface)_72%,transparent)] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={isExplore}
            onClick={() => setActiveTab("explore")}
            className={`min-h-11 rounded-[10px] text-xs transition-[background,color,box-shadow] duration-150 ${
              isExplore
                ? "bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--accent)_32%,transparent)]"
                : "bg-transparent text-muted"
            }`}
          >
            Explore Meetups
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isExplore}
            onClick={() => setActiveTab("events")}
            className={`min-h-11 rounded-[10px] text-xs transition-[background,color,box-shadow] duration-150 ${
              !isExplore
                ? "bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--accent)_32%,transparent)]"
                : "bg-transparent text-muted"
            }`}
          >
            My Events
          </button>
        </section>

        <section aria-live="polite">
          <div className="flex items-end justify-between gap-3 px-0.5 pb-[13px] pt-6">
            <h2 className="font-display text-[21px] text-foreground">
              {isExplore ? "Near you" : "Your calendar"}
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
              {isExplore ? "3 meetups · Lahore" : "No saved meetups"}
            </span>
          </div>

          {isExplore ? (
            <div className="grid gap-3 pb-[92px]">
              {MEETUPS.map((meetup) => (
                <MeetupCard
                  key={meetup.id}
                  kind={meetup.kind}
                  title={meetup.title}
                  status={meetup.status}
                  description={meetup.description}
                  location={meetup.location}
                  when={meetup.when}
                  organizerName={meetup.organizerName}
                  organizerRole={meetup.organizerRole}
                  requested={requestedIds.has(meetup.id)}
                  onRequestToggle={() => toggleRequest(meetup.id)}
                />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-border px-5 py-8 pb-[92px] text-center text-xs text-muted">
              You have no upcoming meetups yet. Explore a gathering or broadcast
              one for your city.
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
