import { PlugZap } from "lucide-react";

/** Shown across admin when META_SYSTEM_USER_TOKEN is missing; the app keeps working on stored data. */
export function MetaNotConnectedBanner() {
  return (
    <div
      role="status"
      className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm"
    >
      <PlugZap className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div>
        <p className="font-medium">Meta not connected</p>
        <p className="text-muted-foreground">
          Add <code className="rounded bg-muted px-1">META_SYSTEM_USER_TOKEN</code> (and{" "}
          <code className="rounded bg-muted px-1">META_API_VERSION</code>) to enable the daily Ads
          Insights sync. Dashboards currently show stored and demo data.
        </p>
      </div>
    </div>
  );
}
