import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/server/api";
import { assertUser } from "@/server/permissions";
import { getReportDownload } from "@/server/reports";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Report PDF download for signed-in users with access to the report's client. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/reports/[id]/pdf">) {
  try {
    const user = await assertUser();
    const { id } = await ctx.params;
    const result = await getReportDownload(user, id);
    if ("redirect" in result) return NextResponse.redirect(result.redirect, 302);
    return new NextResponse(new Uint8Array(result.pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
