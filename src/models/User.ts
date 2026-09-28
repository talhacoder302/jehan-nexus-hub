import { Schema, model, models, type Model, type Types } from "mongoose";
import { USER_ROLES, USER_STATUSES, type UserRole, type UserStatus } from "@/lib/constants";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  image?: string;
  role: UserRole;
  clientId?: Types.ObjectId | null;
  status: UserStatus;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    image: { type: String },
    role: { type: String, enum: USER_ROLES, required: true, default: "client" },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", default: null },
    status: { type: String, enum: USER_STATUSES, required: true, default: "invited" },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.index({ clientId: 1, role: 1 });
userSchema.index({ role: 1, status: 1 });

// Client users must belong to a client; staff must not.
userSchema.pre("validate", function () {
  if (this.role === "client" && !this.clientId) {
    this.invalidate("clientId", "Client users must have a clientId");
  }
  if (this.role !== "client") this.clientId = null;
});

export const User: Model<IUser> = (models.User as Model<IUser>) ?? model<IUser>("User", userSchema);
