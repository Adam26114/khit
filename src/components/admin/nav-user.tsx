"use client";

import { ChevronsUpDown } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";

interface NavUserProps {
  user: {
    name: string;
    email: string;
  };
}

export function NavUser({ user }: NavUserProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" title={user.name}>
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarFallback className="rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
              {user.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
            <>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-sidebar-foreground/65">{user.email}</span>
              </div>
              <ChevronsUpDown className="h-4 w-4 opacity-70" />
            </>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
