import { ArrowLeft, Eye } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/admin/client-form";
import { GenerateReport } from "@/components/admin/generate-report";
import { InviteUserDialog } from "@/components/admin/invite-user-dialog";
import { PageTitle } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fmt, formatDate, monthLabel } from "@/lib/format";
import { getClientForEdit, listManagerOptions } from "@/server/clients";
import { AuthorizationError, requireStaffPage } from "@/server/permissions";
import { listReports } from "@/server/reports";

export const metadata: Metadata = { title: "Edit client" };

export default async function EditClientPage(props: PageProps<"/admin/clients/[id]">) {
  const { id } = await props.params;
  const user = await requireStaffPage();
  const client = await getClientForEdit(user, id).catch((error: unknown) => {
    if (error instanceof AuthorizationError) notFound();
    throw error;
  });
  const [managers, reports] = await Promise.all([listManagerOptions(), listReports(client.id)]);

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
      <Card className="mt-6 max-w-5xl">
        <CardHeader>
          <CardTitle>Monthly reports</CardTitle>
          <CardDescription>
            Reports are generated automatically on the 1st. Generate one on demand here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GenerateReport clientId={client.id} />
          {reports.length ? (
            <ul className="divide-y rounded-lg border">
              {reports.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
                >
                  <span className="font-medium">{monthLabel(r.month)}</span>
                  <span className="text-muted-foreground">
                    {fmt.money(r.summary.spend)} spend · {fmt.roas(r.summary.roas)} ROAS ·{" "}
                    {r.sentAt ? `sent ${formatDate(r.sentAt)}` : "not sent"}
                  </span>
                  <a className="text-primary hover:underline" href={`/api/reports/${r.id}/pdf`}>
                    Download PDF
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No reports yet.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
