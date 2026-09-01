import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { LanguageToggle } from "@/components/common/LanguageToggle";

export const Navigation = memo(function Navigation() {
  const { t } = useTranslation();

  return (
    <header className="border-b border-slate-800 bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/login" className="text-lg font-semibold text-white">
          {t("common.brand")}
        </Link>
        <nav className="flex gap-2 text-sm text-slate-200">
          <LanguageToggle />
          <Link to="/login" className="rounded-md px-3 py-2 hover:bg-slate-800">
            {t("common.login")}
          </Link>
          <Link
            to="/register"
            className="rounded-md bg-sky-500 px-3 py-2 text-slate-950 hover:bg-sky-400"
          >
            {t("common.register")}
          </Link>
        </nav>
      </div>
    </header>
  );
});
