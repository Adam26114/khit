"use client";

import * as React from "react";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardAction
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormattedPrice } from "@/components/ui/formatted-price";
import { 
  Plus,
  Eye,
  TrendingUp,
  ShoppingCart,
  GripVertical
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionCards } from "@/components/admin/section-cards";
import { ChartAreaInteractive } from "@/components/admin/chart-area-interactive";
import { DataTableV2 } from "@/components/admin/data-table-v2";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";

export default function AdminDashboard() {
  const todayStats = useQuery(api.orders.getTodayStats);
  const productsCount = useQuery(api.products.getCount);
  const lowStockProducts = useQuery(api.products.getLowStock, { threshold: 5 });
  const revenueStats = useQuery(api.orders.getRevenueStats);
  const recentOrders = useQuery(api.orders.getRecentOrders, { limit: 10 });

  const isLoading = 
    todayStats === undefined || 
    productsCount === undefined || 
    lowStockProducts === undefined ||
    revenueStats === undefined ||
    recentOrders === undefined;

  const dashboardStats = React.useMemo(() => ({
    revenue: todayStats?.revenue ?? 0,
    pending: todayStats?.pending ?? 0,
    productsCount: productsCount ?? 0,
    lowStockCount: lowStockProducts?.length ?? 0,
  }), [todayStats, productsCount, lowStockProducts]);

  const columns: ColumnDef<any>[] = [
    {
      id: "drag",
      header: () => null,
      cell: ({ row }) => {
        const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
          id: row.original._id,
        });

        return (
          <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className="flex items-center justify-center w-8 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <GripVertical className="size-3.5" />
          </div>
        );
      },
    },
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "orderNumber",
      header: "Order",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.getValue("orderNumber")}</span>
      ),
    },
    {
      accessorKey: "customerInfo",
      header: "Customer",
      cell: ({ row }) => {
        const customer = row.original.customerInfo;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{customer.name}</span>
            <span className="text-xs text-muted-foreground">{customer.email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize px-2 py-0.5 text-[10px] font-medium">
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      accessorKey: "total",
      header: () => <div className="text-right">Total</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <FormattedPrice price={row.getValue("total")} className="font-semibold" />
        </div>
      ),
    },
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => (
        <div className="text-right">
          <Button variant="ghost" size="icon" className="size-8" asChild>
            <Link href={`/admin/orders/${row.original._id}`}>
              <Eye className="size-4" />
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8 p-0 @container/main">
      <div className="flex items-center justify-between">
        <div className="grid gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Overview of your store's performance and recent activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-2" asChild>
            <Link href="/admin/products/new">
              <Plus className="size-4" />
              Add Product
            </Link>
          </Button>
          <Button size="sm" className="h-9 gap-2" asChild>
            <Link href="/admin/orders">
              <ShoppingCart className="size-4" />
              Manage Orders
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <SectionCards stats={dashboardStats} />
      )}

      <div className="grid gap-6">
        {isLoading ? (
          <Skeleton className="h-[400px] w-full rounded-xl" />
        ) : (
          <ChartAreaInteractive data={revenueStats.daily} />
        )}
      </div>

      <div className="flex flex-col gap-6">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col gap-4 mb-4">
            <div className="grid gap-1">
              <h2 className="text-xl font-semibold tracking-tight">Recent Orders</h2>
            </div>
            
            <div className="flex items-center">
              <TabsList className="bg-muted/50 p-0.5 h-9">
                <TabsTrigger value="all" className="px-4 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  All Orders
                </TabsTrigger>
                <TabsTrigger value="pending" className="px-4 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Pending <Badge variant="secondary" className="ml-2 h-4 px-1 text-[10px]">3</Badge>
                </TabsTrigger>
                <TabsTrigger value="processing" className="px-4 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Processing
                </TabsTrigger>
                <TabsTrigger value="completed" className="px-4 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Completed
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <Card className="flex flex-col overflow-hidden @container/card border-none shadow-none bg-transparent">
            <CardContent className="p-0">
              <TabsContent value="all" className="m-0 border-none outline-none">
                <div className="bg-card">
                  <div className="px-0 py-0">
                    {isLoading ? (
                      <div className="p-6 space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                      </div>
                    ) : (
                      <DataTableV2 
                        columns={columns} 
                        data={recentOrders} 
                        getRowId={(row) => row._id}
                        searchKey="orderNumber"
                      />
                    )}
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
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
