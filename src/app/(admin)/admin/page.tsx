"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormattedPrice } from "@/components/ui/formatted-price";
import { 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Users,
  Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const todayStats = useQuery(api.orders.getTodayStats);
  const productsCount = useQuery(api.products.getCount);
  const lowStockProducts = useQuery(api.products.getLowStock, { threshold: 5 });
  const revenueStats = useQuery(api.orders.getRevenueStats);
  const recentOrders = useQuery(api.orders.getRecentOrders, { limit: 5 });

  const isLoading = 
    todayStats === undefined || 
    productsCount === undefined || 
    lowStockProducts === undefined ||
    revenueStats === undefined ||
    recentOrders === undefined;

  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track sales, monitor stock, and manage your store.
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border/60 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold tracking-tight">
                <FormattedPrice price={todayStats?.revenue ?? 0} />
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              From {todayStats?.total ?? 0} orders today
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold tracking-tight">{todayStats?.pending ?? 0}</div>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold tracking-tight">
                <FormattedPrice price={revenueStats?.lifetimeRevenue ?? 0} />
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold tracking-tight">{lowStockProducts?.length ?? 0}</div>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">Items below threshold</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weekly Revenue Bar Chart (Simulated) */}
        <Card className="lg:col-span-2 border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Weekly Revenue</CardTitle>
            <CardDescription>Sales overview for the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <div className="flex h-[200px] items-end justify-between gap-2 px-2 pt-4">
                {revenueStats.daily.map((day, idx) => {
                  const maxRevenue = Math.max(...revenueStats.daily.map(d => d.revenue), 1);
                  const height = `${(day.revenue / maxRevenue) * 100}%`;
                  
                  return (
                    <div key={idx} className="group relative flex flex-1 flex-col items-center gap-2">
                      <div className="absolute -top-6 hidden group-hover:block">
                        <Badge variant="secondary" className="text-[10px] whitespace-nowrap px-1.5 py-0">
                          <FormattedPrice price={day.revenue} />
                        </Badge>
                      </div>
                      <div 
                        className="w-full max-w-[40px] rounded-t-sm bg-primary/20 transition-all hover:bg-primary/40" 
                        style={{ height: day.revenue === 0 ? "4px" : height }}
                      />
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{day.date}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            <CardDescription>Manage store operations quickly.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {[
              { href: "/admin/orders", label: "View Orders", icon: ShoppingCart },
              { href: "/admin/products", label: "Catalog Management", icon: Package },
              { href: "/admin/inventory", label: "Stock Control", icon: TableIcon },
              { href: "/admin/users", label: "User Management", icon: Users },
            ].map((action, i) => (
              <Button key={i} variant="outline" size="sm" className="justify-between h-9 px-3 group" asChild>
                <Link href={action.href}>
                  <span className="flex items-center gap-2">
                    <action.icon className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    {action.label}
                  </span>
                  <ArrowRight className="size-3 text-muted-foreground/50 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Recent Orders</CardTitle>
            <CardDescription>Last 5 orders placed on your store.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/orders" className="text-xs flex items-center gap-1.5 text-primary">
              View all <ArrowRight className="size-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No orders found yet.
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Order</th>
                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Customer</th>
                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">Amount</th>
                    <th className="h-10 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-2 align-middle font-medium">{order.orderNumber}</td>
                      <td className="p-2 align-middle">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">{order.customerInfo.name}</span>
                          <span className="text-[10px] text-muted-foreground">{order.customerInfo.email}</span>
                        </div>
                      </td>
                      <td className="p-2 align-middle">
                        <Badge variant="outline" className="text-[10px] font-normal uppercase py-0 px-1.5">
                          {order.status}
                        </Badge>
                      </td>
                      <td className="p-2 align-middle text-right">
                        <FormattedPrice price={order.total} className="text-xs" />
                      </td>
                      <td className="p-2 align-middle text-right">
                        <Button variant="ghost" size="icon" className="size-7" asChild>
                          <Link href={`/admin/orders/${order._id}`}>
                            <Eye className="size-3.5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Simple fallback for TableIcon which I missed in imports but used in actions
function TableIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 3v18" /><path d="M3 12h18" /><rect width="18" height="18" x="3" y="3" rx="2" />
    </svg>
  );
}
