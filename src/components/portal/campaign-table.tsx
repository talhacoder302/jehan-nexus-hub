"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmt } from "@/lib/format";
import { summarizeInsights, type InsightTotals } from "@/lib/metrics";

export interface CampaignTableRow extends InsightTotals {
  campaignId: string;
  campaignName: string;
}

type SortKey = "campaignName" | keyof InsightTotals;

const COLUMNS: {
  key: SortKey;
  label: string;
  format?: (n: number) => string;
  hideBelow?: "md" | "lg";
}[] = [
  { key: "campaignName", label: "Campaign" },
  { key: "spend", label: "Spend", format: fmt.moneyPrecise },
  { key: "impressions", label: "Impressions", format: fmt.int, hideBelow: "lg" },
  { key: "reach", label: "Reach", format: fmt.int, hideBelow: "lg" },
  { key: "clicks", label: "Clicks", format: fmt.int },
  { key: "ctr", label: "CTR", format: fmt.pct, hideBelow: "md" },
  { key: "cpc", label: "CPC", format: fmt.moneyPrecise, hideBelow: "lg" },
  { key: "cpm", label: "CPM", format: fmt.moneyPrecise, hideBelow: "lg" },
  { key: "conversions", label: "Conv.", format: fmt.int, hideBelow: "md" },
  { key: "roas", label: "ROAS", format: fmt.roas },
];

const hideClass = { md: "hidden md:table-cell", lg: "hidden lg:table-cell" } as const;

export function CampaignTable({ rows }: { rows: CampaignTableRow[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "spend",
    dir: "desc",
  });

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp =
        typeof av === "string" && typeof bv === "string"
          ? av.localeCompare(bv)
          : Number(av) - Number(bv);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sort]);

  const totals = useMemo(
    () =>
      summarizeInsights(
        rows.map((r) => ({
          spend: r.spend,
          impressions: r.impressions,
          reach: r.reach,
          clicks: r.clicks,
          conversions: r.conversions,
          roas: r.roas,
        })),
      ),
    [rows],
  );

  const toggle = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "campaignName" ? "asc" : "desc" },
    );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {COLUMNS.map((c) => {
            const active = sort.key === c.key;
            const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
            return (
              <TableHead
                key={c.key}
                className={`${c.hideBelow ? hideClass[c.hideBelow] : ""} ${c.key === "campaignName" ? "" : "text-right"}`}
                aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
              >
                <button
                  type="button"
                  onClick={() => toggle(c.key)}
                  className={`inline-flex items-center gap-1 hover:text-foreground ${active ? "text-foreground" : ""}`}
                >
                  {c.label}
                  <Icon className="size-3.5" aria-hidden="true" />
                </button>
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((r) => (
          <TableRow key={r.campaignId}>
            {COLUMNS.map((c) => (
              <TableCell
                key={c.key}
                className={`${c.hideBelow ? hideClass[c.hideBelow] : ""} ${c.key === "campaignName" ? "max-w-64 truncate font-medium" : "text-right tabular-nums"}`}
              >
                {c.key === "campaignName" ? r.campaignName : c.format!(r[c.key])}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          {COLUMNS.map((c) => (
            <TableCell
              key={c.key}
              className={`${c.hideBelow ? hideClass[c.hideBelow] : ""} ${c.key === "campaignName" ? "font-semibold" : "text-right font-semibold tabular-nums"}`}
            >
              {c.key === "campaignName" ? "Total" : c.format!(totals[c.key])}
            </TableCell>
          ))}
        </TableRow>
      </TableFooter>
    </Table>
  );
}
