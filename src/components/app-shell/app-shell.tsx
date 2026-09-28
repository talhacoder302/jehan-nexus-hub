"use client";

import {
  Activity,
  Building2,
  CalendarDays,
  ChartColumn,
  ClipboardCheck,
  FileText,
  Inbox,
  LayoutDashboard,
  Menu,
  Newspaper,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const ICONS = {
  dashboard: LayoutDashboard,
  calendar: CalendarDays,
  approvals: ClipboardCheck,
  ads: ChartColumn,
  reports: FileText,
  settings: Settings,
  clients: Building2,
  users: Users,
  posts: Newspaper,
  leads: Inbox,
  activity: Activity,
} as const;

export type NavIcon = keyof typeof ICONS;

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  badge?: number;
  /** Match only the exact path (for index routes). */
  exact?: boolean;
}

export function AppShell({
  nav,
  area,
  homeHref,
  topbar,
  footer,
  children,
}: {
  nav: NavItem[];
  area: string;
  homeHref: string;
  topbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-1">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r bg-sidebar lg:flex">
        <div className="flex h-16 items-center px-5">
          <BrandLogo href={homeHref} suffix={area} />
        </div>
        <SidebarNav nav={nav} />
        {footer ? <div className="border-t p-3">{footer}</div> : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-lg sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              <SheetHeader className="h-16 justify-center px-5">
                <SheetTitle asChild>
                  <div>
                    <BrandLogo href={homeHref} suffix={area} />
                  </div>
                </SheetTitle>
              </SheetHeader>
              <SidebarNav nav={nav} onNavigate={() => setOpen(false)} />
              {footer ? <div className="mt-auto border-t p-3">{footer}</div> : null}
            </SheetContent>
          </Sheet>
          <div className="flex min-w-0 flex-1 items-center gap-2">{topbar}</div>
          <ThemeToggle />
        </header>
        <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarNav({ nav, onNavigate }: { nav: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {nav.map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
          >
            <Icon className={cn("size-4", active && "text-primary")} />
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <Badge className="h-5 min-w-5 justify-center px-1.5 tabular-nums">{item.badge}</Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
