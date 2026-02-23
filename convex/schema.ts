import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const sizeMeasurementFields = v.object({
  shoulder: v.optional(v.number()),
  chest: v.optional(v.number()),
  sleeve: v.optional(v.number()),
  waist: v.optional(v.number()),
  length: v.optional(v.number()),
});

const colorVariantSchema = v.object({
  id: v.string(),
  colorName: v.string(),
  colorHex: v.string(),
  images: v.array(v.string()),
  selectedSizes: v.array(v.string()),
  stock: v.record(v.string(), v.number()),
  measurements: v.record(v.string(), sizeMeasurementFields),
});

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
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_parent", ["parentId"])
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
    isActive: v.optional(v.boolean()),
    careInstructions: v.optional(v.string()),
    sizeFit: v.optional(v.string()),
    // Legacy fields for backward compatibility
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
    // New schema
    colorVariants: v.optional(v.array(colorVariantSchema)),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_sku", ["sku"])
    .index("by_category", ["categoryId"])
    .index("by_featured", ["isFeatured"])
    .index("by_active", ["isActive"]),

  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    colorVariantId: v.string(),
    size: v.string(),
    quantity: v.number(),
    addedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_product_size", ["userId", "productId", "colorVariantId", "size"]),

  wishlistItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    colorVariantId: v.optional(v.string()),
    size: v.optional(v.string()),
    addedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_product", ["userId", "productId"]),

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
      colorVariantId: v.optional(v.string()),
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
