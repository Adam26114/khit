import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all active categories
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("asc")
      .collect();

    return categories;
  },
});

// Get category by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    return category;
  },
});

// Get categories by parent
export const getByParent = query({
  args: { parentId: v.optional(v.id("categories")) },
  handler: async (ctx, { parentId }) => {
    if (parentId) {
      const categories = await ctx.db
        .query("categories")
        .withIndex("by_parent", (q) => q.eq("parentId", parentId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("asc")
        .collect();

      return categories;
    } else {
      // Get root categories (no parent)
      const categories = await ctx.db
        .query("categories")
        .filter((q) =>
          q.and(
            q.eq(q.field("isActive"), true),
            q.eq(q.field("parentId"), undefined)
          )
        )
        .order("asc")
        .collect();

      return categories;
    }
  },
});

// Create category
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const categoryId = await ctx.db.insert("categories", {
      ...args,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    return categoryId;
  },
});

// Update category
export const update = mutation({
  args: {
    id: v.id("categories"),
    updates: v.object({
      name: v.optional(v.string()),
      slug: v.optional(v.string()),
      description: v.optional(v.string()),
      parentId: v.optional(v.id("categories")),
      sortOrder: v.optional(v.number()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { id, updates }) => {
    const category = await ctx.db.get(id);
    if (!category) {
      throw new Error("Category not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete category (soft delete)
export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});
