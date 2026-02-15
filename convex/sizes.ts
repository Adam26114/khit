import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAll = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, { includeInactive }) => {
    let sizes;
    if (includeInactive) {
      sizes = await ctx.db.query("sizes").collect();
    } else {
      sizes = await ctx.db
        .query("sizes")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
    }

    return sizes.sort(
      (a, b) =>
        a.sizeCategory.localeCompare(b.sizeCategory) ||
        a.displayOrder - b.displayOrder ||
        a.name.localeCompare(b.name)
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    nameMm: v.optional(v.string()),
    sizeCategory: v.string(),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const maxDisplayOrder = (await ctx.db.query("sizes").collect()).reduce(
      (max, size) => Math.max(max, size.displayOrder),
      0
    );

    return await ctx.db.insert("sizes", {
      name: args.name.trim().toUpperCase(),
      nameMm: args.nameMm?.trim() || undefined,
      sizeCategory: args.sizeCategory.trim() || "apparel",
      displayOrder: args.displayOrder ?? maxDisplayOrder + 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("sizes"),
    updates: v.object({
      name: v.optional(v.string()),
      nameMm: v.optional(v.string()),
      sizeCategory: v.optional(v.string()),
      displayOrder: v.optional(v.number()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { id, updates }) => {
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Size not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      name: updates.name ? updates.name.trim().toUpperCase() : undefined,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("sizes"),
  },
  handler: async (ctx, { id }) => {
    const inUse = await ctx.db
      .query("productVariants")
      .withIndex("by_product_size")
      .filter((q) => q.eq(q.field("sizeId"), id))
      .first();

    if (inUse) {
      throw new Error("Cannot delete size: it is used by product variants");
    }

    await ctx.db.patch(id, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});
