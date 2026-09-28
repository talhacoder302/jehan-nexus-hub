"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * FullCalendar fetches events from the browser and is heavy, so it is loaded client-side only
 * (it would otherwise try to fetch a relative URL during server rendering).
 */
export const CalendarLoader = dynamic(
  () => import("./content-calendar").then((m) => m.ContentCalendar),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[640px] rounded-2xl" />,
  },
);
