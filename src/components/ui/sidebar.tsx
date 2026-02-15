"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { PanelLeft } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type SidebarState = "expanded" | "collapsed";

interface SidebarContextValue {
  state: SidebarState;
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

interface SidebarProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const SIDEBAR_STATE_KEY = "khit-admin-sidebar-collapsed";

export function SidebarProvider({ children, defaultOpen = true }: SidebarProviderProps) {
  const isMobile = useIsMobile();
  const [openDesktop, setOpenDesktop] = React.useState(defaultOpen);
  const [openMobile, setOpenMobile] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const saved = window.localStorage.getItem(SIDEBAR_STATE_KEY);
    if (saved === "1") {
      setOpenDesktop(false);
    } else if (saved === "0") {
      setOpenDesktop(true);
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(SIDEBAR_STATE_KEY, openDesktop ? "0" : "1");
  }, [hydrated, openDesktop]);

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev);
      return;
    }
    setOpenDesktop((prev) => !prev);
  }, [isMobile]);

  const state: SidebarState = openDesktop ? "expanded" : "collapsed";

  return (
    <SidebarContext.Provider
      value={{ state, isMobile, openMobile, setOpenMobile, toggleSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

interface SidebarProps extends React.ComponentProps<"aside"> {
  variant?: "sidebar" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  side?: "left" | "right";
}

export function Sidebar({
  className,
  children,
  variant = "sidebar",
  collapsible = "offcanvas",
  side = "left",
  ...props
}: SidebarProps) {
  const { state, isMobile, openMobile, setOpenMobile } = useSidebar();
  const isCollapsed = collapsible === "icon" && state === "collapsed";

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side={side}
          className="w-[17rem] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
        >
          <div className="flex h-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      data-state={state}
      data-variant={variant}
      data-collapsible={collapsible}
      className={cn(
        "hidden shrink-0 transition-[width] duration-200 lg:block",
        isCollapsed ? "w-[4.5rem]" : "w-[17rem]",
        variant === "inset" ? "p-0" : "",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex h-[calc(100vh-1rem)] flex-col bg-sidebar text-sidebar-foreground",
          variant === "inset" ? "h-screen border-r border-sidebar-border" : "border-r"
        )}
      >
        {children}
      </div>
    </aside>
  );
}

export function SidebarInset({
  className,
  ...props
}: React.ComponentProps<"main">) {
  return (
    <main
      className={cn(
        "flex min-h-screen flex-1 flex-col bg-background",
        className
      )}
      {...props}
    />
  );
}

export function SidebarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("h-8 w-8", className)}
      onClick={toggleSidebar}
      {...props}
    >
      <PanelLeft className="h-4 w-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

export function SidebarHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("border-b border-sidebar-border p-2", className)} {...props} />;
}

export function SidebarContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("flex min-h-0 flex-1 flex-col gap-1 overflow-auto p-2", className)} {...props} />;
}

export function SidebarFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("mt-auto border-t border-sidebar-border p-2", className)} {...props} />;
}

export function SidebarGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("space-y-1", className)} {...props} />;
}

export function SidebarGroupLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { state } = useSidebar();

  if (state === "collapsed") return null;

  return (
    <div
      className={cn(
        "px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/55",
        className
      )}
      {...props}
    />
  );
}

export function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("space-y-1", className)} {...props} />;
}

export function SidebarMenu({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return <ul className={cn("space-y-1", className)} {...props} />;
}

export function SidebarMenuItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return <li className={cn("group/menu-item relative list-none", className)} {...props} />;
}

interface SidebarMenuButtonProps extends React.ComponentProps<"button"> {
  asChild?: boolean;
  isActive?: boolean;
  size?: "default" | "lg";
  tooltip?: string;
}

export function SidebarMenuButton({
  className,
  asChild = false,
  isActive = false,
  size = "default",
  tooltip,
  children,
  ...props
}: SidebarMenuButtonProps) {
  const { state } = useSidebar();
  const Comp = asChild ? Slot : "button";
  const isCollapsed = state === "collapsed";

  return (
    <Comp
      title={isCollapsed ? tooltip : undefined}
      className={cn(
        "flex w-full items-center rounded-md text-sm text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        size === "lg" ? "h-11 px-2.5" : "h-9 px-2",
        isCollapsed ? "justify-center px-0" : "gap-2",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

interface SidebarMenuActionProps extends React.ComponentProps<"button"> {
  asChild?: boolean;
  showOnHover?: boolean;
}

export function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: SidebarMenuActionProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "absolute right-1 top-1 grid h-7 w-7 place-content-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        showOnHover && "opacity-0 group-hover/menu-item:opacity-100",
        className
      )}
      {...props}
    />
  );
}

export function SidebarMenuSub({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn(
        "mt-1 ml-4 space-y-1 border-l border-sidebar-border/80 pl-3",
        className
      )}
      {...props}
    />
  );
}

export function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return <li className={cn("list-none", className)} {...props} />;
}

interface SidebarMenuSubButtonProps extends React.ComponentProps<"button"> {
  asChild?: boolean;
}

export function SidebarMenuSubButton({
  className,
  asChild = false,
  ...props
}: SidebarMenuSubButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "flex h-7 w-full items-center rounded-md px-2 text-xs text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        className
      )}
      {...props}
    />
  );
}
