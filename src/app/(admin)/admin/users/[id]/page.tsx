"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormattedPrice } from "@/components/ui/formatted-price";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Phone, Calendar, ShoppingBag, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { Id } from "@/../convex/_generated/dataModel";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as Id<"users">;

  const data = useQuery(api.users.getUserWithOrders, { id: userId });

  if (data === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    );
  }

  const { user, orders } = data;

  const totalSpent = orders.reduce((sum, order) => {
    if (["cancelled", "pending"].includes(order.status)) return sum;
    return sum + order.total;
  }, 0);

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {user.name}
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                {user.role}
              </Badge>
            </h1>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Contact Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Mail className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">Email</p>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            {user.phone && (
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <Phone className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Phone</p>
                  <p className="truncate text-sm text-muted-foreground">{user.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Calendar className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">Joined On</p>
                <p className="truncate text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Customer Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                <ShoppingBag className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">Total Orders</p>
                <p className="text-sm text-muted-foreground">{orders.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                <FormattedPrice className="size-4 text-muted-foreground" price={totalSpent} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">Total Spent</p>
                <p className="text-sm text-muted-foreground">
                  <FormattedPrice price={totalSpent} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order History */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Order History</h2>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center text-muted-foreground">
            <Package className="mb-4 size-8 text-muted-foreground/50" />
            <p className="text-sm">No orders found for this user.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Order ID</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Date</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Status</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Items</th>
                  <th className="h-10 px-4 text-right font-medium text-muted-foreground">Total</th>
                  <th className="h-10 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium">{order.orderNumber}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 capitalize">
                      <Badge variant="outline" className="text-xs">
                        {order.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </td>
                    <td className="p-4 text-right font-medium">
                      <FormattedPrice price={order.total} />
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/admin/orders/${order._id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
