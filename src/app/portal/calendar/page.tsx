import type { Metadata } from "next";
import { PageTitle } from "@/components/app-shell/page-header";
import { CalendarLoader } from "@/components/portal/calendar-loader";
import { requirePortalContext } from "@/server/portal";

export const metadata: Metadata = { title: "Content calendar" };

export default async function CalendarPage() {
  const ctx = await requirePortalContext();
  return (
    <>
      <PageTitle
        title="Content calendar"
        description={`Scheduled posts for ${ctx.client.name}. Click a post to see details.`}
      />
      <CalendarLoader />
    </>
  );
}
