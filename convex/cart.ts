import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return await Promise.all(
      items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        
        const colorVariants = product?.colorVariants ?? [];
        const colorVariant = colorVariants.find(cv => cv.id === item.colorVariantId);
        
        const sizeStock = colorVariant?.stock?.[item.size] ?? 0;

        return {
          ...item,
          product,
          colorVariant,
          sizeStock,
        };
      })
    );
  },
});

export const upsertItem = mutation({
  args: {
    userId: v.id("users"),
    productId: v.id("products"),
    colorVariantId: v.string(),
    size: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, { userId, productId, colorVariantId, size, quantity }) => {
    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_user_product_size", (q) =>
        q.eq("userId", userId).eq("productId", productId).eq("colorVariantId", colorVariantId).eq("size", size)
      )
      .unique();

    const safeQuantity = Math.max(0, quantity);

    if (safeQuantity === 0) {
      if (existing) {
        await ctx.db.delete(existing._id);
      }
      return null;
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        quantity: safeQuantity,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("cartItems", {
      userId,
      productId,
      colorVariantId,
      size,
      quantity: safeQuantity,
      addedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const removeItem = mutation({
  args: {
    userId: v.id("users"),
    productId: v.id("products"),
    colorVariantId: v.string(),
    size: v.string(),
  },
  handler: async (ctx, { userId, productId, colorVariantId, size }) => {
    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_user_product_size", (q) =>
        q.eq("userId", userId).eq("productId", productId).eq("colorVariantId", colorVariantId).eq("size", size)
      )
      .unique();

    if (!existing) {
      return;
    }

    await ctx.db.delete(existing._id);
  },
});

export const clearUserCart = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }
  },
});
