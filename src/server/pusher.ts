import "server-only";
import Pusher from "pusher";
import { features, serverEnv } from "@/lib/env";

let client: Pusher | null | undefined;

function getPusher(): Pusher | null {
  if (client !== undefined) return client;
  const env = serverEnv();
  client =
    features().pusher &&
    env.PUSHER_APP_ID &&
    env.PUSHER_KEY &&
    env.PUSHER_SECRET &&
    env.PUSHER_CLUSTER
      ? new Pusher({
          appId: env.PUSHER_APP_ID,
          key: env.PUSHER_KEY,
          secret: env.PUSHER_SECRET,
          cluster: env.PUSHER_CLUSTER,
          useTLS: true,
        })
      : null;
  return client;
}

export const userChannel = (userId: string) => `private-user-${userId}`;

/** Best-effort realtime push. Clients poll every 30s when Pusher isn't configured. */
export async function pushToUsers(
  userIds: string[],
  event: string,
  payload: Record<string, unknown>,
) {
  const pusher = getPusher();
  if (!pusher || !userIds.length) return;
  try {
    // Pusher allows up to 100 channels per trigger.
    for (let i = 0; i < userIds.length; i += 100) {
      await pusher.trigger(userIds.slice(i, i + 100).map(userChannel), event, payload);
    }
  } catch (error) {
    console.error("[pusher] trigger failed", error);
  }
}

/** Signs a private channel subscription for the given socket. */
export function authorizeChannel(socketId: string, channel: string) {
  const pusher = getPusher();
  if (!pusher) return null;
  return pusher.authorizeChannel(socketId, channel);
}
