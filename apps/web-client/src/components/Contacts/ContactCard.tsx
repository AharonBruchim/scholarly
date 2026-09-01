type Contact = {
  id: string;
  name: string;
  email: string;
};

export default function ContactCard({ contact }: { contact: Contact }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-lg font-semibold text-white">{contact.name}</p>
        <p className="text-sm text-slate-300">{contact.email}</p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
        >
          Send
        </button>
        <button
          type="button"
          className="rounded-md bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
        >
          Edit
        </button>
        <button
          type="button"
          className="rounded-md bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-400"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
