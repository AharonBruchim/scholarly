import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LessonDataError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <Card className="border-red-500/40 bg-red-500/10" role="alert">
      <CardHeader>
        <CardTitle>{t("dashboard.loadErrorTitle")}</CardTitle>
        <CardDescription>{t("dashboard.loadErrorDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="secondary" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      </CardContent>
    </Card>
  );
}
