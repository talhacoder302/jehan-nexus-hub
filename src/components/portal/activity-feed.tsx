import Link from "next/link";
import { formatRelative } from "@/lib/format";
import type { ActivityItem } from "@/server/activity";

export function ActivityFeed({
  items,
  emptyText,
  clientNames,
}: {
  items: ActivityItem[];
  emptyText: string;
  clientNames?: Map<string, string>;
}) {
  if (!items.length) return <p className="py-4 text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <ol className="relative space-y-4 border-l pl-5">
      {items.map((a) => {
        const text = (
          <>
            <span className="font-medium">{a.actorName}</span> {a.description}
            {clientNames && a.clientId && clientNames.get(a.clientId) ? (
              <span className="text-muted-foreground"> · {clientNames.get(a.clientId)}</span>
            ) : null}
          </>
        );
        return (
          <li key={a.id} className="relative">
            <span
              aria-hidden="true"
              className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-background bg-primary"
            />
            <p className="text-sm">
              {a.link ? (
                <Link href={a.link} className="hover:underline">
                  {text}
                </Link>
              ) : (
                text
              )}
            </p>
            <p className="text-xs text-muted-foreground">{formatRelative(a.createdAt)}</p>
          </li>
        );
      })}
    </ol>
  );
}
