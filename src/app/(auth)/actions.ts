"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { safeRedirectPath } from "@/lib/permissions";
import {
  acceptInviteSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "@/lib/validators/auth";
import {
  acceptInvite,
  requestPasswordReset,
  resetPassword,
  UserServiceError,
} from "@/server/users";
import type { ActionResult } from "@/types/actions";

const invalid = (error: z.ZodError): ActionResult<never> => ({
  ok: false,
  error: "Please check the highlighted fields.",
  fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]>,
});

export async function loginAction(
  input: unknown,
  callbackUrl?: string | null,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const redirectTo = safeRedirectPath(callbackUrl);
  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
    return { ok: true, data: { redirectTo } };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Incorrect email or password, or your account isn't active yet." };
    }
    throw error;
  }
}

export async function googleSignInAction(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl");
  await signIn("google", {
    redirectTo: safeRedirectPath(typeof callbackUrl === "string" ? callbackUrl : null),
  });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    await requestPasswordReset(parsed.data.email);
  } catch (error) {
    console.error("[auth] password reset request failed", error);
  }
  // Same response whether or not the account exists.
  return {
    ok: true,
    message: "If an account exists for that email, we've sent a link to reset your password.",
  };
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    await resetPassword(parsed.data.token, parsed.data.password);
    return { ok: true, message: "Your password has been updated. You can now sign in." };
  } catch (error) {
    if (error instanceof UserServiceError) return { ok: false, error: error.message };
    throw error;
  }
}

export async function acceptInviteAction(
  input: unknown,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = acceptInviteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const { email } = await acceptInvite(parsed.data);
    await signIn("credentials", { email, password: parsed.data.password, redirect: false });
    return { ok: true, data: { redirectTo: "/continue" } };
  } catch (error) {
    if (error instanceof UserServiceError) return { ok: false, error: error.message };
    if (error instanceof AuthError) return { ok: true, data: { redirectTo: "/login" } };
    throw error;
  }
}
