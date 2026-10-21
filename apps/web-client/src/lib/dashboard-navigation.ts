import {
  CalendarDays,
  CreditCard,
  History,
  type LucideIcon,
  PlusCircle,
  Search,
} from "lucide-react";

export const teacherTabIds = ["lessons", "create", "payments", "history"] as const;
export const studentTabIds = ["lessons", "book", "payments", "history"] as const;
export const historySectionIds = ["lessons", "payments"] as const;

export type TeacherTab = (typeof teacherTabIds)[number];
export type StudentTab = (typeof studentTabIds)[number];
export type HistorySection = (typeof historySectionIds)[number];
export type DashboardRole = "teacher" | "student";

export interface IDashboardNavLink {
  to: string;
  labelKey: string;
}

export interface IDashboardNavItem extends IDashboardNavLink {
  icon: LucideIcon;
  sections: IDashboardNavLink[];
}

const tabIcons: Record<TeacherTab | StudentTab, LucideIcon> = {
  lessons: CalendarDays,
  create: PlusCircle,
  book: Search,
  payments: CreditCard,
  history: History,
};

const historySectionLabelKeys: Record<HistorySection, string> = {
  lessons: "dashboard.tabs.historyLessons",
  payments: "dashboard.tabs.historyPayments",
};

export function getDashboardNavItems(role: DashboardRole): IDashboardNavItem[] {
  const tabIds = role === "teacher" ? teacherTabIds : studentTabIds;
  return tabIds.map((tabId) => ({
    to: `/${role}/${tabId}`,
    labelKey: `dashboard.tabs.${tabId}`,
    icon: tabIcons[tabId],
    sections:
      tabId === "history"
        ? historySectionIds.map((sectionId) => ({
            to: `/${role}/history/${sectionId}`,
            labelKey: historySectionLabelKeys[sectionId],
          }))
        : [],
  }));
}
