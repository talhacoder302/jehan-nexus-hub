import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, noStore } from "@/server/api";
import { listNotifications, markNotificationsRead } from "@/server/notifications";
import { assertUser } from "@/server/permissions";

export const dynamic = "force-dynamic";

/** Latest notifications for the signed-in user (also used as the 30s polling fallback). */
export async function GET() {
  try {
    const user = await assertUser();
    return NextResponse.json(await listNotifications(user.id), { headers: noStore });
  } catch (error) {
    return apiError(error);
  }
}

const markSchema = z.object({
  ids: z
    .array(z.string().regex(/^[a-f\d]{24}$/i))
    .max(100)
    .optional(),
});

/** Marks notifications as read: `{ ids: [...] }` or `{}` for all. */
export async function POST(request: NextRequest) {
  try {
    const user = await assertUser();
    const parsed = markSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    await markNotificationsRead(user.id, parsed.data.ids);
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (error) {
    return apiError(error);
  }
}
