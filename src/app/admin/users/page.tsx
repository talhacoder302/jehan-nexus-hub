import { Users } from "lucide-react";
import type { Metadata } from "next";
import { InviteUserDialog } from "@/components/admin/invite-user-dialog";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { EmptyState, PageTitle } from "@/components/app-shell/page-header";
import { UserStatusBadge } from "@/components/status-badges";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRelative } from "@/lib/format";
import { listClientOptions } from "@/server/clients";
import { requireStaffPage } from "@/server/permissions";
import { listUsers } from "@/server/users";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const user = await requireStaffPage();
  const [users, clients] = await Promise.all([listUsers(user), listClientOptions(user)]);
  const isAdmin = user.role === "admin";

  return (
    <>
      <PageTitle
        title="Users"
        description={
          isAdmin
            ? "Invite teammates and client users, change roles and disable access."
            : "Client users for your assigned clients."
        }
        actions={<InviteUserDialog clients={clients} canInviteStaff={isAdmin} />}
      />
      {users.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No users yet"
          description="Invite your first client user to give them portal access."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead className="hidden lg:table-cell">Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Last login</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </TableCell>
                  <TableCell className="hidden capitalize md:table-cell">{u.role}</TableCell>
                  <TableCell className="hidden lg:table-cell">{u.clientName ?? "—"}</TableCell>
                  <TableCell>
                    <UserStatusBadge status={u.status} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {u.lastLoginAt ? formatRelative(u.lastLoginAt) : "Never"}
                  </TableCell>
                  <TableCell>
                    <UserRowActions
                      user={{ id: u.id, role: u.role, status: u.status, clientId: u.clientId }}
                      isAdmin={isAdmin}
                      isSelf={u.id === user.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
