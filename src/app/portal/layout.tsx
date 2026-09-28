import type { Metadata } from "next";
import { AppShell, type NavItem } from "@/components/app-shell/app-shell";
import { NotificationBell } from "@/components/app-shell/notification-bell";
import { UserMenu } from "@/components/app-shell/user-menu";
import { ClientSwitcher } from "@/components/portal/client-switcher";
import { countPendingApprovals } from "@/server/posts";
import { getPortalContext } from "@/server/portal";
import { requireUser } from "@/server/permissions";

export const metadata: Metadata = {
  title: { default: "Portal", template: "%s | Jehan Nexus Portal" },
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  const user = await requireUser();
  const ctx = await getPortalContext();
  const pending = ctx ? await countPendingApprovals(ctx.clientId) : 0;

  const nav: NavItem[] = [
    { href: "/portal", label: "Dashboard", icon: "dashboard", exact: true },
    { href: "/portal/calendar", label: "Calendar", icon: "calendar" },
    { href: "/portal/approvals", label: "Approvals", icon: "approvals", badge: pending },
    { href: "/portal/ads", label: "Ads Performance", icon: "ads" },
    { href: "/portal/reports", label: "Reports", icon: "reports" },
    { href: "/portal/settings", label: "Settings", icon: "settings" },
  ];

  const topbar = ctx ? (
    ctx.switcher.length ? (
      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground sm:inline">Viewing</span>
        <ClientSwitcher clients={ctx.switcher} value={ctx.clientId} />
      </div>
    ) : (
      <p className="truncate font-medium">{ctx.client.name}</p>
    )
  ) : null;

  return (
    <AppShell
      nav={nav}
      area="Portal"
      homeHref="/portal"
      topbar={topbar}
      actions={<NotificationBell userId={user.id} />}
      footer={<UserMenu user={user} settingsHref="/portal/settings" />}
    >
      {children}
    </AppShell>
  );
}
