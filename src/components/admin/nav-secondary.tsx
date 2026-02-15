"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
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
  items?: SecondaryItem[];
}

export function NavSecondary({ items = [], className }: NavSecondaryProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  if (items.length === 0) return null;

  return (
    <div className={cn("mt-2", className)}>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild title={item.title}>
                <Link href={item.url}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </div>
  );
}
