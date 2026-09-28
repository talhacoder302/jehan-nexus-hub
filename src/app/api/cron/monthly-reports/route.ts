import { after, NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { cronAuthHeader, rejectUnauthorizedCron } from "@/server/cron";
import {
  generateReport,
  listReportableClients,
  MONTH_RE,
  previousMonth,
  reportAlreadySent,
  sendReport,
} from "@/server/reports";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const querySchema = z.object({
  month: z.string().regex(MONTH_RE).optional(),
  cursor: z.coerce.number().int().min(0).default(0),
  batch: z.coerce.number().int().min(1).max(10).default(3),
  force: z.enum(["1"]).optional(),
});

/**
 * Monthly reports (Vercel Cron, 03:00 UTC on the 1st). Generates last month's report for each
 * active client and emails their users a download link. Idempotent: clients whose report was
 * already sent are skipped unless `?force=1`. Batches chain like the Meta sync.
 */
export async function GET(request: NextRequest) {
  const denied = rejectUnauthorizedCron(request);
  if (denied) return denied;

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  const { cursor, batch, force } = parsed.data;
  const month = parsed.data.month ?? previousMonth();

  const started = Date.now();
  const clients = await listReportableClients();
  const results: { clientId: string; status: "sent" | "skipped" | "failed"; error?: string }[] = [];
  let index = cursor;
  for (; index < clients.length && index < cursor + batch; index++) {
    if (results.length > 0 && Date.now() - started > 40_000) break;
    const clientId = clients[index]!;
    try {
      if (!force && (await reportAlreadySent(clientId, month))) {
        results.push({ clientId, status: "skipped" });
        continue;
      }
      const { id } = await generateReport(clientId, month, null);
      await sendReport(id, null);
      results.push({ clientId, status: "sent" });
    } catch (error) {
      console.error(`[monthly-reports] client ${clientId} failed`, error);
      results.push({
        clientId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const nextCursor = index < clients.length ? index : null;
  if (nextCursor !== null) {
    const next = new URL(request.nextUrl);
    next.search = new URLSearchParams({
      month,
      cursor: String(nextCursor),
      batch: String(batch),
      ...(force ? { force } : {}),
    }).toString();
    after(async () => {
      try {
        await fetch(next, { headers: cronAuthHeader(), cache: "no-store" });
      } catch (error) {
        console.error("[monthly-reports] failed to chain next batch", error);
      }
    });
  }

  return NextResponse.json({ ok: true, month, total: clients.length, nextCursor, results });
}
