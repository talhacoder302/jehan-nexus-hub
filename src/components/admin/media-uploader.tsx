"use client";

import { ImagePlus, Link2, LoaderCircle, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm";
const VIDEO = /\.(mp4|mov|webm|m4v)(\?|$)/i;

/**
 * Uploads creatives straight to S3 with a pre-signed PUT (files never pass through our server).
 * When S3 isn't configured, staff can paste https media URLs instead.
 */
export function MediaUploader({
  clientId,
  value,
  onChange,
  s3Enabled,
}: {
  clientId: string | undefined;
  value: string[];
  onChange: (urls: string[]) => void;
  s3Enabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [url, setUrl] = useState("");

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    if (!clientId) {
      toast.error("Choose a client first.");
      return;
    }
    const added: string[] = [];
    for (const file of Array.from(files)) {
      setUploading((n) => n + 1);
      try {
        const res = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId, contentType: file.type, size: file.size }),
        });
        const data = (await res.json()) as {
          uploadUrl?: string;
          publicUrl?: string;
          error?: string;
        };
        if (!res.ok || !data.uploadUrl || !data.publicUrl)
          throw new Error(data.error ?? "Upload failed");
        const put = await fetch(data.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
          body: file,
        });
        if (!put.ok) throw new Error(`Upload failed (${put.status})`);
        added.push(data.publicUrl);
      } catch (error) {
        toast.error(`${file.name}: ${error instanceof Error ? error.message : "upload failed"}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (added.length) onChange([...value, ...added]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const addUrl = () => {
    const trimmed = url.trim();
    if (!/^https:\/\/\S+$/.test(trimmed)) {
      toast.error("Enter an https URL");
      return;
    }
    onChange([...value, trimmed]);
    setUrl("");
  };

  return (
    <div className="space-y-3">
      {value.length ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((src, i) => (
            <li
              key={`${src}-${i}`}
              className="group relative overflow-hidden rounded-lg border bg-muted"
            >
              {VIDEO.test(src) ? (
                <video
                  src={src}
                  className="aspect-square w-full object-cover"
                  muted
                  preload="metadata"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- remote creatives of arbitrary origin
                <img src={src} alt="" className="aspect-square w-full object-cover" />
              )}
              <Button
                type="button"
                size="icon-xs"
                variant="secondary"
                className="absolute top-1 right-1 opacity-90"
                aria-label={`Remove media ${i + 1}`}
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        {s3Enabled ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="sr-only"
              id="media-upload"
              onChange={(e) => void upload(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading > 0}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}
              {uploading ? `Uploading ${uploading}…` : "Upload images or video"}
            </Button>
          </>
        ) : (
          <p className="self-center text-xs text-muted-foreground">
            S3 uploads aren&apos;t configured, so paste media URLs.
          </p>
        )}
        <div className="flex flex-1 gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://… image or video URL"
            aria-label="Media URL"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addUrl} aria-label="Add media URL">
            <Link2 />
          </Button>
        </div>
      </div>
    </div>
  );
}
