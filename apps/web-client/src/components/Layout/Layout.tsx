import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { useAuth } from "@/context/auth-context-core";
import { useTranslation } from "react-i18next";

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useTranslation();

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
            {t("common.brand")}
          </Link>

          <nav className="flex items-center gap-2">
            {!isAuthenticated ? (
              <>
                <LanguageToggle />
                <Button asChild variant="ghost">
                  <Link to="/login">{t("common.login")}</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">{t("common.register")}</Link>
                </Button>
              </>
            ) : (
              <>
                <LanguageToggle />
                <span className="hidden rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200 sm:inline-flex">
                  {user?.name}
                </span>
                <Button variant="secondary" onClick={handleLogout}>
                  {t("common.logout")}
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
