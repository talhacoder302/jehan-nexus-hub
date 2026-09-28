"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, LoaderCircle, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { inviteUserAction } from "@/app/admin/users/actions";
import { applyFieldErrors, FormError, SelectField, TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { UserRole } from "@/lib/constants";
import {
  inviteUserSchema,
  type InviteUserInput,
  type InviteUserValues,
} from "@/lib/validators/auth";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "client", label: "Client user" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

export function InviteUserDialog({
  clients,
  canInviteStaff,
  defaultClientId,
}: {
  clients: { id: string; name: string }[];
  canInviteStaff: boolean;
  defaultClientId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const form = useForm<InviteUserInput, unknown, InviteUserValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { name: "", email: "", role: "client", clientId: defaultClientId ?? "" },
  });
  const role = useWatch({ control: form.control, name: "role" });

  const reset = () => {
    form.reset();
    setError(null);
    setInviteLink(null);
  };

  const onSubmit = (values: InviteUserValues) => {
    setError(null);
    startTransition(async () => {
      const result = await inviteUserAction(values);
      if (!result.ok) {
        setError(result.error);
        applyFieldErrors(form.setError, result.fieldErrors);
        return;
      }
      toast.success(result.message ?? "Invitation created.");
      if (result.data?.inviteLink) setInviteLink(result.data.inviteLink);
      else {
        setOpen(false);
        reset();
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus /> Invite user
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite a user</DialogTitle>
          <DialogDescription>
            They&apos;ll get an email with a link to set their password. Links expire after 7 days.
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Email delivery isn&apos;t configured. Share this one-time link with the user securely:
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={inviteLink}
                aria-label="Invite link"
                onFocus={(e) => e.target.select()}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Copy invite link"
                onClick={() =>
                  navigator.clipboard.writeText(inviteLink).then(() => toast.success("Copied"))
                }
              >
                <Copy />
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <FormError message={error} />
              <TextField control={form.control} name="name" label="Full name" autoComplete="off" />
              <TextField
                control={form.control}
                name="email"
                label="Email"
                type="email"
                autoComplete="off"
              />
              <SelectField
                control={form.control}
                name="role"
                label="Role"
                options={
                  canInviteStaff ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r.value === "client")
                }
              />
              {role === "client" ? (
                <SelectField
                  control={form.control}
                  name="clientId"
                  label="Client"
                  placeholder={clients.length ? "Choose a client" : "No clients yet"}
                  options={clients.map((c) => ({ value: c.id, label: c.name }))}
                  disabled={!clients.length}
                />
              ) : null}
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending ? <LoaderCircle className="animate-spin" /> : null}
                  Send invite
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
