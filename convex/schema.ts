import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("customer"), v.literal("admin")),
    betterAuthId: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_betterAuthId", ["betterAuthId"]),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_parent", ["parentId"])
    .index("by_active", ["isActive"]),

  colors: defineTable({
    name: v.string(),
    nameMm: v.optional(v.string()),
    hexCode: v.string(),
    displayOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_hexCode", ["hexCode"])
    .index("by_active", ["isActive"]),

  sizes: defineTable({
    name: v.string(),
    nameMm: v.optional(v.string()),
    sizeCategory: v.string(),
    displayOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_category", ["sizeCategory"])
    .index("by_active", ["isActive"]),

  products: defineTable({
    sku: v.optional(v.string()),
    name: v.string(),
    nameMm: v.optional(v.string()),
    slug: v.string(),
    description: v.string(),
    descriptionMm: v.optional(v.string()),
    categoryId: v.id("categories"),
    basePrice: v.optional(v.number()),
    salePrice: v.optional(v.number()),
    isFeatured: v.boolean(),
    isPublished: v.optional(v.boolean()),
    isActive: v.boolean(),
    careInstructions: v.optional(v.string()),
    sizeFit: v.optional(v.string()),
    // Legacy compatibility fields to support gradual migration.
    price: v.optional(v.number()),
    images: v.optional(v.array(v.string())),
    sizes: v.optional(v.array(v.string())),
    colors: v.optional(v.array(v.object({
      name: v.string(),
      hex: v.string(),
      stock: v.number(),
    }))),
    stock: v.optional(v.number()),
    isOutOfStock: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_sku", ["sku"])
    .index("by_category", ["categoryId"])
    .index("by_featured", ["isFeatured"])
    .index("by_active", ["isActive"]),

  productVariants: defineTable({
    productId: v.id("products"),
    colorId: v.id("colors"),
    sizeId: v.id("sizes"),
    skuVariant: v.string(),
    priceOverride: v.optional(v.number()),
    stockQuantity: v.number(),
    displayOrder: v.number(),
    isPrimary: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_product_color", ["productId", "colorId"])
    .index("by_product_size", ["productId", "sizeId"])
    .index("by_sku_variant", ["skuVariant"])
    .index("by_active", ["isActive"]),

  media: defineTable({
    variantId: v.id("productVariants"),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    filePath: v.string(),
    fileUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    altText: v.optional(v.string()),
    displayOrder: v.number(),
    isPrimary: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_variant", ["variantId"])
    .index("by_variant_display", ["variantId", "displayOrder"])
    .index("by_variant_primary", ["variantId", "isPrimary"])
    .index("by_active", ["isActive"]),

  cartItems: defineTable({
    userId: v.id("users"),
    variantId: v.id("productVariants"),
    quantity: v.number(),
    addedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_variant", ["userId", "variantId"]),

  wishlistItems: defineTable({
    userId: v.id("users"),
    variantId: v.id("productVariants"),
    addedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_variant", ["userId", "variantId"]),

  orders: defineTable({
    orderNumber: v.string(),
    customerId: v.optional(v.id("users")),
    customerInfo: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      address: v.optional(v.string()),
    }),
    items: v.array(v.object({
      productId: v.id("products"),
      variantId: v.optional(v.id("productVariants")),
      name: v.string(),
      size: v.string(),
      color: v.string(),
      quantity: v.number(),
      price: v.number(),
    })),
    subtotal: v.number(),
    shippingFee: v.number(),
    total: v.number(),
    deliveryMethod: v.union(v.literal("shipping"), v.literal("pickup")),
    paymentMethod: v.literal("cod"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orderNumber", ["orderNumber"])
    .index("by_customer", ["customerId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),
});
