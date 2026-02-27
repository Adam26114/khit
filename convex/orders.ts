import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { nanoid } from "nanoid";
import type { Doc, Id } from "./_generated/dataModel";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const CANCELLED_STATUS = "cancelled";

type DashboardStatus = "Done" | "In Process";
type DashboardSourceType = "order" | "inventory" | "product";

function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const random = nanoid(6).toUpperCase();
  return `ORD-${year}-${random}`;
}

async function findColorVariantBySelection(
  ctx: MutationCtx,
  selection: { productId: Id<"products">; color: string; size: string }
): Promise<{ product: Doc<"products">; colorVariantIndex: number } | null> {
  const product = await ctx.db.get(selection.productId);
  if (!product) {
    return null;
  }

  const colorVariants = product.colorVariants ?? [];

  for (let i = 0; i < colorVariants.length; i++) {
    const cv = colorVariants[i];
    if (cv.colorName.toLowerCase() === selection.color.toLowerCase()) {
      return { product, colorVariantIndex: i };
    }
  }

  if (colorVariants.length > 0) {
    return { product, colorVariantIndex: 0 };
  }

  return null;
}

function startOfDayTimestamp(date: Date): number {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

function toPercentDelta(current: number, previous: number): number {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  const delta = ((current - previous) / Math.abs(previous)) * 100;
  return Math.round(delta * 10) / 10;
}

function sumOrderRevenue(orders: Doc<"orders">[]): number {
  return orders.reduce((sum, order) => {
    if (order.status === CANCELLED_STATUS) return sum;
    return sum + order.total;
  }, 0);
}

function countPendingOrders(orders: Doc<"orders">[]): number {
  return orders.filter((order) => order.status === "pending").length;
}

function sumOrderQuantities(orders: Doc<"orders">[]): Map<string, number> {
  const quantities = new Map<string, number>();
  for (const order of orders) {
    if (order.status === CANCELLED_STATUS) continue;
    for (const item of order.items) {
      const key = String(item.productId);
      quantities.set(key, (quantities.get(key) ?? 0) + item.quantity);
    }
  }
  return quantities;
}

function getProductTotalStock(product: Doc<"products">): number {
  if (!product.colorVariants || product.colorVariants.length === 0) {
    return product.stock ?? 0;
  }
  return product.colorVariants.reduce((sum, variant) => {
    return (
      sum +
      variant.selectedSizes.reduce((variantSum, size) => {
        return variantSum + (variant.stock?.[size] ?? 0);
      }, 0)
    );
  }, 0);
}

async function getOrdersInRange(
  ctx: QueryCtx,
  startTs: number,
  endTs: number
): Promise<Doc<"orders">[]> {
  return ctx.db
    .query("orders")
    .withIndex("by_createdAt", (q) => q.gte("createdAt", startTs).lt("createdAt", endTs))
    .collect();
}

function toDashboardStatus(
  status: Doc<"orders">["status"] | "healthy" | "warning"
): DashboardStatus {
  if (status === "delivered" || status === "confirmed" || status === "healthy") {
    return "Done";
  }
  return "In Process";
}

export const create = mutation({
  args: {
    customerId: v.optional(v.id("users")),
    customerInfo: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      address: v.optional(v.string()),
    }),
    items: v.array(
      v.object({
        productId: v.id("products"),
        colorVariantId: v.optional(v.string()),
        name: v.string(),
        size: v.string(),
        color: v.string(),
        quantity: v.number(),
        price: v.number(),
      })
    ),
    subtotal: v.number(),
    shippingFee: v.number(),
    total: v.number(),
    deliveryMethod: v.union(v.literal("shipping"), v.literal("pickup")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const orderNumber = generateOrderNumber();

    const itemsWithVariants: Array<{
      productId: Id<"products">;
      colorVariantId?: string;
      name: string;
      size: string;
      color: string;
      quantity: number;
      price: number;
    }> = [];

    for (const item of args.items) {
      const result = await findColorVariantBySelection(ctx, {
        productId: item.productId,
        color: item.color,
        size: item.size,
      });

      if (result) {
        const { product, colorVariantIndex } = result;
        const colorVariants = [...(product.colorVariants ?? [])];
        const cv = colorVariants[colorVariantIndex];

        const currentStock = cv.stock?.[item.size] ?? 0;

        if (currentStock < item.quantity) {
          throw new Error(`Not enough stock for ${item.name} (${item.color}/${item.size})`);
        }

        colorVariants[colorVariantIndex] = {
          ...cv,
          stock: {
            ...cv.stock,
            [item.size]: currentStock - item.quantity,
          },
        };

        await ctx.db.patch(product._id, {
          colorVariants,
          updatedAt: now,
        });
      }

      itemsWithVariants.push({
        ...item,
        colorVariantId: result ? `cv-${result.colorVariantIndex}` : undefined,
      });
    }

    const orderId = await ctx.db.insert("orders", {
      ...args,
      items: itemsWithVariants,
      orderNumber,
      paymentMethod: "cod",
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return { orderId, orderNumber };
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, { id, status }) => {
    const order = await ctx.db.get(id);
    if (!order) {
      throw new Error("Order not found");
    }

    if (status === "cancelled" && order.status !== "cancelled") {
      for (const item of order.items) {
        const result = await findColorVariantBySelection(ctx, {
          productId: item.productId,
          color: item.color,
          size: item.size,
        });

        if (!result) {
          continue;
        }

        const { product, colorVariantIndex } = result;
        const colorVariants = [...(product.colorVariants ?? [])];
        const cv = colorVariants[colorVariantIndex];

        const currentStock = cv.stock?.[item.size] ?? 0;

        colorVariants[colorVariantIndex] = {
          ...cv,
          stock: {
            ...cv.stock,
            [item.size]: currentStock + item.quantity,
          },
        };

        await ctx.db.patch(product._id, {
          colorVariants,
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.patch(id, {
      status,
      updatedAt: Date.now(),
    });
  },
});

export const getByNumber = query({
  args: { orderNumber: v.string() },
  handler: async (ctx, { orderNumber }) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderNumber", (q) => q.eq("orderNumber", orderNumber))
      .unique();

    return order;
  },
});

export const getByCustomer = query({
  args: { customerId: v.id("users") },
  handler: async (ctx, { customerId }) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_customer", (q) => q.eq("customerId", customerId))
      .order("desc")
      .collect();

    return orders;
  },
});

export const getAll = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("processing"),
        v.literal("shipped"),
        v.literal("delivered"),
        v.literal("cancelled")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let orders;

    if (args.status) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_createdAt")
        .order("desc")
        .collect();
    }

    if (args.limit) {
      orders = orders.slice(0, args.limit);
    }

    return orders;
  },
});

