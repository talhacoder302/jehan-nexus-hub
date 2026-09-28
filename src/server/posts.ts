import "server-only";
import { Types } from "mongoose";
import { POST_STATUS_COLORS, type Platform, type PostStatus } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { isStaff } from "@/lib/permissions";
import { Client, Comment, Post, User, type IPost } from "@/models";
import { logActivity } from "./activity";
import { clientUserIds, notifyUsers, staffUserIdsForClient } from "./notifications";
import { AuthorizationError, assertClientAccess, type SessionUser } from "./permissions";

export class PostServiceError extends Error {}

export interface PostSummary {
  id: string;
  clientId: string;
  title: string;
  caption: string;
  platforms: Platform[];
  mediaUrls: string[];
  scheduledAt: string;
  status: PostStatus;
  revisionCount: number;
  approvedAt: string | null;
  updatedAt: string;
}

export interface CommentItem {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; role: string; image: string | null };
}

export interface PostDetail extends PostSummary {
  clientName: string;
  createdByName: string | null;
  approvedByName: string | null;
  comments: CommentItem[];
}

type LeanPost = Pick<
  IPost,
  | "_id"
  | "clientId"
  | "title"
  | "caption"
  | "platforms"
  | "mediaUrls"
  | "scheduledAt"
  | "status"
  | "revisionCount"
  | "approvedAt"
  | "updatedAt"
>;

export function toPostSummary(p: LeanPost): PostSummary {
  return {
    id: p._id.toString(),
    clientId: p.clientId.toString(),
    title: p.title,
    caption: p.caption,
    platforms: p.platforms,
    mediaUrls: p.mediaUrls,
    scheduledAt: p.scheduledAt.toISOString(),
    status: p.status,
    revisionCount: p.revisionCount,
    approvedAt: p.approvedAt?.toISOString() ?? null,
    updatedAt: p.updatedAt.toISOString(),
  };
}

const oid = (id: string) => new Types.ObjectId(id);

/** Loads a post and verifies the user can access its client. 404s look identical to 403s. */
async function loadAuthorizedPost(user: SessionUser, postId: string) {
  if (!Types.ObjectId.isValid(postId)) throw new AuthorizationError("Post not found.", 404);
  await connectDB();
  const post = await Post.findById(postId);
  if (!post) throw new AuthorizationError("Post not found.", 404);
  try {
    await assertClientAccess(user, post.clientId.toString());
  } catch {
    throw new AuthorizationError("Post not found.", 404);
  }
  return post;
}

export async function countPendingApprovals(clientId: string): Promise<number> {
  await connectDB();
  return Post.countDocuments({ clientId: oid(clientId), status: "pending_approval" });
}

/** Posts that client users can see: drafts stay internal to the agency. */
function clientVisibleStatuses(user: SessionUser): PostStatus[] | null {
  return isStaff(user.role)
    ? null
    : ["pending_approval", "changes_requested", "approved", "published"];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  color: string;
  status: PostStatus;
  platforms: Platform[];
  caption: string;
  thumbnail: string | null;
}

export async function listCalendarEvents(
  user: SessionUser,
  clientId: string,
  from: Date,
  to: Date,
): Promise<CalendarEvent[]> {
  await connectDB();
  const statuses = clientVisibleStatuses(user);
  const posts = await Post.find({
    clientId: oid(clientId),
    scheduledAt: { $gte: from, $lt: to },
    ...(statuses ? { status: { $in: statuses } } : {}),
  })
    .sort({ scheduledAt: 1 })
    .limit(500)
    .lean();
  return posts.map((p) => ({
    id: p._id.toString(),
    title: p.title,
    start: p.scheduledAt.toISOString(),
    color: POST_STATUS_COLORS[p.status],
    status: p.status,
    platforms: p.platforms,
    caption: p.caption.slice(0, 280),
    thumbnail: p.mediaUrls[0] ?? null,
  }));
}

export async function listPostsByStatus(
  clientId: string,
  statuses: PostStatus[],
  limit = 50,
): Promise<PostSummary[]> {
  await connectDB();
  const posts = await Post.find({ clientId: oid(clientId), status: { $in: statuses } })
    .sort({ scheduledAt: 1 })
    .limit(limit)
    .lean();
  return posts.map(toPostSummary);
}

