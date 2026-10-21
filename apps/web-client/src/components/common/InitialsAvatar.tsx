import { cn } from "@/lib/utils";

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

function avatarColorOf(seed: string): string {
  const hash = [...seed].reduce((total, character) => total + character.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length] ?? "bg-sky-500";
}

export function InitialsAvatar({
  seed,
  firstName,
  lastName,
  fallback = "?",
  className,
}: {
  seed: string;
  firstName: string;
  lastName: string;
  fallback?: string;
  className?: string;
}) {
  const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        avatarColorOf(seed),
        className,
      )}
    >
      {initials || fallback}
    </span>
  );
}
