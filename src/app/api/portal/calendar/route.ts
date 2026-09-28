import { NextResponse, type NextRequest } from "next/server";
import { apiError, noStore } from "@/server/api";
import { assertUser } from "@/server/permissions";
import { getPortalContextFor } from "@/server/portal";
import { listCalendarEvents } from "@/server/posts";

export const dynamic = "force-dynamic";

const MAX_WINDOW_MS = 62 * 24 * 60 * 60 * 1000;

/** FullCalendar event feed for the portal's current client (`?start=ISO&end=ISO`). */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getPortalContextFor(await assertUser());
    if (!ctx) return NextResponse.json([], { headers: noStore });
    const start = new Date(request.nextUrl.searchParams.get("start") ?? "");
    const end = new Date(request.nextUrl.searchParams.get("end") ?? "");
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start ||
      end.getTime() - start.getTime() > MAX_WINDOW_MS
    ) {
      return NextResponse.json({ error: "Invalid range" }, { status: 400 });
    }
    const events = await listCalendarEvents(ctx.user, ctx.clientId, start, end);
    return NextResponse.json(events, { headers: noStore });
  } catch (error) {
    return apiError(error);
  }
}
