import type * as React from "react";
import {
  type FieldValues,
  FormProvider,
  type SubmitHandler,
  type UseFormReturn,
  useFormContext,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormProps<TFieldValues extends FieldValues> {
  form: UseFormReturn<TFieldValues>;
  onSubmit: SubmitHandler<TFieldValues>;
  children: React.ReactNode;
  className?: string;
}

function Form<TFieldValues extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
}: FormProps<TFieldValues>) {
  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-4", className)}
        noValidate
      >
        {children}
      </form>
    </FormProvider>
  );
}

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
}

function FormField({ label, name, error, className, ...props }: FormFieldProps) {
  const { register } = useFormContext();

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        className={cn(className, error ? "border-red-500" : "")}
        {...register(name)}
        {...props}
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}

export { Form, FormField };
