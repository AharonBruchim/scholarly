import { LogOut, Settings } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useCloseOnOutsideInteraction } from "@/hooks/useCloseOnOutsideInteraction";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types/auth";

const avatarColors = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-fuchsia-500",
];

function initialsOf(user: AuthUser): string {
  const first = user.firstName.trim().charAt(0);
  const last = user.lastName.trim().charAt(0);
  return `${first}${last}`.toUpperCase() || user.email.charAt(0).toUpperCase();
}

function avatarColorOf(seed: string): string {
  const hash = [...seed].reduce((total, character) => total + character.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length] ?? "bg-sky-500";
}

export function UserAvatar({ user, className }: { user: AuthUser; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        avatarColorOf(user.id || user.email),
        className,
      )}
    >
      {initialsOf(user)}
    </span>
  );
}

const menuItemClassName =
  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400";

export function UserMenu({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useCloseOnOutsideInteraction(open, containerRef, setOpen);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${t("common.accountMenu")}: ${user.name}`}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "rounded-full ring-offset-2 ring-offset-slate-950 transition-shadow hover:ring-2 hover:ring-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
          open && "ring-2 ring-sky-400",
        )}
      >
        <UserAvatar user={user} className="h-9 w-9 text-sm" />
      </button>
      {open ? (
        <div className="absolute end-0 top-full z-30 mt-2 w-72 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-3 px-3 py-3">
            <UserAvatar user={user} className="h-10 w-10" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-400" dir="ltr">
                {user.email}
              </p>
            </div>
          </div>
          <div className="my-1 h-px bg-slate-800" />
          <Link to="/settings/profile" onClick={() => setOpen(false)} className={menuItemClassName}>
            <Settings className="h-4 w-4" aria-hidden="true" />
            {t("common.settings")}
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className={cn(menuItemClassName, "text-rose-300 hover:text-rose-200")}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t("common.logout")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
