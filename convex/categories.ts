import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

async function deleteVariantCascade(
  ctx: MutationCtx,
  variantId: Id<"productVariants">
) {
  const [mediaItems, cartItems, wishlistItems] = await Promise.all([
    ctx.db
      .query("media")
      .withIndex("by_variant", (q) => q.eq("variantId", variantId))
      .collect(),
    ctx.db.query("cartItems").collect(),
    ctx.db.query("wishlistItems").collect(),
  ]);

  for (const media of mediaItems) {
    await ctx.db.delete(media._id);
  }

  for (const item of cartItems) {
    if (item.variantId === variantId) {
      await ctx.db.delete(item._id);
    }
  }

  for (const item of wishlistItems) {
    if (item.variantId === variantId) {
      await ctx.db.delete(item._id);
    }
  }

  await ctx.db.delete(variantId);
}

async function deleteProductCascade(ctx: MutationCtx, productId: Id<"products">) {
  const variants = await ctx.db
    .query("productVariants")
    .withIndex("by_product", (q) => q.eq("productId", productId))
    .collect();

  for (const variant of variants) {
    await deleteVariantCascade(ctx, variant._id);
  }

  await ctx.db.delete(productId);
}

async function collectCategoryTree(
  ctx: MutationCtx,
  rootId: Id<"categories">
): Promise<Id<"categories">[]> {
  const result: Id<"categories">[] = [];
  const queue: Id<"categories">[] = [rootId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    result.push(current);

    const children = await ctx.db
      .query("categories")
      .withIndex("by_parent", (q) => q.eq("parentId", current))
      .collect();

    for (const child of children) {
      queue.push(child._id);
    }
  }

  return result;
}

// Get all categories
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return categories.sort(
      (a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt
    );
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
        .collect();

      return categories.sort(
        (a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt
      );
    } else {
      // Get root categories (no parent)
      const categories = await ctx.db
        .query("categories")
        .filter((q) => q.eq(q.field("parentId"), undefined))
        .collect();

      return categories.sort(
        (a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt
      );
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

// Delete category and dependent data.
export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }): Promise<{ deletedCategories: number; deletedProducts: number }> => {
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Category not found");
    }

    const categoryIds = await collectCategoryTree(ctx, id);
    let deletedProducts = 0;

    for (const categoryId of categoryIds) {
      const products = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("categoryId", categoryId))
        .collect();

      for (const product of products) {
        await deleteProductCascade(ctx, product._id);
        deletedProducts += 1;
      }
    }

    for (const categoryId of [...categoryIds].reverse()) {
      await ctx.db.delete(categoryId);
    }

    return {
      deletedCategories: categoryIds.length,
      deletedProducts,
    };
  },
});
