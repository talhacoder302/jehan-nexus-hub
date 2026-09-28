"use client";

import FullCalendar, { type EventClickInfo, type EventSourceFuncInfo } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import breezyTheme from "@fullcalendar/react/themes/breezy";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/breezy/theme.css";
import "@fullcalendar/react/themes/breezy/palettes/indigo.css";
import "temporal-polyfill/global";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useCallback, useState } from "react";
import { PostStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  POST_STATUS_COLORS,
  POST_STATUS_LABELS,
  POST_STATUSES,
  type Platform,
  type PostStatus,
} from "@/lib/constants";
import { formatDateTime } from "@/lib/format";

interface ApiEvent {
  id: string;
  title: string;
  start: string;
  color: string;
  status: PostStatus;
  platforms: Platform[];
  caption: string;
  thumbnail: string | null;
}

type Selected = ApiEvent;

export function ContentCalendar({ detailBase = "/portal/posts" }: { detailBase?: string }) {
  const { resolvedTheme } = useTheme();
  const [selected, setSelected] = useState<Selected | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (info: EventSourceFuncInfo) => {
    const params = new URLSearchParams({
      start: info.start.toISOString(),
      end: info.end.toISOString(),
    });
    const res = await fetch(`/api/portal/calendar?${params}`, { cache: "no-store" });
    if (!res.ok) {
      setError("Couldn't load posts for this period.");
      return [];
    }
    setError(null);
    const events = (await res.json()) as ApiEvent[];
    return events.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start,
      color: e.color,
      contrastColor: "#ffffff",
      extendedProps: e,
    }));
  }, []);

  const onEventClick = (info: EventClickInfo) => {
    info.jsEvent.preventDefault();
    setSelected(info.event.extendedProps as Selected);
  };

  return (
    <div className="space-y-4">
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Status legend">
        {POST_STATUSES.map((s) => (
          <li key={s} className="flex items-center gap-2 text-muted-foreground">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full"
              style={{ background: POST_STATUS_COLORS[s] }}
            />
            {POST_STATUS_LABELS[s]}
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div
        className="jn-calendar overflow-hidden rounded-2xl border bg-card p-2 sm:p-4"
        data-color-scheme={resolvedTheme === "dark" ? "dark" : "light"}
      >
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, breezyTheme]}
          initialView="dayGridMonth"
          headerToolbar={{
            start: "title",
            center: "",
            end: "today prev,next dayGridMonth,timeGridWeek",
          }}
          buttons={{
            today: { text: "Today" },
            dayGridMonth: { text: "Month" },
            timeGridWeek: { text: "Week" },
          }}
          height="auto"
          dayMaxEvents={3}
          eventDisplay="block"
          events={fetchEvents}
          eventClick={onEventClick}
          eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
          colorScheme={resolvedTheme === "dark" ? "dark" : "light"}
        />
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>
                  {formatDateTime(selected.start)} ·{" "}
                  {selected.platforms
                    .map((p) => (p === "facebook" ? "Facebook" : "Instagram"))
                    .join(" & ")}
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-4">
                {selected.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote creatives of arbitrary origin
                  <img
                    src={selected.thumbnail}
                    alt=""
                    className="size-24 shrink-0 rounded-lg border object-cover"
                  />
                ) : null}
                <div className="min-w-0 space-y-2">
                  <PostStatusBadge status={selected.status} />
                  <p className="line-clamp-4 text-sm text-muted-foreground">
                    {selected.caption || "No caption yet."}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button asChild>
                  <Link href={`${detailBase}/${selected.id}`}>
                    Open post <ExternalLink data-icon="inline-end" />
                  </Link>
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
