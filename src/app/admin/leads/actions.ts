"use server";

import { revalidatePath } from "next/cache";
import { leadStatusSchema } from "@/lib/validators/lead";
import { updateLeadStatus } from "@/server/leads";
import { AuthorizationError, assertStaff } from "@/server/permissions";
import type { ActionResult } from "@/types/actions";

export async function updateLeadStatusAction(input: unknown): Promise<ActionResult> {
  const parsed = leadStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  try {
    await updateLeadStatus(await assertStaff(), parsed.data.leadId, parsed.data.status);
    revalidatePath("/admin/leads");
    return { ok: true, message: "Lead updated." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, error: error.message };
    console.error("[admin/leads]", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
