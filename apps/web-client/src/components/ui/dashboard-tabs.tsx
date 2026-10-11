import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface DashboardTab<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

interface DashboardTabsProps<T extends string> {
  tabs: DashboardTab<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  children: ReactNode;
}

export function DashboardTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  children,
}: DashboardTabsProps<T>) {
  return (
    <div className="space-y-5">
      <div
        role="tablist"
        className="grid gap-2 rounded-lg border border-slate-800 bg-slate-950/70 p-1 sm:flex sm:flex-wrap"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.id)}
              className={cn(
                "inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:flex-1",
                selected
                  ? "bg-sky-500 text-slate-950"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel">{children}</div>
    </div>
  );
}
