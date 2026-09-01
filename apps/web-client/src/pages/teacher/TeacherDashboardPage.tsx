import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";

const defaultBankAccount = {
  bankName: "",
  branchNumber: "",
  accountNumber: "",
};

export default function TeacherDashboardPage() {
  const { user, updateTeacherBankAccount } = useAuth();
  const [form, setForm] = useState(defaultBankAccount);
  const [submitted, setSubmitted] = useState(Boolean(user?.bankAccount));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateTeacherBankAccount(form);
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-sky-400">Teacher dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Overview</h1>
        </div>
        <Button>Create class</Button>
      </div>

      {!user?.bankAccount && !submitted ? (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardHeader>
            <CardTitle className="text-amber-200">Complete your bank details</CardTitle>
            <CardDescription className="text-amber-100/80">
              Add your bank account to continue and receive teacher payouts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
              <label className="space-y-2 text-sm text-slate-200">
                <span>Bank name</span>
                <input
                  value={form.bankName}
                  onChange={(event) => setForm((current) => ({ ...current, bankName: event.target.value }))}
                  className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
                  placeholder="Bank Hapoalim"
                  required
                />
              </label>

              <label className="space-y-2 text-sm text-slate-200">
                <span>Branch number</span>
                <input
                  value={form.branchNumber}
                  onChange={(event) => setForm((current) => ({ ...current, branchNumber: event.target.value }))}
                  className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
                  placeholder="123"
                  required
                />
              </label>

              <label className="space-y-2 text-sm text-slate-200">
                <span>Account number</span>
                <input
                  value={form.accountNumber}
                  onChange={(event) => setForm((current) => ({ ...current, accountNumber: event.target.value }))}
                  className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
                  placeholder="012345678"
                  required
                />
              </label>

              <div className="md:col-span-3 flex justify-end">
                <Button type="submit">Save bank details</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Classes</CardTitle>
            <CardDescription>12 active classes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-white">12</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription>Across all programs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-white">148</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>Next lesson in 2h</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-white">3:00 PM</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
