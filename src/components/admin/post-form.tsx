"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { savePostAction } from "@/app/admin/posts/actions";
import {
  applyFieldErrors,
  FormError,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PLATFORMS, type Platform } from "@/lib/constants";
import { postFormSchema, type PostFormValues } from "@/lib/validators/post";
import { MediaUploader } from "./media-uploader";

/** Converts between an ISO timestamp and the `datetime-local` value in the browser's timezone. */
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const PLATFORM_LABELS: Record<Platform, string> = { facebook: "Facebook", instagram: "Instagram" };

export function PostForm({
  postId,
  defaults,
  clients,
  s3Enabled,
  canSubmit,
  locked,
}: {
  postId: string | null;
  defaults: PostFormValues;
  clients: { id: string; name: string }[];
  s3Enabled: boolean;
  /** Whether "Save & send for approval" applies to the current status. */
  canSubmit: boolean;
  locked?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: defaults,
  });
  const clientId = useWatch({ control: form.control, name: "clientId" });

  const save = (submit: boolean) =>
    form.handleSubmit((values) =>
      startTransition(async () => {
        setError(null);
        const result = await savePostAction(postId, values, submit);
        if (!result.ok) {
          setError(result.error);
          applyFieldErrors(form.setError, result.fieldErrors);
          return;
        }
        toast.success(result.message ?? "Saved");
        if (!postId && result.data) router.push(`/admin/posts/${result.data.id}`);
        else router.refresh();
      }),
    );

  return (
    <form noValidate onSubmit={save(false)}>
      <fieldset disabled={locked || pending} className="contents">
        <FieldGroup>
          <FormError message={error} />
          <SelectField
            control={form.control}
            name="clientId"
            label="Client"
            placeholder="Choose a client"
            disabled={!!postId || locked}
            options={clients.map((c) => ({ value: c.id, label: c.name }))}
          />
          <TextField
            control={form.control}
            name="title"
            label="Title"
            placeholder="Internal title, e.g. Weekly offer"
          />
          <TextareaField
            control={form.control}
            name="caption"
            label="Caption"
            rows={6}
            placeholder="Post caption with hashtags"
          />

          <Controller
            control={form.control}
            name="platforms"
            render={({ field, fieldState }) => (
              <FieldSet data-invalid={fieldState.invalid}>
                <FieldLegend variant="label">Platforms</FieldLegend>
                <div className="flex gap-6">
                  {PLATFORMS.map((p) => (
                    <Field key={p} orientation="horizontal" className="w-auto">
                      <Checkbox
                        id={`platform-${p}`}
                        checked={field.value.includes(p)}
                        onCheckedChange={(v) =>
                          field.onChange(
                            v ? [...field.value, p] : field.value.filter((x) => x !== p),
                          )
                        }
                      />
                      <FieldLabel htmlFor={`platform-${p}`} className="font-normal">
                        {PLATFORM_LABELS[p]}
                      </FieldLabel>
                    </Field>
                  ))}
                </div>
                <FieldError errors={[fieldState.error]} />
              </FieldSet>
            )}
          />

          <Controller
            control={form.control}
            name="scheduledAt"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="max-w-xs">
                <FieldLabel htmlFor="scheduledAt">Scheduled for</FieldLabel>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={field.value ? toLocalInput(field.value) : ""}
                  onChange={(e) =>
                    field.onChange(e.target.value ? new Date(e.target.value).toISOString() : "")
                  }
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="mediaUrls"
            render={({ field, fieldState }) => (
              <FieldSet>
                <FieldLegend variant="label">Media</FieldLegend>
                <MediaUploader
                  clientId={clientId}
                  value={field.value}
                  onChange={field.onChange}
                  s3Enabled={s3Enabled}
                />
                <FieldError errors={[fieldState.error]} />
              </FieldSet>
            )}
          />

          {!locked ? (
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="outline" disabled={pending}>
                {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
                {postId ? "Save" : "Save draft"}
              </Button>
              {canSubmit ? (
                <Button type="button" disabled={pending} onClick={save(true)}>
                  <Send /> Save &amp; send for approval
                </Button>
              ) : null}
            </div>
          ) : null}
        </FieldGroup>
      </fieldset>
    </form>
  );
}
