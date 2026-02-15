"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Eye, Package } from "lucide-react";
import { notify } from "@/lib/notifications";

interface OrderItem {
  productId: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerId?: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  deliveryMethod: "shipping" | "pickup";
  paymentMethod: "cod";
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  processing: "bg-purple-500",
  shipped: "bg-indigo-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const orders = useQuery(
    api.orders.getAll,
    statusFilter === "all" ? {} : { status: statusFilter as "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" }
  );
  const updateStatus = useMutation(api.orders.updateStatus);

  const filteredOrders = (orders as Order[] | undefined)?.filter((order: Order) =>
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerInfo.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateStatus({ id: orderId as any, status: newStatus as "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" });
      notify.success(`Order status updated to ${statusLabels[newStatus]}`);
    } catch (error) {
      notify.actionError("update order status", error);
    }
  };

  if (orders === undefined) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Orders</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number, customer name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredOrders?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No orders found</p>
              </div>
            ) : (
              filteredOrders?.map((order: Order) => (
                <div
                  key={order._id}
                  className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold">{order.orderNumber}</span>
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.customerInfo.name} • {order.customerInfo.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()} •{" "}
                      {order.items.length} items • Ks {order.total.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusUpdate(order._id, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedOrder(order._id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <OrderDetail orderId={selectedOrder} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderDetail({ orderId }: { orderId: string }) {
  // This would ideally be a separate query to get full order details
  // For now, we'll get all orders and find the one we need
  const orders = useQuery(api.orders.getAll, {});
  const order = (orders as Order[] | undefined)?.find((o: Order) => o._id === orderId);

  if (!order) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Order Number</p>
          <p className="font-semibold">{order.orderNumber}</p>
        </div>
        <Badge className={statusColors[order.status]}>
          {statusLabels[order.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Customer</p>
          <p className="font-medium">{order.customerInfo.name}</p>
          <p className="text-sm">{order.customerInfo.email}</p>
          <p className="text-sm">{order.customerInfo.phone}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Order Date</p>
          <p>{new Date(order.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-2">Delivery Method</p>
        <p className="capitalize">{order.deliveryMethod}</p>
        {order.deliveryMethod === "shipping" && order.customerInfo.address && (
          <p className="text-sm mt-1">{order.customerInfo.address}</p>
        )}
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Items</p>
        <div className="space-y-2">
          {order.items.map((item: OrderItem, idx: number) => (
            <div key={idx} className="flex justify-between py-2 border-b">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                </p>
              </div>
              <p className="font-medium">Ks {item.price.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>Ks {order.subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>Ks {order.shippingFee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>Ks {order.total.toLocaleString()}</span>
        </div>
      </div>

      {order.notes && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Notes</p>
          <p className="text-sm">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
