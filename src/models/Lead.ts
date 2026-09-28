import { Schema, model, models, type Model, type Types } from "mongoose";
import {
  BUDGET_OPTIONS,
  LEAD_STATUSES,
  SERVICE_OPTIONS,
  type BudgetOption,
  type LeadStatus,
  type ServiceOption,
} from "@/lib/constants";

export interface ILead {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service: ServiceOption;
  budget?: BudgetOption;
  message: string;
  source: string;
  status: LeadStatus;
  /** SHA-256 of the submitter IP, used only for rate limiting. */
  ipHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    service: { type: String, enum: SERVICE_OPTIONS, required: true },
    budget: { type: String, enum: BUDGET_OPTIONS },
    message: { type: String, required: true, maxlength: 5000 },
    source: { type: String, default: "website" },
    status: { type: String, enum: LEAD_STATUSES, default: "new" },
    ipHash: { type: String, select: false },
  },
  { timestamps: true },
);

leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ ipHash: 1, createdAt: -1 });

export const Lead: Model<ILead> = (models.Lead as Model<ILead>) ?? model<ILead>("Lead", leadSchema);
