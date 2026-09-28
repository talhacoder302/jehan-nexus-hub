import "server-only";
import { Types } from "mongoose";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import type { UserRole } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import {
  canAccessClient,
  clientCollectionFilter,
  isAdmin,
  isStaff,
  resolveClientScope,
  type AuthzUser,
} from "@/lib/permissions";
import { Client, User } from "@/models";

export interface SessionUser extends AuthzUser {
  name: string;
  email: string;
  image: string | null;
}

export class AuthorizationError extends Error {
  constructor(
    message = "You don't have access to this resource.",
    readonly status: 401 | 403 | 404 = 403,
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * The signed-in user, re-read from the database once per request. Using the DB (not only the JWT)
 * means disabled users and role changes take effect immediately.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id || !Types.ObjectId.isValid(id)) return null;
  await connectDB();
  const user = await User.findById(id).lean();
  if (!user || user.status !== "active") return null;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    role: user.role,
    clientId: user.clientId?.toString() ?? null,
  };
});

/** For pages and layouts: redirect to login when signed out. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireStaffPage(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isStaff(user.role)) redirect("/portal");
  return user;
}

export async function requireAdminPage(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isAdmin(user.role)) redirect("/admin");
  return user;
}

/** For Server Actions and route handlers: throw instead of redirecting. */
export async function assertUser(roles?: readonly UserRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthorizationError("Please sign in again.", 401);
  if (roles && !roles.includes(user.role)) throw new AuthorizationError();
  return user;
}

export const assertStaff = () => assertUser(["admin", "manager"]);
export const assertAdmin = () => assertUser(["admin"]);

/** Throws unless `user` may access `clientId`. Managers are checked against `assignedManagers`. */
export async function assertClientAccess(user: SessionUser, clientId: string): Promise<void> {
  if (!Types.ObjectId.isValid(clientId)) throw new AuthorizationError("Client not found.", 404);
  let managers: string[] = [];
  if (user.role === "manager") {
    const client = await Client.findById(clientId, { assignedManagers: 1 }).lean();
    if (!client) throw new AuthorizationError("Client not found.", 404);
    managers = client.assignedManagers.map((m) => m.toString());
  }
  if (!canAccessClient(user, clientId, managers)) throw new AuthorizationError();
}

/** Mongo filter for listing clients visible to `user`, with ids cast to ObjectIds. */
export function visibleClientsFilter(user: SessionUser) {
  const filter = clientCollectionFilter(user);
  if (typeof filter._id === "string") return { _id: new Types.ObjectId(filter._id) };
  if (typeof filter.assignedManagers === "string") {
    return { assignedManagers: new Types.ObjectId(filter.assignedManagers) };
  }
  return filter;
}

/** Ids of clients visible to `user` (used to scope cross-client queries for staff). */
export async function visibleClientIds(user: SessionUser): Promise<Types.ObjectId[]> {
  if (user.role === "client") return user.clientId ? [new Types.ObjectId(user.clientId)] : [];
  const clients = await Client.find(visibleClientsFilter(user), { _id: 1 }).lean();
  return clients.map((c) => c._id);
}

/**
 * Resolves which client a portal request is for and verifies access. Client users are pinned to
 * their own client; staff pick one (falling back to the first client they can see).
 */
export async function resolvePortalClient(
  user: SessionUser,
  requested?: string | null,
): Promise<string | null> {
  const scoped = resolveClientScope(user, requested);
  if (scoped) {
    await assertClientAccess(user, scoped);
    return scoped;
  }
  const first = await Client.findOne(visibleClientsFilter(user), { _id: 1 })
    .sort({ name: 1 })
    .lean();
  return first?._id.toString() ?? null;
}
