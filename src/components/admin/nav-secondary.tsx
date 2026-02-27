"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface SecondaryItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface NavSecondaryProps {
  className?: string;
  title?: string;
  items?: SecondaryItem[];
}

function isActivePath(pathname: string, url: string): boolean {
  if (url === "/admin") return pathname === url;
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function NavSecondary({ items = [], className, title }: NavSecondaryProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  if (items.length === 0) return null;

  const menu = (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.url);
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              title={item.title}
              isActive={active}
              className={cn(active && "bg-black text-white hover:bg-black/90 hover:text-white")}
            >
              <Link href={item.url}>
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  if (title) {
    return (
      <SidebarGroup className={cn("mt-2", className)}>
        <SidebarGroupLabel>{title}</SidebarGroupLabel>
        <SidebarGroupContent>{menu}</SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <div className={cn("mt-2", className)}>
      {menu}
    </div>
  );
}
