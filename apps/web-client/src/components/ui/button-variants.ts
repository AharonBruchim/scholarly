import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default:
          "bg-sky-500 font-semibold text-slate-950 shadow-sm shadow-sky-950/40 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:opacity-100 disabled:shadow-none",
        secondary: "border border-slate-700 bg-slate-800/80 text-slate-100 hover:bg-slate-700",
        outline: "border border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800",
        ghost: "text-slate-300 hover:bg-slate-800 hover:text-white",
        destructive: "bg-red-500 text-white hover:bg-red-400",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
