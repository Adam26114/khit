"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowRight, Clock, Package, ShoppingCart } from "lucide-react";

export default function AdminDashboard() {
  const todayStats = useQuery(api.orders.getTodayStats);
  const productsCount = useQuery(api.products.getCount);
  const lowStockProducts = useQuery(api.products.getLowStock, { threshold: 5 });

  const isLoading = todayStats === undefined || productsCount === undefined || lowStockProducts === undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track orders, monitor stock, and manage catalog activity in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders Today</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-3xl font-semibold">{todayStats?.total ?? 0}</div>}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-3xl font-semibold">{todayStats?.pending ?? 0}</div>}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-3xl font-semibold">{productsCount ?? 0}</div>}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-3xl font-semibold">{lowStockProducts?.length ?? 0}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle>Daily overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Orders</p>
                {isLoading ? <Skeleton className="mt-2 h-6 w-14" /> : <p className="mt-2 text-2xl font-semibold">{todayStats?.total ?? 0}</p>}
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Pending</p>
                {isLoading ? <Skeleton className="mt-2 h-6 w-14" /> : <p className="mt-2 text-2xl font-semibold">{todayStats?.pending ?? 0}</p>}
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Low stock</p>
                {isLoading ? <Skeleton className="mt-2 h-6 w-14" /> : <p className="mt-2 text-2xl font-semibold">{lowStockProducts?.length ?? 0}</p>}
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">
                Keep variant stock synced to prevent overselling. Use Inventory and Variants pages to update quantities.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link href="/admin/orders">
                Manage Orders
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link href="/admin/products">
                Add or Edit Products
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link href="/admin/variants">
                Manage Variants
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link href="/admin/media">
                Upload Media
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
