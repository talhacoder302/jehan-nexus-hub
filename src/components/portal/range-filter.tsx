"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RANGE_PRESETS } from "@/lib/date-range";
import { cn } from "@/lib/utils";

/** Date range control: presets plus a custom from/to (inclusive), kept in the URL. */
export function RangeFilter({
  preset,
  from,
  to,
}: {
  preset: number | null;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [custom, setCustom] = useState({ from, to });

  const go = (query: string) =>
    startTransition(() => router.push(`${pathname}?${query}`, { scroll: false }));

  return (
    <div
      className={cn("flex flex-col gap-3 lg:flex-row lg:items-center", pending && "opacity-70")}
      aria-busy={pending}
    >
      <div
        role="group"
        aria-label="Date range presets"
        className="inline-flex rounded-lg border p-0.5"
      >
        {RANGE_PRESETS.map((d) => (
          <Button
            key={d}
            size="sm"
            variant={preset === d ? "secondary" : "ghost"}
            aria-pressed={preset === d}
            onClick={() => go(`days=${d}`)}
          >
            {d}d
          </Button>
        ))}
      </div>
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (custom.from && custom.to && custom.from <= custom.to)
            go(`from=${custom.from}&to=${custom.to}`);
        }}
      >
        <label className="sr-only" htmlFor="range-from">
          From
        </label>
        <Input
          id="range-from"
          type="date"
          value={custom.from}
          max={custom.to}
          onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
          className="h-8 w-40"
        />
        <span className="text-sm text-muted-foreground">to</span>
        <label className="sr-only" htmlFor="range-to">
          To
        </label>
        <Input
          id="range-to"
          type="date"
          value={custom.to}
          min={custom.from}
          onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
          className="h-8 w-40"
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={!custom.from || !custom.to || custom.from > custom.to}
        >
          Apply
        </Button>
      </form>
    </div>
  );
}
