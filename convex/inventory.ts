import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAdmin } from "./users";

export const getInventory = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const products = await ctx.db.query("products").collect();

    const inventoryItems: Array<{
      productId: Id<"products">;
      productName: string;
      colorVariantId: string;
      colorName: string;
      size: string;
      stock: number;
    }> = [];

    for (const product of products) {
      if (!product.colorVariants) continue;

      for (const variant of product.colorVariants) {
        // Only include sizes that are selected for this variant
        for (const size of variant.selectedSizes) {
          inventoryItems.push({
            productId: product._id,
            productName: product.name,
            colorVariantId: variant.id,
            colorName: variant.colorName,
            size,
            stock: variant.stock[size] ?? 0,
          });
        }
      }
    }

    // Sort by product name, then color, then size (basic sort)
    return inventoryItems.sort((a, b) => {
      if (a.productName !== b.productName) return a.productName.localeCompare(b.productName);
      if (a.colorName !== b.colorName) return a.colorName.localeCompare(b.colorName);
      return a.size.localeCompare(b.size);
    });
  },
});

export const updateStock = mutation({
  args: {
    productId: v.id("products"),
    colorVariantId: v.string(),
    size: v.string(),
    newStock: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");
    if (!product.colorVariants) throw new Error("Product has no variants");

    const variantIndex = product.colorVariants.findIndex((v) => v.id === args.colorVariantId);
    if (variantIndex === -1) throw new Error("Variant not found");

    const newVariants = [...product.colorVariants];
    const variant = { ...newVariants[variantIndex] };
    
    variant.stock = {
      ...variant.stock,
      [args.size]: args.newStock,
    };
    
    newVariants[variantIndex] = variant;

    await ctx.db.patch(args.productId, {
      colorVariants: newVariants,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
