import "server-only";
import { Types, type PipelineStage } from "mongoose";
import { eachDay, previousPeriod, toIsoDay, type DateRange } from "@/lib/date-range";
import { connectDB } from "@/lib/db";
import { percentChange, totalsFromSums, type InsightSums, type InsightTotals } from "@/lib/metrics";
import { AdInsightDaily } from "@/models";

/**
 * All functions take a clientId that the caller has already authorized (see
 * resolvePortalClient / assertClientAccess); every query is filtered by it.
 */

const sumFields = {
  spend: { $sum: "$spend" },
  impressions: { $sum: "$impressions" },
  reach: { $sum: "$reach" },
  clicks: { $sum: "$clicks" },
  conversions: { $sum: "$conversions" },
  revenue: { $sum: { $multiply: ["$roas", "$spend"] } },
} as const;

type SumsRow = InsightSums & { _id: unknown };

function match(clientIds: Types.ObjectId[], range: DateRange): PipelineStage.Match {
  return {
    $match: {
      clientId: clientIds.length === 1 ? clientIds[0] : { $in: clientIds },
      date: { $gte: range.from, $lt: range.to },
    },
  };
}

const EMPTY: InsightSums = {
  spend: 0,
  impressions: 0,
  reach: 0,
  clicks: 0,
  conversions: 0,
  revenue: 0,
};

export async function getTotals(
  clientIds: string[] | string,
  range: DateRange,
): Promise<InsightTotals> {
  await connectDB();
  const ids = (Array.isArray(clientIds) ? clientIds : [clientIds]).map(
    (id) => new Types.ObjectId(id),
  );
  if (!ids.length) return totalsFromSums(EMPTY);
  const [row] = await AdInsightDaily.aggregate<SumsRow>([
    match(ids, range),
    { $group: { _id: null, ...sumFields } },
  ]);
  return totalsFromSums(row ?? EMPTY);
}

export type KpiKey = "spend" | "impressions" | "reach" | "clicks" | "ctr" | "roas";

export interface KpiComparison {
  current: InsightTotals;
  previous: InsightTotals;
  change: Record<KpiKey, number | null>;
}

export async function getKpiComparison(clientId: string, range: DateRange): Promise<KpiComparison> {
  const [current, previous] = await Promise.all([
    getTotals(clientId, range),
    getTotals(clientId, previousPeriod(range)),
  ]);
  const keys: KpiKey[] = ["spend", "impressions", "reach", "clicks", "ctr", "roas"];
  const change = Object.fromEntries(
    keys.map((k) => [k, percentChange(current[k], previous[k])]),
  ) as Record<KpiKey, number | null>;
  return { current, previous, change };
}

export interface DailyPoint {
  date: string;
  spend: number;
  clicks: number;
  impressions: number;
  ctr: number;
  roas: number;
  conversions: number;
}

/** One point per day in the range; days without data are zero-filled so charts don't skip. */
export async function getDailySeries(clientId: string, range: DateRange): Promise<DailyPoint[]> {
  await connectDB();
  const rows = await AdInsightDaily.aggregate<SumsRow & { _id: Date }>([
    match([new Types.ObjectId(clientId)], range),
    { $group: { _id: "$date", ...sumFields } },
  ]);
  const byDay = new Map(rows.map((r) => [toIsoDay(r._id), r]));
  return eachDay(range).map((date) => {
    const t = totalsFromSums(byDay.get(date) ?? EMPTY);
    return {
      date,
      spend: t.spend,
      clicks: t.clicks,
      impressions: t.impressions,
      ctr: t.ctr,
      roas: t.roas,
      conversions: t.conversions,
    };
  });
}

export interface CampaignRow extends InsightTotals {
  campaignId: string;
  campaignName: string;
  adAccountId: string;
}

export async function getCampaignRows(clientId: string, range: DateRange): Promise<CampaignRow[]> {
  await connectDB();
  const rows = await AdInsightDaily.aggregate<
    SumsRow & { _id: { campaignId: string; adAccountId: string }; campaignName: string }
  >([
    match([new Types.ObjectId(clientId)], range),
    { $sort: { date: -1 } },
    {
      $group: {
        _id: { campaignId: "$campaignId", adAccountId: "$adAccountId" },
        campaignName: { $first: "$campaignName" },
        ...sumFields,
      },
    },
    { $sort: { spend: -1 } },
  ]);
  return rows.map((r) => ({
    campaignId: r._id.campaignId,
    adAccountId: r._id.adAccountId,
    campaignName: r.campaignName || r._id.campaignId,
    ...totalsFromSums(r),
  }));
}

/** Total spend per client over a range, for the admin overview. */
export async function getSpendByClient(
  clientIds: Types.ObjectId[],
  range: DateRange,
): Promise<Map<string, InsightTotals>> {
  await connectDB();
  if (!clientIds.length) return new Map();
  const rows = await AdInsightDaily.aggregate<SumsRow & { _id: Types.ObjectId }>([
    match(clientIds, range),
    { $group: { _id: "$clientId", ...sumFields } },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), totalsFromSums(r)]));
}

export async function lastInsightDate(clientId: string): Promise<string | null> {
  await connectDB();
  const row = await AdInsightDaily.findOne({ clientId: new Types.ObjectId(clientId) }, { date: 1 })
    .sort({ date: -1 })
    .lean();
  return row ? toIsoDay(row.date) : null;
}
