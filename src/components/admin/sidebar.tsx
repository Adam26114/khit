"use client";

import * as React from "react";
import Link from "next/link";
import {
  Command,
  FolderTree,
  LifeBuoy,
  Package,
  Send,
  Settings,
  ShoppingCart,
  SquareTerminal,
  Users,
  Warehouse,
} from "lucide-react";

import { useSession } from "@/lib/auth";
import { NavMain } from "@/components/admin/nav-main";
import { NavProjects } from "@/components/admin/nav-projects";
import { NavUser } from "@/components/admin/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: SquareTerminal,
      items: [
        { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
        { title: "Inventory", url: "/admin/inventory", icon: Warehouse },
      ],
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings,
      items: [
        { title: "Users", url: "/admin/users", icon: Users },
        { title: "Support", url: "/admin/settings", icon: LifeBuoy },
        { title: "Feedback", url: "/admin/settings", icon: Send },
      ],
    },
  ],
  projects: [
    {
      name: "Products",
      url: "/admin/products",
      icon: Package,
      items: [
        { title: "Categories", url: "/admin/categories", icon: FolderTree },
      ],
    },
  ],
};

function isActivePath(pathname: string, url: string): boolean {
  if (url === "/admin") return pathname === url;
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function getAdminPageTitle(pathname: string): string {
  const pages: Record<string, string> = {
    "/admin": "Dashboard",
    "/admin/orders": "Orders",
    "/admin/products": "Products",
    "/admin/categories": "Categories",
    "/admin/inventory": "Inventory",
    "/admin/users": "Users",
    "/admin/settings": "Settings",
  };

  const matched = Object.keys(pages).find((key) => isActivePath(pathname, key));
  if (!matched) return "Dashboard";
  return pages[matched] ?? "Dashboard";
}

export function AdminSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader className="h-[65px] p-0">
        <SidebarMenu className="h-full space-y-0">
          <SidebarMenuItem className="h-full">
            <SidebarMenuButton
              size="lg"
              className="h-16 rounded-none px-4"
              asChild
            >
              <Link href="/admin">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div
                  className={`grid flex-1 text-left text-sm leading-tight ${collapsed ? "hidden" : ""}`}
                >
                  <span className="truncate font-medium">Khit Admin</span>
                  <span className="truncate text-xs text-sidebar-foreground/65">
                    Enterprise
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain title="Platform" items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: session?.user?.name || "Admin",
            email: session?.user?.email || "admin@khit.local",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
