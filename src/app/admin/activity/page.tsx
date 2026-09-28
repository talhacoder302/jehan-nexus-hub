import type { Metadata } from "next";
import { PageTitle } from "@/components/app-shell/page-header";
import { ActivityFeed } from "@/components/portal/activity-feed";
import { Card, CardContent } from "@/components/ui/card";
import { listActivity } from "@/server/activity";
import { listClientOptions } from "@/server/clients";
import { requireStaffPage, visibleClientIds } from "@/server/permissions";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const user = await requireStaffPage();
  const [ids, clients] = await Promise.all([visibleClientIds(user), listClientOptions(user)]);
  // Admins also see agency-level events (leads, user management) that have no client.
  const items = await listActivity({ clientIds: user.role === "admin" ? null : ids, limit: 100 });
  const names = new Map(clients.map((c) => [c.id, c.name]));

  return (
    <>
      <PageTitle
        title="Activity log"
        description="Every create, update and approval, newest first."
      />
      <Card>
        <CardContent>
          <ActivityFeed items={items} clientNames={names} emptyText="No activity yet." />
        </CardContent>
      </Card>
    </>
  );
}
