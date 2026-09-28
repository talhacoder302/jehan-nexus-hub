"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { USER_ROLES } from "@/lib/constants";
import { inviteUserSchema, objectId } from "@/lib/validators/auth";
import { AuthorizationError, assertAdmin, assertStaff } from "@/server/permissions";
import { inviteUser, setUserDisabled, updateUserRole, UserServiceError } from "@/server/users";
import type { ActionResult } from "@/types/actions";

function toError(error: unknown): ActionResult<never> {
  if (error instanceof UserServiceError || error instanceof AuthorizationError) {
    return { ok: false, error: error.message };
  }
  console.error("[admin/users]", error);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function inviteUserAction(
  input: unknown,
): Promise<ActionResult<{ inviteLink?: string; delivered: boolean }>> {
  const parsed = inviteUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  try {
    const actor = await assertStaff();
    const result = await inviteUser(actor, parsed.data);
    revalidatePath("/admin/users");
    return {
      ok: true,
      data: { inviteLink: result.inviteLink, delivered: result.delivered },
      message: result.delivered
        ? `Invitation sent to ${parsed.data.email}.`
        : "Email isn't configured, so copy the invite link below and share it securely.",
    };
  } catch (error) {
    return toError(error);
  }
}

const roleSchema = z.object({
  userId: objectId,
  role: z.enum(USER_ROLES),
  clientId: objectId.optional(),
});

export async function changeUserRoleAction(input: unknown): Promise<ActionResult> {
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  try {
    const actor = await assertAdmin();
    await updateUserRole(actor, parsed.data.userId, parsed.data.role, parsed.data.clientId);
    revalidatePath("/admin/users");
    return { ok: true, message: "Role updated." };
  } catch (error) {
    return toError(error);
  }
}

const disableSchema = z.object({ userId: objectId, disabled: z.boolean() });

export async function setUserDisabledAction(input: unknown): Promise<ActionResult> {
  const parsed = disableSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  try {
    const actor = await assertStaff();
    await setUserDisabled(actor, parsed.data.userId, parsed.data.disabled);
    revalidatePath("/admin/users");
    return { ok: true, message: parsed.data.disabled ? "User disabled." : "User re-enabled." };
  } catch (error) {
    return toError(error);
  }
}
