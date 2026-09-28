import { z } from "zod";
import { CLIENT_PLANS, CLIENT_STATUSES } from "@/lib/constants";
import { emailField, objectId } from "./auth";

const hex = z
  .string()
  .trim()
  .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, "Use a hex color like #4f46e5")
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const numericId = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{5,30}$/, `${label} must be numeric`)
    .optional()
    .or(z.literal("").transform(() => undefined));

/** Accepts "act_123, 456" in any mix of commas/newlines; stores bare numeric ids. */
export const adAccountIdsSchema = z
  .string()
  .transform((raw) =>
    raw
      .split(/[\s,]+/)
      .map((s) => s.trim().replace(/^act_/i, ""))
      .filter(Boolean),
  )
  .pipe(
    z
      .array(
        z.string().regex(/^\d{5,30}$/, "Ad account ids must be numeric (with or without act_)"),
      )
      .max(20, "Up to 20 ad accounts per client"),
  )
  .transform((ids) => [...new Set(ids)]);

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const clientFormSchema = z.object({
  name: z.string().trim().min(2, "Enter the client name").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only")
    .max(60),
  logo: z
    .url("Enter a valid URL")
    .refine((u) => u.startsWith("https://"), "Logo must be served over https")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  industry: optionalText(80),
  contactEmail: z
    .literal("")
    .transform(() => undefined)
    .or(emailField())
    .optional(),
  brandPrimary: hex,
  brandSecondary: hex,
  metaAdAccountIds: adAccountIdsSchema,
  facebookPageId: numericId("Facebook Page ID"),
  instagramAccountId: numericId("Instagram account ID"),
  assignedManagers: z.array(objectId).max(20),
  plan: z.enum(CLIENT_PLANS),
  status: z.enum(CLIENT_STATUSES),
});

export type ClientFormInput = z.input<typeof clientFormSchema>;
export type ClientFormValues = z.output<typeof clientFormSchema>;
