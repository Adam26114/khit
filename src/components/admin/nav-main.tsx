"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronRight, CirclePlus, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
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
  showQuickCreate?: boolean;
  quickCreateUrl?: string;
  quickCreateLabel?: string;
}

function isActivePath(pathname: string, url: string): boolean {
  if (url === "/admin") return pathname === url;
  return pathname === url || pathname.startsWith(`${url}/`);
}

function isLeafPath(pathname: string, url: string): boolean {
  return pathname === url;
}

export function NavMain({
  title,
  items,
  showQuickCreate = false,
  quickCreateUrl = "/admin/products",
  quickCreateLabel = "Quick Create",
}: NavMainProps) {
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
        {showQuickCreate ? (
          <SidebarMenu className="mb-2">
            <SidebarMenuItem>
              <Button
                asChild
                className={cn(
                  "h-9 w-full justify-start px-2 bg-khit-royalBlue text-khit-royalBlueForeground hover:bg-khit-royalBlueHover",
                  collapsed && "justify-center"
                )}
              >
                <Link href={quickCreateUrl}>
                  <CirclePlus className="h-4 w-4 shrink-0" />
                  {!collapsed ? (
                    <>
                      <span className="truncate">{quickCreateLabel}</span>
                      <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-white/80" />
                    </>
                  ) : null}
                </Link>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}

        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            const subItems = item.items ?? [];
            const hasChildren = subItems.length > 0;
            const leafActive = isLeafPath(pathname, item.url);
            const childActive = subItems.some((subItem) => isActivePath(pathname, subItem.url));
            const active = collapsed ? leafActive || childActive : leafActive;
            const isOpen = openItems[item.title] ?? (leafActive || childActive);

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
                    className={cn(
                      !collapsed && hasChildren && "pr-10",
                      active && "bg-black text-white hover:bg-black/90 hover:text-white"
                    )}
                  >
                    <Link href={item.url}>
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>

                  {!collapsed && hasChildren ? (
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction
                        className={cn(
                          "data-[state=open]:rotate-90",
                          active && "text-white hover:bg-black/90 hover:text-white"
                        )}
                      >
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
                          const subActive = isActivePath(pathname, subItem.url);
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                className={cn(
                                  "h-8 text-sm",
                                  subActive && "bg-black text-white hover:bg-black/90 hover:text-white"
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
