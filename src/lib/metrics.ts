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

/**
 * Sums volume metrics and recomputes ratios from the totals (averaging per-row ratios would be
 * wrong). Reach is summed as an approximation, since Meta's reach is not additive across days.
 */
export function summarizeInsights(rows: readonly InsightTotalsInput[]): InsightTotals {
  let spend = 0;
  let impressions = 0;
  let reach = 0;
  let clicks = 0;
  let conversions = 0;
  let revenue = 0;
  for (const r of rows) {
    spend += r.spend;
    impressions += r.impressions;
    reach += r.reach;
    clicks += r.clicks;
    conversions += r.conversions;
    revenue += r.roas * r.spend;
  }
  return {
    spend: round(spend),
    impressions,
    reach,
    clicks,
    ctr: round(safeDiv(clicks, impressions) * 100),
    cpc: round(safeDiv(spend, clicks)),
    cpm: round(safeDiv(spend, impressions) * 1000),
    conversions,
    roas: round(safeDiv(revenue, spend)),
  };
}

/** Percentage change from `previous` to `current`; null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return round(((current - previous) / previous) * 100, 1);
}
