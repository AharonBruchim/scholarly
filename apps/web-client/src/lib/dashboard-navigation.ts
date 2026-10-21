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
export const teacherHistorySectionIds = ["lessons", "payments", "messages"] as const;
export const studentHistorySectionIds = ["lessons", "payments"] as const;

export type TeacherTab = (typeof teacherTabIds)[number];
export type StudentTab = (typeof studentTabIds)[number];
export type TeacherHistorySection = (typeof teacherHistorySectionIds)[number];
export type StudentHistorySection = (typeof studentHistorySectionIds)[number];
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

const historySectionLabelKeys: Record<TeacherHistorySection | StudentHistorySection, string> = {
  lessons: "dashboard.tabs.historyLessons",
  payments: "dashboard.tabs.historyPayments",
  messages: "dashboard.tabs.historyMessages",
};

export function getDashboardNavItems(role: DashboardRole): IDashboardNavItem[] {
  const tabIds = role === "teacher" ? teacherTabIds : studentTabIds;
  const historySectionIds =
    role === "teacher" ? teacherHistorySectionIds : studentHistorySectionIds;
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
