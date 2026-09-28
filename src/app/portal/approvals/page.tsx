import { ArrowRight, ClipboardCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageTitle } from "@/components/app-shell/page-header";
import { PlatformList } from "@/components/portal/platform-list";
import { PostStatusBadge } from "@/components/status-badges";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { requirePortalContext } from "@/server/portal";
import { listPostsByStatus } from "@/server/posts";

export const metadata: Metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  const ctx = await requirePortalContext();
  const [pending, changes] = await Promise.all([
    listPostsByStatus(ctx.clientId, ["pending_approval"]),
    listPostsByStatus(ctx.clientId, ["changes_requested"]),
  ]);

  return (
    <>
      <PageTitle
        title="Approvals"
        description="Review each post and approve it, or request changes with a comment."
      />
      {pending.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck />}
          title="No posts awaiting approval"
          description="When your account manager sends content for review, it will appear here and you'll get a notification."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pending.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}

      {changes.length ? (
        <section className="mt-10">
          <h2 className="mb-1 text-lg font-semibold">Being revised</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            You requested changes on these posts. We&apos;ll resubmit them for approval.
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {changes.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function PostCard({ post }: { post: Awaited<ReturnType<typeof listPostsByStatus>>[number] }) {
  return (
    <Card className="gap-0 overflow-hidden p-0 transition-shadow hover:shadow-lg">
      <Link href={`/portal/posts/${post.id}`} className="flex h-full flex-col">
        {post.mediaUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote creatives of arbitrary origin
          <img
            src={post.mediaUrls[0]}
            alt=""
            loading="lazy"
            className="aspect-video w-full object-cover"
          />
        ) : (
          <div className="aspect-video w-full bg-muted" />
        )}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <PostStatusBadge status={post.status} />
            <PlatformList platforms={post.platforms} />
          </div>
          <h3 className="font-semibold">{post.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{post.caption}</p>
          <p className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
            {formatDateTime(post.scheduledAt)}
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              Review <ArrowRight className="size-3.5" />
            </span>
          </p>
        </div>
      </Link>
    </Card>
  );
}
