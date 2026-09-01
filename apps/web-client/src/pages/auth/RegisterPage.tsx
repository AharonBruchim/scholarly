import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { useAuth } from "@/context/auth-context";
import { useRegisterMutation } from "@/hooks/useAuthQueries";
import { registerSchema, type RegisterFormValues } from "@/types/auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const mutation = useRegisterMutation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "student",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    const session = await mutation.mutateAsync(values);
    register(session);
    navigate(values.role === "teacher" ? "/teacher" : "/student");
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Register as a teacher or student.</CardDescription>
        </CardHeader>

        <CardContent>
          <Form form={form} onSubmit={onSubmit}>
            <FormField label="Name" name="name" placeholder="Jane Doe" error={form.formState.errors.name?.message} />
            <FormField label="Email" name="email" type="email" placeholder="you@example.com" error={form.formState.errors.email?.message} />
            <FormField label="Password" name="password" type="password" placeholder="••••••••" error={form.formState.errors.password?.message} />

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Role</label>
              <select
                {...form.register("role")}
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating account..." : "Register"}
            </Button>
            {mutation.isError ? (
              <p className="text-sm text-red-400">{mutation.error?.message ?? "Registration failed."}</p>
            ) : null}
          </Form>

          <p className="mt-4 text-center text-sm text-slate-300">
            Already have an account? <Link to="/login" className="font-medium text-sky-400 hover:text-sky-300">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
