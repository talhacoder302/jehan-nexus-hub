import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IReportSummary {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  roas: number;
  postsPublished: number;
}

export interface IReport {
  _id: Types.ObjectId;
  clientId: Types.ObjectId;
  /** YYYY-MM */
  month: string;
  /** S3 object key/URL when S3 is configured; otherwise null and the PDF is rendered on demand. */
  pdfUrl?: string | null;
  summary: IReportSummary;
  generatedAt: Date;
  sentAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const n = { type: Number, default: 0 };

const reportSchema = new Schema<IReport>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    pdfUrl: { type: String, default: null },
    summary: {
      spend: n,
      impressions: n,
      reach: n,
      clicks: n,
      ctr: n,
      cpc: n,
      cpm: n,
      conversions: n,
      roas: n,
      postsPublished: n,
    },
    generatedAt: { type: Date, required: true, default: () => new Date() },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

reportSchema.index({ clientId: 1, month: -1 }, { unique: true });

export const Report: Model<IReport> =
  (models.Report as Model<IReport>) ?? model<IReport>("Report", reportSchema);
