import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useRegisterMutation } from "@/hooks/useAuthQueries";

import { createUserSchema, UsersRoles, type CreateUserValues } from "@scholarly/shared";

function FieldErrors({ errors }: { errors: readonly unknown[] }) {
  const messages = errors.flatMap((error) => {
    if (typeof error === "string") {
      return [error];
    }

    if (error && typeof error === "object" && "message" in error) {
      return [String(error.message)];
    }

    return [];
  });

  return messages.map((message, index) => (
    <p key={`${message}-${index}`} className="text-xs text-red-400" role="alert">
      {message}
    </p>
  ));
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: setSession } = useAuth();
  const mutation = useRegisterMutation();

  const form = useForm({
    defaultValues: {
      role: UsersRoles.STUDENT,
      firstName: "",
      lastName: "",
      email: "",
      phone: { number: "", allowWhatsApp: true, allowSMS: true },
      password: "",
    } as CreateUserValues,
    validators: {
      onChange: createUserSchema,
    },
    onSubmit: async ({ value }) => {
      const session = await mutation.mutateAsync(value);
      setSession(session);
      navigate(value.role === UsersRoles.TEACHER ? "/teacher" : "/student");
    },
  });
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>יצירת חשבון</CardTitle>
          <CardDescription>הרשמה כמורה או כסטודנט</CardDescription>
        </CardHeader>

        <CardContent>
          <form
            autoComplete="on"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <form.Field name="role">
              {(field) => (
                <div className="space-y-1">
                  <label htmlFor="role" className="text-sm font-medium">תפקיד</label>
                  <select
                    id="role"
                    name="role"
                    value={field.state.value}
                    onChange={(e) => {
                      const newRole = e.target.value as UsersRoles;
                      field.handleChange(newRole);
                      if (newRole === UsersRoles.STUDENT) {
                        form.setFieldValue("bankAccount" as never, undefined as never);
                      } else {
                        form.setFieldValue("bankAccount" as never, { bankName: "", branchNumber: "", accountNumber: "" } as never);
                      }
                    }}
                    className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  >
                    <option value={UsersRoles.STUDENT}>סטודנט</option>
                    <option value={UsersRoles.TEACHER}>מורה</option>
                  </select>
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-3">
              <form.Field name="firstName">
                {(field) => (
                  <div className="space-y-1">
                    <label htmlFor="firstName" className="text-sm font-medium">שם פרטי</label>
                    <Input
                      id="firstName"
                      name="firstName"
                      autoComplete="given-name"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="ישראל"
                    />
                    <FieldErrors errors={field.state.meta.errors} />
                  </div>
                )}
              </form.Field>

              <form.Field name="lastName">
                {(field) => (
                  <div className="space-y-1">
                    <label htmlFor="lastName" className="text-sm font-medium">שם משפחה</label>
                    <Input
                      id="lastName"
                      name="lastName"
                      autoComplete="family-name"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="ישראלי"
                    />
                    <FieldErrors errors={field.state.meta.errors} />
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="email">
              {(field) => (
                <div className="space-y-1">
                  <label htmlFor="email" className="text-sm font-medium">אימייל</label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="you@example.com"
                  />
                  <FieldErrors errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>

            <form.Field name="phone.number">
              {(field) => (
                <div className="space-y-1">
                  <label htmlFor="phone" className="text-sm font-medium">מספר טלפון</label>
                  <Input
                    id="phone"
                    name="phone.number"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="0500000000"
                  />
                  <FieldErrors errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <div className="space-y-1">
                  <label htmlFor="password" className="text-sm font-medium">סיסמה</label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="לפחות 8 תווים"
                  />
                  <FieldErrors errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>

            <div className="space-y-2 rounded-md border border-slate-800 p-3">
              <form.Field name="phone.allowWhatsApp">
                {(field) => (
                  <label htmlFor="allowWhatsApp" className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      id="allowWhatsApp"
                      name="phone.allowWhatsApp"
                      type="checkbox"
                      checked={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700"
                    />
                    אני מאשר/ת קבלת הודעות ב־WhatsApp
                  </label>
                )}
              </form.Field>

              <form.Field name="phone.allowSMS">
                {(field) => (
                  <label htmlFor="allowSMS" className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      id="allowSMS"
                      name="phone.allowSMS"
                      type="checkbox"
                      checked={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700"
                    />
                    אני מאשר/ת קבלת הודעות SMS
                  </label>
                )}
              </form.Field>
            </div>

            <form.Subscribe selector={(state) => state.values.role}>
              {(role) =>
                role === UsersRoles.TEACHER ? (
                  <div className="space-y-3 rounded-md border border-slate-800 p-3 bg-slate-900/40">
                    <h4 className="text-sm font-semibold text-slate-200">פרטי חשבון בנק (למורים)</h4>

                    <form.Field name={"bankAccount.bankName" as never}>
                      {(field) => (
                        <div className="space-y-1">
                          <label htmlFor="bankName" className="text-xs font-medium">שם הבנק</label>
                          <Input
                            id="bankName"
                            name="bankAccount.bankName"
                            autoComplete="off"
                            value={(field.state.value as string) ?? ""}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value as never)}
                            placeholder="בנק הפועלים"
                          />
                          <FieldErrors errors={field.state.meta.errors} />
                        </div>
                      )}
                    </form.Field>

                    <div className="grid grid-cols-2 gap-2">
                      <form.Field name={"bankAccount.branchNumber" as never}>
                        {(field) => (
                          <div className="space-y-1">
                            <label htmlFor="branchNumber" className="text-xs font-medium">מספר סניף</label>
                            <Input
                              id="branchNumber"
                              name="bankAccount.branchNumber"
                              inputMode="numeric"
                              autoComplete="off"
                              value={(field.state.value as string) ?? ""}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value as never)}
                              placeholder="123"
                            />
                            <FieldErrors errors={field.state.meta.errors} />
                          </div>
                        )}
                      </form.Field>

                      <form.Field name={"bankAccount.accountNumber" as never}>
                        {(field) => (
                          <div className="space-y-1">
                            <label htmlFor="accountNumber" className="text-xs font-medium">מספר חשבון</label>
                            <Input
                              id="accountNumber"
                              name="bankAccount.accountNumber"
                              inputMode="numeric"
                              autoComplete="off"
                              value={(field.state.value as string) ?? ""}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value as never)}
                              placeholder="456789"
                            />
                            <FieldErrors errors={field.state.meta.errors} />
                          </div>
                        )}
                      </form.Field>
                    </div>
                  </div>
                ) : null
              }
            </form.Subscribe>

            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting || mutation.isPending}>
                  {mutation.isPending || isSubmitting ? "יוצר חשבון..." : "הרשמה"}
                </Button>
              )}
            </form.Subscribe>

            {mutation.isError ? (
              <p className="text-sm text-red-400">{mutation.error?.message ?? "הרשמה נכשלה."}</p>
            ) : null}
          </form>

          <p className="mt-4 text-center text-sm text-slate-300">
            כבר יש לך חשבון? <Link to="/login" className="font-medium text-sky-400 hover:text-sky-300">התחברות</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
