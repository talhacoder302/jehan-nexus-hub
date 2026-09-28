"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { saveClientAction } from "@/app/admin/clients/actions";
import {
  applyFieldErrors,
  FormError,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CLIENT_PLANS, CLIENT_STATUSES } from "@/lib/constants";
import {
  clientFormSchema,
  slugify,
  type ClientFormInput,
  type ClientFormValues,
} from "@/lib/validators/client";

const title = (s: string) => s[0]!.toUpperCase() + s.slice(1);

export function ClientForm({
  clientId,
  defaults,
  managers,
  isAdmin,
}: {
  clientId: string | null;
  defaults: ClientFormInput;
  managers: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(!!clientId);
  const form = useForm<ClientFormInput, unknown, ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: defaults,
  });

  const onSubmit = (values: ClientFormValues) =>
    startTransition(async () => {
      setError(null);
      const result = await saveClientAction(clientId, values);
      if (!result.ok) {
        setError(result.error);
        applyFieldErrors(form.setError, result.fieldErrors);
        return;
      }
      toast.success(result.message ?? "Saved");
      if (!clientId && result.data) router.push(`/admin/clients/${result.data.id}`);
      else router.refresh();
    });

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="grid max-w-5xl gap-6 lg:grid-cols-2"
    >
      <div className="lg:col-span-2">
        <FormError message={error} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="client-name">Client name</FieldLabel>
                  <Input
                    id="client-name"
                    {...field}
                    aria-invalid={fieldState.invalid}
                    onChange={(e) => {
                      field.onChange(e);
                      if (!slugTouched) form.setValue("slug", slugify(e.target.value));
                    }}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <TextField
              control={form.control}
              name="slug"
              label="Slug"
              description="Used in internal links. Lowercase letters, numbers and dashes."
              onKeyDown={() => setSlugTouched(true)}
            />
            <TextField control={form.control} name="industry" label="Industry" />
            <TextField
              control={form.control}
              name="contactEmail"
              label="Contact email"
              type="email"
            />
            <TextField
              control={form.control}
              name="logo"
              label="Logo URL"
              placeholder="https://…"
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                control={form.control}
                name="brandPrimary"
                label="Brand primary"
                placeholder="#4f46e5"
              />
              <TextField
                control={form.control}
                name="brandSecondary"
                label="Brand secondary"
                placeholder="#e0e7ff"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                control={form.control}
                name="plan"
                label="Plan"
                disabled={!isAdmin}
                options={CLIENT_PLANS.map((p) => ({ value: p, label: title(p) }))}
              />
              <SelectField
                control={form.control}
                name="status"
                label="Status"
                disabled={!isAdmin}
                options={CLIENT_STATUSES.map((s) => ({ value: s, label: title(s) }))}
              />
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Meta accounts</CardTitle>
            <CardDescription>Used by the daily insights sync and monthly reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <TextareaField
                control={form.control}
                name="metaAdAccountIds"
                label="Ad account IDs"
                rows={3}
                placeholder={"act_1234567890\n9876543210"}
                description="One per line or comma-separated, with or without the act_ prefix."
              />
              <TextField
                control={form.control}
                name="facebookPageId"
                label="Facebook Page ID"
                inputMode="numeric"
              />
              <TextField
                control={form.control}
                name="instagramAccountId"
                label="Instagram account ID"
                inputMode="numeric"
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assigned managers</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Managers only see clients they're assigned to."
                : "Only admins can change assignments."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              control={form.control}
              name="assignedManagers"
              render={({ field }) => (
                <FieldSet>
                  <FieldLegend className="sr-only">Assigned managers</FieldLegend>
                  {managers.length === 0 ? (
                    <FieldDescription>No managers yet. Invite one from Users.</FieldDescription>
                  ) : (
                    managers.map((m) => {
                      const checked = field.value.includes(m.id);
                      return (
                        <Field key={m.id} orientation="horizontal">
                          <Checkbox
                            id={`mgr-${m.id}`}
                            checked={checked}
                            disabled={!isAdmin}
                            onCheckedChange={(v) =>
                              field.onChange(
                                v
                                  ? [...field.value, m.id]
                                  : field.value.filter((id) => id !== m.id),
                              )
                            }
                          />
                          <FieldLabel htmlFor={`mgr-${m.id}`} className="font-normal">
                            {m.name}
                          </FieldLabel>
                        </Field>
                      );
                    })
                  )}
                </FieldSet>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="h-10" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
          {clientId ? "Save changes" : "Create client"}
        </Button>
      </div>
    </form>
  );
}
