import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { useAuth } from "@/context/auth-context";
import { useLoginMutation } from "@/hooks/useAuthQueries";
import { loginSchema, type LoginFormValues } from "@/types/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const mutation = useLoginMutation();

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
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Access your school dashboard and lessons.</CardDescription>
        </CardHeader>

        <CardContent>
          <Form form={form} onSubmit={onSubmit}>
            <FormField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={form.formState.errors.email?.message}
            />
            <FormField
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={form.formState.errors.password?.message}
            />

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Signing in..." : "Login"}
            </Button>
            {mutation.isError ? (
              <p className="text-sm text-red-400">{mutation.error?.message ?? "Login failed."}</p>
            ) : null}
          </Form>

          <p className="mt-4 text-center text-sm text-slate-300">
            Need an account? <Link to="/register" className="font-medium text-sky-400 hover:text-sky-300">Create one</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
