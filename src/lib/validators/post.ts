import { z } from "zod";
import { PLATFORMS, POST_STATUSES } from "@/lib/constants";
import { objectId } from "./auth";

export const approvePostSchema = z.object({ postId: objectId });

export const requestChangesSchema = z.object({
  postId: objectId,
  comment: z
    .string()
    .trim()
    .min(3, "Tell us what should change")
    .max(2000, "Please keep feedback under 2000 characters"),
});
export type RequestChangesInput = z.infer<typeof requestChangesSchema>;

export const commentSchema = z.object({
  postId: objectId,
  body: z
    .string()
    .trim()
    .min(1, "Write a comment")
    .max(2000, "Please keep comments under 2000 characters"),
});
export type CommentInput = z.infer<typeof commentSchema>;

const mediaUrl = z
  .url("Enter a valid URL")
  .refine((u) => u.startsWith("https://"), "Media must be served over https");

/** Admin create/edit. `scheduledAt` is an ISO string from a datetime-local input. */
export const postFormSchema = z.object({
  clientId: objectId,
  title: z.string().trim().min(2, "Add a title").max(160),
  caption: z.string().trim().max(5000, "Captions can be at most 5000 characters"),
  platforms: z.array(z.enum(PLATFORMS)).min(1, "Choose at least one platform"),
  mediaUrls: z.array(mediaUrl).max(10, "Up to 10 media files per post"),
  scheduledAt: z.iso.datetime({ offset: true, error: "Choose a date and time" }),
});
export type PostFormValues = z.infer<typeof postFormSchema>;

export const postStatusSchema = z.object({
  postId: objectId,
  status: z.enum(POST_STATUSES),
});
