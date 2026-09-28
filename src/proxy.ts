import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Route protection (Next.js 16 renamed middleware to proxy). Uses the edge-safe config only:
 *  - /portal/* requires a signed-in user
 *  - /admin/*  requires admin or manager
 * Every server query re-checks access as well (see src/server/permissions.ts), so the proxy is a
 * first line of defence, not the only one.
 */
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*", "/login"],
};
