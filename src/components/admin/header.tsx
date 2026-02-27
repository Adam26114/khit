"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, LogOut, MoonStar, SunMedium } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth";
import { getAdminPageTitle } from "@/components/admin/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface AdminHeaderProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function AdminHeader({ theme, onToggleTheme }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const pageTitle = getAdminPageTitle(pathname);
  const userEmail = session?.user?.email ?? "admin@khit.local";

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
      router.push("/login?callbackUrl=/admin");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />

        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate text-sm font-semibold leading-none">
            <span>Dashboard</span>
            {pageTitle !== "Dashboard" ? (
              <>
                <ChevronRight className="size-3.5 text-muted-foreground" />
                <span>{pageTitle}</span>
              </>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-muted-foreground leading-none">Khit Admin Panel</p>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </Button>

          <div className="hidden text-right sm:block">
            <p className="max-w-[220px] truncate text-sm font-medium">{userEmail}</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>

          <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </header>
  );
}
