import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDirectoryUsers } from "@/hooks/useDirectory";

export function TeacherDirectory() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const teachersQuery = useDirectoryUsers("teacher");
  const teachers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    if (!normalizedSearch) {
      return teachersQuery.data ?? [];
    }

    return (teachersQuery.data ?? []).filter((teacher) =>
      `${teacher.firstName} ${teacher.lastName}`.toLocaleLowerCase().includes(normalizedSearch),
    );
  }, [search, teachersQuery.data]);

  return (
    <Card id="teacher-directory" className="scroll-mt-6">
      <CardHeader>
        <CardTitle>{t("directory.title")}</CardTitle>
        <CardDescription>{t("directory.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("directory.searchPlaceholder")}
            className="ps-9"
          />
        </div>

        {teachersQuery.isPending ? (
          <p className="text-sm text-slate-300">{t("common.loading")}</p>
        ) : null}

        {teachersQuery.isError ? (
          <div className="space-y-3" role="alert">
            <p className="text-sm text-red-400">{t("directory.loadError")}</p>
            <Button type="button" variant="secondary" onClick={() => void teachersQuery.refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        ) : null}

        {teachersQuery.isSuccess && teachers.length === 0 ? (
          <p className="text-sm text-slate-300">{t("directory.empty")}</p>
        ) : null}

        {teachers.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teachers.map((teacher) => (
              <li
                key={teacher._id}
                className="rounded-xl border border-slate-700 bg-slate-950/50 p-4"
              >
                <p className="font-semibold text-white">
                  {teacher.firstName} {teacher.lastName}
                </p>
                <p className="mt-1 text-sm text-slate-400">{t("directory.teacher")}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
