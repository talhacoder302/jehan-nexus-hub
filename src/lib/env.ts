import { z } from "zod";

/**
 * Server environment. Core variables are required; every third-party integration is optional
 * and the matching feature degrades gracefully when its keys are missing (see `features`).
 *
 * Parsing is lazy so that `next build` can prerender marketing pages without a database.
 */
const optional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_URL: optional,
  AUTH_GOOGLE_ID: optional,
  AUTH_GOOGLE_SECRET: optional,
  AWS_REGION: optional,
  AWS_ACCESS_KEY_ID: optional,
  AWS_SECRET_ACCESS_KEY: optional,
  AWS_S3_BUCKET: optional,
  RESEND_API_KEY: optional,
  EMAIL_FROM: optional,
  ADMIN_NOTIFY_EMAIL: optional,
  PUSHER_APP_ID: optional,
  PUSHER_KEY: optional,
  PUSHER_SECRET: optional,
  PUSHER_CLUSTER: optional,
  META_API_VERSION: z
    .string()
    .trim()
    .regex(/^v\d+\.\d+$/, "META_API_VERSION must look like v24.0")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  META_SYSTEM_USER_TOKEN: optional,
  META_APP_ID: optional,
  META_APP_SECRET: optional,
  CRON_SECRET: optional,
  NEXT_PUBLIC_SITE_URL: optional,
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid environment variables:\n${issues.join("\n")}`);
  }
  cached = parsed.data;
  return cached;
}

/** Which optional integrations are configured. Safe to call on the server only. */
export function features() {
  const e = serverEnv();
  return {
    google: Boolean(e.AUTH_GOOGLE_ID && e.AUTH_GOOGLE_SECRET),
    s3: Boolean(e.AWS_REGION && e.AWS_ACCESS_KEY_ID && e.AWS_SECRET_ACCESS_KEY && e.AWS_S3_BUCKET),
    resend: Boolean(e.RESEND_API_KEY && e.EMAIL_FROM),
    pusher: Boolean(e.PUSHER_APP_ID && e.PUSHER_KEY && e.PUSHER_SECRET && e.PUSHER_CLUSTER),
    meta: Boolean(e.META_SYSTEM_USER_TOKEN),
    cron: Boolean(e.CRON_SECRET),
  };
}

export type Features = ReturnType<typeof features>;

/**
 * Public (browser-safe) values. Each NEXT_PUBLIC_ variable must be referenced literally so
 * Next.js can inline it at build time.
 */
export const publicEnv = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  pusherKey: process.env.NEXT_PUBLIC_PUSHER_KEY || undefined,
  pusherCluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || undefined,
} as const;
