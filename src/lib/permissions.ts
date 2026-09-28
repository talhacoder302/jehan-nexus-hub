/**
 * Pure authorization rules. No database or framework imports, so they are unit-tested directly and
 * reused by server services (see src/server/permissions.ts) and the route proxy.
 *
 * Rules:
 *  - admin:   every client
 *  - manager: clients where they are in `assignedManagers`
 *  - client:  only their own `clientId`, whatever the request asks for
 */
import { STAFF_ROLES, type UserRole } from "./constants";

export interface AuthzUser {
  id: string;
  role: UserRole;
  clientId: string | null;
}

export function isStaff(role: UserRole | undefined | null): boolean {
  return !!role && STAFF_ROLES.includes(role);
}

export function isAdmin(role: UserRole | undefined | null): boolean {
  return role === "admin";
}

/** Whether `user` may read or act on data belonging to `clientId`. */
export function canAccessClient(
  user: AuthzUser,
  clientId: string,
  assignedManagerIds: readonly string[] = [],
): boolean {
  switch (user.role) {
    case "admin":
      return true;
    case "manager":
      return assignedManagerIds.includes(user.id);
    case "client":
      return !!user.clientId && user.clientId === clientId;
    default:
      return false;
  }
}

/**
 * The client a portal request is scoped to. Client users are always pinned to their own client,
 * so a tampered `?client=` parameter or form field can never widen access.
 */
export function resolveClientScope(
  user: AuthzUser,
  requestedClientId?: string | null,
): string | null {
  if (user.role === "client") return user.clientId;
  return requestedClientId || null;
}

/** Mongo filter over the clients collection restricting results to what `user` can see. */
export function clientCollectionFilter(user: AuthzUser): Record<string, unknown> {
  switch (user.role) {
    case "admin":
      return {};
    case "manager":
      return { assignedManagers: user.id };
    case "client":
      return user.clientId ? { _id: user.clientId } : { _id: null };
    default:
      return { _id: null };
  }
}

/** Routes each role may enter. Mirrors the proxy so both layers agree. */
export function canEnterPath(role: UserRole | undefined | null, pathname: string): boolean {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return isStaff(role);
  if (pathname === "/portal" || pathname.startsWith("/portal/")) return !!role;
  return true;
}

/**
 * Turns a callbackUrl into a same-site relative path (prevents open redirects). Absolute URLs keep
 * only their path and query, so `https://evil.example/x` becomes `/x` on this site.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/continue"): string {
  if (!value) return fallback;
  let path = value;
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) {
    try {
      const url = new URL(value);
      path = `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return fallback;
    }
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  return path;
}
