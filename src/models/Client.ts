import { Schema, model, models, type Model, type Types } from "mongoose";
import { CLIENT_PLANS, CLIENT_STATUSES, type ClientPlan, type ClientStatus } from "@/lib/constants";

export interface IBrandColors {
  primary?: string;
  secondary?: string;
}

export interface IClient {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  logo?: string;
  industry?: string;
  contactEmail?: string;
  brandColors: IBrandColors;
  metaAdAccountIds: string[];
  facebookPageId?: string;
  instagramAccountId?: string;
  assignedManagers: Types.ObjectId[];
  plan: ClientPlan;
  status: ClientStatus;
  createdAt: Date;
  updatedAt: Date;
}

const hexColor = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const clientSchema = new Schema<IClient>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo: { type: String },
    industry: { type: String, trim: true },
    contactEmail: { type: String, lowercase: true, trim: true },
    brandColors: {
      primary: { type: String, match: hexColor },
      secondary: { type: String, match: hexColor },
    },
    // Stored without the "act_" prefix; the Meta client adds it.
    metaAdAccountIds: { type: [String], default: [] },
    facebookPageId: { type: String, trim: true },
    instagramAccountId: { type: String, trim: true },
    assignedManagers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    plan: { type: String, enum: CLIENT_PLANS, default: "growth" },
    status: { type: String, enum: CLIENT_STATUSES, default: "active" },
  },
  { timestamps: true },
);

clientSchema.index({ status: 1, name: 1 });
clientSchema.index({ assignedManagers: 1 });
clientSchema.index({ metaAdAccountIds: 1 });

export const Client: Model<IClient> =
  (models.Client as Model<IClient>) ?? model<IClient>("Client", clientSchema);
