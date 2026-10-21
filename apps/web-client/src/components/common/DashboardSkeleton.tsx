import { useTranslation } from "react-i18next";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-800/70 ${className}`} />;
}

export function DashboardSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6" role="status" aria-label={t("common.loading")}>
      <SkeletonBlock className="h-8 w-40" />
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-800 md:grid-cols-3">
        {["first", "second", "third"].map((key) => (
          <div key={key} className="space-y-2 bg-slate-950 px-4 py-3">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-6 w-28" />
          </div>
        ))}
      </div>
      <div className="glass-panel space-y-3 p-5 sm:p-6">
        <SkeletonBlock className="h-5 w-48" />
        {["a", "b", "c", "d"].map((key) => (
          <SkeletonBlock key={key} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
