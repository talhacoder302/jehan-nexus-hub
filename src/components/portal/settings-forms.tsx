"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { changePasswordAction, updateProfileAction } from "@/app/portal/settings/actions";
import { applyFieldErrors, TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  changePasswordSchema,
  profileSchema,
  type ChangePasswordInput,
  type ProfileInput,
} from "@/lib/validators/auth";

export function ProfileForm({ name }: { name: string }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name },
  });
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          const result = await updateProfileAction(values);
          if (result.ok) toast.success(result.message ?? "Saved");
          else {
            toast.error(result.error);
            applyFieldErrors(form.setError, result.fieldErrors);
          }
        }),
      )}
    >
      <FieldGroup>
        <TextField control={form.control} name="name" label="Name" autoComplete="name" />
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" /> : null}
            Save
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          const result = await changePasswordAction(values);
          if (result.ok) {
            toast.success(result.message ?? "Password changed");
            form.reset();
          } else {
            toast.error(result.error);
            applyFieldErrors(form.setError, result.fieldErrors);
          }
        }),
      )}
    >
      <FieldGroup>
        <TextField
          control={form.control}
          name="currentPassword"
          label="Current password"
          type="password"
          autoComplete="current-password"
        />
        <TextField
          control={form.control}
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          description="At least 10 characters, with a letter and a number."
        />
        <TextField
          control={form.control}
          name="confirmPassword"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
        />
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" /> : null}
            Change password
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
