import "server-only";
import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";

/**
 * Verifies the `Authorization: Bearer <CRON_SECRET>` header that Vercel Cron sends. Returns an
 * error response to send back, or null when the request is authorized.
 */
export function rejectUnauthorizedCron(request: NextRequest): NextResponse | null {
  const secret = serverEnv().CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function cronAuthHeader(): Record<string, string> {
  return { Authorization: `Bearer ${serverEnv().CRON_SECRET}` };
}
