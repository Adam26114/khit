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
        const variant = await ctx.db.get(item.variantId);
        const product = variant ? await ctx.db.get(variant.productId) : null;
        const color = variant ? await ctx.db.get(variant.colorId) : null;
        const size = variant ? await ctx.db.get(variant.sizeId) : null;

        return {
          ...item,
          variant,
          product,
          color,
          size,
        };
      })
    );
  },
});

export const upsertItem = mutation({
  args: {
    userId: v.id("users"),
    variantId: v.id("productVariants"),
    quantity: v.number(),
  },
  handler: async (ctx, { userId, variantId, quantity }) => {
    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_user_variant", (q) =>
        q.eq("userId", userId).eq("variantId", variantId)
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
      variantId,
      quantity: safeQuantity,
      addedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const removeItem = mutation({
  args: {
    userId: v.id("users"),
    variantId: v.id("productVariants"),
  },
  handler: async (ctx, { userId, variantId }) => {
    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_user_variant", (q) =>
        q.eq("userId", userId).eq("variantId", variantId)
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
