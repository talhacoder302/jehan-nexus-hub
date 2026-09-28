import { Schema, model, models, type Model, type Types } from "mongoose";
import { TOKEN_PURPOSES, type TokenPurpose } from "@/lib/constants";

/** Single-use tokens for invites and password resets. Only a SHA-256 hash is stored. */
export interface IVerificationToken {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  purpose: TokenPurpose;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const verificationTokenSchema = new Schema<IVerificationToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    purpose: { type: String, enum: TOKEN_PURPOSES, required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

verificationTokenSchema.index({ userId: 1, purpose: 1 });
// MongoDB removes expired tokens automatically.
verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const VerificationToken: Model<IVerificationToken> =
  (models.VerificationToken as Model<IVerificationToken>) ??
  model<IVerificationToken>("VerificationToken", verificationTokenSchema);
