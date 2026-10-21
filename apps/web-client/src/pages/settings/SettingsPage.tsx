import { Link2, Lock, type LucideIcon, SlidersHorizontal, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navigate, NavLink, useParams } from "react-router-dom";

import { GmailConnectionCard } from "@/components/billing/GmailConnectionCard";
import { TeacherAutomationSettings } from "@/components/profile/TeacherAutomationSettings";
import { ProfileSettingsForm } from "@/components/settings/ProfileSettingsForm";
import { SecuritySettingsForm } from "@/components/settings/SecuritySettingsForm";
import { useAuth } from "@/context/auth-context-core";
import { cn } from "@/lib/utils";

type SettingsSection = "profile" | "security" | "teaching" | "connections";

interface ISettingsSectionLink {
  id: SettingsSection;
  icon: LucideIcon;
  teacherOnly: boolean;
}

const settingsSections: ISettingsSectionLink[] = [
  { id: "profile", icon: UserRound, teacherOnly: false },
  { id: "security", icon: Lock, teacherOnly: false },
  { id: "teaching", icon: SlidersHorizontal, teacherOnly: true },
  { id: "connections", icon: Link2, teacherOnly: true },
];

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { section } = useParams<{ section: string }>();
  if (!user) return null;
  const availableSections = settingsSections.filter(
    (item) => !item.teacherOnly || user.role === "teacher",
  );
  const activeSection = availableSections.find((item) => item.id === section)?.id;
  if (!activeSection) return <Navigate to="/settings/profile" replace />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">{t("settings.title")}</h1>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label={t("settings.navigation")} className="min-w-0">
          <ul className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
            {availableSections.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id} className="shrink-0">
                  <NavLink
                    to={`/settings/${item.id}`}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                        isActive
                          ? "bg-slate-800 text-white"
                          : "text-slate-400 hover:bg-slate-900 hover:text-white",
                      )
                    }
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {t(`settings.sections.${item.id}`)}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="min-w-0 space-y-4">
          {activeSection === "profile" ? <ProfileSettingsForm userId={user.id} /> : null}
          {activeSection === "security" ? <SecuritySettingsForm userId={user.id} /> : null}
          {activeSection === "teaching" ? <TeacherAutomationSettings userId={user.id} /> : null}
          {activeSection === "connections" ? <GmailConnectionCard /> : null}
        </div>
      </div>
    </div>
  );
}
