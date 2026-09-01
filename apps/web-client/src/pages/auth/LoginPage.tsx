import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
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
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
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
            <FormField
              label={t("auth.password")}
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder={t("auth.passwordPlaceholder")}
              error={
                form.formState.errors.password?.message
                  ? t(form.formState.errors.password.message)
                  : undefined
              }
            />

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? t("auth.signingIn") : t("common.login")}
            </Button>
            {mutation.isError ? (
              <p className="text-sm text-red-400">{t("auth.loginFailed")}</p>
            ) : null}
          </Form>

          <p className="mt-4 text-center text-sm text-slate-300">
            {t("auth.needAccount")}{" "}
            <Link to="/register" className="font-medium text-sky-400 hover:text-sky-300">
              {t("auth.createAccount")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
