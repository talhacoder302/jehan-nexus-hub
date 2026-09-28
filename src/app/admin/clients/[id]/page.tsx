import { ArrowLeft, Eye } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/admin/client-form";
import { InviteUserDialog } from "@/components/admin/invite-user-dialog";
import { PageTitle } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { getClientForEdit, listManagerOptions } from "@/server/clients";
import { AuthorizationError, requireStaffPage } from "@/server/permissions";

export const metadata: Metadata = { title: "Edit client" };

export default async function EditClientPage(props: PageProps<"/admin/clients/[id]">) {
  const { id } = await props.params;
  const user = await requireStaffPage();
  const client = await getClientForEdit(user, id).catch((error: unknown) => {
    if (error instanceof AuthorizationError) notFound();
    throw error;
  });
  const managers = await listManagerOptions();

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/admin/clients">
          <ArrowLeft /> Clients
        </Link>
      </Button>
      <PageTitle
        title={client.name}
        description="Client details, Meta accounts and assignments."
        actions={
          <>
            <InviteUserDialog
              clients={[{ id: client.id, name: client.name }]}
              canInviteStaff={false}
              defaultClientId={client.id}
            />
            <Button asChild variant="outline">
              <Link href={`/admin/posts?client=${client.id}`}>
                <Eye /> Posts
              </Link>
            </Button>
          </>
        }
      />
      <ClientForm
        clientId={client.id}
        isAdmin={user.role === "admin"}
        managers={managers}
        defaults={{
          name: client.name,
          slug: client.slug,
          logo: client.logo,
          industry: client.industry,
          contactEmail: client.contactEmail,
          brandPrimary: client.brandPrimary,
          brandSecondary: client.brandSecondary,
          metaAdAccountIds: client.metaAdAccountIds,
          facebookPageId: client.facebookPageId,
          instagramAccountId: client.instagramAccountId,
          assignedManagers: client.assignedManagers,
          plan: client.plan,
          status: client.status,
        }}
      />
    </>
  );
}
