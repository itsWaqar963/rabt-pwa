"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { resolveAwakeningComplete } from "@/lib/awakening-store";

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    async function routeGuest() {
      if (!isAuthenticated || !user?.id) {
        if (!cancelled) setChecking(false);
        return;
      }

      const done = await resolveAwakeningComplete(user.id);
      if (cancelled) return;
      router.replace(done ? "/discover" : "/");
    }

    void routeGuest();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loading, router, user?.id]);

  if (loading || (isAuthenticated && checking)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg)" }}
        aria-busy="true"
        aria-label="Loading"
      />
    );
  }

  if (isAuthenticated) return null;

  return <>{children}</>;
}
