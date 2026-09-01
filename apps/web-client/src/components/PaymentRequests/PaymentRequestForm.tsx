import { useState } from "react";

export const PaymentRequestForm = () => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [studentCount, setStudentCount] = useState("");
  const [sessionCount, setSessionCount] = useState("");
  const [comments, setComments] = useState("");

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
      <div className="space-y-4">
        <label className="block text-sm text-slate-200">
          Amount
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>

        <label className="block text-sm text-slate-200">
          Payment date
          <input
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>

        <label className="block text-sm text-slate-200">
          Number of students
          <input
            value={studentCount}
            onChange={(event) => setStudentCount(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>

        <label className="block text-sm text-slate-200">
          Number of sessions
          <input
            value={sessionCount}
            onChange={(event) => setSessionCount(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>

        <label className="block text-sm text-slate-200">
          Notes
          <textarea
            value={comments}
            onChange={(event) => setComments(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>

        <button
          type="button"
          className="w-full rounded-md bg-sky-500 px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-sky-400"
        >
          Send request
        </button>
      </div>
    </div>
  );
};
