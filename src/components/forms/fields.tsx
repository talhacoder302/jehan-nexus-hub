"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type UseFormSetError,
} from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface BaseProps<T extends FieldValues, TOut extends FieldValues = T> {
  control: Control<T, unknown, TOut>;
  name: FieldPath<T>;
  label: ReactNode;
  description?: ReactNode;
  className?: string;
}

export function TextField<T extends FieldValues, TOut extends FieldValues = T>({
  control,
  name,
  label,
  description,
  className,
  ...inputProps
}: BaseProps<T, TOut> & Omit<ComponentProps<typeof Input>, "name" | "value" | "onChange" | "onBlur">) {
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Input
            id={id}
            {...inputProps}
            {...field}
            value={(field.value as string | number | undefined) ?? ""}
            aria-invalid={fieldState.invalid}
          />
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function TextareaField<T extends FieldValues, TOut extends FieldValues = T>({
  control,
  name,
  label,
  description,
  className,
  ...inputProps
}: BaseProps<T, TOut> & Omit<ComponentProps<typeof Textarea>, "name" | "value" | "onChange" | "onBlur">) {
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Textarea
            id={id}
            {...inputProps}
            {...field}
            value={(field.value as string | undefined) ?? ""}
            aria-invalid={fieldState.invalid}
          />
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function SelectField<T extends FieldValues, TOut extends FieldValues = T>({
  control,
  name,
  label,
  description,
  className,
  options,
  placeholder,
  disabled,
}: BaseProps<T, TOut> & {
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Select
            value={(field.value as string | undefined) ?? ""}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger id={id} className="w-full" aria-invalid={fieldState.invalid}>
              <SelectValue placeholder={placeholder ?? "Select…"} />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

/** Copies server-side field errors from an ActionResult onto the form. */
export function applyFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fieldErrors: Record<string, string[] | undefined> | undefined,
) {
  for (const [name, messages] of Object.entries(fieldErrors ?? {})) {
    if (messages?.[0]) setError(name as FieldPath<T>, { message: messages[0] });
  }
}

export function FormError({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </p>
  );
}
