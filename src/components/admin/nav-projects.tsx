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

interface ProjectSubItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface ProjectItem {
  name: string;
  url: string;
  icon: LucideIcon;
  items?: ProjectSubItem[];
}

interface NavProjectsProps {
  projects: ProjectItem[];
}

function isActivePath(pathname: string, url: string): boolean {
  if (url === "/admin") return pathname === url;
  return pathname === url || pathname.startsWith(`${url}/`);
}

function isLeafPath(pathname: string, url: string): boolean {
  return pathname === url;
}

export function NavProjects({ projects }: NavProjectsProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const activeProjectTitles = useMemo(
    () =>
      projects
        .filter((project) => isActivePath(pathname, project.url))
        .map((project) => project.name),
    [projects, pathname]
  );

  useEffect(() => {
    if (collapsed) return;
    setOpenItems((prev) => {
      const next = { ...prev };
      for (const title of activeProjectTitles) {
        next[title] = true;
      }
      return next;
    });
  }, [activeProjectTitles, collapsed]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {projects.map((project) => {
            const Icon = project.icon;
            const subItems = project.items ?? [];
            const hasChildren = subItems.length > 0;
            const leafActive = isLeafPath(pathname, project.url);
            const childActive = subItems.some((subItem) => isActivePath(pathname, subItem.url));
            const active = collapsed ? leafActive || childActive : leafActive;
            const isOpen = openItems[project.name] ?? (leafActive || childActive);

            return (
              <Collapsible
                key={project.name}
                asChild
                open={hasChildren ? (!collapsed && isOpen) : false}
                onOpenChange={(open) =>
                  setOpenItems((prev) => ({
                    ...prev,
                    [project.name]: open,
                  }))
                }
              >
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={project.name}
                    className={cn(
                      !collapsed && hasChildren && "pr-10",
                      active && "bg-black text-white hover:bg-black/90 hover:text-white"
                    )}
                  >
                    <Link href={project.url}>
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{project.name}</span>}
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
                                <Link href={subItem.url} className="flex items-center gap-2">
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
