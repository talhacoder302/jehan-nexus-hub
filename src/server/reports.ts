import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { features } from "@/lib/env";
import { monthLabel } from "@/lib/format";
import { percentChange, type InsightTotals } from "@/lib/metrics";
import { Client, Post, Report, type IReportSummary } from "@/models";
import { logActivity } from "./activity";
import { getCampaignRows, getDailySeries, getTotals } from "./insights";
import { clientUserIds, notifyUsers } from "./notifications";
import { AuthorizationError, assertClientAccess, type SessionUser } from "./permissions";
import { renderReportPdf, type ReportData } from "./report-pdf";
import { putPrivateObject, signedDownloadUrl } from "./s3";

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

/* ---------------------------- month helpers ---------------------------- */

export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return { from: new Date(Date.UTC(y, m - 1, 1)), to: new Date(Date.UTC(y, m, 1)) };
}

export function previousMonth(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return d.toISOString().slice(0, 7);
}

function shiftMonth(month: string, delta: number): string {
  const { from } = monthRange(month);
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + delta, 1))
    .toISOString()
    .slice(0, 7);
}

/* ------------------------------ generation ----------------------------- */

/** Fetches the client logo for the PDF (PNG/JPEG only, small, short timeout). Failures are ignored. */
async function loadLogo(url: string | undefined): Promise<ReportData["client"]["logo"]> {
  if (!url?.startsWith("https://")) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/image\/(png|jpe?g)/.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 2 * 1024 * 1024) return null;
    return { data: buf, format: type.includes("png") ? "png" : "jpg" };
  } catch {
    return null;
  }
}

async function buildReportData(clientId: string, month: string): Promise<ReportData> {
  const client = await Client.findById(clientId).lean();
  if (!client) throw new AuthorizationError("Client not found.", 404);
  const range = monthRange(month);
  const prev = monthRange(shiftMonth(month, -1));
  const cid = new Types.ObjectId(clientId);

  const [totals, prevTotals, daily, campaigns, postsPublished, postsApproved, logo] =
    await Promise.all([
      getTotals(clientId, range),
      getTotals(clientId, prev),
      getDailySeries(clientId, range),
      getCampaignRows(clientId, range),
      Post.countDocuments({
        clientId: cid,
        status: "published",
        scheduledAt: { $gte: range.from, $lt: range.to },
      }),
      Post.countDocuments({ clientId: cid, approvedAt: { $gte: range.from, $lt: range.to } }),
      loadLogo(client.logo),
    ]);

  const keys = Object.keys(totals) as (keyof InsightTotals)[];
  return {
    client: { name: client.name, brandColor: client.brandColors?.primary ?? null, logo },
    month,
    totals,
    change: Object.fromEntries(keys.map((k) => [k, percentChange(totals[k], prevTotals[k])])),
    daily: daily.map((d) => ({ date: d.date, spend: d.spend })),
    campaigns: campaigns.slice(0, 8),
    postsPublished,
    postsApproved,
    generatedAt: new Date(),
  };
}

/**
 * Builds (or rebuilds) a client's report for `month`. Uploads the PDF to S3 when configured;
 * otherwise only the summary is stored and the PDF is rendered on demand at download time.
 */
export async function generateReport(
  clientId: string,
  month: string,
  actorId: string | null,
): Promise<{ id: string; stored: boolean }> {
  if (!MONTH_RE.test(month)) throw new Error("Invalid month");
  await connectDB();
  const data = await buildReportData(clientId, month);
  const summary: IReportSummary = { ...data.totals, postsPublished: data.postsPublished };

  const report = await Report.findOneAndUpdate(
    { clientId: new Types.ObjectId(clientId), month },
    { $set: { summary, generatedAt: data.generatedAt } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).orFail();

  let stored = false;
  if (features().s3) {
    const pdf = await renderReportPdf(data);
    const key = await putPrivateObject(
      `reports/${clientId}/${month}-${report._id.toString()}.pdf`,
      pdf,
      "application/pdf",
    );
    report.pdfUrl = key;
    await report.save();
    stored = true;
  }

  await logActivity({
    actorId,
    clientId,
    action: "report.generated",
    entity: "report",
    entityId: report._id,
    meta: { month },
  });
  return { id: report._id.toString(), stored };
}

/** Notifies and emails the client's users that the report is ready, then marks it sent. */
export async function sendReport(reportId: string, actorId: string | null): Promise<number> {
  await connectDB();
  const report = await Report.findById(reportId);
  if (!report) throw new AuthorizationError("Report not found.", 404);
  const recipients = await clientUserIds(report.clientId);
  const label = monthLabel(report.month);
  await notifyUsers(recipients, {
    type: "report_ready",
    title: `Your ${label} report is ready`,
    link: "/portal/reports",
    email: {
      subject: `Your ${label} performance report`,
      body: `Your monthly report for ${label} is ready: spend, results, top campaigns and published content in one PDF. Sign in to your portal to download it.`,
      cta: "Download report",
    },
  });
  report.sentAt = new Date();
  await report.save();
  await logActivity({
    actorId,
    clientId: report.clientId,
    action: "report.sent",
    entity: "report",
    entityId: report._id,
    meta: { month: report.month, recipients: recipients.length },
  });
  return recipients.length;
}

/** Generates on demand for staff (admin UI). */
export async function generateReportForUser(
  user: SessionUser,
  clientId: string,
  month: string,
  send: boolean,
) {
  if (user.role === "client") throw new AuthorizationError();
  await assertClientAccess(user, clientId);
  if (month > new Date().toISOString().slice(0, 7)) {
    throw new AuthorizationError(
      "Reports can only be generated for the current or past months.",
      403,
    );
  }
  const result = await generateReport(clientId, month, user.id);
  const recipients = send ? await sendReport(result.id, user.id) : 0;
  return { ...result, recipients };
}

/**
 * Resolves a download for the signed-in user: a short-lived S3 link when the PDF is stored,
 * otherwise a freshly rendered PDF.
 */
export async function getReportDownload(
  user: SessionUser,
  reportId: string,
): Promise<{ redirect: string } | { pdf: Buffer; fileName: string }> {
  if (!Types.ObjectId.isValid(reportId)) throw new AuthorizationError("Report not found.", 404);
  await connectDB();
  const report = await Report.findById(reportId).lean();
  if (!report) throw new AuthorizationError("Report not found.", 404);
  try {
    await assertClientAccess(user, report.clientId.toString());
  } catch {
    throw new AuthorizationError("Report not found.", 404);
  }
  const client = await Client.findById(report.clientId, { slug: 1 }).lean();
  const fileName = `${client?.slug ?? "report"}-${report.month}.pdf`;
  if (report.pdfUrl && features().s3) {
    return { redirect: await signedDownloadUrl(report.pdfUrl, fileName) };
  }
  const data = await buildReportData(report.clientId.toString(), report.month);
  return { pdf: await renderReportPdf(data), fileName };
}

/** Active clients, for the monthly cron. */
export async function listReportableClients(): Promise<string[]> {
  await connectDB();
  const clients = await Client.find({ status: "active" }, { _id: 1 }).sort({ _id: 1 }).lean();
  return clients.map((c) => c._id.toString());
}

export async function reportAlreadySent(clientId: string, month: string): Promise<boolean> {
  return !!(await Report.exists({
    clientId: new Types.ObjectId(clientId),
    month,
    sentAt: { $ne: null },
  }));
}
