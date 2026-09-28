"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, LoaderCircle, MessageSquareWarning, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  addCommentAction,
  approvePostAction,
  requestChangesAction,
} from "@/app/portal/posts/actions";
import { initials } from "@/components/app-shell/user-menu";
import { applyFieldErrors, FormError, TextareaField } from "@/components/forms/fields";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { formatRelative } from "@/lib/format";
import {
  commentSchema,
  requestChangesSchema,
  type CommentInput,
  type RequestChangesInput,
} from "@/lib/validators/post";
import type { CommentItem } from "@/server/posts";

export function ApprovalActions({ postId }: { postId: string }) {
  const router = useRouter();
  const [approving, startApprove] = useTransition();
  const [sending, startSend] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<RequestChangesInput>({
    resolver: zodResolver(requestChangesSchema),
    defaultValues: { postId, comment: "" },
  });

  const approve = () =>
    startApprove(async () => {
      const result = await approvePostAction({ postId });
      if (result.ok) {
        toast.success(result.message ?? "Approved");
        router.refresh();
      } else toast.error(result.error);
    });

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button size="lg" onClick={approve} disabled={approving || sending} className="h-10">
        {approving ? <LoaderCircle className="animate-spin" /> : <Check />}
        Approve
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="lg" variant="outline" className="h-10" disabled={approving}>
            <MessageSquareWarning /> Request changes
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request changes</DialogTitle>
            <DialogDescription>
              Tell us what to change. Your account manager is notified and will send a revised
              version.
            </DialogDescription>
          </DialogHeader>
          <form
            noValidate
            onSubmit={form.handleSubmit((values) =>
              startSend(async () => {
                setError(null);
                const result = await requestChangesAction(values);
                if (result.ok) {
                  toast.success(result.message ?? "Feedback sent");
                  setOpen(false);
                  form.reset({ postId, comment: "" });
                  router.refresh();
                } else {
                  setError(result.error);
                  applyFieldErrors(form.setError, result.fieldErrors);
                }
              }),
            )}
          >
            <FieldGroup>
              <FormError message={error} />
              <TextareaField
                control={form.control}
                name="comment"
                label="What should change?"
                rows={5}
                placeholder="e.g. Please use the brighter photo and mention our weekend hours."
              />
              <DialogFooter>
                <Button type="submit" disabled={sending}>
                  {sending ? <LoaderCircle className="animate-spin" /> : <Send />}
                  Send feedback
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CommentThread({ postId, initial }: { postId: string; initial: CommentItem[] }) {
  const [comments, setComments] = useState(initial);
  const [pending, startTransition] = useTransition();
  const form = useForm<CommentInput>({
    resolver: zodResolver(commentSchema),
    defaultValues: { postId, body: "" },
  });

  return (
    <div className="space-y-5">
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No comments yet. Start the conversation below.
        </p>
      ) : (
        <ol className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar className="size-8">
                {c.author.image ? <AvatarImage src={c.author.image} alt="" /> : null}
                <AvatarFallback className="bg-primary/15 text-xs text-primary">
                  {initials(c.author.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 rounded-xl border bg-muted/30 px-4 py-3">
                <p className="text-sm">
                  <span className="font-medium">{c.author.name}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {c.author.role === "client" ? "Client" : "Jehan Nexus"} ·{" "}
                    {formatRelative(c.createdAt)}
                  </span>
                </p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{c.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      <form
        noValidate
        onSubmit={form.handleSubmit((values) =>
          startTransition(async () => {
            const result = await addCommentAction(values);
            if (result.ok && result.data) {
              setComments((prev) => [...prev, result.data!]);
              form.reset({ postId, body: "" });
            } else if (!result.ok) {
              toast.error(result.error);
              applyFieldErrors(form.setError, result.fieldErrors);
            }
          }),
        )}
      >
        <FieldGroup>
          <TextareaField
            control={form.control}
            name="body"
            label="Add a comment"
            rows={3}
            placeholder="Write a comment…"
          />
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" /> : <Send />}
              Post comment
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
