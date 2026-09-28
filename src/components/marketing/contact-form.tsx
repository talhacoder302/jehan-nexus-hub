"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, LoaderCircle, Send } from "lucide-react";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { submitContactAction } from "@/app/(marketing)/contact/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BUDGET_OPTIONS, SERVICE_OPTIONS } from "@/lib/constants";
import {
  BUDGET_LABELS,
  SERVICE_LABELS,
  contactSchema,
  type ContactInput,
  type ContactValues,
} from "@/lib/validators/lead";

export function ContactForm({ defaultService }: { defaultService?: ContactInput["service"] }) {
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<ContactInput, unknown, ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      service: defaultService,
      budget: undefined,
      message: "",
      website: "",
    },
  });

  const onSubmit = (values: ContactValues) => {
    setFormError(null);
    startTransition(async () => {
      const result = await submitContactAction(values);
      if (result.ok) {
        setSuccess(result.message ?? "Thanks! We'll be in touch soon.");
        form.reset();
        return;
      }
      setFormError(result.error);
      for (const [name, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) form.setError(name as keyof ContactInput, { message: messages[0] });
      }
    });
  };

  if (success) {
    return (
      <div
        role="status"
        className="flex flex-col items-center rounded-2xl border bg-card p-10 text-center"
      >
        <CircleCheck className="size-12 text-success" />
        <h2 className="mt-4 text-2xl font-semibold">Message sent</h2>
        <p className="mt-2 text-muted-foreground">{success}</p>
        <Button variant="outline" className="mt-6" onClick={() => setSuccess(null)}>
          Send another message
        </Button>
      </div>
    );
  }

  const { errors } = form.formState;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="relative rounded-2xl border bg-card p-6 sm:p-8"
      aria-describedby={formError ? "contact-form-error" : undefined}
    >
      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              autoComplete="name"
              aria-invalid={!!errors.name}
              {...form.register("name")}
            />
            <FieldError errors={[errors.name]} />
          </Field>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...form.register("email")}
            />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="phone">
              Phone <span className="font-normal text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="phone" type="tel" autoComplete="tel" {...form.register("phone")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="company">
              Company <span className="font-normal text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="company" autoComplete="organization" {...form.register("company")} />
          </Field>

          <Controller
            control={form.control}
            name="service"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="service">What do you need help with?</FieldLabel>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger id="service" className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Choose a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SERVICE_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="budget"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="budget">
                  Monthly budget{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </FieldLabel>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger id="budget" className="w-full">
                    <SelectValue placeholder="Select a range" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_OPTIONS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {BUDGET_LABELS[b]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        </div>

        <Field data-invalid={!!errors.message}>
          <FieldLabel htmlFor="message">Tell us about your goals</FieldLabel>
          <Textarea
            id="message"
            rows={5}
            aria-invalid={!!errors.message}
            placeholder="Where are you today, and where do you want to be in 6 months?"
            {...form.register("message")}
          />
          <FieldError errors={[errors.message]} />
        </Field>

        {/* Honeypot: visually hidden and skipped by keyboard and screen readers. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="website">Website</label>
          <input id="website" tabIndex={-1} autoComplete="off" {...form.register("website")} />
        </div>

        {formError ? (
          <p id="contact-form-error" role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-11 bg-brand-gradient text-white"
        >
          {pending ? <LoaderCircle className="animate-spin" /> : <Send />}
          {pending ? "Sending…" : "Send message"}
        </Button>
        <p className="text-xs text-muted-foreground">
          We’ll only use your details to respond to your enquiry. See our privacy policy.
        </p>
      </FieldGroup>
    </form>
  );
}
