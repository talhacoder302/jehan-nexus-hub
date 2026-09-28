import { MessageSquare, Newspaper, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageTitle } from "@/components/app-shell/page-header";
import { PlatformList } from "@/components/portal/platform-list";
import { PostStatusBadge } from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { POST_STATUS_LABELS, POST_STATUSES, type PostStatus } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { listClientOptions } from "@/server/clients";
import { requireStaffPage, visibleClientIds } from "@/server/permissions";
import { listAdminPosts } from "@/server/posts";

export const metadata: Metadata = { title: "Posts" };

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default async function AdminPostsPage(props: PageProps<"/admin/posts">) {
  const user = await requireStaffPage();
  const params = await props.searchParams;
  const clientId = typeof params.client === "string" ? params.client : undefined;
  const status = POST_STATUSES.find((s) => s === params.status) as PostStatus | undefined;
  const [clients, ids] = await Promise.all([listClientOptions(user), visibleClientIds(user)]);
  const posts = await listAdminPosts(user, ids, { clientId, status });

  return (
    <>
      <PageTitle
        title="Posts"
        description="Plan content, send it for client approval and track what's published."
        actions={
          <Button asChild>
            <Link href={clientId ? `/admin/posts/new?client=${clientId}` : "/admin/posts/new"}>
              <Plus /> New post
            </Link>
          </Button>
        }
      />

      <form
        method="get"
        className="mb-4 flex flex-wrap items-center gap-2"
        aria-label="Filter posts"
      >
        <label className="sr-only" htmlFor="filter-client">
          Client
        </label>
        <select
          id="filter-client"
          name="client"
          defaultValue={clientId ?? ""}
          className={selectClass}
        >
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="filter-status">
          Status
        </label>
        <select
          id="filter-status"
          name="status"
          defaultValue={status ?? ""}
          className={selectClass}
        >
          <option value="">All statuses</option>
          {POST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {POST_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" variant="outline">
          Filter
        </Button>
        {clientId || status ? (
          <Button asChild size="sm" variant="ghost">
            <Link href="/admin/posts">Clear</Link>
          </Button>
        ) : null}
      </form>

      {posts.length === 0 ? (
        <EmptyState
          icon={<Newspaper />}
          title="No posts match"
          description="Create a post or change the filters."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Post</TableHead>
                <TableHead className="hidden md:table-cell">Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Scheduled</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="max-w-72">
                    <Link
                      href={`/admin/posts/${p.id}`}
                      className="block truncate font-medium hover:underline"
                    >
                      {p.title}
                    </Link>
                    <PlatformList platforms={p.platforms} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {p.clientName}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <PostStatusBadge status={p.status} />
                      {p.overdue ? (
                        <Badge variant="destructive" className="text-xs">
                          Overdue
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {formatDateTime(p.scheduledAt)}
                  </TableCell>
                  <TableCell className="hidden text-right text-muted-foreground lg:table-cell">
                    {p.commentCount ? (
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="size-3.5" /> {p.commentCount}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
