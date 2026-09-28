import { after, NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { cronAuthHeader, rejectUnauthorizedCron } from "@/server/cron";
import { isMetaConfigured } from "@/server/meta";
import { syncBatch } from "@/server/meta-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const querySchema = z.object({
  cursor: z.coerce.number().int().min(0).default(0),
  days: z.coerce.number().int().min(1).max(90).default(3),
  batch: z.coerce.number().int().min(1).max(20).default(5),
});

/**
 * Daily Meta Ads Insights sync (Vercel Cron, 02:00 UTC). Processes a small batch of ad accounts
 * per invocation and chains the next batch after responding, so each run stays well inside the
 * serverless time limit. `?days=` (max 90) backfills a longer window.
 */
export async function GET(request: NextRequest) {
  const denied = rejectUnauthorizedCron(request);
  if (denied) return denied;

  if (!isMetaConfigured()) {
    return NextResponse.json({
      ok: true,
      skipped: "Meta is not configured (META_SYSTEM_USER_TOKEN missing)",
    });
  }

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  const { cursor, days, batch } = parsed.data;

  const result = await syncBatch({ cursor, batchSize: batch, days, budgetMs: 45_000 });

  if (result.nextCursor !== null) {
    const next = new URL(request.nextUrl);
    next.search = new URLSearchParams({
      cursor: String(result.nextCursor),
      days: String(days),
      batch: String(batch),
    }).toString();
    after(async () => {
      try {
        await fetch(next, { headers: cronAuthHeader(), cache: "no-store" });
      } catch (error) {
        console.error("[meta-sync] failed to chain next batch", error);
      }
    });
  }

  return NextResponse.json({
    ok: true,
    since: result.since,
    until: result.until,
    total: result.total,
    nextCursor: result.nextCursor,
    accounts: result.processed.map((p) => ({
      client: p.clientName,
      adAccountId: p.adAccountId,
      ok: p.ok,
      rows: p.rows,
      error: p.error,
    })),
  });
}
