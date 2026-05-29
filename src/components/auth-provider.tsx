"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  getSession,
  signOut as supabaseSignOut,
  supabase,
  type AppSession,
} from "@/lib/supabase";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  session: AppSession | null;
  signOut: () => Promise<void>;
  updateSession: (patch: Partial<AppSession["user"]>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<AppSession | null>(null);

  const applySession = useCallback((nextSession: AppSession | null) => {
    setSession(nextSession);
    setStatus(nextSession ? "authenticated" : "unauthenticated");
  }, []);

  useEffect(() => {
    let mounted = true;

    getSession().then((nextSession) => {
      if (!mounted) return;
      applySession(nextSession);
    });

    const authSubscription = supabase?.auth.onAuthStateChange((event) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        applySession(null);
        return;
      }

      getSession().then((nextSession) => {
        if (!mounted) return;
        applySession(nextSession);
      });
    }).data.subscription;

    return () => {
      mounted = false;
      authSubscription?.unsubscribe();
    };
  }, [applySession]);

  const signOut = useCallback(async () => {
    applySession(null);
    await supabaseSignOut();
  }, [applySession]);

  const updateSession = useCallback((patch: Partial<AppSession["user"]>) => {
    setSession((prev) =>
      prev
        ? {
            user: {
              ...prev.user,
              ...patch,
            },
          }
        : null
    );
  }, []);

  const value = useMemo(
    () => ({ status, session, signOut, updateSession }),
    [status, session, signOut, updateSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function useRequireAuth(redirectPath: string) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "loading") return;
    if (!auth.session) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(redirectPath)}`);
    }
  }, [auth.status, auth.session, redirectPath, router]);

  return {
    ...auth,
    isReady: auth.status === "authenticated" && auth.session !== null,
  };
}

export function useGuestOnly(redirectPath = "/") {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "loading") return;
    if (auth.session) {
      router.replace(redirectPath);
    }
  }, [auth.status, auth.session, redirectPath, router]);

  return auth.status === "loading";
}
