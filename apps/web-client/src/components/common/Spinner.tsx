import { useTranslation } from "react-i18next";

export function Spinner({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();

  return (
    <div className={`flex items-center justify-center ${compact ? "min-h-48" : "min-h-[60vh]"}`}>
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-slate-700 border-t-sky-400 animate-spin"
        role="status"
        aria-label={t("common.loading")}
      />
    </div>
  );
}
