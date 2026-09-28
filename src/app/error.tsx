"use client";

import { ErrorState } from "@/components/app-shell/error-state";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-24">
      <ErrorState error={error} reset={reset} />
    </main>
  );
}
