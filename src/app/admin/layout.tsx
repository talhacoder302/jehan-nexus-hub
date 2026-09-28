import type { Metadata } from "next";
import { AppShell, type NavItem } from "@/components/app-shell/app-shell";
import { NotificationBell } from "@/components/app-shell/notification-bell";
import { UserMenu } from "@/components/app-shell/user-menu";
import { countNewLeads } from "@/server/leads";
import { requireStaffPage } from "@/server/permissions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Jehan Nexus Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireStaffPage();
  const newLeads = await countNewLeads();
  const nav: NavItem[] = [
    { href: "/admin", label: "Overview", icon: "dashboard", exact: true },
    { href: "/admin/clients", label: "Clients", icon: "clients" },
    { href: "/admin/posts", label: "Posts", icon: "posts" },
    { href: "/admin/users", label: "Users", icon: "users" },
    { href: "/admin/leads", label: "Leads", icon: "leads", badge: newLeads },
    { href: "/admin/activity", label: "Activity", icon: "activity" },
  ];
  return (
    <AppShell
      nav={nav}
      area="Admin"
      homeHref="/admin"
      actions={<NotificationBell userId={user.id} />}
      footer={<UserMenu user={user} settingsHref="/portal/settings" />}
    >
      {children}
    </AppShell>
  );
}
