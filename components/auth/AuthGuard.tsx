"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { resolveAwakeningComplete } from "@/lib/awakening-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const [awakeningOk, setAwakeningOk] = useState(false);

  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    async function gate() {
      if (!isAuthenticated) {
        router.replace("/welcome");
        if (!cancelled) setAwakeningOk(false);
        return;
      }

      if (!user?.id) {
        if (!cancelled) setAwakeningOk(true);
        return;
      }

      const done = await resolveAwakeningComplete(user.id);
      if (cancelled) return;
      if (!done) {
        setAwakeningOk(false);
        router.replace("/");
        return;
      }
      setAwakeningOk(true);
    }

    void gate();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loading, router, user?.id]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg)" }}
        aria-busy="true"
        aria-label="Loading"
      />
    );
  }

  if (!isAuthenticated) return null;

  if (!awakeningOk) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg)" }}
        aria-busy="true"
        aria-label="Loading"
      />
    );
  }

  return <>{children}</>;
}
