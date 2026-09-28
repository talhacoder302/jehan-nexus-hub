import { Schema, model, models, type Model, type Types } from "mongoose";
import { PLATFORMS, POST_STATUSES, type Platform, type PostStatus } from "@/lib/constants";

export interface IPost {
  _id: Types.ObjectId;
  clientId: Types.ObjectId;
  title: string;
  caption: string;
  platforms: Platform[];
  mediaUrls: string[];
  scheduledAt: Date;
  status: PostStatus;
  createdBy: Types.ObjectId;
  approvedBy?: Types.ObjectId | null;
  approvedAt?: Date | null;
  revisionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    caption: { type: String, default: "", maxlength: 5000 },
    platforms: {
      type: [{ type: String, enum: PLATFORMS }],
      validate: [(v: string[]) => v.length > 0, "At least one platform is required"],
    },
    mediaUrls: { type: [String], default: [] },
    scheduledAt: { type: Date, required: true },
    status: { type: String, enum: POST_STATUSES, default: "draft", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    revisionCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

postSchema.index({ clientId: 1, scheduledAt: 1 });
postSchema.index({ clientId: 1, status: 1, scheduledAt: 1 });
postSchema.index({ status: 1, scheduledAt: 1 });

export const Post: Model<IPost> = (models.Post as Model<IPost>) ?? model<IPost>("Post", postSchema);
