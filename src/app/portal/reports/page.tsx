import { Download, FileText } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState, PageTitle } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmt, formatDate, monthLabel } from "@/lib/format";
import { requirePortalContext } from "@/server/portal";
import { listReports } from "@/server/reports";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const ctx = await requirePortalContext();
  const reports = await listReports(ctx.clientId);

  return (
    <>
      <PageTitle
        title="Monthly reports"
        description="A PDF summary of ad performance and published content, generated on the 1st of each month."
      />
      {reports.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="No reports yet"
          description="Your first monthly report will appear here at the start of next month."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Clicks</TableHead>
                <TableHead className="hidden text-right md:table-cell">ROAS</TableHead>
                <TableHead className="hidden text-right md:table-cell">Posts published</TableHead>
                <TableHead className="hidden lg:table-cell">Generated</TableHead>
                <TableHead className="w-32">
                  <span className="sr-only">Download</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{monthLabel(r.month)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmt.money(r.summary.spend)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {fmt.int(r.summary.clicks)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {fmt.roas(r.summary.roas)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {r.summary.postsPublished}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {formatDate(r.generatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <a href={`/api/reports/${r.id}/pdf`} download>
                        <Download /> PDF
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
