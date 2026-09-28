import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PostForm } from "@/components/admin/post-form";
import { EmptyState, PageTitle } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { features } from "@/lib/env";
import { listClientOptions } from "@/server/clients";
import { requireStaffPage } from "@/server/permissions";

export const metadata: Metadata = { title: "New post" };

/** Default schedule: tomorrow at 10:00 UTC. */
function defaultSchedule() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(10, 0, 0, 0);
  return d.toISOString();
}

export default async function NewPostPage(props: PageProps<"/admin/posts/new">) {
  const user = await requireStaffPage();
  const { client } = await props.searchParams;
  const clients = await listClientOptions(user);
  const preselected =
    clients.find((c) => c.id === client)?.id ?? (clients.length === 1 ? clients[0]!.id : "");

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/admin/posts">
          <ArrowLeft /> Posts
        </Link>
      </Button>
      <PageTitle
        title="New post"
        description="Save as a draft, or send straight to the client for approval."
      />
      {clients.length === 0 ? (
        <EmptyState
          title="No clients available"
          description="Create or get assigned to a client first."
        />
      ) : (
        <Card className="max-w-3xl">
          <CardContent>
            <PostForm
              postId={null}
              clients={clients}
              s3Enabled={features().s3}
              canSubmit
              defaults={{
                clientId: preselected,
                title: "",
                caption: "",
                platforms: ["facebook", "instagram"],
                mediaUrls: [],
                scheduledAt: defaultSchedule(),
              }}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}
