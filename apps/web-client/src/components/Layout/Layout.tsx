import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context-core";

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to={isAuthenticated ? (user?.role === "teacher" ? "/teacher" : "/student") : "/login"}
            className="text-lg font-semibold text-white"
          >
            Scholarly
          </Link>

          <nav className="flex items-center gap-2">
            {!isAuthenticated ? (
              <>
                <Button asChild variant="ghost">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </>
            ) : (
              <>
                <span className="hidden rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200 sm:inline-flex">
                  {user?.name}
                </span>
                <Button variant="secondary" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
