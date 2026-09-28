import type { Metadata } from "next";
import { ClientForm } from "@/components/admin/client-form";
import { PageTitle } from "@/components/app-shell/page-header";
import { listManagerOptions } from "@/server/clients";
import { requireAdminPage } from "@/server/permissions";

export const metadata: Metadata = { title: "New client" };

export default async function NewClientPage() {
  await requireAdminPage();
  const managers = await listManagerOptions();
  return (
    <>
      <PageTitle
        title="New client"
        description="Add a client, their Meta accounts and assigned managers."
      />
      <ClientForm
        clientId={null}
        isAdmin
        managers={managers}
        defaults={{
          name: "",
          slug: "",
          logo: "",
          industry: "",
          contactEmail: "",
          brandPrimary: "",
          brandSecondary: "",
          metaAdAccountIds: "",
          facebookPageId: "",
          instagramAccountId: "",
          assignedManagers: [],
          plan: "growth",
          status: "active",
        }}
      />
    </>
  );
}
