/**
 * Date ranges for insight queries. All ranges are whole UTC days, `from` inclusive and `to`
 * exclusive. Pure functions so they can be shared by pages, API routes and tests.
 */
export const DAY_MS = 24 * 60 * 60 * 1000;
export const RANGE_PRESETS = [7, 14, 30, 90] as const;
export const MAX_RANGE_DAYS = 366;

export interface DateRange {
  from: Date;
  to: Date;
}

export function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function toIsoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** The last `days` complete days, ending yesterday (today's data is still incomplete). */
export function lastNDays(days: number, now = new Date()): DateRange {
  const to = utcMidnight(now);
  return { from: new Date(to.getTime() - days * DAY_MS), to };
}

/** The equally long period immediately before `range`. */
export function previousPeriod(range: DateRange): DateRange {
  const length = range.to.getTime() - range.from.getTime();
  return { from: new Date(range.from.getTime() - length), to: range.from };
}

export function rangeDays(range: DateRange): number {
  return Math.round((range.to.getTime() - range.from.getTime()) / DAY_MS);
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function parseDay(value: unknown): Date | null {
  if (typeof value !== "string" || !ISO_DAY.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Reads `?from=YYYY-MM-DD&to=YYYY-MM-DD` (inclusive end date as shown to users) or `?days=N`.
 * Invalid, reversed or overly long input falls back to the last 30 days.
 */
export function parseRangeParams(
  params: Record<string, string | string[] | undefined>,
  now = new Date(),
): { range: DateRange; preset: number | null } {
  const from = parseDay(params.from);
  const toInclusive = parseDay(params.to);
  if (from && toInclusive) {
    const to = new Date(toInclusive.getTime() + DAY_MS);
    const days = (to.getTime() - from.getTime()) / DAY_MS;
    if (days >= 1 && days <= MAX_RANGE_DAYS) return { range: { from, to }, preset: null };
  }
  const days = Number(params.days);
  const preset = RANGE_PRESETS.find((p) => p === days) ?? 30;
  return { range: lastNDays(preset, now), preset };
}

/** Every UTC day in the range, as ISO strings (used to zero-fill chart series). */
export function eachDay(range: DateRange): string[] {
  const out: string[] = [];
  for (let t = range.from.getTime(); t < range.to.getTime(); t += DAY_MS)
    out.push(toIsoDay(new Date(t)));
  return out;
}
