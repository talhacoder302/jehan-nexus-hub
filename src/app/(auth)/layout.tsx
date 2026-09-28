import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-svh flex-1 flex-col">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-[56rem] -translate-x-1/2 rounded-full bg-brand-gradient opacity-20 blur-3xl"
      />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <BrandLogo />
        <ThemeToggle />
      </header>
      <main
        id="main"
        className="flex flex-1 items-start justify-center px-4 pt-8 pb-16 sm:items-center sm:pt-0"
      >
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="pb-6 text-center text-xs text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground">
          Privacy
        </Link>
        <span className="mx-2">·</span>
        <Link href="/terms" className="hover:text-foreground">
          Terms
        </Link>
      </footer>
    </div>
  );
}
