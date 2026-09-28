"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { objectId } from "@/lib/validators/auth";
import { assertClientAccess, assertStaff } from "@/server/permissions";
import { PORTAL_CLIENT_COOKIE } from "@/server/portal";
import type { ActionResult } from "@/types/actions";

/** Staff-only: choose which client the portal view shows. */
export async function switchPortalClientAction(clientId: unknown): Promise<ActionResult> {
  const parsed = objectId.safeParse(clientId);
  if (!parsed.success) return { ok: false, error: "Invalid client." };
  try {
    const user = await assertStaff();
    await assertClientAccess(user, parsed.data);
  } catch {
    return { ok: false, error: "You don't have access to that client." };
  }
  (await cookies()).set(PORTAL_CLIENT_COOKIE, parsed.data, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/portal", "layout");
  return { ok: true };
}
