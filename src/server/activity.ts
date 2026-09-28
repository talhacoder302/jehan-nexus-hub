import "server-only";
import type { Types } from "mongoose";
import type { ActivityEntity } from "@/lib/constants";
import { ActivityLog, User } from "@/models";

type Id = Types.ObjectId | string | null | undefined;

/**
 * Writes an activity log entry. Failures are logged and swallowed: an audit write must never make
 * the user-facing action fail.
 */
export async function logActivity(entry: {
  actorId: Id;
  clientId?: Id;
  action: string;
  entity: ActivityEntity;
  entityId?: Id;
  meta?: Record<string, unknown>;
}) {
  try {
    await ActivityLog.create({
      actorId: entry.actorId ?? null,
      clientId: entry.clientId ?? null,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      meta: entry.meta,
    });
  } catch (error) {
    console.error("[activity] failed to write log", entry.action, error);
  }
}

export interface ActivityItem {
  id: string;
  action: string;
  description: string;
  actorName: string;
  clientId: string | null;
  link: string | null;
  createdAt: string;
}

const DESCRIPTIONS: Record<string, (meta: Record<string, unknown>) => string> = {
  "post.created": (m) => `created post "${String(m.title ?? "")}"`,
  "post.updated": (m) => `updated post "${String(m.title ?? "")}"`,
  "post.sent_for_approval": (m) => `sent "${String(m.title ?? "")}" for approval`,
  "post.approved": (m) => `approved "${String(m.title ?? "")}"`,
  "post.changes_requested": (m) => `requested changes on "${String(m.title ?? "")}"`,
  "post.published": (m) => `marked "${String(m.title ?? "")}" as published`,
  "post.deleted": (m) => `deleted post "${String(m.title ?? "")}"`,
  "comment.created": (m) => `commented on "${String(m.title ?? "")}"`,
  "report.generated": (m) => `generated the ${String(m.month ?? "")} report`,
  "report.sent": (m) => `emailed the ${String(m.month ?? "")} report`,
  "client.created": (m) => `created client ${String(m.name ?? "")}`,
  "client.updated": (m) => `updated client ${String(m.name ?? "")}`,
  "user.invited": (m) => `invited ${String(m.email ?? "a user")}`,
  "user.reinvited": (m) => `re-sent an invite to ${String(m.email ?? "a user")}`,
  "user.activated": () => "activated their account",
  "user.disabled": () => "disabled a user",
  "user.enabled": () => "re-enabled a user",
  "user.role_changed": (m) => `changed a user's role to ${String(m.role ?? "")}`,
  "lead.created": () => "submitted the contact form",
  "lead.updated": (m) => `moved a lead to ${String(m.status ?? "")}`,
  "insight.synced": (m) => `synced ${String(m.rows ?? 0)} Meta insight rows`,
};

function describe(action: string, meta: Record<string, unknown> | undefined) {
  return DESCRIPTIONS[action]?.(meta ?? {}) ?? action.replace(/[._]/g, " ");
}

function linkFor(
  entity: string,
  entityId: string | null,
  meta: Record<string, unknown> | undefined,
  portal: boolean,
) {
  if (entity === "post" && entityId)
    return portal ? `/portal/posts/${entityId}` : `/admin/posts/${entityId}`;
  if (entity === "comment" && typeof meta?.postId === "string") {
    return portal ? `/portal/posts/${meta.postId}` : `/admin/posts/${meta.postId}`;
  }
  if (entity === "report") return portal ? "/portal/reports" : null;
  if (entity === "lead" && !portal) return "/admin/leads";
  return null;
}

/**
 * Recent activity. Pass the client ids the viewer is allowed to see (already authorized). For
 * client users, `portal` hides internal-only actions like drafts and user management.
 */
export async function listActivity(opts: {
  clientIds: Types.ObjectId[] | null;
  limit?: number;
  portal?: boolean;
}): Promise<ActivityItem[]> {
  const filter: Record<string, unknown> = {};
  if (opts.clientIds) filter.clientId = { $in: opts.clientIds };
  if (opts.portal) {
    filter.action = {
      $in: [
        "post.sent_for_approval",
        "post.approved",
        "post.changes_requested",
        "post.published",
        "comment.created",
        "report.generated",
        "report.sent",
      ],
    };
  }
  const rows = await ActivityLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(opts.limit ?? 10)
    .lean();
  const actorIds = [...new Set(rows.map((r) => r.actorId?.toString()).filter(Boolean))] as string[];
  const actors = await User.find({ _id: { $in: actorIds } }, { name: 1 }).lean();
  const names = new Map(actors.map((a) => [a._id.toString(), a.name]));
  return rows.map((r) => {
    const meta = r.meta as Record<string, unknown> | undefined;
    const entityId = r.entityId?.toString() ?? null;
    return {
      id: r._id.toString(),
      action: r.action,
      description: describe(r.action, meta),
      actorName: r.actorId ? (names.get(r.actorId.toString()) ?? "Someone") : "System",
      clientId: r.clientId?.toString() ?? null,
      link: linkFor(r.entity, entityId, meta, !!opts.portal),
      createdAt: r.createdAt.toISOString(),
    };
  });
}
