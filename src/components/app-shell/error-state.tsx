"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Shared UI for route error boundaries. Shows the digest (not the message) for support. */
export function ErrorState({
  error,
  reset,
  title = "Something went wrong",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center"
    >
      <TriangleAlert className="size-8 text-destructive" />
      <h2 className="mt-3 text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        We couldn&apos;t load this page. Please try again. If it keeps happening, contact your
        account manager.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">Ref: {error.digest}</p>
      ) : null}
      <Button className="mt-5" variant="outline" onClick={reset}>
        <RefreshCw /> Try again
      </Button>
    </div>
  );
}
