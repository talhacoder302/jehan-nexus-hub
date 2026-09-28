import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/server/api";
import { assertUser } from "@/server/permissions";
import { authorizeChannel, userChannel } from "@/server/pusher";

/** Authorizes Pusher private channels. Users may only subscribe to their own channel. */
export async function POST(request: NextRequest) {
  try {
    const user = await assertUser();
    const form = await request.formData();
    const socketId = form.get("socket_id");
    const channel = form.get("channel_name");
    if (typeof socketId !== "string" || typeof channel !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (channel !== userChannel(user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const auth = authorizeChannel(socketId, channel);
    if (!auth) return NextResponse.json({ error: "Realtime not configured" }, { status: 503 });
    return NextResponse.json(auth);
  } catch (error) {
    return apiError(error);
  }
}
