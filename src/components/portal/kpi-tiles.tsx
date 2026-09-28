import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { fmt } from "@/lib/format";
import type { InsightTotals } from "@/lib/metrics";
import { cn } from "@/lib/utils";

export type KpiDef = {
  key: keyof InsightTotals;
  label: string;
  format: keyof typeof fmt;
  /** For cost metrics a decrease is good. */
  lowerIsBetter?: boolean;
};

export const DEFAULT_KPIS: KpiDef[] = [
  { key: "spend", label: "Spend", format: "money" },
  { key: "reach", label: "Reach", format: "compact" },
  { key: "clicks", label: "Clicks", format: "int" },
  { key: "ctr", label: "CTR", format: "pct" },
  { key: "roas", label: "ROAS", format: "roas" },
];

/**
 * Stat tiles: the value is the headline; the delta vs the previous period carries an arrow icon
 * and a text label, so direction never relies on color alone.
 */
export function KpiTiles({
  current,
  change,
  periodLabel,
  kpis = DEFAULT_KPIS,
}: {
  current: InsightTotals;
  change: Partial<Record<keyof InsightTotals, number | null>>;
  periodLabel: string;
  kpis?: KpiDef[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {kpis.map((k) => {
        const delta = change[k.key] ?? null;
        const neutral = delta === null || delta === 0;
        const good = !neutral && (k.lowerIsBetter ? delta! < 0 : delta! > 0);
        const Icon = neutral ? Minus : delta! > 0 ? ArrowUpRight : ArrowDownRight;
        return (
          <Card key={k.key} className="gap-1 p-4">
            <p className="text-sm text-muted-foreground">{k.label}</p>
            <p className="font-heading text-2xl font-semibold tabular-nums">
              {fmt[k.format](current[k.key])}
            </p>
            <p
              className={cn(
                "flex items-center gap-1 text-xs",
                neutral ? "text-muted-foreground" : good ? "text-success" : "text-destructive",
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              <span className="font-medium tabular-nums">
                {delta === null ? "No prior data" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`}
              </span>
              {delta !== null ? <span className="text-muted-foreground">{periodLabel}</span> : null}
              <span className="sr-only">{neutral ? "" : good ? "(improved)" : "(declined)"}</span>
            </p>
          </Card>
        );
      })}
    </div>
  );
}
