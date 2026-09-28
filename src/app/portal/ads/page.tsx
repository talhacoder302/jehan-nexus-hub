import { ChartColumn } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState, PageTitle } from "@/components/app-shell/page-header";
import { CampaignTable } from "@/components/portal/campaign-table";
import { KpiTiles, type KpiDef } from "@/components/portal/kpi-tiles";
import { MetricChart, type MetricFormat } from "@/components/portal/metric-chart";
import { RangeFilter } from "@/components/portal/range-filter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DAY_MS, parseRangeParams, rangeDays, toIsoDay } from "@/lib/date-range";
import { formatDate } from "@/lib/format";
import {
  getCampaignRows,
  getDailySeries,
  getKpiComparison,
  lastInsightDate,
  type DailyPoint,
} from "@/server/insights";
import { requirePortalContext } from "@/server/portal";

export const metadata: Metadata = { title: "Ads performance" };

const KPIS: KpiDef[] = [
  { key: "spend", label: "Spend", format: "money" },
  { key: "impressions", label: "Impressions", format: "compact" },
  { key: "clicks", label: "Clicks", format: "int" },
  { key: "ctr", label: "CTR", format: "pct" },
  { key: "roas", label: "ROAS", format: "roas" },
];

const CHARTS: {
  key: keyof DailyPoint;
  title: string;
  description: string;
  format: MetricFormat;
  kind: "area" | "bar" | "line";
}[] = [
  {
    key: "spend",
    title: "Spend",
    description: "Daily amount spent",
    format: "money",
    kind: "area",
  },
  { key: "clicks", title: "Clicks", description: "Daily link clicks", format: "int", kind: "bar" },
  { key: "ctr", title: "CTR", description: "Clicks ÷ impressions", format: "pct", kind: "line" },
  {
    key: "roas",
    title: "ROAS",
    description: "Purchase value ÷ spend",
    format: "roas",
    kind: "line",
  },
];

export default async function AdsPerformancePage(props: PageProps<"/portal/ads">) {
  const ctx = await requirePortalContext();
  const { range, preset } = parseRangeParams(await props.searchParams);
  const [kpis, series, campaigns, lastSync] = await Promise.all([
    getKpiComparison(ctx.clientId, range),
    getDailySeries(ctx.clientId, range),
    getCampaignRows(ctx.clientId, range),
    lastInsightDate(ctx.clientId),
  ]);
  const days = rangeDays(range);
  const toInclusive = toIsoDay(new Date(range.to.getTime() - DAY_MS));

  return (
    <div className="space-y-6">
      <PageTitle
        title="Ads performance"
        description={
          <>
            Meta Ads results for {ctx.client.name}
            {lastSync
              ? ` · data through ${formatDate(`${lastSync}T00:00:00Z`, { dateStyle: "medium", timeZone: "UTC" })}`
              : ""}
          </>
        }
      />
      <RangeFilter
        key={`${toIsoDay(range.from)}_${toInclusive}`}
        preset={preset}
        from={toIsoDay(range.from)}
        to={toInclusive}
      />

      {campaigns.length === 0 ? (
        <EmptyState
          icon={<ChartColumn />}
          title="No ad data for this period"
          description="Try a different date range. If your ad accounts were connected recently, data appears after the next daily sync."
        />
      ) : (
        <>
          <KpiTiles
            current={kpis.current}
            change={kpis.change}
            periodLabel={`vs prior ${days}d`}
            kpis={KPIS}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            {CHARTS.map((c) => (
              <Card key={c.key}>
                <CardHeader>
                  <CardTitle>{c.title}</CardTitle>
                  <CardDescription>{c.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <MetricChart
                    data={series.map((d) => ({ date: d.date, value: Number(d[c.key]) }))}
                    label={c.title}
                    format={c.format}
                    kind={c.kind}
                    height={220}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="gap-0 pb-0">
            <CardHeader className="pb-4">
              <CardTitle>Campaigns</CardTitle>
              <CardDescription>
                Click a column to sort. Totals recompute ratios from summed values.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <CampaignTable rows={campaigns} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
