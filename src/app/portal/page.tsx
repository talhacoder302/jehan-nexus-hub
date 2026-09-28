import { ArrowRight, CalendarCheck, ClipboardCheck } from "lucide-react";
import { Types } from "mongoose";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageTitle } from "@/components/app-shell/page-header";
import { ActivityFeed } from "@/components/portal/activity-feed";
import { KpiTiles } from "@/components/portal/kpi-tiles";
import { MetricChart } from "@/components/portal/metric-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { lastNDays } from "@/lib/date-range";
import { formatDateTime } from "@/lib/format";
import { listActivity } from "@/server/activity";
import { getDailySeries, getKpiComparison } from "@/server/insights";
import { requirePortalContext } from "@/server/portal";
import { listPostsByStatus } from "@/server/posts";

export const metadata: Metadata = { title: "Dashboard" };

export default async function PortalDashboardPage() {
  const ctx = await requirePortalContext();
  const range = lastNDays(30);
  const [kpis, series, pending, activity] = await Promise.all([
    getKpiComparison(ctx.clientId, range),
    getDailySeries(ctx.clientId, range),
    listPostsByStatus(ctx.clientId, ["pending_approval"], 5),
    listActivity({ clientIds: [new Types.ObjectId(ctx.clientId)], limit: 8, portal: true }),
  ]);

  return (
    <div className="space-y-6">
      <PageTitle
        title={`Welcome back, ${ctx.user.name.split(" ")[0]}`}
        description={`${ctx.client.name} · Last 30 days`}
        actions={
          <Button asChild variant="outline">
            <Link href="/portal/ads">
              Full ads report <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        }
      />

      <KpiTiles current={kpis.current} change={kpis.change} periodLabel="vs prior 30d" />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Ad spend</CardTitle>
            <CardDescription>Daily spend across all campaigns, last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {kpis.current.spend > 0 ? (
              <MetricChart
                data={series.map((d) => ({ date: d.date, value: d.spend }))}
                label="Spend"
                format="money"
              />
            ) : (
              <EmptyState
                title="No ad data yet"
                description="Spend appears here once your Meta ad accounts are connected and synced."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="size-4 text-primary" /> Awaiting your approval
            </CardTitle>
            <CardDescription>
              {pending.length
                ? `${pending.length} post${pending.length > 1 ? "s" : ""} ready for review`
                : "Nothing to review"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pending.length ? (
              <ul className="divide-y">
                {pending.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/portal/posts/${p.id}`}
                      className="flex items-center justify-between gap-3 py-3 hover:text-primary"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{p.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatDateTime(p.scheduledAt)}
                        </span>
                      </span>
                      <ArrowRight className="size-4 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<CalendarCheck />}
                title="You're all caught up"
                description="New posts will appear here when they're ready for you."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed
            items={activity}
            emptyText="Activity on your posts and reports will show up here."
          />
        </CardContent>
      </Card>
    </div>
  );
}
