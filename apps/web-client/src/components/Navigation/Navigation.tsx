import { memo } from "react";
import { Link } from "react-router-dom";

export const Navigation = memo(function Navigation() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/login" className="text-lg font-semibold text-white">Scholarly</Link>
        <nav className="flex gap-2 text-sm text-slate-200">
          <Link to="/login" className="rounded-md px-3 py-2 hover:bg-slate-800">Login</Link>
          <Link to="/register" className="rounded-md bg-sky-500 px-3 py-2 text-slate-950 hover:bg-sky-400">Register</Link>
        </nav>
      </div>
    </header>
  );
});
