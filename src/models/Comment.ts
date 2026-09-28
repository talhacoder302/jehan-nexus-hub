import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IComment {
  _id: Types.ObjectId;
  postId: Types.ObjectId;
  authorId: Types.ObjectId;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

commentSchema.index({ postId: 1, createdAt: 1 });

export const Comment: Model<IComment> =
  (models.Comment as Model<IComment>) ?? model<IComment>("Comment", commentSchema);
