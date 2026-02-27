"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { AdminDashboardOperationsTable } from "@/components/admin/dashboard-operations-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormattedPrice } from "@/components/ui/formatted-price";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS = [
  { label: "Last 3 months", value: "90d" as const },
  { label: "Last 30 days", value: "30d" as const },
  { label: "Last 7 days", value: "7d" as const },
];

function normalizeTrend(value: number, positiveIsGood: boolean): number {
  return positiveIsGood ? value : value * -1;
}

function TrendBadge({ value }: { value: number }) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2 py-0 text-[11px] font-medium",
        isNeutral && "text-muted-foreground",
        isPositive && "border-emerald-200 bg-emerald-50 text-emerald-700",
        !isPositive && !isNeutral && "border-orange-200 bg-orange-50 text-orange-700"
      )}
    >
      {isNeutral ? null : isPositive ? <ArrowUpRight className="mr-1 size-3" /> : <ArrowDownRight className="mr-1 size-3" />}
      {isNeutral ? "0%" : `${value > 0 ? "+" : ""}${value.toFixed(1)}%`}
    </Badge>
  );
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]["value"]>("7d");

  const kpis = useQuery(api.orders.getDashboardKpis, { lowStockThreshold: 5 });
  const revenueSeries = useQuery(api.orders.getRevenueSeries, { range });
  const tableRows = useQuery(api.orders.getDashboardTableRows, {
    limit: 68,
    lowStockThreshold: 5,
  });

  const chartData = useMemo(() => {
    if (!revenueSeries) return [];

    const maxRevenue = Math.max(...revenueSeries.map((item) => item.revenue), 1);
    const maxOrders = Math.max(...revenueSeries.map((item) => item.orderCount), 1);

    return revenueSeries.map((item) => ({
      ...item,
      ordersTrend: (item.orderCount / maxOrders) * maxRevenue * 0.65,
    }));
  }, [revenueSeries]);

  const isKpiLoading = kpis === undefined;
  const isChartLoading = revenueSeries === undefined;

  return (
    <div className="space-y-6 pb-8">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <CardDescription className="text-xs uppercase tracking-[0.12em]">Revenue Today</CardDescription>
              {isKpiLoading ? <Skeleton className="h-5 w-16" /> : <TrendBadge value={normalizeTrend(kpis.revenueTodayTrend, true)} />}
            </div>
            {isKpiLoading ? (
              <Skeleton className="mt-1 h-8 w-40" />
            ) : (
              <CardTitle className="text-3xl font-semibold tracking-tight">
                <FormattedPrice price={kpis.revenueToday} />
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            <p className="text-sm font-medium">From {kpis?.todayOrderCount ?? 0} orders today</p>
            <p className="text-sm text-muted-foreground">Compared to yesterday.</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <CardDescription className="text-xs uppercase tracking-[0.12em]">Pending Orders</CardDescription>
              {isKpiLoading ? <Skeleton className="h-5 w-16" /> : <TrendBadge value={normalizeTrend(kpis.pendingOrdersTrend, false)} />}
            </div>
            <div className="flex items-center justify-between">
              {isKpiLoading ? (
                <Skeleton className="mt-1 h-8 w-20" />
              ) : (
                <CardTitle className="text-3xl font-semibold tracking-tight">{kpis.pendingOrders}</CardTitle>
              )}
              <Clock3 className="size-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            <p className="text-sm font-medium">Requires attention</p>
            <p className="text-sm text-muted-foreground">Compared to yesterday pending queue.</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <CardDescription className="text-xs uppercase tracking-[0.12em]">Total Sales</CardDescription>
              {isKpiLoading ? <Skeleton className="h-5 w-16" /> : <TrendBadge value={normalizeTrend(kpis.totalSalesTrend, true)} />}
            </div>
            {isKpiLoading ? (
              <Skeleton className="mt-1 h-8 w-44" />
            ) : (
              <CardTitle className="text-3xl font-semibold tracking-tight">
                <FormattedPrice price={kpis.totalSales} />
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            <p className="text-sm font-medium">Lifetime earnings</p>
            <p className="text-sm text-muted-foreground">Compared to the previous 30-day window.</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <CardDescription className="text-xs uppercase tracking-[0.12em]">Low Stock Items</CardDescription>
              {isKpiLoading ? <Skeleton className="h-5 w-16" /> : <TrendBadge value={normalizeTrend(kpis.lowStockTrend, false)} />}
            </div>
            <div className="flex items-center justify-between">
              {isKpiLoading ? (
                <Skeleton className="mt-1 h-8 w-20" />
              ) : (
                <CardTitle className="text-3xl font-semibold tracking-tight">{kpis.lowStockItems}</CardTitle>
              )}
              <AlertTriangle className="size-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            <p className="text-sm font-medium">Items below threshold</p>
            <p className="text-sm text-muted-foreground">Threshold set at {kpis?.lowStockThreshold ?? 5} units.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="rounded-xl border shadow-sm xl:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>Weekly Revenue</CardTitle>
                <CardDescription>Sales overview for the last 7 days.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {RANGE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={range === option.value ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-8",
                      range === option.value && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={() => setRange(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {isChartLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={24}
                  />
                  <Tooltip
                    cursor={false}
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const point = payload[0]?.payload as
                        | { revenue: number; orderCount: number }
                        | undefined;
                      if (!point) return null;

                      return (
                        <div className="rounded-xl border bg-background px-3 py-2 text-xs shadow-sm">
                          <p className="mb-1 font-medium">{String(label)}</p>
                          <p className="text-muted-foreground">
                            Revenue: <span className="font-medium text-foreground">{point.revenue.toLocaleString()} MMK</span>
                          </p>
                          <p className="text-muted-foreground">
                            Orders: <span className="font-medium text-foreground">{point.orderCount}</span>
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ordersTrend"
                    stroke="hsl(var(--foreground))"
                    strokeOpacity={0.55}
                    fill="url(#ordersFill)"
                    fillOpacity={1}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--foreground))"
                    strokeWidth={1.5}
                    fill="url(#revenueFill)"
                    fillOpacity={1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage store operations quickly.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-hidden rounded-lg border">
              {[
                { href: "/admin/orders", label: "View Orders", icon: ShoppingCart },
                { href: "/admin/products", label: "Catalog Management", icon: Package },
                { href: "/admin/inventory", label: "Stock Control", icon: AlertTriangle },
                { href: "/admin/users", label: "User Management", icon: Users },
              ].map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-3 text-sm transition-colors hover:bg-muted/50",
                    index !== 3 && "border-b"
                  )}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <item.icon className="size-4 text-muted-foreground" />
                    {item.label}
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-xl border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle>Operational Sections</CardTitle>
          <CardDescription>
            Live rows aggregated from orders, inventory signals, and product publishing states.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-5 pt-1">
          <AdminDashboardOperationsTable rows={tableRows} />
        </CardContent>
      </Card>
    </div>
  );
}
