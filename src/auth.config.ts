import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";
import { USER_ROLES } from "@/lib/constants";
import { canEnterPath, isStaff } from "@/lib/permissions";

/**
 * Edge-safe Auth.js config: no database or Node-only imports. Used by `src/proxy.ts` for route
 * protection. Providers and DB-backed callbacks are added in `src/auth.ts`.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const role = auth?.user?.role;

      if (pathname === "/login") {
        return role ? NextResponse.redirect(new URL("/continue", request.nextUrl)) : true;
      }

      const protectedPath = pathname.startsWith("/portal") || pathname.startsWith("/admin");
      if (!protectedPath) return true;
      if (!role) return false; // redirects to /login?callbackUrl=...

      if (!canEnterPath(role, pathname)) {
        return NextResponse.redirect(
          new URL(isStaff(role) ? "/admin" : "/portal", request.nextUrl),
        );
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = user.role;
        token.clientId = user.clientId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      // Token fields are validated at runtime rather than trusted from type augmentation.
      const role = USER_ROLES.find((r) => r === token.role);
      if (typeof token.uid === "string" && role) {
        session.user.id = token.uid;
        session.user.role = role;
        session.user.clientId = typeof token.clientId === "string" ? token.clientId : null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
