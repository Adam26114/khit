import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAll = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, { includeInactive }) => {
    let colors;
    if (includeInactive) {
      colors = await ctx.db.query("colors").collect();
    } else {
      colors = await ctx.db
        .query("colors")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
    }

    return colors.sort(
      (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    nameMm: v.optional(v.string()),
    hexCode: v.string(),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const maxDisplayOrder = (await ctx.db.query("colors").collect()).reduce(
      (max, color) => Math.max(max, color.displayOrder),
      0
    );

    return await ctx.db.insert("colors", {
      name: args.name.trim(),
      nameMm: args.nameMm?.trim() || undefined,
      hexCode: args.hexCode.trim() || "#111111",
      displayOrder: args.displayOrder ?? maxDisplayOrder + 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("colors"),
    updates: v.object({
      name: v.optional(v.string()),
      nameMm: v.optional(v.string()),
      hexCode: v.optional(v.string()),
      displayOrder: v.optional(v.number()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { id, updates }) => {
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Color not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("colors"),
  },
  handler: async (ctx, { id }) => {
    const inUse = await ctx.db
      .query("productVariants")
      .withIndex("by_product_color")
      .filter((q) => q.eq(q.field("colorId"), id))
      .first();

    if (inUse) {
      throw new Error("Cannot delete color: it is used by product variants");
    }

    await ctx.db.patch(id, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});
