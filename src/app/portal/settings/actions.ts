"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { changePasswordSchema, profileSchema } from "@/lib/validators/auth";
import { assertUser } from "@/server/permissions";
import { changePassword, updateProfile, UserServiceError } from "@/server/users";
import type { ActionResult } from "@/types/actions";

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const user = await assertUser();
  await updateProfile(user, parsed.data.name);
  revalidatePath("/portal", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Profile updated." };
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  try {
    const user = await assertUser();
    await changePassword(user, parsed.data.currentPassword, parsed.data.password);
    return { ok: true, message: "Password changed." };
  } catch (error) {
    if (error instanceof UserServiceError) {
      return { ok: false, error: error.message, fieldErrors: { currentPassword: [error.message] } };
    }
    throw error;
  }
}
