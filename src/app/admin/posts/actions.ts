"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { objectId } from "@/lib/validators/auth";
import { postFormSchema } from "@/lib/validators/post";
import { AuthorizationError, assertStaff } from "@/server/permissions";
import {
  createPost,
  deletePost,
  markPublished,
  PostServiceError,
  sendForApproval,
  updatePost,
} from "@/server/posts";
import type { ActionResult } from "@/types/actions";

function toError(error: unknown): ActionResult<never> {
  if (error instanceof PostServiceError || error instanceof AuthorizationError) {
    return { ok: false, error: error.message };
  }
  console.error("[admin/posts]", error);
  return { ok: false, error: "Something went wrong. Please try again." };
}

function revalidatePosts(postId?: string) {
  revalidatePath("/admin/posts");
  revalidatePath("/admin");
  if (postId) {
    revalidatePath(`/admin/posts/${postId}`);
    revalidatePath(`/portal/posts/${postId}`);
  }
  revalidatePath("/portal", "layout");
}

/** Creates (postId = null) or updates a post; optionally sends it for approval in the same step. */
export async function savePostAction(
  postId: unknown,
  input: unknown,
  submit: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = postFormSchema.safeParse(input);
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
    if (postId === null) {
      id = await createPost(user, parsed.data);
    } else {
      const existing = objectId.safeParse(postId);
      if (!existing.success) return { ok: false, error: "Invalid post." };
      id = existing.data;
      await updatePost(user, id, parsed.data);
    }
    if (submit === true) await sendForApproval(user, id);
    revalidatePosts(id);
    return {
      ok: true,
      data: { id },
      message: submit === true ? "Sent to the client for approval." : "Post saved.",
    };
  } catch (error) {
    return toError(error);
  }
}

const idSchema = z.object({ postId: objectId });

export async function sendForApprovalAction(input: unknown): Promise<ActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  try {
    await sendForApproval(await assertStaff(), parsed.data.postId);
    revalidatePosts(parsed.data.postId);
    return { ok: true, message: "Sent to the client for approval." };
  } catch (error) {
    return toError(error);
  }
}

export async function markPublishedAction(input: unknown): Promise<ActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  try {
    await markPublished(await assertStaff(), parsed.data.postId);
    revalidatePosts(parsed.data.postId);
    return { ok: true, message: "Marked as published." };
  } catch (error) {
    return toError(error);
  }
}

export async function deletePostAction(input: unknown): Promise<ActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  try {
    await deletePost(await assertStaff(), parsed.data.postId);
    revalidatePosts();
    return { ok: true, message: "Post deleted." };
  } catch (error) {
    return toError(error);
  }
}
