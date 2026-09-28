import { describe, expect, it } from "vitest";
import { eachDay, lastNDays, parseRangeParams, previousPeriod, rangeDays } from "@/lib/date-range";
import { percentChange, summarizeInsights } from "@/lib/metrics";

describe("summarizeInsights", () => {
  it("recomputes ratios from totals instead of averaging them", () => {
    const totals = summarizeInsights([
      { spend: 100, impressions: 10_000, reach: 8000, clicks: 100, conversions: 5, roas: 2 },
      { spend: 300, impressions: 10_000, reach: 9000, clicks: 300, conversions: 15, roas: 4 },
    ]);
    expect(totals).toEqual({
      spend: 400,
      impressions: 20_000,
      reach: 17_000,
      clicks: 400,
      ctr: 2,
      cpc: 1,
      cpm: 20,
      conversions: 20,
      // revenue = 100*2 + 300*4 = 1400 → 1400 / 400
      roas: 3.5,
    });
  });

  it("returns zeros for no data", () => {
    expect(summarizeInsights([])).toMatchObject({ spend: 0, ctr: 0, cpc: 0, roas: 0 });
  });

  it("computes percent change and handles an empty baseline", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
    expect(percentChange(10, 0)).toBeNull();
  });
});

describe("date ranges", () => {
  const now = new Date("2026-09-28T15:30:00Z");

  it("builds the last N complete days", () => {
    const r = lastNDays(30, now);
    expect(r.to.toISOString()).toBe("2026-09-28T00:00:00.000Z");
    expect(r.from.toISOString()).toBe("2026-08-29T00:00:00.000Z");
    expect(rangeDays(r)).toBe(30);
    expect(eachDay(r)).toHaveLength(30);
  });

  it("builds the previous period of equal length", () => {
    const p = previousPeriod(lastNDays(7, now));
    expect(p.to.toISOString()).toBe("2026-09-21T00:00:00.000Z");
    expect(rangeDays(p)).toBe(7);
  });

  it("parses custom and preset ranges and rejects bad input", () => {
    const custom = parseRangeParams({ from: "2026-08-01", to: "2026-08-31" }, now);
    expect(custom.preset).toBeNull();
    expect(rangeDays(custom.range)).toBe(31);

    expect(parseRangeParams({ days: "7" }, now).preset).toBe(7);
    expect(parseRangeParams({ days: "13" }, now).preset).toBe(30);
    expect(parseRangeParams({ from: "2026-09-10", to: "2026-09-01" }, now).preset).toBe(30);
    expect(parseRangeParams({ from: "2020-01-01", to: "2026-01-01" }, now).preset).toBe(30);
    expect(parseRangeParams({ from: "<script>", to: "2026-01-01" }, now).preset).toBe(30);
  });
});
