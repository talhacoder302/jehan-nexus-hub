import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <defs>
        <linearGradient id="jn-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--brand-from)" }} />
          <stop offset="100%" style={{ stopColor: "var(--brand-to)" }} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#jn-mark)" />
      <path
        d="M11 9.5v9.2a3.3 3.3 0 0 1-3.3 3.3M21 22.5V9.5l-7 13V9.5"
        fill="none"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLogo({
  href = "/",
  className,
  suffix,
}: {
  href?: string;
  className?: string;
  suffix?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2.5 font-heading text-lg font-semibold", className)}
      aria-label="Jehan Nexus home"
    >
      <BrandMark />
      <span>
        Jehan <span className="text-brand-gradient">Nexus</span>
        {suffix ? (
          <span className="ml-1.5 text-sm font-medium text-muted-foreground">{suffix}</span>
        ) : null}
      </span>
    </Link>
  );
}
