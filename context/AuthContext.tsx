"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type AuthUser = { name: string; phone?: string };

type AuthState = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
};

const STORAGE_KEY = "rabt_auth_status";

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { isAuthenticated: boolean; user: AuthUser | null };
        setIsAuthenticated(parsed.isAuthenticated ?? false);
        setUser(parsed.user ?? null);
      }
    } catch {
      // corrupt storage — ignore
    }
  }, []);

  const login = useCallback((u: AuthUser) => {
    setIsAuthenticated(true);
    setUser(u);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ isAuthenticated: true, user: u }));
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
