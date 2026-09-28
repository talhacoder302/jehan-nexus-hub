import "server-only";
import type { Types } from "mongoose";
import type { ActivityEntity } from "@/lib/constants";
import { ActivityLog } from "@/models";

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
