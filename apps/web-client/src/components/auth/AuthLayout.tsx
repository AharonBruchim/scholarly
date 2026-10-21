import { CalendarDays, CreditCard, type LucideIcon, Video } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface IAuthFeature {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
}

const features: IAuthFeature[] = [
  {
    icon: CalendarDays,
    titleKey: "authShell.featureLessonsTitle",
    descriptionKey: "authShell.featureLessonsDescription",
  },
  {
    icon: Video,
    titleKey: "authShell.featureMeetTitle",
    descriptionKey: "authShell.featureMeetDescription",
  },
  {
    icon: CreditCard,
    titleKey: "authShell.featurePaymentsTitle",
    descriptionKey: "authShell.featurePaymentsDescription",
  },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-[calc(100dvh-10rem)] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
      <aside className="hidden space-y-8 lg:block">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight text-white">
            {t("authShell.headline")}
          </h1>
          <p className="max-w-md text-lg text-slate-400">{t("authShell.subtitle")}</p>
        </div>
        <ul className="space-y-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <li key={feature.titleKey} className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-medium text-white">{t(feature.titleKey)}</p>
                  <p className="text-sm text-slate-400">{t(feature.descriptionKey)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </aside>
      <div className="mx-auto w-full max-w-md lg:max-w-none">{children}</div>
    </div>
  );
}
