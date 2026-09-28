/**
 * Pure mapping from Meta Marketing API campaign insight rows to AdInsightDaily documents.
 * Kept free of server imports so it is unit-tested directly.
 */

export interface MetaActionStat {
  action_type: string;
  value: string;
}

/** Subset of fields requested from /act_{id}/insights at level=campaign, time_increment=1. */
export interface MetaInsightRow {
  campaign_id?: string;
  campaign_name?: string;
  date_start: string;
  date_stop?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: MetaActionStat[];
  action_values?: MetaActionStat[];
  purchase_roas?: MetaActionStat[];
}

export interface MappedInsight {
  adAccountId: string;
  campaignId: string;
  campaignName: string;
  date: Date;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  roas: number;
}

/**
 * Conversion action types in priority order. Only the first one present is counted, because
 * Meta reports overlapping types (e.g. `purchase` and `omni_purchase`) for the same event.
 */
export const CONVERSION_ACTION_PRIORITY = [
  "omni_purchase",
  "purchase",
  "offsite_conversion.fb_pixel_purchase",
  "onsite_web_purchase",
  "lead",
  "onsite_conversion.lead_grouped",
  "offsite_conversion.fb_pixel_lead",
  "complete_registration",
  "offsite_conversion.fb_pixel_complete_registration",
] as const;

const PURCHASE_VALUE_PRIORITY = [
  "omni_purchase",
  "purchase",
  "offsite_conversion.fb_pixel_purchase",
] as const;

/** Parses Meta's numeric strings; anything invalid, negative or missing becomes 0. */
export function num(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function firstByPriority(
  stats: MetaActionStat[] | undefined,
  priority: readonly string[],
): number | null {
  if (!stats?.length) return null;
  for (const type of priority) {
    const hit = stats.find((s) => s.action_type === type);
    if (hit) return num(hit.value);
  }
  return null;
}

export function extractConversions(actions: MetaActionStat[] | undefined): number {
  return firstByPriority(actions, CONVERSION_ACTION_PRIORITY) ?? 0;
}

/** Prefers Meta's own purchase_roas; falls back to purchase value ÷ spend. */
export function extractRoas(
  row: Pick<MetaInsightRow, "purchase_roas" | "action_values" | "spend">,
): number {
  const reported =
    firstByPriority(row.purchase_roas, PURCHASE_VALUE_PRIORITY) ??
    (row.purchase_roas?.[0] ? num(row.purchase_roas[0].value) : null);
  if (reported !== null) return round(reported);
  const value = firstByPriority(row.action_values, PURCHASE_VALUE_PRIORITY);
  const spend = num(row.spend);
  return value !== null && spend > 0 ? round(value / spend) : 0;
}

const round = (n: number, dp = 4) => Math.round(n * 10 ** dp) / 10 ** dp;

/** "act_123" | "123" → "123" */
export function normalizeAdAccountId(id: string): string {
  return id.trim().replace(/^act_/i, "");
}

/** Maps one API row. Returns null for rows without a campaign or a valid date. */
export function mapInsightRow(row: MetaInsightRow, adAccountId: string): MappedInsight | null {
  if (!row.campaign_id || !/^\d{4}-\d{2}-\d{2}$/.test(row.date_start ?? "")) return null;
  const date = new Date(`${row.date_start}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;

  const spend = num(row.spend);
  const impressions = Math.round(num(row.impressions));
  const clicks = Math.round(num(row.clicks));
  return {
    adAccountId: normalizeAdAccountId(adAccountId),
    campaignId: row.campaign_id,
    campaignName: row.campaign_name ?? "",
    date,
    spend: round(spend, 2),
    impressions,
    reach: Math.round(num(row.reach)),
    clicks,
    // Recompute when Meta omits a ratio (e.g. zero-impression days) so values stay consistent.
    ctr:
      row.ctr !== undefined
        ? round(num(row.ctr))
        : impressions
          ? round((clicks / impressions) * 100)
          : 0,
    cpc: row.cpc !== undefined ? round(num(row.cpc)) : clicks ? round(spend / clicks) : 0,
    cpm:
      row.cpm !== undefined
        ? round(num(row.cpm))
        : impressions
          ? round((spend / impressions) * 1000)
          : 0,
    conversions: extractConversions(row.actions),
    roas: extractRoas(row),
  };
}

/** Meta error codes that mean "slow down and retry". */
export const META_RATE_LIMIT_CODES = new Set([
  4, 17, 32, 613, 80000, 80001, 80002, 80003, 80004, 80005, 80006, 80008, 80009, 80014,
]);
/** Transient server-side errors worth retrying. */
export const META_TRANSIENT_CODES = new Set([1, 2]);

export function isRetryableMetaError(code: number | undefined, httpStatus: number): boolean {
  if (code !== undefined && (META_RATE_LIMIT_CODES.has(code) || META_TRANSIENT_CODES.has(code)))
    return true;
  return httpStatus === 429 || httpStatus >= 500;
}

/** Exponential backoff with full jitter, capped. */
export function backoffMs(
  attempt: number,
  baseMs = 1000,
  capMs = 20_000,
  random = Math.random,
): number {
  const exp = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.round(exp / 2 + random() * (exp / 2));
}
