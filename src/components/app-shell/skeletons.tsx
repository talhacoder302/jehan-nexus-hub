import { Skeleton } from "@/components/ui/skeleton";

function TitleSkeleton() {
  return (
    <div className="mb-6 space-y-2">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-6">
      <TitleSkeleton />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-xl xl:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

export function ChartsSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-6">
      <TitleSkeleton />
      <Skeleton className="h-9 w-96 max-w-full" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <TitleSkeleton />
      <Skeleton className="mb-4 h-5 w-full max-w-xl" />
      <Skeleton className="h-[600px] rounded-2xl" />
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading">
      <TitleSkeleton />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading">
      <TitleSkeleton />
      <div className="space-y-2 rounded-xl border p-4">
        <Skeleton className="h-6 w-full" />
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <TitleSkeleton />
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-[480px] rounded-xl lg:col-span-3" />
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
      </div>
    </div>
  );
}
