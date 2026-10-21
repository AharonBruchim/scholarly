import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context-core";
import { useLoginMutation } from "@/hooks/useAuthQueries";
import { type LoginFormValues, loginSchema } from "@/types/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const mutation = useLoginMutation();
  const { t } = useTranslation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const session = await mutation.mutateAsync(values);
    login(session);
    navigate(session.user.role === "teacher" ? "/teacher" : "/student");
  };

  return (
    <AuthLayout>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t("auth.loginTitle")}</CardTitle>
          <CardDescription>{t("auth.loginDescription")}</CardDescription>
        </CardHeader>

        <CardContent>
          <Form form={form} onSubmit={onSubmit}>
            <FormField
              label={t("auth.email")}
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t("auth.emailPlaceholder")}
              error={
                form.formState.errors.email?.message
                  ? t(form.formState.errors.email.message)
                  : undefined
              }
            />
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                placeholder={t("auth.passwordPlaceholder")}
                revealLabel={t("auth.showPassword")}
                hideLabel={t("auth.hidePassword")}
                className={form.formState.errors.password ? "border-red-500" : ""}
                {...form.register("password")}
              />
              {form.formState.errors.password?.message ? (
                <p className="text-sm text-red-400">
                  {t(form.formState.errors.password.message)}
                </p>
              ) : null}
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? t("auth.signingIn") : t("common.login")}
            </Button>
            {mutation.isError ? (
              <p className="text-sm text-red-400">{t("auth.loginFailed")}</p>
            ) : null}
          </Form>

          <p className="mt-3 text-center text-sm">
            <Link to="/forgot-password" className="font-medium text-sky-400 hover:text-sky-300">
              {t("auth.forgotPassword")}
            </Link>
          </p>

          <p className="mt-4 text-center text-sm text-slate-300">
            {t("auth.needAccount")}{" "}
            <Link to="/register" className="font-medium text-sky-400 hover:text-sky-300">
              {t("auth.createAccount")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
