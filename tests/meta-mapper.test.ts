import { describe, expect, it } from "vitest";
import {
  backoffMs,
  extractConversions,
  extractRoas,
  isRetryableMetaError,
  mapInsightRow,
  normalizeAdAccountId,
  num,
  type MetaInsightRow,
} from "@/lib/meta-mapper";

const baseRow: MetaInsightRow = {
  campaign_id: "120200000000001",
  campaign_name: "Spring Sale",
  date_start: "2026-09-01",
  date_stop: "2026-09-01",
  spend: "123.45",
  impressions: "10000",
  reach: "7500",
  clicks: "250",
  ctr: "2.5",
  cpc: "0.4938",
  cpm: "12.345",
  actions: [
    { action_type: "link_click", value: "200" },
    { action_type: "purchase", value: "12" },
    { action_type: "omni_purchase", value: "12" },
  ],
  purchase_roas: [{ action_type: "omni_purchase", value: "3.21" }],
};

describe("mapInsightRow", () => {
  it("maps a full row", () => {
    const mapped = mapInsightRow(baseRow, "act_987654321");
    expect(mapped).toEqual({
      adAccountId: "987654321",
      campaignId: "120200000000001",
      campaignName: "Spring Sale",
      date: new Date("2026-09-01T00:00:00.000Z"),
      spend: 123.45,
      impressions: 10000,
      reach: 7500,
      clicks: 250,
      ctr: 2.5,
      cpc: 0.4938,
      cpm: 12.345,
      conversions: 12,
      roas: 3.21,
    });
  });

  it("does not double count overlapping purchase action types", () => {
    expect(mapInsightRow(baseRow, "1")?.conversions).toBe(12);
  });

  it("recomputes missing ratios from volumes", () => {
    const mapped = mapInsightRow(
      { ...baseRow, ctr: undefined, cpc: undefined, cpm: undefined },
      "1",
    );
    expect(mapped?.ctr).toBe(2.5);
    expect(mapped?.cpc).toBeCloseTo(0.4938, 4);
    expect(mapped?.cpm).toBeCloseTo(12.345, 3);
  });

  it("handles zero-activity days without dividing by zero", () => {
    const mapped = mapInsightRow(
      {
        campaign_id: "1",
        date_start: "2026-09-02",
        spend: "0",
        impressions: "0",
        clicks: "0",
      },
      "1",
    );
    expect(mapped).toMatchObject({ spend: 0, ctr: 0, cpc: 0, cpm: 0, conversions: 0, roas: 0 });
  });

  it("rejects rows without a campaign or a valid date", () => {
    expect(mapInsightRow({ ...baseRow, campaign_id: undefined }, "1")).toBeNull();
    expect(mapInsightRow({ ...baseRow, date_start: "01/09/2026" }, "1")).toBeNull();
  });

  it("stores dates at UTC midnight", () => {
    expect(mapInsightRow(baseRow, "1")?.date.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });
});

describe("extractConversions", () => {
  it("falls back to leads when there are no purchases", () => {
    expect(
      extractConversions([
        { action_type: "link_click", value: "40" },
        { action_type: "lead", value: "7" },
      ]),
    ).toBe(7);
  });

  it("returns 0 when nothing matches", () => {
    expect(extractConversions([{ action_type: "post_engagement", value: "99" }])).toBe(0);
    expect(extractConversions(undefined)).toBe(0);
  });
});

describe("extractRoas", () => {
  it("prefers Meta's purchase_roas", () => {
    expect(extractRoas(baseRow)).toBe(3.21);
  });

  it("falls back to purchase value divided by spend", () => {
    expect(
      extractRoas({
        spend: "50",
        action_values: [{ action_type: "purchase", value: "200" }],
      }),
    ).toBe(4);
  });

  it("is 0 without purchase data", () => {
    expect(extractRoas({ spend: "50" })).toBe(0);
  });
});

describe("helpers", () => {
  it("parses numbers defensively", () => {
    expect(num("12.5")).toBe(12.5);
    expect(num("abc")).toBe(0);
    expect(num("-3")).toBe(0);
    expect(num(undefined)).toBe(0);
  });

  it("normalizes ad account ids", () => {
    expect(normalizeAdAccountId("act_123")).toBe("123");
    expect(normalizeAdAccountId(" 456 ")).toBe("456");
  });

  it("classifies retryable errors", () => {
    expect(isRetryableMetaError(17, 400)).toBe(true); // user request limit
    expect(isRetryableMetaError(80004, 400)).toBe(true); // ads management throttling
    expect(isRetryableMetaError(2, 500)).toBe(true); // transient
    expect(isRetryableMetaError(190, 400)).toBe(false); // invalid token
    expect(isRetryableMetaError(100, 400)).toBe(false); // invalid parameter
    expect(isRetryableMetaError(undefined, 503)).toBe(true);
  });

  it("backs off exponentially with a cap", () => {
    const noJitter = () => 1; // upper bound
    expect(backoffMs(0, 1000, 20_000, noJitter)).toBe(1000);
    expect(backoffMs(2, 1000, 20_000, noJitter)).toBe(4000);
    expect(backoffMs(10, 1000, 20_000, noJitter)).toBe(20_000);
    expect(backoffMs(3, 1000, 20_000, () => 0)).toBe(4000); // lower bound is half
  });
});
