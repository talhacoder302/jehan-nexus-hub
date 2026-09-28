import { z } from "zod";
import { BUDGET_OPTIONS, LEAD_STATUSES, SERVICE_OPTIONS } from "@/lib/constants";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.email("Please enter a valid email").trim().toLowerCase().max(200),
  phone: optionalText(40),
  company: optionalText(120),
  service: z.enum(SERVICE_OPTIONS, { error: "Choose a service" }),
  budget: z.enum(BUDGET_OPTIONS).optional(),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more (at least 10 characters)")
    .max(5000, "Please keep it under 5000 characters"),
  /** Honeypot: hidden from humans. Any value marks the submission as spam. */
  website: z.string().max(500).optional(),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactValues = z.output<typeof contactSchema>;

export const leadStatusSchema = z.object({
  leadId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id"),
  status: z.enum(LEAD_STATUSES),
});

export const SERVICE_LABELS: Record<(typeof SERVICE_OPTIONS)[number], string> = {
  "web-development": "Web Development",
  "social-media-management": "Social Media Management",
  "meta-ads": "Meta Ads",
  "not-sure": "Not sure yet",
};

export const BUDGET_LABELS: Record<(typeof BUDGET_OPTIONS)[number], string> = {
  "under-1k": "Under $1k / month",
  "1k-3k": "$1k – $3k / month",
  "3k-10k": "$3k – $10k / month",
  "10k-plus": "$10k+ / month",
};
