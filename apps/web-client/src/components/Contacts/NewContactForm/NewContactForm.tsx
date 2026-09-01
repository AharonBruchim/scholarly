import { type FormEvent, useState } from "react";

export default function NewContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.info("Submitted contact", { name, email });
    setName("");
    setEmail("");
  };

  return (
    <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
      <h2 className="mb-4 text-2xl font-semibold text-white">Create a contact</h2>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <label className="block text-sm text-slate-200">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>

        <label className="block text-sm text-slate-200">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-md bg-sky-500 px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-sky-400"
        >
          Save
        </button>
      </form>
    </div>
  );
}
