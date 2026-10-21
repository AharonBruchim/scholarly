import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";

import { useNavBadges } from "@/hooks/useNavBadges";
import {
  type DashboardRole,
  getDashboardNavItems,
  type IDashboardNavItem,
} from "@/lib/dashboard-navigation";
import { cn } from "@/lib/utils";

const desktopLinkClassName =
  "relative inline-flex h-16 items-center gap-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400";

const activeUnderlineClassName =
  "text-white after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-sky-400";

function desktopLinkStateClassName(isActive: boolean): string {
  return cn(
    desktopLinkClassName,
    isActive ? activeUnderlineClassName : "text-slate-400 hover:text-white",
  );
}

function mobileLinkClassName({ isActive }: { isActive: boolean }): string {
  return cn(
    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
    isActive ? "bg-sky-500/15 text-sky-300" : "text-slate-300 hover:bg-slate-800 hover:text-white",
  );
}

function NavBadge({ count }: { count: number | undefined }) {
  const { t } = useTranslation();
  if (!count) return null;
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-semibold text-slate-950">
      {count}
      <span className="sr-only"> {t("common.pendingItems")}</span>
    </span>
  );
}

function useCloseOnOutsideInteraction(
  open: boolean,
  containerRef: React.RefObject<HTMLElement | null>,
  setOpen: (open: boolean) => void,
) {
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, containerRef, setOpen]);
}

function DesktopDropdown({ item }: { item: IDashboardNavItem }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const Icon = item.icon;
  const isActive = pathname.startsWith(item.to);

  useCloseOnOutsideInteraction(open, containerRef, setOpen);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={desktopLinkStateClassName(isActive)}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        {t(item.labelKey)}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div className="absolute start-0 top-full z-20 mt-1 min-w-44 rounded-lg border border-slate-800 bg-slate-900 p-1 shadow-xl shadow-black/40">
          {item.sections.map((section) => (
            <NavLink
              key={section.to}
              to={section.to}
              onClick={() => setOpen(false)}
              className={mobileLinkClassName}
            >
              {t(section.labelKey)}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DesktopDashboardNav({ role }: { role: DashboardRole }) {
  const { t } = useTranslation();
  const badges = useNavBadges(role);
  return (
    <nav aria-label={t("common.mainNavigation")} className="hidden items-center md:flex">
      {getDashboardNavItems(role).map((item) => {
        if (item.sections.length > 0) return <DesktopDropdown key={item.to} item={item} />;
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => desktopLinkStateClassName(isActive)}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {t(item.labelKey)}
            <NavBadge count={badges[item.to]} />
          </NavLink>
        );
      })}
    </nav>
  );
}

export function MobileDashboardNav({ role }: { role: DashboardRole }) {
  const { t } = useTranslation();
  const badges = useNavBadges(role);
  const totalBadgeCount = Object.values(badges).reduce((total, count) => total + count, 0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeMenu = () => setOpen(false);

  useCloseOnOutsideInteraction(open, containerRef, setOpen);

  return (
    <div ref={containerRef} className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label={t("common.mainNavigation")}
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        {open ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" aria-hidden="true" />
        )}
        {totalBadgeCount > 0 ? (
          <span
            className="absolute end-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-amber-400"
            aria-hidden="true"
          />
        ) : null}
      </button>
      {open ? (
        <nav
          aria-label={t("common.mainNavigation")}
          className="absolute inset-x-0 top-full z-20 border-b border-slate-800 bg-slate-950 px-4 py-3 shadow-xl shadow-black/40"
        >
          <ul className="space-y-1">
            {getDashboardNavItems(role).map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  {item.sections.length > 0 ? (
                    <>
                      <p className="flex items-center gap-3 px-3 pt-2.5 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {t(item.labelKey)}
                      </p>
                      <ul className="space-y-1 ps-7">
                        {item.sections.map((section) => (
                          <li key={section.to}>
                            <NavLink
                              to={section.to}
                              onClick={closeMenu}
                              className={mobileLinkClassName}
                            >
                              {t(section.labelKey)}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <NavLink to={item.to} onClick={closeMenu} className={mobileLinkClassName}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {t(item.labelKey)}
                      <NavBadge count={badges[item.to]} />
                    </NavLink>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
