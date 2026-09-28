import { Schema, model, models, type Model, type Types } from "mongoose";
import { ACTIVITY_ENTITIES, type ActivityEntity } from "@/lib/constants";

export interface IActivityLog {
  _id: Types.ObjectId;
  actorId?: Types.ObjectId | null;
  clientId?: Types.ObjectId | null;
  /** e.g. "post.created", "post.approved", "client.updated" */
  action: string;
  entity: ActivityEntity;
  entityId?: Types.ObjectId | null;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", default: null },
    action: { type: String, required: true },
    entity: { type: String, enum: ACTIVITY_ENTITIES, required: true },
    entityId: { type: Schema.Types.ObjectId, default: null },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

activityLogSchema.index({ clientId: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

export const ActivityLog: Model<IActivityLog> =
  (models.ActivityLog as Model<IActivityLog>) ??
  model<IActivityLog>("ActivityLog", activityLogSchema);
