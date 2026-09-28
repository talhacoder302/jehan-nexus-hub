import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Report, type IReportSummary } from "@/models";

export interface ReportListItem {
  id: string;
  month: string;
  summary: IReportSummary;
  generatedAt: string;
  sentAt: string | null;
}

/** Reports for one (already authorized) client, newest first. */
export async function listReports(clientId: string): Promise<ReportListItem[]> {
  await connectDB();
  const reports = await Report.find({ clientId: new Types.ObjectId(clientId) })
    .sort({ month: -1 })
    .lean();
  return reports.map((r) => ({
    id: r._id.toString(),
    month: r.month,
    summary: r.summary,
    generatedAt: r.generatedAt.toISOString(),
    sentAt: r.sentAt?.toISOString() ?? null,
  }));
}
