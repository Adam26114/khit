"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { useSession } from "@/lib/auth";
import { AdminLoadingState } from "@/components/admin/admin-loading-state";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: isSessionPending } = useSession();
  const isAdmin = useQuery(api.users.isAdmin);
  const router = useRouter();

  useEffect(() => {
    if (!isSessionPending && !session) {
      // Not logged in, redirect to login
      router.push("/login?callbackUrl=/admin");
    } else if (!isSessionPending && isAdmin === false) {
      // Logged in but not admin, redirect to store
      router.push("/");
    }
  }, [isSessionPending, session, isAdmin, router]);

  if (isSessionPending || isAdmin === undefined) {
    return <AdminLoadingState />;
  }

  if (!session || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