export async function listUpcomingPosts(user: SessionUser, clientId: string, limit = 5) {
  await connectDB();
  const statuses = clientVisibleStatuses(user);
  const posts = await Post.find({
    clientId: oid(clientId),
    scheduledAt: { $gte: new Date() },
    ...(statuses ? { status: { $in: statuses } } : {}),
  })
    .sort({ scheduledAt: 1 })
    .limit(limit)
    .lean();
  return posts.map(toPostSummary);
}

export async function getPostDetail(user: SessionUser, postId: string): Promise<PostDetail> {
  const post = await loadAuthorizedPost(user, postId);
  const statuses = clientVisibleStatuses(user);
  if (statuses && !statuses.includes(post.status))
    throw new AuthorizationError("Post not found.", 404);

  const [client, comments, people] = await Promise.all([
    Client.findById(post.clientId, { name: 1 }).lean(),
    Comment.find({ postId: post._id }).sort({ createdAt: 1 }).lean(),
    User.find(
      {
        _id: { $in: [post.createdBy, post.approvedBy].filter((id): id is Types.ObjectId => !!id) },
      },
      { name: 1 },
    ).lean(),
  ]);
  const authorIds = [...new Set(comments.map((c) => c.authorId.toString()))];
  const authors = await User.find(
    { _id: { $in: authorIds } },
    { name: 1, role: 1, image: 1 },
  ).lean();
  const authorMap = new Map(authors.map((a) => [a._id.toString(), a]));
  const nameOf = (id?: Types.ObjectId | null) =>
    id ? (people.find((p) => p._id.equals(id))?.name ?? null) : null;

  return {
    ...toPostSummary(post),
    clientName: client?.name ?? "",
    createdByName: nameOf(post.createdBy),
    approvedByName: nameOf(post.approvedBy),
    comments: comments.map((c) => {
      const a = authorMap.get(c.authorId.toString());
      return {
        id: c._id.toString(),
        body: c.body,
        createdAt: c.createdAt.toISOString(),
        author: {
          id: c.authorId.toString(),
          name: a?.name ?? "Former user",
          role: a?.role ?? "client",
          image: a?.image ?? null,
        },
      };
    }),
  };
}

export async function approvePost(user: SessionUser, postId: string): Promise<void> {
  const post = await loadAuthorizedPost(user, postId);
  if (post.status !== "pending_approval") {
    throw new PostServiceError("Only posts awaiting approval can be approved.");
  }
  post.status = "approved";
  post.approvedBy = oid(user.id);
  post.approvedAt = new Date();
  await post.save();

  await logActivity({
    actorId: user.id,
    clientId: post.clientId,
    action: "post.approved",
    entity: "post",
    entityId: post._id,
    meta: { title: post.title },
  });
  const recipients = (await staffUserIdsForClient(post.clientId)).filter((id) => id !== user.id);
  await notifyUsers(
    [...recipients, post.createdBy.toString()].filter((id) => id !== user.id),
    {
      type: "post_approved",
      title: `Approved: "${post.title}"`,
      link: `/admin/posts/${post._id.toString()}`,
      email: {
        subject: `Post approved: ${post.title}`,
        body: `${user.name} approved "${post.title}". It's ready to be scheduled.`,
        cta: "View post",
      },
    },
  );
}

export async function requestChanges(
  user: SessionUser,
  postId: string,
  comment: string,
): Promise<void> {
  const post = await loadAuthorizedPost(user, postId);
  if (post.status !== "pending_approval") {
    throw new PostServiceError("Changes can only be requested on posts awaiting approval.");
  }
  post.status = "changes_requested";
  post.approvedBy = null;
  post.approvedAt = null;
  await post.save();
  await Comment.create({ postId: post._id, authorId: oid(user.id), body: comment });

  await logActivity({
    actorId: user.id,
    clientId: post.clientId,
    action: "post.changes_requested",
    entity: "post",
    entityId: post._id,
    meta: { title: post.title },
  });
  const recipients = await staffUserIdsForClient(post.clientId);
  await notifyUsers(
    [...recipients, post.createdBy.toString()].filter((id) => id !== user.id),
    {
      type: "post_changes_requested",
      title: `Changes requested on "${post.title}"`,
      link: `/admin/posts/${post._id.toString()}`,
      email: {
        subject: `Changes requested: ${post.title}`,
        body: `${user.name} requested changes on "${post.title}": "${comment}"`,
        cta: "Review feedback",
      },
    },
  );
}

