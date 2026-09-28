/** Pure helpers for aggregating ad insight rows. Shared by the dashboard, reports and tests. */

export interface InsightTotalsInput {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  conversions: number;
  /** Return on ad spend for the row; revenue is reconstructed as roas * spend. */
  roas: number;
}

export interface InsightTotals {
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

const round = (n: number, dp = 2) => (Number.isFinite(n) ? Math.round(n * 10 ** dp) / 10 ** dp : 0);
const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0);

export interface InsightSums {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

/** Derives ratio metrics from summed volumes (used by both JS and Mongo aggregations). */
export function totalsFromSums(s: InsightSums): InsightTotals {
  return {
    spend: round(s.spend),
    impressions: s.impressions,
    reach: s.reach,
    clicks: s.clicks,
    ctr: round(safeDiv(s.clicks, s.impressions) * 100),
    cpc: round(safeDiv(s.spend, s.clicks)),
    cpm: round(safeDiv(s.spend, s.impressions) * 1000),
    conversions: s.conversions,
    roas: round(safeDiv(s.revenue, s.spend)),
  };
}

/**
 * Sums volume metrics and recomputes ratios from the totals (averaging per-row ratios would be
 * wrong). Reach is summed as an approximation, since Meta's reach is not additive across days.
 */
export function summarizeInsights(rows: readonly InsightTotalsInput[]): InsightTotals {
  const sums: InsightSums = {
    spend: 0,
    impressions: 0,
    reach: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
  };
  for (const r of rows) {
    sums.spend += r.spend;
    sums.impressions += r.impressions;
    sums.reach += r.reach;
    sums.clicks += r.clicks;
    sums.conversions += r.conversions;
    sums.revenue += r.roas * r.spend;
  }
  return totalsFromSums(sums);
}

/** Percentage change from `previous` to `current`; null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return round(((current - previous) / previous) * 100, 1);
}
