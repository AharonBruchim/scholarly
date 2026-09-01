import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const isHebrew = i18n.resolvedLanguage !== "en";
  const nextLanguage = isHebrew ? "en" : "he";

  return (
    <Button
      type="button"
      variant="ghost"
      className="gap-2"
      onClick={() => void i18n.changeLanguage(nextLanguage)}
      aria-label={t("common.language")}
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span>{isHebrew ? "English" : "עברית"}</span>
    </Button>
  );
}