export async function addComment(
  user: SessionUser,
  postId: string,
  body: string,
): Promise<CommentItem> {
  const post = await loadAuthorizedPost(user, postId);
  const statuses = clientVisibleStatuses(user);
  if (statuses && !statuses.includes(post.status))
    throw new AuthorizationError("Post not found.", 404);

  const comment = await Comment.create({ postId: post._id, authorId: oid(user.id), body });
  await logActivity({
    actorId: user.id,
    clientId: post.clientId,
    action: "comment.created",
    entity: "comment",
    entityId: comment._id,
    meta: { postId: post._id.toString(), title: post.title },
  });

  // Notify the other side of the conversation.
  const fromClient = user.role === "client";
  const recipients = fromClient
    ? [...(await staffUserIdsForClient(post.clientId)), post.createdBy.toString()]
    : await clientUserIds(post.clientId);
  const link = fromClient
    ? `/admin/posts/${post._id.toString()}`
    : `/portal/posts/${post._id.toString()}`;
  await notifyUsers(
    recipients.filter((id) => id !== user.id),
    { type: "comment_added", title: `${user.name} commented on "${post.title}"`, link },
  );

  return {
    id: comment._id.toString(),
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    author: { id: user.id, name: user.name, role: user.role, image: user.image },
  };
}

/* ------------------------------------------------------------------ */
/* Admin: create, edit and move posts through the approval workflow.  */
/* ------------------------------------------------------------------ */

export interface AdminPostListItem extends PostSummary {
  clientName: string;
  overdue: boolean;
  commentCount: number;
}

/** Past its scheduled time but not yet approved or published. */
export function isOverdue(p: { scheduledAt: Date | string; status: PostStatus }, now = new Date()) {
  return new Date(p.scheduledAt) < now && !["approved", "published"].includes(p.status);
}

export async function listAdminPosts(
  user: SessionUser,
  visibleClientIds: Types.ObjectId[],
  filters: { clientId?: string; status?: PostStatus },
): Promise<AdminPostListItem[]> {
  if (!isStaff(user.role)) throw new AuthorizationError();
  await connectDB();
  const requested = filters.clientId;
  const clientFilter =
    requested && visibleClientIds.some((id) => id.equals(requested))
      ? oid(requested)
      : { $in: visibleClientIds };
  const posts = await Post.find({
    clientId: clientFilter,
    ...(filters.status ? { status: filters.status } : {}),
  })
    .sort({ scheduledAt: -1 })
    .limit(200)
    .lean();
  const [clients, comments] = await Promise.all([
    Client.find(
      { _id: { $in: [...new Set(posts.map((p) => p.clientId.toString()))] } },
      { name: 1 },
    ).lean(),
    Comment.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { postId: { $in: posts.map((p) => p._id) } } },
      { $group: { _id: "$postId", n: { $sum: 1 } } },
    ]),
  ]);
  const names = new Map(clients.map((c) => [c._id.toString(), c.name]));
  const counts = new Map(comments.map((c) => [c._id.toString(), c.n]));
  const now = new Date();
  return posts.map((p) => ({
    ...toPostSummary(p),
    clientName: names.get(p.clientId.toString()) ?? "",
    overdue: isOverdue(p, now),
    commentCount: counts.get(p._id.toString()) ?? 0,
  }));
}

export interface PostWriteValues {
  clientId: string;
  title: string;
  caption: string;
  platforms: Platform[];
  mediaUrls: string[];
  scheduledAt: string;
}

