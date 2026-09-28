"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { objectId } from "@/lib/validators/auth";
import { AuthorizationError, assertStaff } from "@/server/permissions";
import { generateReportForUser, MONTH_RE } from "@/server/reports";
import type { ActionResult } from "@/types/actions";

const schema = z.object({
  clientId: objectId,
  month: z.string().regex(MONTH_RE, "Choose a month"),
  send: z.boolean(),
});

/** Admin/manager: generate a client's monthly report on demand, optionally emailing it. */
export async function generateReportAction(input: unknown): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Choose a valid month." };
  try {
    const user = await assertStaff();
    const { recipients } = await generateReportForUser(
      user,
      parsed.data.clientId,
      parsed.data.month,
      parsed.data.send,
    );
    revalidatePath(`/admin/clients/${parsed.data.clientId}`);
    revalidatePath("/portal/reports");
    return {
      ok: true,
      message: parsed.data.send
        ? `Report generated and sent to ${recipients} user${recipients === 1 ? "" : "s"}.`
        : "Report generated.",
    };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, error: error.message };
    console.error("[admin/reports]", error);
    return { ok: false, error: "Couldn't generate the report. Please try again." };
  }
}
