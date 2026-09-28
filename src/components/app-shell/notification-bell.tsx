"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { publicEnv } from "@/lib/public-env";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  title: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const POLL_MS = 30_000;

/**
 * Notification bell. Uses Pusher private channels when NEXT_PUBLIC_PUSHER_KEY is configured and
 * falls back to polling /api/notifications every 30 seconds otherwise.
 */
export function NotificationBell({ userId }: { userId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: Item[]; unread: number };
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      // Network hiccup: the next poll or push will catch up.
    }
  }, []);

  useEffect(() => {
    // Initial fetch is deferred a tick so it never blocks hydration.
    const first = setTimeout(load, 0);
    const { pusherKey, pusherCluster } = publicEnv;
    if (!pusherKey || !pusherCluster) {
      const timer = setInterval(load, POLL_MS);
      return () => {
        clearTimeout(first);
        clearInterval(timer);
      };
    }

    let disposed = false;
    let cleanup = () => {};
    void import("pusher-js").then(({ default: Pusher }) => {
      if (disposed) return;
      const pusher = new Pusher(pusherKey, {
        cluster: pusherCluster,
        channelAuthorization: { endpoint: "/api/pusher/auth", transport: "ajax" },
      });
      const channel = pusher.subscribe(`private-user-${userId}`);
      channel.bind("notification", (data: { title?: string }) => {
        if (data.title) toast(data.title);
        void load();
        router.refresh();
      });
      cleanup = () => {
        channel.unbind_all();
        pusher.unsubscribe(`private-user-${userId}`);
        pusher.disconnect();
      };
    });
    return () => {
      disposed = true;
      clearTimeout(first);
      cleanup();
    };
  }, [load, router, userId]);

  const markRead = async (ids?: string[]) => {
    setItems((prev) => prev.map((n) => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)));
    setUnread((u) => (ids ? Math.max(0, u - ids.length) : 0));
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids ? { ids } : {}),
    }).catch(() => undefined);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread ? `Notifications (${unread} unread)` : "Notifications"}
        >
          <Bell className="size-4" />
          {unread ? (
            <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 font-semibold text-primary-foreground tabular-nums">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between pr-1">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {unread ? (
            <Button variant="ghost" size="xs" onClick={() => markRead()}>
              <CheckCheck /> Mark all read
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {items.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="items-start gap-3 py-2.5"
                onSelect={() => {
                  if (!n.read) void markRead([n.id]);
                  if (n.link) router.push(n.link);
                }}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    n.read ? "bg-transparent" : "bg-primary",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm", !n.read && "font-medium")}>{n.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {formatRelative(n.createdAt)}
                  </span>
                </span>
                {!n.read ? <span className="sr-only">Unread</span> : null}
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
