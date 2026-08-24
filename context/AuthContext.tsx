"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { upsertProfileFromAuth } from "@/lib/profile-sync";
import { syncAwakeningFromRemote } from "@/lib/awakening-store";

export type AuthUser = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
};

type AuthState = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function mapUser(sessionUser: User | null | undefined): AuthUser | null {
  if (!sessionUser) return null;
  const meta = sessionUser.user_metadata ?? {};
  const name =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.preferred_username === "string" && meta.preferred_username) ||
    sessionUser.email?.split("@")[0] ||
    "User";
  const avatarUrl =
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    undefined;

  return {
    id: sessionUser.id,
    name,
    email: sessionUser.email ?? undefined,
    avatarUrl,
  };
}

function applySession(
  session: Session | null,
  setUser: (u: AuthUser | null) => void,
  setIsAuthenticated: (v: boolean) => void,
) {
  setIsAuthenticated(!!session);
  setUser(mapUser(session?.user));
}

function shouldRefreshUser(event: AuthChangeEvent): boolean {
  switch (event) {
    case "SIGNED_IN":
    case "USER_UPDATED":
      return true;
    case "INITIAL_SESSION":
    case "SIGNED_OUT":
    case "TOKEN_REFRESHED":
    case "PASSWORD_RECOVERY":
    case "MFA_CHALLENGE_VERIFIED":
      return false;
    default: {
      const _never: never = event;
      return _never;
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function refreshFromGetUser() {
      const { data, error } = await supabase.auth.getUser();
      if (cancelled) return;
      if (error) {
        console.error("[auth] getUser", error);
        return;
      }
      const mapped = mapUser(data.user);
      if (!mapped) return;
      setUser(mapped);
      setIsAuthenticated(true);
      void upsertProfileFromAuth(mapped);
      void syncAwakeningFromRemote(mapped.id);
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      applySession(session, setUser, setIsAuthenticated);
      setLoading(false);
      if (session?.user?.id) {
        void refreshFromGetUser();
        void syncAwakeningFromRemote(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      applySession(session, setUser, setIsAuthenticated);
      setLoading(false);
      if (!shouldRefreshUser(event)) return;
      // Defer so auth callback does not deadlock on getUser / upsert.
      setTimeout(() => {
        if (!cancelled) void refreshFromGetUser();
      }, 0);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw error;
  }, []);

  const signInWithMagicLink = useCallback(
    async (email: string): Promise<{ error: string | null }> => {
      const emailRedirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo },
      });
      return { error: error?.message ?? null };
    },
    [],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        signInWithGoogle,
        signInWithMagicLink,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
