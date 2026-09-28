import { PageTitle } from "@/components/app-shell/page-header";
import { requirePortalContext } from "@/server/portal";

export default async function PortalDashboardPage() {
  const ctx = await requirePortalContext();
  return (
    <PageTitle title={`Welcome, ${ctx.user.name.split(" ")[0]}`} description={ctx.client.name} />
  );
}
