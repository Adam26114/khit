"use client";

import * as React from "react";
import Link from "next/link";
import {
  Command,
  FolderTree,
  LifeBuoy,
  Search,
  Package,
  Settings,
  ShoppingCart,
  SquareTerminal,
  BarChart3,
  Warehouse,
} from "lucide-react";

import { useSession } from "@/lib/auth";
import { NavMain } from "@/components/admin/nav-main";
import { NavProjects } from "@/components/admin/nav-projects";
import { NavSecondary } from "@/components/admin/nav-secondary";
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
  ],
  projects: [
    {
      name: "Products",
      url: "/admin/products",
      icon: Package,
      items: [{ title: "Categories", url: "/admin/categories", icon: FolderTree }],
    },
  ],
  documents: [
    { title: "Reports", url: "/admin/orders", icon: BarChart3 },
    { title: "Catalog", url: "/admin/catalog", icon: Package },
  ],
  footer: [
    { title: "Settings", url: "/admin/settings", icon: Settings },
    { title: "Get Help", url: "/admin/settings", icon: LifeBuoy },
    { title: "Search", url: "/admin/search", icon: Search },
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
    "/admin/catalog": "Catalog",
    "/admin/search": "Search",
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
        <NavMain title="Platform" items={data.navMain} showQuickCreate />
        <NavProjects projects={data.projects} />
        <NavSecondary title="Documents" items={data.documents} />
        <NavSecondary className="mt-auto" items={data.footer} />
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
