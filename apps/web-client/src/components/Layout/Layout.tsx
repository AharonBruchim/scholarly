import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { DesktopDashboardNav, MobileDashboardNav } from "@/components/Layout/DashboardNav";
import { UserMenu } from "@/components/Layout/UserMenu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context-core";
import { languageSwitchingEnabled } from "@/i18n";

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useTranslation();
  const dashboardRole = isAuthenticated ? user?.role : undefined;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 md:gap-6">
            {dashboardRole ? <MobileDashboardNav role={dashboardRole} /> : null}
            <Link
              to={isAuthenticated ? (user?.role === "teacher" ? "/teacher" : "/student") : "/login"}
              className="text-lg font-semibold text-white"
            >
              {t("common.brand")}
            </Link>
            {dashboardRole ? <DesktopDashboardNav role={dashboardRole} /> : null}
          </div>

          <nav className="flex items-center gap-2">
            {!isAuthenticated ? (
              <>
                {languageSwitchingEnabled ? <LanguageToggle /> : null}
                <Button asChild variant="ghost">
                  <Link to="/login">{t("common.login")}</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">{t("common.register")}</Link>
                </Button>
              </>
            ) : (
              <>
                {languageSwitchingEnabled ? <LanguageToggle /> : null}
                {user ? <UserMenu user={user} onLogout={() => void handleLogout()} /> : null}
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