export const getTodayStats = query({
  args: {},
  handler: async (ctx) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startTimestamp = startOfDay.getTime();

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt")
      .filter((q) => q.gte(q.field("createdAt"), startTimestamp))
      .collect();

    const pending = orders.filter((order) => order.status === "pending").length;
    const todayRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    return {
      total: orders.length,
      pending,
      revenue: todayRevenue,
    };
  },
});

export const getDashboardKpis = query({
  args: {
    lowStockThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const threshold = args.lowStockThreshold ?? 5;
    const now = new Date();
    const todayStart = startOfDayTimestamp(now);
    const tomorrowStart = todayStart + ONE_DAY_MS;
    const yesterdayStart = todayStart - ONE_DAY_MS;

    const [todayOrders, yesterdayOrders, allOrders, activeProducts, current30Orders, previous30Orders] =
      await Promise.all([
        getOrdersInRange(ctx, todayStart, tomorrowStart),
        getOrdersInRange(ctx, yesterdayStart, todayStart),
        ctx.db.query("orders").collect(),
        ctx.db
          .query("products")
          .withIndex("by_active", (q) => q.eq("isActive", true))
          .collect(),
        getOrdersInRange(ctx, todayStart - 29 * ONE_DAY_MS, tomorrowStart),
        getOrdersInRange(ctx, todayStart - 59 * ONE_DAY_MS, todayStart - 29 * ONE_DAY_MS),
      ]);

    const revenueToday = sumOrderRevenue(todayOrders);
    const revenueYesterday = sumOrderRevenue(yesterdayOrders);
    const pendingToday = countPendingOrders(todayOrders);
    const pendingYesterday = countPendingOrders(yesterdayOrders);
    const totalSales = sumOrderRevenue(allOrders);
    const current30Revenue = sumOrderRevenue(current30Orders);
    const previous30Revenue = sumOrderRevenue(previous30Orders);

    const currentStockByProduct = new Map<string, number>();
    let lowStockItems = 0;
    for (const product of activeProducts) {
      const stock = getProductTotalStock(product);
      currentStockByProduct.set(String(product._id), stock);
      if (stock <= threshold) {
        lowStockItems += 1;
      }
    }

    const soldTodayByProduct = sumOrderQuantities(todayOrders);
    let estimatedYesterdayLowStockItems = 0;
    currentStockByProduct.forEach((stock, productId) => {
      const estimatedYesterdayStock = stock + (soldTodayByProduct.get(productId) ?? 0);
      if (estimatedYesterdayStock <= threshold) {
        estimatedYesterdayLowStockItems += 1;
      }
    });

    return {
      revenueToday,
      revenueTodayTrend: toPercentDelta(revenueToday, revenueYesterday),
      pendingOrders: pendingToday,
      pendingOrdersTrend: toPercentDelta(pendingToday, pendingYesterday),
      totalSales,
      totalSalesTrend: toPercentDelta(current30Revenue, previous30Revenue),
      lowStockItems,
      lowStockTrend: toPercentDelta(lowStockItems, estimatedYesterdayLowStockItems),
      todayOrderCount: todayOrders.length,
      lowStockThreshold: threshold,
    };
  },
});

