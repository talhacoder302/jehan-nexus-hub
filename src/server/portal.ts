import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { connectDB } from "@/lib/db";
import { Client } from "@/models";
import { listClientOptions, type ClientOption } from "./clients";
import { requireUser, resolvePortalClient, type SessionUser } from "./permissions";

export const PORTAL_CLIENT_COOKIE = "jn_portal_client";

export interface PortalContext {
  user: SessionUser;
  clientId: string;
  client: { id: string; name: string; logo: string | null; brandColor: string | null };
  /** Client options for the staff switcher (empty for client users). */
  switcher: ClientOption[];
}

/**
 * Resolves the signed-in user and the client the portal is showing. Client users are always
 * pinned to their own client; staff choose one with the switcher (stored in a cookie and re-checked
 * against their access on every request).
 */
export const getPortalContext = cache(async (): Promise<PortalContext | null> =>
  getPortalContextFor(await requireUser()),
);

/** Same as getPortalContext for an already-verified user (API routes use this; no redirects). */
export async function getPortalContextFor(user: SessionUser): Promise<PortalContext | null> {
  await connectDB();
  const requested =
    user.role === "client" ? null : (await cookies()).get(PORTAL_CLIENT_COOKIE)?.value;
  let clientId: string | null;
  try {
    clientId = await resolvePortalClient(user, requested);
  } catch {
    // Stale cookie pointing at a client the user can no longer see: fall back to the default.
    clientId = await resolvePortalClient(user, null);
  }
  if (!clientId) return null;
  const client = await Client.findById(clientId, { name: 1, logo: 1, brandColors: 1 }).lean();
  if (!client) return null;
  return {
    user,
    clientId,
    client: {
      id: clientId,
      name: client.name,
      logo: client.logo ?? null,
      brandColor: client.brandColors?.primary ?? null,
    },
    switcher: user.role === "client" ? [] : await listClientOptions(user),
  };
}

/** For portal pages: context is required; users without a client see the empty state instead. */
export async function requirePortalContext(): Promise<PortalContext> {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal/no-client");
  return ctx;
}
