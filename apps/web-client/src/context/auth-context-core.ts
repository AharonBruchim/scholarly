import { createContext, useContext } from "react";

import type { AuthSession, AuthUser } from "@/types/auth";

export interface AuthContextValue {
  session: AuthSession | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (session: AuthSession) => void;
  register: (session: AuthSession) => void;
  updateTeacherBankAccount: (bankAccount: NonNullable<AuthUser["bankAccount"]>) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
