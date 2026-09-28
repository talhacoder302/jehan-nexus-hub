"use client";

import { FileDown, LoaderCircle, Send } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { generateReportAction } from "@/app/admin/clients/[id]/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { monthLabel } from "@/lib/format";

/** Current month plus the previous 11, newest first. */
function recentMonths(now = new Date()) {
  return Array.from({ length: 12 }, (_, i) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)).toISOString().slice(0, 7),
  );
}

export function GenerateReport({ clientId }: { clientId: string }) {
  const months = recentMonths();
  const [month, setMonth] = useState(months[1]!);
  const [pending, startTransition] = useTransition();

  const run = (send: boolean) =>
    startTransition(async () => {
      const result = await generateReportAction({ clientId, month, send });
      if (result.ok) toast.success(result.message ?? "Report generated");
      else toast.error(result.error);
    });

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select value={month} onValueChange={setMonth}>
        <SelectTrigger className="w-44" aria-label="Report month">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m} value={m}>
              {monthLabel(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" disabled={pending} onClick={() => run(false)}>
        {pending ? <LoaderCircle className="animate-spin" /> : <FileDown />}
        Generate
      </Button>
      <Button disabled={pending} onClick={() => run(true)}>
        <Send /> Generate &amp; email client
      </Button>
    </div>
  );
}
