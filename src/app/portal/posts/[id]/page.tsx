import { ArrowLeft, CalendarClock, History, UserCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/app-shell/page-header";
import { MediaPreview } from "@/components/portal/media-preview";
import { PlatformList } from "@/components/portal/platform-list";
import { ApprovalActions, CommentThread } from "@/components/portal/post-review";
import { PostStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { AuthorizationError } from "@/server/permissions";
import { requirePortalContext } from "@/server/portal";
import { getPostDetail } from "@/server/posts";

export const metadata: Metadata = { title: "Post" };

export default async function PortalPostPage(props: PageProps<"/portal/posts/[id]">) {
  const { id } = await props.params;
  const ctx = await requirePortalContext();
  const post = await getPostDetail(ctx.user, id).catch((error: unknown) => {
    if (error instanceof AuthorizationError) notFound();
    throw error;
  });

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/portal/approvals">
          <ArrowLeft /> Approvals
        </Link>
      </Button>
      <PageTitle
        title={post.title}
        description={post.clientName}
        actions={<PostStatusBadge status={post.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardContent className="space-y-5">
              <MediaPreview urls={post.mediaUrls} title={post.title} />
              <div>
                <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  Caption
                </h2>
                <p className="whitespace-pre-wrap">{post.caption || "No caption yet."}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentThread postId={post.id} initial={post.comments} />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:col-span-2">
          {post.status === "pending_approval" ? (
            <Card className="border-primary/40">
              <CardHeader>
                <CardTitle>Your approval is needed</CardTitle>
              </CardHeader>
              <CardContent>
                <ApprovalActions postId={post.id} />
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardContent>
              <dl className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <dt className="text-muted-foreground">Scheduled for</dt>
                    <dd className="font-medium">{formatDateTime(post.scheduledAt)}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 size-4" />
                  <div>
                    <dt className="text-muted-foreground">Platforms</dt>
                    <dd>
                      <PlatformList platforms={post.platforms} showLabels />
                    </dd>
                  </div>
                </div>
                {post.approvedAt ? (
                  <div className="flex items-start gap-3">
                    <UserCheck className="mt-0.5 size-4 text-muted-foreground" />
                    <div>
                      <dt className="text-muted-foreground">Approved</dt>
                      <dd className="font-medium">
                        {formatDateTime(post.approvedAt)}
                        {post.approvedByName ? ` by ${post.approvedByName}` : ""}
                      </dd>
                    </div>
                  </div>
                ) : null}
                <div className="flex items-start gap-3">
                  <History className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <dt className="text-muted-foreground">Revisions</dt>
                    <dd className="font-medium">{post.revisionCount}</dd>
                  </div>
                </div>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
