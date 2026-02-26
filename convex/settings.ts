import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./users";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("storeSettings").first();
  },
});

export const update = mutation({
  args: {
    heroBannerLine1: v.optional(v.string()),
    heroBannerLine2: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    storeAddress: v.optional(v.string()),
    facebookUrl: v.optional(v.string()),
    instagramUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db.query("storeSettings").first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("storeSettings", {
        ...args,
        updatedAt: Date.now(),
      });
    }
  },
});
