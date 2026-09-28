import { describe, expect, it } from "vitest";
import {
  canAccessClient,
  canEnterPath,
  clientCollectionFilter,
  isStaff,
  resolveClientScope,
  safeRedirectPath,
  type AuthzUser,
} from "@/lib/permissions";

const CLIENT_A = "aaaaaaaaaaaaaaaaaaaaaaaa";
const CLIENT_B = "bbbbbbbbbbbbbbbbbbbbbbbb";

const admin: AuthzUser = { id: "admin1", role: "admin", clientId: null };
const manager: AuthzUser = { id: "manager1", role: "manager", clientId: null };
const clientUserA: AuthzUser = { id: "userA", role: "client", clientId: CLIENT_A };
const orphanClient: AuthzUser = { id: "userX", role: "client", clientId: null };

describe("canAccessClient", () => {
  it("lets a client user access only their own client", () => {
    expect(canAccessClient(clientUserA, CLIENT_A)).toBe(true);
    expect(canAccessClient(clientUserA, CLIENT_B)).toBe(false);
  });

  it("ignores manager assignments for client users", () => {
    // Even if the user's id somehow appears in assignedManagers, clients stay pinned to their own id.
    expect(canAccessClient(clientUserA, CLIENT_B, [clientUserA.id])).toBe(false);
  });

  it("denies client users without a client", () => {
    expect(canAccessClient(orphanClient, CLIENT_A)).toBe(false);
  });

  it("lets managers access only assigned clients", () => {
    expect(canAccessClient(manager, CLIENT_A, ["manager1"])).toBe(true);
    expect(canAccessClient(manager, CLIENT_B, ["someoneElse"])).toBe(false);
    expect(canAccessClient(manager, CLIENT_B)).toBe(false);
  });

  it("lets admins access every client", () => {
    expect(canAccessClient(admin, CLIENT_A)).toBe(true);
    expect(canAccessClient(admin, CLIENT_B, [])).toBe(true);
  });
});

describe("resolveClientScope", () => {
  it("pins client users to their own client, whatever they request", () => {
    expect(resolveClientScope(clientUserA, CLIENT_B)).toBe(CLIENT_A);
    expect(resolveClientScope(clientUserA, null)).toBe(CLIENT_A);
  });

  it("uses the requested client for staff", () => {
    expect(resolveClientScope(admin, CLIENT_B)).toBe(CLIENT_B);
    expect(resolveClientScope(manager, undefined)).toBeNull();
  });
});

describe("clientCollectionFilter", () => {
  it("scopes each role correctly", () => {
    expect(clientCollectionFilter(admin)).toEqual({});
    expect(clientCollectionFilter(manager)).toEqual({ assignedManagers: "manager1" });
    expect(clientCollectionFilter(clientUserA)).toEqual({ _id: CLIENT_A });
    expect(clientCollectionFilter(orphanClient)).toEqual({ _id: null });
  });
});

describe("canEnterPath", () => {
  it("restricts /admin to staff", () => {
    expect(canEnterPath("client", "/admin")).toBe(false);
    expect(canEnterPath("client", "/admin/clients")).toBe(false);
    expect(canEnterPath("manager", "/admin/posts")).toBe(true);
    expect(canEnterPath("admin", "/admin")).toBe(true);
  });

  it("requires any role for /portal", () => {
    expect(canEnterPath(undefined, "/portal")).toBe(false);
    expect(canEnterPath("client", "/portal/ads")).toBe(true);
  });

  it("does not confuse lookalike paths", () => {
    expect(canEnterPath("client", "/administrator")).toBe(true);
    expect(canEnterPath(null, "/portalx")).toBe(true);
  });

  it("knows who is staff", () => {
    expect(isStaff("admin")).toBe(true);
    expect(isStaff("manager")).toBe(true);
    expect(isStaff("client")).toBe(false);
    expect(isStaff(undefined)).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  it("keeps same-site relative paths", () => {
    expect(safeRedirectPath("/portal/ads?days=7")).toBe("/portal/ads?days=7");
  });

  it("strips the origin from absolute URLs so they stay on this site", () => {
    expect(safeRedirectPath("https://evil.example/steal?x=1")).toBe("/steal?x=1");
    expect(safeRedirectPath("http://localhost:3000/portal")).toBe("/portal");
  });

  it("rejects protocol-relative and odd inputs", () => {
    expect(safeRedirectPath("//evil.example")).toBe("/continue");
    expect(safeRedirectPath("/\\evil.example")).toBe("/continue");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/continue");
    expect(safeRedirectPath("relative/path")).toBe("/continue");
    expect(safeRedirectPath(undefined, "/login")).toBe("/login");
  });
});
