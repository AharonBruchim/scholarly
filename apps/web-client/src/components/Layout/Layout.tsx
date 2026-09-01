import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context-core";

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
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
                <Link
                  to="/profile"
                  className="inline-flex min-h-10 items-center rounded-full border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-400/60 hover:bg-slate-700 hover:text-white hover:shadow-md hover:shadow-sky-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  title={t("common.myProfile")}
                  aria-label={`${t("common.myProfile")}: ${user?.name ?? ""}`}
                >
                  {user?.name}
                </Link>
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
