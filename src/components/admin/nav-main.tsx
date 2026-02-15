"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuAction,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavSubItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  items?: NavSubItem[];
}

interface NavMainProps {
  title?: string;
  items: NavItem[];
}

function isActivePath(pathname: string, url: string): boolean {
  if (url === "/admin") return pathname === url;
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function NavMain({ title, items }: NavMainProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const activeItemTitles = useMemo(
    () =>
      items
        .filter((item) => isActivePath(pathname, item.url))
        .map((item) => item.title),
    [items, pathname]
  );

  useEffect(() => {
    if (collapsed) return;
    setOpenItems((prev) => {
      const next = { ...prev };
      for (const title of activeItemTitles) {
        next[title] = true;
      }
      return next;
    });
  }, [activeItemTitles, collapsed]);

  return (
    <SidebarGroup>
      {title ? <SidebarGroupLabel>{title}</SidebarGroupLabel> : null}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.url);
            const subItems = item.items ?? [];
            const hasChildren = subItems.length > 0;
            const isOpen = openItems[item.title] ?? active;

            return (
              <Collapsible
                key={item.title}
                asChild
                open={hasChildren ? (!collapsed && isOpen) : false}
                onOpenChange={(open) =>
                  setOpenItems((prev) => ({
                    ...prev,
                    [item.title]: open,
                  }))
                }
              >
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.title}
                    className={cn(!collapsed && hasChildren && "pr-10")}
                  >
                    <Link href={item.url}>
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>

                  {!collapsed && hasChildren ? (
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                  ) : null}

                  {!collapsed && hasChildren ? (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {subItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const subActive = pathname === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                className={cn(
                                  "h-8 text-sm",
                                  subActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                                )}
                              >
                                <Link href={subItem.url} className="flex gap-2 items-center">
                                  <SubIcon className="size-[13px]" />
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  ) : null}
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
