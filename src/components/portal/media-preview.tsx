import { ImageOff } from "lucide-react";

const VIDEO = /\.(mp4|mov|webm|m4v)(\?|$)/i;

/** Renders post creatives. Plain <img>/<video> because creatives come from arbitrary S3/CDN hosts. */
export function MediaPreview({ urls, title }: { urls: string[]; title: string }) {
  if (!urls.length) {
    return (
      <div className="grid aspect-square place-items-center rounded-xl border border-dashed text-muted-foreground">
        <div className="flex flex-col items-center gap-2 text-sm">
          <ImageOff className="size-6" /> No media attached
        </div>
      </div>
    );
  }
  return (
    <div className={urls.length > 1 ? "grid grid-cols-2 gap-2" : ""}>
      {urls.map((url, i) =>
        VIDEO.test(url) ? (
          <video
            key={url}
            src={url}
            controls
            preload="metadata"
            className="w-full rounded-xl border bg-black"
            aria-label={`${title}: video ${i + 1}`}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- remote creatives of arbitrary origin
          <img
            key={url}
            src={url}
            alt={`${title}: image ${i + 1}`}
            loading="lazy"
            className="w-full rounded-xl border object-cover"
          />
        ),
      )}
    </div>
  );
}
