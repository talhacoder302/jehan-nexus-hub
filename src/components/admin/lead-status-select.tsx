"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateLeadStatusAction } from "@/app/admin/leads/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/constants";

export function LeadStatusSelect({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const [pending, startTransition] = useTransition();
  return (
    <Select
      value={status}
      disabled={pending}
      onValueChange={(next) =>
        startTransition(async () => {
          const result = await updateLeadStatusAction({ leadId, status: next });
          if (result.ok) toast.success(result.message ?? "Updated");
          else toast.error(result.error);
        })
      }
    >
      <SelectTrigger size="sm" className="w-32" aria-label="Lead status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LEAD_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {s[0]!.toUpperCase() + s.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
