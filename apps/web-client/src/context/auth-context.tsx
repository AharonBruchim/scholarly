import { type ReactNode, useCallback, useMemo, useState } from "react";

import type { AuthSession, AuthUser } from "@/types/auth";
import { AuthContext, type AuthContextValue } from "./auth-context-core";

const STORAGE_KEY = "scholarly.auth.session";

function readStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const savedSession = window.localStorage.getItem(STORAGE_KEY);

  if (!savedSession) {
    return null;
  }

  try {
    return JSON.parse(savedSession) as AuthSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function writeStoredSession(session: AuthSession | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession());

  const login = useCallback((nextSession: AuthSession) => {
    setSession(nextSession);
    writeStoredSession(nextSession);
  }, []);

  const register = useCallback((nextSession: AuthSession) => {
    setSession(nextSession);
    writeStoredSession(nextSession);
  }, []);

  const updateTeacherBankAccount = useCallback(
    (bankAccount: NonNullable<AuthUser["bankAccount"]>) => {
      setSession((current) => {
        if (current?.user.role !== "teacher") {
          return current;
        }

        const nextSession: AuthSession = {
          ...current,
          user: {
            ...current.user,
            bankAccount,
          },
        };

        writeStoredSession(nextSession);
        return nextSession;
      });
    },
    [],
  );

  const logout = useCallback(() => {
    setSession(null);
    writeStoredSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      login,
      register,
      updateTeacherBankAccount,
      logout,
    }),
    [login, logout, register, session, updateTeacherBankAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
