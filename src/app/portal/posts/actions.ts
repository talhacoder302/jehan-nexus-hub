"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { approvePostSchema, commentSchema, requestChangesSchema } from "@/lib/validators/post";
import { AuthorizationError, assertUser } from "@/server/permissions";
import {
  addComment,
  approvePost,
  PostServiceError,
  requestChanges,
  type CommentItem,
} from "@/server/posts";
import type { ActionResult } from "@/types/actions";

function toError(error: unknown): ActionResult<never> {
  if (error instanceof PostServiceError || error instanceof AuthorizationError) {
    return { ok: false, error: error.message };
  }
  console.error("[portal/posts]", error);
  return { ok: false, error: "Something went wrong. Please try again." };
}

function revalidatePortal(postId: string) {
  revalidatePath(`/portal/posts/${postId}`);
  revalidatePath("/portal", "layout");
}

export async function approvePostAction(input: unknown): Promise<ActionResult> {
  const parsed = approvePostSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  try {
    const user = await assertUser();
    await approvePost(user, parsed.data.postId);
    revalidatePortal(parsed.data.postId);
    return { ok: true, message: "Post approved. Thanks!" };
  } catch (error) {
    return toError(error);
  }
}

export async function requestChangesAction(input: unknown): Promise<ActionResult> {
  const parsed = requestChangesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please add a comment describing the changes.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  try {
    const user = await assertUser();
    await requestChanges(user, parsed.data.postId, parsed.data.comment);
    revalidatePortal(parsed.data.postId);
    return { ok: true, message: "Feedback sent to your account manager." };
  } catch (error) {
    return toError(error);
  }
}

export async function addCommentAction(input: unknown): Promise<ActionResult<CommentItem>> {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Comment can't be empty.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  try {
    const user = await assertUser();
    const comment = await addComment(user, parsed.data.postId, parsed.data.body);
    revalidatePath(`/portal/posts/${parsed.data.postId}`);
    revalidatePath(`/admin/posts/${parsed.data.postId}`);
    return { ok: true, data: comment };
  } catch (error) {
    return toError(error);
  }
}
