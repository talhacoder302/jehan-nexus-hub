import { AlarmClock, ClipboardCheck, DollarSign, Inbox } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MetaNotConnectedBanner } from "@/components/admin/meta-banner";
import { PageTitle } from "@/components/app-shell/page-header";
import { ActivityFeed } from "@/components/portal/activity-feed";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listActivity } from "@/server/activity";
import { getOverview } from "@/server/overview";
import { requireStaffPage } from "@/server/permissions";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  const user = await requireStaffPage();
  const overview = await getOverview(user);
  const activity = await listActivity({ clientIds: overview.clientIds, limit: 12 });
  const clientNames = new Map(overview.clients.map((c) => [c.id, c.name]));

  const tiles = [
    {
      label: "Ad spend (30d)",
      value: fmt.money(overview.totals.spend),
      icon: DollarSign,
      href: undefined,
    },
    {
      label: "Pending approvals",
      value: String(overview.pendingApprovals),
      icon: ClipboardCheck,
      href: "/admin/posts?status=pending_approval",
    },
    {
      label: "Overdue posts",
      value: String(overview.overdue),
      icon: AlarmClock,
      href: "/admin/posts",
      alert: overview.overdue > 0,
    },
    {
      label: "New leads",
      value: String(overview.newLeads),
      icon: Inbox,
      href: "/admin/leads?status=new",
    },
  ];

  return (
    <div className="space-y-6">
      <PageTitle
        title="Overview"
        description={`${overview.activeClients} active client${overview.activeClients === 1 ? "" : "s"}${user.role === "manager" ? " assigned to you" : ""}`}
      />
      {!overview.metaConnected ? <MetaNotConnectedBanner /> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon, href, alert }) => {
          const body = (
            <Card className={cn("gap-1 p-4 transition-colors", href && "hover:border-primary/40")}>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className={cn("size-4", alert && "text-destructive")} aria-hidden="true" />{" "}
                {label}
              </p>
              <p className="font-heading text-2xl font-semibold tabular-nums">{value}</p>
              {alert ? (
                <p className="text-xs text-destructive">
                  Past their scheduled time without approval
                </p>
              ) : null}
            </Card>
          );
          return href ? (
            <Link key={label} href={href}>
              {body}
            </Link>
          ) : (
            <div key={label}>{body}</div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="gap-0 pb-0 xl:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle>Clients</CardTitle>
            <CardDescription>Last 30 days of Meta Ads, plus open content work</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Client</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">ROAS</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="pr-6 text-right">Overdue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No clients yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  overview.clients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="pl-6">
                        <Link
                          href={`/admin/clients/${c.id}`}
                          className="font-medium hover:underline"
                        >
                          {c.name}
                        </Link>
                        {c.status !== "active" ? (
                          <span className="ml-2 text-xs text-muted-foreground capitalize">
                            {c.status}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {c.totals ? fmt.money(c.totals.spend) : "—"}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums sm:table-cell">
                        {c.totals ? fmt.roas(c.totals.roas) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{c.pending}</TableCell>
                      <TableCell
                        className={cn(
                          "pr-6 text-right tabular-nums",
                          c.overdue && "font-semibold text-destructive",
                        )}
                      >
                        {c.overdue}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={activity} clientNames={clientNames} emptyText="No activity yet." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
