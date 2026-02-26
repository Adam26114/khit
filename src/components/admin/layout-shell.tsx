"use client";

import { useEffect, useState } from "react";

import { AdminHeader } from "@/components/admin/header";
import { AdminSidebar } from "@/components/admin/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface AdminLayoutShellProps {
  children: React.ReactNode;
}

type AdminTheme = "light" | "dark";

const THEME_STORAGE_KEY = "khit-admin-theme";

export function AdminLayoutShell({ children }: AdminLayoutShellProps) {
  const [theme, setTheme] = useState<AdminTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [mounted, theme]);

  return (
    <div className={cn("h-screen overflow-hidden bg-background text-foreground", theme === "dark" && "dark")}>
      <SidebarProvider defaultOpen>
        <div className="flex h-full w-full">
          <AdminSidebar />
          <SidebarInset className="h-full overflow-auto rounded-none border-0 shadow-none">
            <AdminHeader
              theme={mounted ? theme : "light"}
              onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
            />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
