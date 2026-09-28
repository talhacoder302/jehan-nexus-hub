"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { loginAction } from "@/app/(auth)/actions";
import { applyFieldErrors, FormError, TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";

export function LoginForm({
  callbackUrl,
  initialError,
}: {
  callbackUrl?: string;
  initialError?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError ?? null);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginInput) => {
    setError(null);
    startTransition(async () => {
      const result = await loginAction(values, callbackUrl);
      if (result.ok) {
        // Full navigation so the new session cookie is picked up everywhere.
        window.location.assign(result.data?.redirectTo ?? "/continue");
        return;
      }
      setError(result.error);
      applyFieldErrors(form.setError, result.fieldErrors);
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <FormError message={error} />
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
        />
        <div className="space-y-2">
          <TextField
            control={form.control}
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
          />
          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" size="lg" className="h-10" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" /> : null}
          Sign in
        </Button>
      </FieldGroup>
    </form>
  );
}
