"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      try {
        const href = window.location.href;
        const url = new URL(href);
        const code = url.searchParams.get("code");
        const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
        const hashParams = new URLSearchParams(hash);
        const errorDescription =
          url.searchParams.get("error_description") ||
          hashParams.get("error_description");

        if (errorDescription) {
          if (!cancelled) {
            setMessage("Sign-in failed");
            router.replace(
              `/welcome?error=${encodeURIComponent(errorDescription)}`,
            );
          }
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // Implicit / magic-link hash tokens: client auto-detects on getSession
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (!data.session) {
            // Wait briefly for detectSessionInUrl init
            await new Promise((r) => setTimeout(r, 400));
            const again = await supabase.auth.getSession();
            if (!again.data.session) {
              throw new Error("No session found in callback URL");
            }
          }
        }

        if (!cancelled) {
          router.replace("/discover");
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Authentication failed";
        if (!cancelled) {
          setMessage("Sign-in failed");
          router.replace(`/welcome?error=${encodeURIComponent(msg)}`);
        }
      }
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 30%, oklch(0.25 0.08 164 / 0.35) 0%, transparent 70%), var(--bg)",
      }}
    >
      <p
        className="font-mono text-xs tracking-[0.2em] uppercase"
        style={{ color: "var(--muted)" }}
      >
        {message}
      </p>
    </div>
  );
}
