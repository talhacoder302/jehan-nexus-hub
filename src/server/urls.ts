import "server-only";
import { serverEnv } from "@/lib/env";

/** Absolute base URL for links in emails and reports. */
export function siteUrl(): string {
  const env = serverEnv();
  return (env.AUTH_URL ?? env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
