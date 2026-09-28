import "server-only";
import { Types, type AnyBulkWriteOperation } from "mongoose";
import { DAY_MS, toIsoDay, utcMidnight } from "@/lib/date-range";
import { connectDB } from "@/lib/db";
import { mapInsightRow, type MappedInsight } from "@/lib/meta-mapper";
import { AdInsightDaily, Client, type IAdInsightDaily } from "@/models";
import { logActivity } from "./activity";
import { fetchCampaignInsights, MetaApiError } from "./meta";

export interface AccountRef {
  clientId: string;
  clientName: string;
  adAccountId: string;
}

export interface AccountResult extends AccountRef {
  ok: boolean;
  rows: number;
  error?: string;
}

export interface SyncBatchResult {
  processed: AccountResult[];
  total: number;
  nextCursor: number | null;
  since: string;
  until: string;
}

/** Every (client, ad account) pair for active clients, in a stable order for cursor paging. */
export async function listSyncAccounts(): Promise<AccountRef[]> {
  await connectDB();
  const clients = await Client.find(
    { status: "active", "metaAdAccountIds.0": { $exists: true } },
    { name: 1, metaAdAccountIds: 1 },
  )
    .sort({ _id: 1 })
    .lean();
  return clients.flatMap((c) =>
    c.metaAdAccountIds.map((adAccountId) => ({
      clientId: c._id.toString(),
      clientName: c.name,
      adAccountId,
    })),
  );
}

/** Upserts on the unique (adAccountId, campaignId, date) key so re-syncing is idempotent. */
export async function upsertInsights(clientId: string, rows: MappedInsight[]): Promise<number> {
  if (!rows.length) return 0;
  const cid = new Types.ObjectId(clientId);
  const ops: AnyBulkWriteOperation<IAdInsightDaily>[] = rows.map((r) => ({
    updateOne: {
      filter: { adAccountId: r.adAccountId, campaignId: r.campaignId, date: r.date },
      update: { $set: { ...r, clientId: cid } },
      upsert: true,
    },
  }));
  await AdInsightDaily.bulkWrite(ops, { ordered: false });
  return rows.length;
}

export async function syncAccount(
  account: AccountRef,
  since: string,
  until: string,
  deadline: number,
): Promise<AccountResult> {
  try {
    const raw = await fetchCampaignInsights(account.adAccountId, since, until, deadline);
    const mapped = raw
      .map((r) => mapInsightRow(r, account.adAccountId))
      .filter((r): r is MappedInsight => r !== null);
    const rows = await upsertInsights(account.clientId, mapped);
    return { ...account, ok: true, rows };
  } catch (error) {
    // Partial failure: record it and carry on with the other accounts.
    const message =
      error instanceof MetaApiError
        ? `Meta error ${error.code ?? error.status}: ${error.message}`
        : error instanceof Error
          ? error.message
          : "Unknown error";
    console.error(`[meta-sync] account ${account.adAccountId} failed: ${message}`);
    return { ...account, ok: false, rows: 0, error: message };
  }
}

/**
 * Syncs one batch of accounts starting at `cursor`. Stops early when the time budget runs out so
 * the caller can continue with `nextCursor` in a fresh invocation.
 */
export async function syncBatch(opts: {
  cursor: number;
  batchSize: number;
  days: number;
  budgetMs: number;
  now?: Date;
}): Promise<SyncBatchResult> {
  const started = Date.now();
  const deadline = started + opts.budgetMs;
  const today = utcMidnight(opts.now ?? new Date());
  // Meta revises recent days (attribution), so each run re-reads a short trailing window.
  const since = toIsoDay(new Date(today.getTime() - opts.days * DAY_MS));
  const until = toIsoDay(new Date(today.getTime() - DAY_MS));

  const accounts = await listSyncAccounts();
  const slice = accounts.slice(opts.cursor, opts.cursor + opts.batchSize);
  const processed: AccountResult[] = [];
  for (const account of slice) {
    // Leave headroom for at least one more full request before the platform limit.
    if (processed.length > 0 && Date.now() > deadline - 15_000) break;
    processed.push(await syncAccount(account, since, until, deadline));
  }

  const byClient = new Map<string, { rows: number; failed: number }>();
  for (const r of processed) {
    const agg = byClient.get(r.clientId) ?? { rows: 0, failed: 0 };
    agg.rows += r.rows;
    agg.failed += r.ok ? 0 : 1;
    byClient.set(r.clientId, agg);
  }
  for (const [clientId, agg] of byClient) {
    await logActivity({
      actorId: null,
      clientId,
      action: "insight.synced",
      entity: "insight",
      meta: { rows: agg.rows, failedAccounts: agg.failed, since, until },
    });
  }

  const next = opts.cursor + processed.length;
  return {
    processed,
    total: accounts.length,
    nextCursor: next < accounts.length ? next : null,
    since,
    until,
  };
}
