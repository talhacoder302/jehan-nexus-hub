"use client";

import { MoreHorizontal } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { changeUserRoleAction, setUserDisabledAction } from "@/app/admin/users/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserRole, UserStatus } from "@/lib/constants";

export function UserRowActions({
  user,
  isAdmin,
  isSelf,
}: {
  user: { id: string; role: UserRole; status: UserStatus; clientId: string | null };
  isAdmin: boolean;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    startTransition(async () => {
      const result = await fn();
      if (result.ok) toast.success(result.message ?? "Saved");
      else toast.error(result.error ?? "Something went wrong");
    });

  if (isSelf) return <span className="text-xs text-muted-foreground">You</span>;

  const staffRoles: UserRole[] = ["admin", "manager"];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="User actions" disabled={pending}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isAdmin && user.role !== "client" ? (
          <>
            <DropdownMenuLabel>Change role</DropdownMenuLabel>
            {staffRoles
              .filter((r) => r !== user.role)
              .map((r) => (
                <DropdownMenuItem
                  key={r}
                  onSelect={() => run(() => changeUserRoleAction({ userId: user.id, role: r }))}
                >
                  Make {r}
                </DropdownMenuItem>
              ))}
            <DropdownMenuSeparator />
          </>
        ) : null}
        {user.status === "disabled" ? (
          <DropdownMenuItem
            onSelect={() => run(() => setUserDisabledAction({ userId: user.id, disabled: false }))}
          >
            Re-enable user
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => run(() => setUserDisabledAction({ userId: user.id, disabled: true }))}
          >
            Disable user
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