export async function createPost(user: SessionUser, values: PostWriteValues): Promise<string> {
  if (!isStaff(user.role)) throw new AuthorizationError();
  await connectDB();
  await assertClientAccess(user, values.clientId);
  const post = await Post.create({
    clientId: oid(values.clientId),
    title: values.title,
    caption: values.caption,
    platforms: values.platforms,
    mediaUrls: values.mediaUrls,
    scheduledAt: new Date(values.scheduledAt),
    status: "draft",
    createdBy: oid(user.id),
  });
  await logActivity({
    actorId: user.id,
    clientId: post.clientId,
    action: "post.created",
    entity: "post",
    entityId: post._id,
    meta: { title: post.title },
  });
  return post._id.toString();
}

/**
 * Edits content. Published posts are locked. Changing an approved post invalidates the approval
 * (back to draft) so content the client hasn't seen can never go out as "approved".
 */
export async function updatePost(
  user: SessionUser,
  postId: string,
  values: PostWriteValues,
): Promise<void> {
  if (!isStaff(user.role)) throw new AuthorizationError();
  const post = await loadAuthorizedPost(user, postId);
  if (post.status === "published") throw new PostServiceError("Published posts can't be edited.");
  if (values.clientId !== post.clientId.toString()) {
    throw new PostServiceError("A post can't be moved to another client.");
  }
  post.title = values.title;
  post.caption = values.caption;
  post.platforms = values.platforms;
  post.mediaUrls = values.mediaUrls;
  post.scheduledAt = new Date(values.scheduledAt);
  if (post.status === "approved" && post.isModified()) {
    post.status = "draft";
    post.approvedBy = null;
    post.approvedAt = null;
  }
  await post.save();
  await logActivity({
    actorId: user.id,
    clientId: post.clientId,
    action: "post.updated",
    entity: "post",
    entityId: post._id,
    meta: { title: post.title },
  });
}

export async function sendForApproval(user: SessionUser, postId: string): Promise<void> {
  if (!isStaff(user.role)) throw new AuthorizationError();
  const post = await loadAuthorizedPost(user, postId);
  if (post.status !== "draft" && post.status !== "changes_requested") {
    throw new PostServiceError(
      "Only drafts or posts with requested changes can be sent for approval.",
    );
  }
  if (post.status === "changes_requested") post.revisionCount += 1;
  post.status = "pending_approval";
  await post.save();

  await logActivity({
    actorId: user.id,
    clientId: post.clientId,
    action: "post.sent_for_approval",
    entity: "post",
    entityId: post._id,
    meta: { title: post.title, revision: post.revisionCount },
  });
  await notifyUsers(await clientUserIds(post.clientId), {
    type: "post_pending_approval",
    title: `"${post.title}" is ready for your approval`,
    link: `/portal/posts/${post._id.toString()}`,
    email: {
      subject: `Please review: ${post.title}`,
      body: `A ${post.revisionCount ? "revised " : ""}post scheduled for ${post.scheduledAt.toUTCString()} is ready for your review. Approve it or request changes in your portal.`,
      cta: "Review post",
    },
  });
}

export async function markPublished(user: SessionUser, postId: string): Promise<void> {
  if (!isStaff(user.role)) throw new AuthorizationError();
  const post = await loadAuthorizedPost(user, postId);
  if (post.status !== "approved") {
    throw new PostServiceError("Only approved posts can be marked as published.");
  }
  post.status = "published";
  await post.save();
  await logActivity({
    actorId: user.id,
    clientId: post.clientId,
    action: "post.published",
    entity: "post",
    entityId: post._id,
    meta: { title: post.title },
  });
}

export async function deletePost(user: SessionUser, postId: string): Promise<void> {
  if (!isStaff(user.role)) throw new AuthorizationError();
  const post = await loadAuthorizedPost(user, postId);
  if (post.status === "published") {
    throw new PostServiceError("Published posts are kept for reporting and can't be deleted.");
  }
  await Comment.deleteMany({ postId: post._id });
  await post.deleteOne();
  await logActivity({
    actorId: user.id,
    clientId: post.clientId,
    action: "post.deleted",
    entity: "post",
    entityId: post._id,
    meta: { title: post.title },
  });
}
