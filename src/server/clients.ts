import "server-only";
import { Types } from "mongoose";
import type { ClientPlan, ClientStatus } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import type { ClientFormValues } from "@/lib/validators/client";
import { Client, Post, User } from "@/models";
import { logActivity } from "./activity";
import {
  AuthorizationError,
  assertClientAccess,
  visibleClientsFilter,
  type SessionUser,
} from "./permissions";

export class ClientServiceError extends Error {}

export interface ClientOption {
  id: string;
  name: string;
}

/** Clients the user can see, for pickers and switchers. */
export async function listClientOptions(user: SessionUser): Promise<ClientOption[]> {
  await connectDB();
  const clients = await Client.find(
    { ...visibleClientsFilter(user), status: { $ne: "archived" } },
    { name: 1 },
  )
    .sort({ name: 1 })
    .lean();
  return clients.map((c) => ({ id: c._id.toString(), name: c.name }));
}

export interface ClientListItem {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  industry: string | null;
  plan: ClientPlan;
  status: ClientStatus;
  adAccounts: number;
  managers: string[];
  pendingApprovals: number;
  users: number;
}

export async function listClients(user: SessionUser): Promise<ClientListItem[]> {
  await connectDB();
  if (user.role === "client") throw new AuthorizationError();
  const clients = await Client.find(visibleClientsFilter(user)).sort({ status: 1, name: 1 }).lean();
  const ids = clients.map((c) => c._id);
  const managerIds = [...new Set(clients.flatMap((c) => c.assignedManagers.map(String)))];
  const [managers, pending, users] = await Promise.all([
    User.find({ _id: { $in: managerIds } }, { name: 1 }).lean(),
    Post.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { clientId: { $in: ids }, status: "pending_approval" } },
      { $group: { _id: "$clientId", n: { $sum: 1 } } },
    ]),
    User.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { clientId: { $in: ids }, status: { $ne: "disabled" } } },
      { $group: { _id: "$clientId", n: { $sum: 1 } } },
    ]),
  ]);
  const managerNames = new Map(managers.map((m) => [m._id.toString(), m.name]));
  const pendingMap = new Map(pending.map((p) => [p._id.toString(), p.n]));
  const usersMap = new Map(users.map((p) => [p._id.toString(), p.n]));
  return clients.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    logo: c.logo ?? null,
    industry: c.industry ?? null,
    plan: c.plan,
    status: c.status,
    adAccounts: c.metaAdAccountIds.length,
    managers: c.assignedManagers.map((m) => managerNames.get(m.toString()) ?? "Unknown"),
    pendingApprovals: pendingMap.get(c._id.toString()) ?? 0,
    users: usersMap.get(c._id.toString()) ?? 0,
  }));
}

export interface ClientFormData {
  id: string;
  name: string;
  slug: string;
  logo: string;
  industry: string;
  contactEmail: string;
  brandPrimary: string;
  brandSecondary: string;
  metaAdAccountIds: string;
  facebookPageId: string;
  instagramAccountId: string;
  assignedManagers: string[];
  plan: ClientPlan;
  status: ClientStatus;
}

export async function getClientForEdit(
  user: SessionUser,
  clientId: string,
): Promise<ClientFormData> {
  if (user.role === "client") throw new AuthorizationError();
  await connectDB();
  await assertClientAccess(user, clientId);
  const c = await Client.findById(clientId).lean();
  if (!c) throw new AuthorizationError("Client not found.", 404);
  return {
    id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    logo: c.logo ?? "",
    industry: c.industry ?? "",
    contactEmail: c.contactEmail ?? "",
    brandPrimary: c.brandColors?.primary ?? "",
    brandSecondary: c.brandColors?.secondary ?? "",
    metaAdAccountIds: c.metaAdAccountIds.join("\n"),
    facebookPageId: c.facebookPageId ?? "",
    instagramAccountId: c.instagramAccountId ?? "",
    assignedManagers: c.assignedManagers.map(String),
    plan: c.plan,
    status: c.status,
  };
}

/** Staff who can be assigned to clients. */
export async function listManagerOptions(): Promise<ClientOption[]> {
  await connectDB();
  const staff = await User.find(
    { role: { $in: ["admin", "manager"] }, status: { $ne: "disabled" } },
    { name: 1, role: 1 },
  )
    .sort({ name: 1 })
    .lean();
  return staff.map((s) => ({
    id: s._id.toString(),
    name: `${s.name}${s.role === "admin" ? " (admin)" : ""}`,
  }));
}

function toDoc(values: ClientFormValues) {
  return {
    name: values.name,
    slug: values.slug,
    logo: values.logo,
    industry: values.industry,
    contactEmail: values.contactEmail,
    brandColors: { primary: values.brandPrimary, secondary: values.brandSecondary },
    metaAdAccountIds: values.metaAdAccountIds,
    facebookPageId: values.facebookPageId,
    instagramAccountId: values.instagramAccountId,
    plan: values.plan,
    status: values.status,
  };
}

async function assertSlugFree(slug: string, exceptId?: string) {
  const clash = await Client.exists({ slug, ...(exceptId ? { _id: { $ne: exceptId } } : {}) });
  if (clash) throw new ClientServiceError("That slug is already used by another client.");
}

async function validManagers(ids: string[]) {
  const found = await User.find(
    { _id: { $in: ids }, role: { $in: ["admin", "manager"] } },
    { _id: 1 },
  ).lean();
  return found.map((u) => u._id);
}

/** Admin-only. */
export async function createClient(user: SessionUser, values: ClientFormValues): Promise<string> {
  if (user.role !== "admin") throw new AuthorizationError("Only admins can create clients.");
  await connectDB();
  await assertSlugFree(values.slug);
  const client = await Client.create({
    ...toDoc(values),
    assignedManagers: await validManagers(values.assignedManagers),
  });
  await logActivity({
    actorId: user.id,
    clientId: client._id,
    action: "client.created",
    entity: "client",
    entityId: client._id,
    meta: { name: client.name },
  });
  return client._id.toString();
}

/** Admins edit everything; managers edit their assigned clients but not assignments or status. */
export async function updateClient(
  user: SessionUser,
  clientId: string,
  values: ClientFormValues,
): Promise<void> {
  if (user.role === "client") throw new AuthorizationError();
  await connectDB();
  await assertClientAccess(user, clientId);
  const client = await Client.findById(clientId);
  if (!client) throw new AuthorizationError("Client not found.", 404);
  await assertSlugFree(values.slug, clientId);

  const doc = toDoc(values);
  if (user.role !== "admin") {
    doc.status = client.status;
    doc.plan = client.plan;
  } else {
    client.assignedManagers = await validManagers(values.assignedManagers);
  }
  client.set(doc);
  await client.save();
  await logActivity({
    actorId: user.id,
    clientId: client._id,
    action: "client.updated",
    entity: "client",
    entityId: client._id,
    meta: { name: client.name },
  });
}
