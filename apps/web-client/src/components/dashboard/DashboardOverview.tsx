import { cn } from "@/lib/utils";

export interface IDashboardStat {
  label: string;
  value: string;
  hint?: string;
  wide?: boolean;
}

export function DashboardOverview({
  greeting,
  stats,
}: {
  greeting: string;
  stats: IDashboardStat[];
}) {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">{greeting}</h1>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn("bg-slate-950 px-4 py-3", stat.wide && "col-span-2 md:col-span-1")}
          >
            <dt className="text-xs font-medium text-slate-400">{stat.label}</dt>
            <dd className="mt-1 truncate text-xl font-semibold text-white">{stat.value}</dd>
            {stat.hint ? <dd className="truncate text-xs text-slate-400">{stat.hint}</dd> : null}
          </div>
        ))}
      </dl>
    </section>
  );
}
