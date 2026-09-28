/** Display formatting helpers shared by server and client components. */

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const currencyPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("en-US");

export const fmt = {
  money: (n: number) => currency.format(n),
  moneyPrecise: (n: number) => currencyPrecise.format(n),
  compact: (n: number) => compact.format(n),
  int: (n: number) => integer.format(Math.round(n)),
  pct: (n: number) => `${n.toFixed(2)}%`,
  roas: (n: number) => `${n.toFixed(2)}x`,
};

export function formatDate(
  value: string | Date,
  opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) {
  return new Intl.DateTimeFormat("en-US", opts).format(
    typeof value === "string" ? new Date(value) : value,
  );
}

export function formatDateTime(value: string | Date) {
  return formatDate(value, { dateStyle: "medium", timeStyle: "short" });
}

export function formatRelative(value: string | Date, now = Date.now()) {
  const date = typeof value === "string" ? new Date(value) : value;
  const diff = Math.round((date.getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(diff, "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return formatDate(date);
}

export function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return formatDate(new Date(Date.UTC(y!, m! - 1, 1)), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
