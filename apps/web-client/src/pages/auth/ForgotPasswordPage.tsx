import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForgotPasswordMutation } from "@/hooks/useAuthQueries";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const mutation = useForgotPasswordMutation();

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("auth.forgotPasswordTitle")}</CardTitle>
          <CardDescription>{t("auth.forgotPasswordDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate(email);
            }}
          >
            <label htmlFor="forgot-email" className="block space-y-2 text-sm">
              <span>{t("auth.email")}</span>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                required
              />
            </label>
            <Button type="submit" className="w-full" disabled={mutation.isPending || !email}>
              {mutation.isPending ? t("auth.sendingReset") : t("auth.sendReset")}
            </Button>
            {mutation.isSuccess ? (
              <p className="text-sm text-emerald-300" role="status">
                {t("auth.resetSent")}
              </p>
            ) : null}
            {mutation.isError ? (
              <p className="text-sm text-red-400" role="alert">
                {t("auth.resetSendFailed")}
              </p>
            ) : null}
          </form>
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
