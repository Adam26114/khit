import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

async function clearProductPrimaryVariant(
  ctx: MutationCtx,
  productId: Id<"products">
) {
  const variants = await ctx.db
    .query("productVariants")
    .withIndex("by_product", (q) => q.eq("productId", productId))
    .collect();

  for (const variant of variants) {
    if (variant.isPrimary) {
      await ctx.db.patch(variant._id, {
        isPrimary: false,
        updatedAt: Date.now(),
      });
    }
  }
}

export const getAll = query({
  args: {
    includeInactive: v.optional(v.boolean()),
    productId: v.optional(v.id("products")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let variants;

    if (args.productId) {
      variants = await ctx.db
        .query("productVariants")
        .withIndex("by_product", (q) => q.eq("productId", args.productId!))
        .collect();
    } else {
      variants = await ctx.db.query("productVariants").collect();
    }

    if (!args.includeInactive) {
      variants = variants.filter((variant) => variant.isActive);
    }

    variants.sort((a, b) => a.displayOrder - b.displayOrder || a.createdAt - b.createdAt);

    if (args.limit) {
      variants = variants.slice(0, args.limit);
    }

    return await Promise.all(
      variants.map(async (variant) => {
        const [product, color, size, media] = await Promise.all([
          ctx.db.get(variant.productId),
          ctx.db.get(variant.colorId),
          ctx.db.get(variant.sizeId),
          ctx.db
            .query("media")
            .withIndex("by_variant", (q) => q.eq("variantId", variant._id))
            .collect(),
        ]);

        return {
          ...variant,
          productName: product?.name ?? "Unknown Product",
          colorName: color?.name ?? "Unknown Color",
          colorHex: color?.hexCode ?? "#111111",
          sizeName: size?.name ?? "Unknown Size",
          mediaCount: media.filter((item) => item.isActive).length,
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    productId: v.id("products"),
    colorId: v.id("colors"),
    sizeId: v.id("sizes"),
    skuVariant: v.string(),
    priceOverride: v.optional(v.number()),
    stockQuantity: v.number(),
    displayOrder: v.optional(v.number()),
    isPrimary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const [color, size] = await Promise.all([
      ctx.db.get(args.colorId),
      ctx.db.get(args.sizeId),
    ]);

    if (!color || !color.isActive) {
      throw new Error("Color not found or inactive");
    }

    if (!size || !size.isActive) {
      throw new Error("Size not found or inactive");
    }

    const existingForColor = await ctx.db
      .query("productVariants")
      .withIndex("by_product_color", (q) =>
        q.eq("productId", args.productId).eq("colorId", args.colorId)
      )
      .collect();

    const duplicate = existingForColor.find((variant) => variant.sizeId === args.sizeId);
    if (duplicate) {
      throw new Error("Variant already exists for this product + color + size");
    }

    const sameSku = await ctx.db
      .query("productVariants")
      .withIndex("by_sku_variant", (q) => q.eq("skuVariant", args.skuVariant.trim()))
      .unique();

    if (sameSku) {
      throw new Error("Variant SKU already exists");
    }

    const now = Date.now();

    if (args.isPrimary) {
      await clearProductPrimaryVariant(ctx, args.productId);
    }

    const maxDisplayOrder = (await ctx.db
      .query("productVariants")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect()
    ).reduce((max, variant) => Math.max(max, variant.displayOrder), 0);

    return await ctx.db.insert("productVariants", {
      productId: args.productId,
      colorId: args.colorId,
      sizeId: args.sizeId,
      skuVariant: args.skuVariant.trim(),
      priceOverride: args.priceOverride,
      stockQuantity: Math.max(0, args.stockQuantity),
      displayOrder: args.displayOrder ?? maxDisplayOrder + 1,
      isPrimary: Boolean(args.isPrimary),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("productVariants"),
    updates: v.object({
      productId: v.optional(v.id("products")),
      colorId: v.optional(v.id("colors")),
      sizeId: v.optional(v.id("sizes")),
      skuVariant: v.optional(v.string()),
      priceOverride: v.optional(v.number()),
      stockQuantity: v.optional(v.number()),
      displayOrder: v.optional(v.number()),
      isPrimary: v.optional(v.boolean()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { id, updates }) => {
    const variant = await ctx.db.get(id);
    if (!variant) {
      throw new Error("Variant not found");
    }

    const nextProductId = updates.productId ?? variant.productId;
    const nextColorId = updates.colorId ?? variant.colorId;
    const nextSizeId = updates.sizeId ?? variant.sizeId;
    const nextSku = updates.skuVariant?.trim() ?? variant.skuVariant;

    const duplicateByColor = await ctx.db
      .query("productVariants")
      .withIndex("by_product_color", (q) =>
        q.eq("productId", nextProductId).eq("colorId", nextColorId)
      )
      .collect();

    const duplicate = duplicateByColor.find(
      (item) => item._id !== id && item.sizeId === nextSizeId
    );

    if (duplicate) {
      throw new Error("Another variant already exists for this product + color + size");
    }

    const existingSku = await ctx.db
      .query("productVariants")
      .withIndex("by_sku_variant", (q) => q.eq("skuVariant", nextSku))
      .unique();

    if (existingSku && existingSku._id !== id) {
      throw new Error("Variant SKU already exists");
    }

    if (updates.isPrimary) {
      await clearProductPrimaryVariant(ctx, nextProductId);
    }

    await ctx.db.patch(id, {
      ...updates,
      skuVariant: nextSku,
      stockQuantity:
        typeof updates.stockQuantity === "number"
          ? Math.max(0, updates.stockQuantity)
          : undefined,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("productVariants"),
  },
  handler: async (ctx, { id }) => {
    const variant = await ctx.db.get(id);
    if (!variant) {
      throw new Error("Variant not found");
    }

    await ctx.db.patch(id, {
      isActive: false,
      isPrimary: false,
      updatedAt: Date.now(),
    });
  },
});
