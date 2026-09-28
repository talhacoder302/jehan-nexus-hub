import { Building2, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageTitle } from "@/components/app-shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listClients } from "@/server/clients";
import { requireStaffPage } from "@/server/permissions";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const user = await requireStaffPage();
  const clients = await listClients(user);
  const isAdmin = user.role === "admin";

  return (
    <>
      <PageTitle
        title="Clients"
        description={isAdmin ? "All agency clients." : "Clients assigned to you."}
        actions={
          isAdmin ? (
            <Button asChild>
              <Link href="/admin/clients/new">
                <Plus /> New client
              </Link>
            </Button>
          ) : null
        }
      />
      {clients.length === 0 ? (
        <EmptyState
          icon={<Building2 />}
          title="No clients yet"
          description={
            isAdmin
              ? "Create your first client to start planning content."
              : "You haven't been assigned any clients yet."
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="hidden md:table-cell">Plan</TableHead>
                <TableHead className="hidden lg:table-cell">Managers</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Ad accounts</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Users</TableHead>
                <TableHead className="text-right">Pending</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/admin/clients/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {c.industry ?? c.slug}
                      {c.status !== "active" ? (
                        <Badge variant="outline" className="capitalize">
                          {c.status}
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="hidden capitalize md:table-cell">{c.plan}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {c.managers.join(", ") || "Unassigned"}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {c.adAccounts}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {c.users}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.pendingApprovals}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
