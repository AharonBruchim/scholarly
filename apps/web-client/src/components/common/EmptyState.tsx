import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-700 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80">
        <Icon className="h-6 w-6 text-slate-400" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        {description ? <p className="max-w-sm text-sm text-slate-400">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
