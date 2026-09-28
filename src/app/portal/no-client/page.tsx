import { Building2 } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { isStaff } from "@/lib/permissions";
import { requireUser } from "@/server/permissions";

export default async function NoClientPage() {
  const user = await requireUser();
  return (
    <EmptyState
      icon={<Building2 />}
      title="No client to show yet"
      description={
        isStaff(user.role)
          ? "Create a client (or get assigned to one) to preview their portal."
          : "Your account isn't linked to a client. Please contact your account manager."
      }
      action={
        isStaff(user.role) ? (
          <Button asChild>
            <Link href="/admin/clients">Go to clients</Link>
          </Button>
        ) : null
      }
    />
  );
}
