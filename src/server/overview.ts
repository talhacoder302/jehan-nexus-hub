import "server-only";
import type { Types } from "mongoose";
import { lastNDays } from "@/lib/date-range";
import { connectDB } from "@/lib/db";
import { features } from "@/lib/env";
import { summarizeInsights, type InsightTotals } from "@/lib/metrics";
import { Client, Post } from "@/models";
import { getSpendByClient } from "./insights";
import { countNewLeads } from "./leads";
import { visibleClientIds, type SessionUser } from "./permissions";

export interface OverviewClientRow {
  id: string;
  name: string;
  status: string;
  totals: InsightTotals | null;
  pending: number;
  overdue: number;
  adAccounts: number;
}

export interface Overview {
  totals: InsightTotals;
  pendingApprovals: number;
  overdue: number;
  newLeads: number;
  activeClients: number;
  metaConnected: boolean;
  clients: OverviewClientRow[];
  clientIds: Types.ObjectId[];
}

/** Agency-wide numbers for the clients the staff member can see. */
export async function getOverview(user: SessionUser): Promise<Overview> {
  await connectDB();
  const ids = await visibleClientIds(user);
  const now = new Date();
  const [clients, spend, pendingAgg, overdueAgg, newLeads] = await Promise.all([
    Client.find({ _id: { $in: ids } }, { name: 1, status: 1, metaAdAccountIds: 1 })
      .sort({ name: 1 })
      .lean(),
    getSpendByClient(ids, lastNDays(30)),
    Post.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { clientId: { $in: ids }, status: "pending_approval" } },
      { $group: { _id: "$clientId", n: { $sum: 1 } } },
    ]),
    Post.aggregate<{ _id: Types.ObjectId; n: number }>([
      {
        $match: {
          clientId: { $in: ids },
          scheduledAt: { $lt: now },
          status: { $nin: ["approved", "published"] },
        },
      },
      { $group: { _id: "$clientId", n: { $sum: 1 } } },
    ]),
    countNewLeads(),
  ]);
  const pending = new Map(pendingAgg.map((p) => [p._id.toString(), p.n]));
  const overdue = new Map(overdueAgg.map((p) => [p._id.toString(), p.n]));
  const rows: OverviewClientRow[] = clients.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    status: c.status,
    totals: spend.get(c._id.toString()) ?? null,
    pending: pending.get(c._id.toString()) ?? 0,
    overdue: overdue.get(c._id.toString()) ?? 0,
    adAccounts: c.metaAdAccountIds.length,
  }));

  const all = rows.map((r) => r.totals).filter((t): t is InsightTotals => !!t);
  return {
    totals: summarizeInsights(all),
    pendingApprovals: [...pending.values()].reduce((a, b) => a + b, 0),
    overdue: [...overdue.values()].reduce((a, b) => a + b, 0),
    newLeads,
    activeClients: clients.filter((c) => c.status === "active").length,
    metaConnected: features().meta,
    clients: rows,
    clientIds: ids,
  };
}
