"use client";

import { ChevronsUpDown, LayoutDashboard, LogOut, Settings, Shield } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/(auth)/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserRole } from "@/lib/constants";

export interface MenuUser {
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function UserMenu({ user, settingsHref }: { user: MenuUser; settingsHref: string }) {
  const staff = user.role !== "client";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg p-2 text-left outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="size-8">
          {user.image ? <AvatarImage src={user.image} alt="" /> : null}
          <AvatarFallback className="bg-primary/15 text-xs text-primary">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground capitalize">{user.role}</p>
        </div>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {staff ? (
          <>
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <Shield /> Admin area
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/portal">
                <LayoutDashboard /> Client portal view
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuItem asChild>
          <Link href={settingsHref}>
            <Settings /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut /> Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
