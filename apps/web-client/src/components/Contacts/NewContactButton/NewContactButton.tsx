import { useNavigate } from "react-router-dom";

export default function NewContactButton() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      aria-label="Add contact"
      onClick={() => navigate("/contacts/new")}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-2xl font-semibold text-slate-950 shadow-lg shadow-sky-500/30 transition hover:bg-sky-400"
    >
      +
    </button>
  );
}
