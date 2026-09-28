import { PageTitle } from "@/components/app-shell/page-header";
import { requireStaffPage } from "@/server/permissions";

export default async function AdminOverviewPage() {
  const user = await requireStaffPage();
  return <PageTitle title="Overview" description={`Signed in as ${user.name} (${user.role})`} />;
}
