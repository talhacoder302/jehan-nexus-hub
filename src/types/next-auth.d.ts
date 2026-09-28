import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/constants";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      clientId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    clientId?: string | null;
  }
}
