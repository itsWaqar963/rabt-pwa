"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail } from "lucide-react";
import { GuestGuard } from "@/components/auth/GuestGuard";
import { useAuth } from "@/context/AuthContext";

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function WelcomeContent() {
  const { signInWithGoogle, signInWithMagicLink } = useAuth();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [error, setError] = useState<string | null>(urlError);

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      setBusy(false);
    }
  }

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setBusy(true);
    const { error: err } = await signInWithMagicLink(email);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setMagicSent(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen flex flex-col items-center justify-between px-6 py-12"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 30%, oklch(0.25 0.08 164 / 0.35) 0%, transparent 70%), var(--bg)",
      }}
    >
      <div />

      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex items-center justify-center">
          <div
            aria-hidden
            className="absolute size-36 rounded-full"
            style={{
              background:
                "radial-gradient(circle, oklch(0.76 0.15 164 / 0.22) 0%, oklch(0.76 0.15 164 / 0.08) 55%, transparent 75%)",
              filter: "blur(12px)",
            }}
          />
          <div
            lang="ar"
            className="relative font-display text-7xl font-bold tracking-tight"
            style={{
              color: "#ffffff",
              textShadow:
                "0 0 48px oklch(0.96 0.02 0 / 0.85), 0 0 18px oklch(0.96 0.02 0 / 0.55), 0 0 72px oklch(0.76 0.15 164 / 0.35)",
            }}
          >
            ربط
          </div>
        </div>
        <div
          className="font-mono text-xs tracking-[0.3em] uppercase"
          style={{ color: "var(--muted)" }}
        >
          RABT
        </div>

        <p
          className="mt-4 text-xl font-medium"
          style={{
            background:
              "linear-gradient(90deg, var(--accent), oklch(0.85 0.12 180))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Meet with intent. Grow with trust.
        </p>
      </div>

      <div className="w-full flex flex-col gap-3 mt-10">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          disabled={busy}
          onClick={() => void handleGoogle()}
          className="w-full flex items-center justify-center gap-3 rounded-2xl py-4 text-base font-semibold disabled:opacity-60"
          style={{
            background: "var(--accent)",
            color: "oklch(0.10 0.01 235)",
          }}
        >
          <GoogleIcon />
          Continue with Google
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          disabled={busy}
          onClick={() => setShowEmail((v) => !v)}
          className="w-full flex items-center justify-center gap-3 rounded-2xl py-4 text-base font-semibold border disabled:opacity-60"
          style={{
            borderColor: "var(--border)",
            background: "oklch(from var(--surface) l c h / 0.8)",
            color: "var(--fg)",
          }}
        >
          <Mail size={18} strokeWidth={2} />
          Sign in with Email (Magic Link)
        </motion.button>

        <AnimatePresence>
          {showEmail ? (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              onSubmit={(e) => void handleMagicLink(e)}
              className="flex flex-col gap-2 overflow-hidden"
            >
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy || magicSent}
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[color-mix(in_oklch,var(--accent)_55%,var(--border))]"
                style={{
                  borderColor: "var(--border)",
                  background: "oklch(from var(--surface) l c h / 0.9)",
                  color: "var(--fg)",
                }}
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                disabled={busy || magicSent || !email.trim()}
                className="w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
                style={{
                  background:
                    "color-mix(in oklch, var(--accent) 22%, transparent)",
                  color: "var(--accent)",
                  border: "1px solid color-mix(in oklch, var(--accent) 40%, var(--border))",
                }}
              >
                {magicSent ? "Link sent" : "Send link"}
              </motion.button>
            </motion.form>
          ) : null}
        </AnimatePresence>

        {magicSent ? (
          <p
            className="text-center text-sm"
            style={{ color: "var(--accent)" }}
            role="status"
          >
            Check your email for the magic link.
          </p>
        ) : null}

        {error ? (
          <p
            className="text-center text-xs"
            style={{ color: "oklch(0.7 0.15 25)" }}
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <p
          className="text-center text-xs mt-2"
          style={{ color: "var(--muted)" }}
        >
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </motion.div>
  );
}

export default function WelcomePage() {
  return (
    <GuestGuard>
      <Suspense
        fallback={
          <div
            className="min-h-screen"
            style={{ background: "var(--bg)" }}
            aria-busy="true"
          />
        }
      >
        <WelcomeContent />
      </Suspense>
    </GuestGuard>
  );
}
