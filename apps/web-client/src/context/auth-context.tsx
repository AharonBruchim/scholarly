import type { UserProfile } from "@scholarly/shared";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { authApi, getCurrentSession, setCurrentSession, subscribeToSession } from "@/services/api";
import type { AuthSession } from "@/types/auth";
import { AuthContext, type AuthContextValue } from "./auth-context-core";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(() => getCurrentSession());
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(
    () =>
      subscribeToSession((nextSession) => {
        setSession(nextSession);
        if (!nextSession) queryClient.clear();
      }),
    [queryClient],
  );

  useEffect(() => {
    let active = true;

    void authApi.refresh().finally(() => {
      if (active) {
        setIsInitializing(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback((nextSession: AuthSession) => {
    setCurrentSession(nextSession);
  }, []);

  const register = useCallback((nextSession: AuthSession) => {
    setCurrentSession(nextSession);
  }, []);

  const updateProfile = useCallback((profile: UserProfile) => {
    const current = getCurrentSession();
    if (!current || current.user.id !== profile._id) return;

    setCurrentSession({
      ...current,
      user: {
        ...current.user,
        firstName: profile.firstName,
        lastName: profile.lastName,
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        email: profile.email,
        phone: profile.phone,
        hasBankAccount: profile.hasBankAccount,
        hasTeacherPreferences: Boolean(profile.teacherPreferences),
      },
    });
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isInitializing,
      isAuthenticated: Boolean(session),
      login,
      register,
      updateProfile,
      logout,
    }),
    [isInitializing, login, logout, register, session, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
