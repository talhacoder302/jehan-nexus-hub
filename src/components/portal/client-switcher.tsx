"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { switchPortalClientAction } from "@/app/portal/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ClientSwitcher({
  clients,
  value,
}: {
  clients: { id: string; name: string }[];
  value: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Select
      value={value}
      disabled={pending}
      onValueChange={(next) =>
        startTransition(async () => {
          const result = await switchPortalClientAction(next);
          if (!result.ok) toast.error(result.error);
        })
      }
    >
      <SelectTrigger className="h-8 w-48 sm:w-60" aria-label="Viewing client">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {clients.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
