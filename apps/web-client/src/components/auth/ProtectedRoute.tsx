import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/context/auth-context-core";
import type { UserRole } from "@/types/auth";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { session, user } = useAuth();

  if (!session || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} replace />;
  }

  return <Outlet />;
}
