"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormattedPrice } from "@/components/ui/formatted-price";
import { Users, Eye, ArrowRightLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { notify } from "@/lib/notifications";
import type { Id } from "@/../convex/_generated/dataModel";

interface UserWithStats {
  _id: Id<"users">;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "customer";
  isActive: boolean;
  createdAt: number;
  totalOrders: number;
  totalSpent: number;
}

export default function UsersPage() {
  const users = useQuery(api.users.getUsersWithStats);
  const updateRole = useMutation(api.users.updateRole);

  const handleToggleRole = async (user: UserWithStats) => {
    if (!confirm(`Are you sure you want to change ${user.name}'s role to ${user.role === 'admin' ? 'Customer' : 'Admin'}?`)) return;
    
    try {
      await updateRole({
        id: user._id,
        role: user.role === "admin" ? "customer" : "admin",
      });
      notify.success(`Role updated successfully for ${user.name}`);
    } catch (error) {
      notify.actionError("update user role", error);
    }
  };

  const columns: AdminTableColumn<UserWithStats>[] = [
    {
      id: "name",
      header: "User Details",
      searchAccessor: (user) => `${user.name} ${user.email} ${user.phone || ""}`,
      cell: (user) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{user.name}</span>
          <span className="text-sm text-muted-foreground">{user.email}</span>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      cell: (user) => (
        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
          {user.role}
        </Badge>
      ),
    },
    {
      id: "orders",
      header: "Orders",
      cell: (user) => (
        <div className="flex flex-col">
          <span className="font-medium">{user.totalOrders}</span>
          {user.totalOrders > 0 && (
            <span className="text-sm text-muted-foreground mt-0.5">
              <FormattedPrice price={user.totalSpent} />
            </span>
          )}
        </div>
      ),
    },
    {
      id: "joined",
      header: "Joined",
      cell: (user) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  if (users === undefined) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Users</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground mt-1">
          View customer profiles, order history, and manage administrator access.
        </p>
      </div>

      <AdminDataTable
        data={users as UserWithStats[]}
        columns={columns}
        getRowId={(user) => user._id}
        emptyTitle="No users found"
        emptyDescription="Your registered customers will appear here."
        emptyIcon={Users}
        searchPlaceholder="Search by name or email..."
        rowActions={(user) => [
          {
            label: "View Details",
            icon: Eye,
            content: (
              <Link href={`/admin/users/${user._id}`} className="flex w-full items-center">
                <Eye className="mr-2 size-4" />
                View Details
              </Link>
            ),
            onClick: () => {}, // Handled by Link inside content
          },
          {
            label: `Make ${user.role === 'admin' ? 'Customer' : 'Admin'}`,
            icon: ArrowRightLeft,
            onClick: () => handleToggleRole(user),
          },
        ]}
      />
    </div>
  );
}
