import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IAdInsightDaily {
  _id: Types.ObjectId;
  clientId: Types.ObjectId;
  adAccountId: string;
  campaignId: string;
  campaignName: string;
  /** UTC midnight of the reporting day. */
  date: Date;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  roas: number;
  createdAt: Date;
  updatedAt: Date;
}

const num = { type: Number, default: 0, min: 0 };

const adInsightDailySchema = new Schema<IAdInsightDaily>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    adAccountId: { type: String, required: true },
    campaignId: { type: String, required: true },
    campaignName: { type: String, default: "" },
    date: { type: Date, required: true },
    spend: num,
    impressions: num,
    reach: num,
    clicks: num,
    ctr: num,
    cpc: num,
    cpm: num,
    conversions: num,
    roas: num,
  },
  { timestamps: true },
);

adInsightDailySchema.index({ adAccountId: 1, campaignId: 1, date: 1 }, { unique: true });
adInsightDailySchema.index({ clientId: 1, date: 1 });

export const AdInsightDaily: Model<IAdInsightDaily> =
  (models.AdInsightDaily as Model<IAdInsightDaily>) ??
  model<IAdInsightDaily>("AdInsightDaily", adInsightDailySchema);
