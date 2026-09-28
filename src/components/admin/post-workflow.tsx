"use client";

import { CheckCheck, LoaderCircle, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deletePostAction,
  markPublishedAction,
  sendForApprovalAction,
} from "@/app/admin/posts/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { PostStatus } from "@/lib/constants";
import type { ActionResult } from "@/types/actions";

/** Status transitions available to staff for the current post status. */
export function PostWorkflow({ postId, status }: { postId: string; status: PostStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const run = (fn: () => Promise<ActionResult>, after?: () => void) =>
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(result.message ?? "Done");
        if (after) after();
        else router.refresh();
      } else toast.error(result.error);
    });

  return (
    <div className="flex flex-wrap gap-2">
      {status === "draft" || status === "changes_requested" ? (
        <Button disabled={pending} onClick={() => run(() => sendForApprovalAction({ postId }))}>
          {pending ? <LoaderCircle className="animate-spin" /> : <Send />}
          {status === "changes_requested" ? "Resubmit for approval" : "Send for approval"}
        </Button>
      ) : null}
      {status === "approved" ? (
        <Button disabled={pending} onClick={() => run(() => markPublishedAction({ postId }))}>
          <CheckCheck /> Mark as published
        </Button>
      ) : null}
      {status !== "published" ? (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" disabled={pending}>
              <Trash2 /> Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this post?</DialogTitle>
              <DialogDescription>
                The post and its comments will be permanently removed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() =>
                  run(
                    () => deletePostAction({ postId }),
                    () => router.push("/admin/posts"),
                  )
                }
              >
                Delete post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
