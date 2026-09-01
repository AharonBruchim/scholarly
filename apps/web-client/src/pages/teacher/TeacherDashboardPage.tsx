import { useState } from "react";
import { useTranslation } from "react-i18next";

import { LessonDataError } from "@/components/dashboard/LessonDataError";
import { Spinner } from "@/components/common/Spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context-core";
import { useDashboardLessons } from "@/hooks/useDashboard";
import { formatLessonDateTime, getLessonDashboardStats } from "@/lib/dashboard";
import { updateTeacherBankAccount as persistTeacherBankAccount } from "@/services/api";

const emptyBankAccount = {
  bankName: "",
  branchNumber: "",
  accountNumber: "",
};

export default function TeacherDashboardPage() {
  const { t, i18n } = useTranslation();
  const { user, updateTeacherBankAccount } = useAuth();
  const lessonsQuery = useDashboardLessons();
  const stats = getLessonDashboardStats(lessonsQuery.data ?? []);
  const [bankForm, setBankForm] = useState(() => user?.bankAccount ?? emptyBankAccount);
  const [isSavingBankAccount, setIsSavingBankAccount] = useState(false);
  const [bankAccountError, setBankAccountError] = useState<string | null>(null);

  const handleBankAccountSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    setIsSavingBankAccount(true);
    setBankAccountError(null);

    try {
      await persistTeacherBankAccount(user.id, bankForm);
      updateTeacherBankAccount(bankForm);
    } catch {
      setBankAccountError(t("dashboard.bankSaveFailed"));
    } finally {
      setIsSavingBankAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-sky-400">
          {t("dashboard.teacherLabel")}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{t("dashboard.teacherTitle")}</h1>
      </div>

      {!user?.bankAccount ? (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardHeader>
            <CardTitle className="text-amber-200">{t("dashboard.bankPromptTitle")}</CardTitle>
            <CardDescription className="text-amber-100/80">
              {t("dashboard.bankPromptDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-3" onSubmit={handleBankAccountSubmit}>
              <label className="space-y-2 text-sm text-slate-200">
                <span>{t("dashboard.bankName")}</span>
                <input
                  value={bankForm.bankName}
                  onChange={(event) =>
                    setBankForm((current) => ({ ...current, bankName: event.target.value }))
                  }
                  className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
                  autoComplete="organization"
                  required
                />
              </label>

              <label className="space-y-2 text-sm text-slate-200">
                <span>{t("dashboard.branchNumber")}</span>
                <input
                  value={bankForm.branchNumber}
                  onChange={(event) =>
                    setBankForm((current) => ({ ...current, branchNumber: event.target.value }))
                  }
                  className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
                  inputMode="numeric"
                  required
                />
              </label>

              <label className="space-y-2 text-sm text-slate-200">
                <span>{t("dashboard.accountNumber")}</span>
                <input
                  value={bankForm.accountNumber}
                  onChange={(event) =>
                    setBankForm((current) => ({ ...current, accountNumber: event.target.value }))
                  }
                  className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
                  inputMode="numeric"
                  required
                />
              </label>

              {bankAccountError ? (
                <p className="text-sm text-red-300 md:col-span-3" role="alert">
                  {bankAccountError}
                </p>
              ) : null}

              <div className="flex justify-end md:col-span-3">
                <Button type="submit" disabled={isSavingBankAccount}>
                  {isSavingBankAccount
                    ? t("dashboard.savingBankDetails")
                    : t("dashboard.saveBankDetails")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {lessonsQuery.isPending ? <Spinner compact /> : null}
      {lessonsQuery.isError ? (
        <LessonDataError onRetry={() => void lessonsQuery.refetch()} />
      ) : null}

      {lessonsQuery.isSuccess ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.scheduledLessons")}</CardTitle>
              <CardDescription>{t("dashboard.scheduledDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-white">{stats.upcomingLessonCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.students")}</CardTitle>
              <CardDescription>{t("dashboard.studentsDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-white">{stats.studentCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.nextLesson")}</CardTitle>
              <CardDescription>
                {stats.nextLesson
                  ? t("dashboard.nextLessonWithSubject", {
                      subject: stats.nextLesson.subject,
                      date: formatLessonDateTime(stats.nextLesson.startTime, i18n.language),
                    })
                  : t("dashboard.noUpcomingLesson")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold text-white">
                {stats.nextLesson
                  ? formatLessonDateTime(stats.nextLesson.startTime, i18n.language)
                  : t("common.none")}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
