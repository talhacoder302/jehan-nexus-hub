"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  acceptInviteAction,
  forgotPasswordAction,
  resetPasswordAction,
} from "@/app/(auth)/actions";
import { applyFieldErrors, FormError, TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  acceptInviteSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type AcceptInviteInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validators/auth";

const PASSWORD_HINT = "At least 10 characters, with a letter and a number.";

function SuccessMessage({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-4 text-center">
      <CircleCheck className="size-10 text-success" />
      <p>{message}</p>
      {action}
    </div>
  );
}

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  if (done) {
    return (
      <SuccessMessage
        message={done}
        action={
          <Link href="/login" className="text-sm text-primary hover:underline">
            Back to sign in
          </Link>
        }
      />
    );
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          const result = await forgotPasswordAction(values);
          if (result.ok) setDone(result.message ?? "Check your email.");
          else {
            setError(result.error);
            applyFieldErrors(form.setError, result.fieldErrors);
          }
        }),
      )}
    >
      <FieldGroup>
        <FormError message={error} />
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
        />
        <Button type="submit" size="lg" className="h-10" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" /> : null}
          Send reset link
        </Button>
      </FieldGroup>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  if (done) {
    return (
      <SuccessMessage
        message={done}
        action={
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        }
      />
    );
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          const result = await resetPasswordAction(values);
          if (result.ok) setDone(result.message ?? "Password updated.");
          else {
            setError(result.error);
            applyFieldErrors(form.setError, result.fieldErrors);
          }
        }),
      )}
    >
      <FieldGroup>
        <FormError message={error} />
        <TextField
          control={form.control}
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          description={PASSWORD_HINT}
        />
        <TextField
          control={form.control}
          name="confirmPassword"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
        />
        <Button type="submit" size="lg" className="h-10" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" /> : null}
          Update password
        </Button>
      </FieldGroup>
    </form>
  );
}

export function AcceptInviteForm({ token, name }: { token: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<AcceptInviteInput>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { token, name, password: "", confirmPassword: "" },
  });

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          const result = await acceptInviteAction(values);
          if (result.ok) {
            window.location.assign(result.data?.redirectTo ?? "/continue");
            return;
          }
          setError(result.error);
          applyFieldErrors(form.setError, result.fieldErrors);
        }),
      )}
    >
      <FieldGroup>
        <FormError message={error} />
        <TextField control={form.control} name="name" label="Your name" autoComplete="name" />
        <TextField
          control={form.control}
          name="password"
          label="Choose a password"
          type="password"
          autoComplete="new-password"
          description={PASSWORD_HINT}
        />
        <TextField
          control={form.control}
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
        />
        <Button type="submit" size="lg" className="h-10" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" /> : null}
          Activate account
        </Button>
      </FieldGroup>
    </form>
  );
}
