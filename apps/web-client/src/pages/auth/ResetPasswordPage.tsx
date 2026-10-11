import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useResetPasswordMutation } from "@/hooks/useAuthQueries";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const mutation = useResetPasswordMutation();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      setValidationError(t("validation.passwordMinLength"));
      return;
    }
    setValidationError(null);
    mutation.mutate(
      { token, newPassword },
      {
        onSuccess: () => {
          window.setTimeout(() => navigate("/login"), 1000);
        },
      },
    );
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("auth.resetPasswordTitle")}</CardTitle>
          <CardDescription>{t("auth.resetPasswordDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <p className="text-sm text-red-400" role="alert">
              {t("auth.resetTokenMissing")}
            </p>
          ) : (
            <form className="space-y-4" onSubmit={submit}>
              <label htmlFor="reset-password" className="block space-y-2 text-sm">
                <span>{t("profile.newPassword")}</span>
                <PasswordInput
                  id="reset-password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder={t("auth.passwordRequirement")}
                  revealLabel={t("auth.showPassword")}
                  hideLabel={t("auth.hidePassword")}
                  required
                />
              </label>
              {validationError || mutation.isError ? (
                <p className="text-sm text-red-400" role="alert">
                  {validationError ?? t("auth.resetFailed")}
                </p>
              ) : null}
              {mutation.isSuccess ? (
                <p className="text-sm text-emerald-300" role="status">
                  {t("auth.resetSuccess")}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? t("profile.saving") : t("auth.resetPassword")}
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-slate-300">
            <Link to="/login" className="font-medium text-sky-400 hover:text-sky-300">
              {t("common.login")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
