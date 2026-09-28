"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { objectId } from "@/lib/validators/auth";
import { clientFormSchema } from "@/lib/validators/client";
import { ClientServiceError, createClient, updateClient } from "@/server/clients";
import { AuthorizationError, assertStaff } from "@/server/permissions";
import type { ActionResult } from "@/types/actions";

function toError(error: unknown): ActionResult<never> {
  if (error instanceof ClientServiceError || error instanceof AuthorizationError) {
    return { ok: false, error: error.message };
  }
  console.error("[admin/clients]", error);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function saveClientAction(
  clientId: unknown,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = clientFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  try {
    const user = await assertStaff();
    let id: string;
    if (clientId === null) {
      id = await createClient(user, parsed.data);
    } else {
      const existing = objectId.safeParse(clientId);
      if (!existing.success) return { ok: false, error: "Invalid client." };
      id = existing.data;
      await updateClient(user, id, parsed.data);
    }
    revalidatePath("/admin/clients");
    revalidatePath("/admin");
    return {
      ok: true,
      data: { id },
      message: clientId === null ? "Client created." : "Client saved.",
    };
  } catch (error) {
    return toError(error);
  }
}
