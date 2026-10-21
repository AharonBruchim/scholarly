import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useChangeUserPassword } from "@/hooks/useUserProfile";

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
};

export function SecuritySettingsForm({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [validationError, setValidationError] = useState<string | null>(null);
  const changePasswordMutation = useChangeUserPassword(userId);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      setValidationError(t("validation.passwordMinLength"));
      return;
    }
    setValidationError(null);
    changePasswordMutation.mutate(passwordForm, {
      onSuccess: () => setPasswordForm(emptyPasswordForm),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile.passwordTitle")}</CardTitle>
        <CardDescription>{t("profile.passwordDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label htmlFor="profile-current-password" className="block space-y-1 text-sm">
            <span>{t("profile.currentPassword")}</span>
            <PasswordInput
              id="profile-current-password"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
              }
              revealLabel={t("auth.showPassword")}
              hideLabel={t("auth.hidePassword")}
              required
            />
          </label>

          <label htmlFor="profile-new-password" className="block space-y-1 text-sm">
            <span>{t("profile.newPassword")}</span>
            <PasswordInput
              id="profile-new-password"
              autoComplete="new-password"
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
              }
              placeholder={t("auth.passwordRequirement")}
              revealLabel={t("auth.showPassword")}
              hideLabel={t("auth.hidePassword")}
              required
            />
          </label>

          {validationError || changePasswordMutation.isError ? (
            <p className="text-sm text-red-400" role="alert">
              {validationError ?? t("profile.passwordSaveFailed")}
            </p>
          ) : null}
          {changePasswordMutation.isSuccess ? (
            <p className="text-sm text-emerald-400" role="status">
              {t("profile.passwordSaved")}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                changePasswordMutation.isPending ||
                !passwordForm.currentPassword ||
                !passwordForm.newPassword
              }
            >
              {changePasswordMutation.isPending ? t("profile.saving") : t("profile.passwordSave")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