export const getRevenueStats = query({
  args: {},
  handler: async (ctx) => {
    // Basic implementation: last 7 days revenue
    const now = new Date();
    const stats = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const startTime = date.getTime();
      
      const endTime = startTime + 24 * 60 * 60 * 1000;

      const dayOrders = await ctx.db
        .query("orders")
        .withIndex("by_createdAt", (q) => 
          q.gte("createdAt", startTime).lt("createdAt", endTime)
        )
        .collect();

      const revenue = dayOrders.reduce((sum, order) => {
        if (order.status === "cancelled") return sum;
        return sum + order.total;
      }, 0);

      stats.push({
        date: date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
        revenue,
      });
    }

    const totalOrders = await ctx.db.query("orders").collect();
    const lifetimeRevenue = totalOrders.reduce((sum, order) => {
      if (order.status === "cancelled") return sum;
      return sum + order.total;
    }, 0);

    return {
      daily: stats,
      lifetimeRevenue,
      totalOrders: totalOrders.length,
    };
  },
});

export const getRevenueSeries = query({
  args: {
    range: v.union(v.literal("7d"), v.literal("30d"), v.literal("90d")),
  },
  handler: async (ctx, args) => {
    const days = args.range === "90d" ? 90 : args.range === "30d" ? 30 : 7;
    const now = new Date();
    const todayStart = startOfDayTimestamp(now);
    const windowStart = todayStart - (days - 1) * ONE_DAY_MS;
    const windowEnd = todayStart + ONE_DAY_MS;

    const orders = await getOrdersInRange(ctx, windowStart, windowEnd);
    const grouped = new Map<string, { revenue: number; orderCount: number }>();

    for (let i = 0; i < days; i++) {
      const current = new Date(windowStart + i * ONE_DAY_MS);
      const iso = current.toISOString().slice(0, 10);
      grouped.set(iso, { revenue: 0, orderCount: 0 });
    }

    for (const order of orders) {
      const date = new Date(order.createdAt).toISOString().slice(0, 10);
      const entry = grouped.get(date);
      if (!entry) continue;
      if (order.status !== CANCELLED_STATUS) {
        entry.revenue += order.total;
        entry.orderCount += 1;
      }
    }

    return Array.from(grouped.entries()).map(([dateIso, metrics]) => {
      const date = new Date(`${dateIso}T00:00:00`);
      return {
        dateIso,
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: metrics.revenue,
        orderCount: metrics.orderCount,
      };
    });
  },
});

export const getDashboardTableRows = query({
  args: {
    limit: v.optional(v.number()),
    lowStockThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 68;
    const threshold = args.lowStockThreshold ?? 5;

    const [orders, activeProducts, users] = await Promise.all([
      ctx.db.query("orders").withIndex("by_createdAt").order("desc").take(50),
      ctx.db
        .query("products")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect(),
      ctx.db.query("users").collect(),
    ]);

    const reviewers = users
      .filter((user) => user.role === "admin")
      .map((user) => user.name?.trim())
      .filter((name): name is string => Boolean(name));

    const reviewerAt = (index: number): string => {
      if (reviewers.length === 0 || index % 3 === 0) {
        return "Assign reviewer";
      }
      return reviewers[index % reviewers.length];
    };

    const orderRows = orders.map((order, index) => {
      const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
      return {
        id: `order-${order._id}`,
        header: `Order ${order.orderNumber}`,
        sectionType: "Order",
        status: toDashboardStatus(order.status),
        target: quantity,
        limit: 5,
        reviewer: reviewerAt(index),
        sourceType: "order" as DashboardSourceType,
        sourceId: String(order._id),
      };
    });

    const inventoryRows: Array<{
      id: string;
      header: string;
      sectionType: string;
      status: DashboardStatus;
      target: number;
      limit: number;
      reviewer: string;
      sourceType: DashboardSourceType;
      sourceId: string;
    }> = [];

    for (const product of activeProducts) {
      for (const variant of product.colorVariants ?? []) {
        for (const size of variant.selectedSizes) {
          const stock = variant.stock?.[size] ?? 0;
          inventoryRows.push({
            id: `inventory-${product._id}-${variant.id}-${size}`,
            header: `${product.name} (${variant.colorName} / ${size})`,
            sectionType: "Inventory",
            status: toDashboardStatus(stock > threshold ? "healthy" : "warning"),
            target: stock,
            limit: threshold,
            reviewer: reviewerAt(inventoryRows.length + orderRows.length),
            sourceType: "inventory",
            sourceId: `${product._id}:${variant.id}:${size}`,
          });
        }
      }
    }

    const productRows = activeProducts.map((product, index) => {
      const totalStock = getProductTotalStock(product);
      const isPublished = product.isPublished !== false;
      return {
        id: `product-${product._id}`,
        header: product.name,
        sectionType: "Product",
        status: toDashboardStatus(isPublished && totalStock > threshold ? "healthy" : "warning"),
        target: totalStock,
        limit: threshold,
        reviewer: reviewerAt(index + orderRows.length + inventoryRows.length),
        sourceType: "product" as DashboardSourceType,
        sourceId: String(product._id),
      };
    });

    const rows = [...orderRows, ...inventoryRows, ...productRows]
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "In Process" ? -1 : 1;
        }
        return a.header.localeCompare(b.header);
      })
      .slice(0, limit);

    return rows;
  },
});

export const getRecentOrders = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_createdAt")
      .order("desc")
      .take(args.limit ?? 10);
  },
});
