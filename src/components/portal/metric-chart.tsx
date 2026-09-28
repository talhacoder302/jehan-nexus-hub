"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmt, formatDate } from "@/lib/format";

export type MetricFormat = "money" | "int" | "pct" | "roas";

export interface MetricPoint {
  date: string;
  value: number;
}

const formatters: Record<MetricFormat, (n: number) => string> = {
  money: fmt.money,
  int: fmt.int,
  pct: fmt.pct,
  roas: fmt.roas,
};

const axisFormatters: Record<MetricFormat, (n: number) => string> = {
  money: (n) => (n >= 1000 ? `$${fmt.compact(n)}` : `$${Math.round(n)}`),
  int: (n) => fmt.compact(n),
  pct: (n) => `${n}%`,
  roas: (n) => `${n}x`,
};

const shortDate = (iso: string) =>
  formatDate(`${iso}T00:00:00Z`, { month: "short", day: "numeric", timeZone: "UTC" });

function ChartTooltip({
  active,
  payload,
  label,
  metricLabel,
  format,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: unknown }>;
  label?: unknown;
  metricLabel: string;
  format: MetricFormat;
}) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0]?.value ?? 0);
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="text-xs text-muted-foreground">
        {typeof label === "string"
          ? formatDate(`${label}T00:00:00Z`, { dateStyle: "medium", timeZone: "UTC" })
          : ""}
      </p>
      <p className="mt-0.5 flex items-center gap-2">
        <span aria-hidden="true" className="size-2 rounded-full bg-chart-1" />
        <span className="text-muted-foreground">{metricLabel}</span>
        <span className="ml-auto font-semibold tabular-nums">{formatters[format](value)}</span>
      </p>
    </div>
  );
}

/**
 * One metric over time. Each measure gets its own chart and y-axis (never a dual axis). Uses the
 * validated `--chart-1` series color, a recessive grid, 2px lines and a crosshair tooltip.
 */
export function MetricChart({
  data,
  label,
  format,
  kind = "area",
  height = 240,
}: {
  data: MetricPoint[];
  label: string;
  format: MetricFormat;
  kind?: "area" | "line" | "bar";
  height?: number;
}) {
  const common = {
    data,
    margin: { top: 8, right: 8, bottom: 0, left: 0 },
    accessibilityLayer: true,
  };
  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
      <XAxis
        dataKey="date"
        tickFormatter={shortDate}
        tickLine={false}
        axisLine={false}
        minTickGap={24}
        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
      />
      <YAxis
        tickFormatter={axisFormatters[format]}
        tickLine={false}
        axisLine={false}
        width={52}
        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
      />
      <Tooltip
        cursor={
          kind === "bar"
            ? { fill: "var(--muted)", opacity: 0.6 }
            : { stroke: "var(--muted-foreground)", strokeDasharray: "4 4" }
        }
        content={(props) => (
          <ChartTooltip
            active={props.active}
            payload={props.payload}
            label={props.label}
            metricLabel={label}
            format={format}
          />
        )}
      />
    </>
  );

  return (
    <div role="img" aria-label={`${label} over time`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {kind === "bar" ? (
          <BarChart {...common} barCategoryGap={2}>
            {axes}
            <Bar
              dataKey="value"
              name={label}
              fill="var(--chart-1)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        ) : kind === "line" ? (
          <LineChart {...common}>
            {axes}
            <Line
              dataKey="value"
              name={label}
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            />
          </LineChart>
        ) : (
          <AreaChart {...common}>
            <defs>
              <linearGradient id={`fill-${label.replace(/\W/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            {axes}
            <Area
              dataKey="value"
              name={label}
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill={`url(#fill-${label.replace(/\W/g, "")})`}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
