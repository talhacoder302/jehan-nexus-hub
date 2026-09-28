import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/post-form";
import { PostWorkflow } from "@/components/admin/post-workflow";
import { PageTitle } from "@/components/app-shell/page-header";
import { CommentThread } from "@/components/portal/post-review";
import { PostStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { features } from "@/lib/env";
import { formatDateTime } from "@/lib/format";
import { listClientOptions } from "@/server/clients";
import { AuthorizationError, requireStaffPage } from "@/server/permissions";
import { getPostDetail } from "@/server/posts";

export const metadata: Metadata = { title: "Edit post" };

export default async function AdminPostPage(props: PageProps<"/admin/posts/[id]">) {
  const { id } = await props.params;
  const user = await requireStaffPage();
  const post = await getPostDetail(user, id).catch((error: unknown) => {
    if (error instanceof AuthorizationError) notFound();
    throw error;
  });
  const clients = await listClientOptions(user);
  const locked = post.status === "published";

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/admin/posts">
          <ArrowLeft /> Posts
        </Link>
      </Button>
      <PageTitle
        title={post.title}
        description={`${post.clientName} · created by ${post.createdByName ?? "unknown"}`}
        actions={<PostStatusBadge status={post.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Content</CardTitle>
            <CardDescription>
              {locked
                ? "Published posts are locked."
                : post.status === "approved"
                  ? "Editing an approved post sends it back to draft so the client re-approves the change."
                  : "Edit and save. Clients only see posts once they're sent for approval."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PostForm
              postId={post.id}
              clients={
                clients.some((c) => c.id === post.clientId)
                  ? clients
                  : [...clients, { id: post.clientId, name: post.clientName }]
              }
              s3Enabled={features().s3}
              canSubmit={post.status === "draft" || post.status === "changes_requested"}
              locked={locked}
              defaults={{
                clientId: post.clientId,
                title: post.title,
                caption: post.caption,
                platforms: post.platforms,
                mediaUrls: post.mediaUrls,
                scheduledAt: post.scheduledAt,
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Workflow</CardTitle>
              <CardDescription>
                Revision {post.revisionCount}
                {post.approvedAt
                  ? ` · approved ${formatDateTime(post.approvedAt)} by ${post.approvedByName ?? "client"}`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PostWorkflow postId={post.id} status={post.status} />
              {post.status !== "draft" ? (
                <Button asChild variant="link" className="h-auto p-0">
                  <Link href={`/portal/posts/${post.id}`}>
                    View as client <ExternalLink data-icon="inline-end" />
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <CardDescription>
                Visible to the client once the post is sent for approval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommentThread postId={post.id} initial={post.comments} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
