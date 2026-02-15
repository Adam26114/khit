import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

function isInitialAdminEmail(email?: string | null): boolean {
  if (!email) return false;

  const configured = process.env.INITIAL_ADMIN_EMAIL;
  if (!configured) return false;

  const normalizedEmail = email.trim().toLowerCase();
  const adminEmails = configured
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(normalizedEmail);
}

// Get user by Better Auth ID
export const getByBetterAuthId = query({
  args: { betterAuthId: v.string() },
  handler: async (ctx, { betterAuthId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_betterAuthId", (q) => q.eq("betterAuthId", betterAuthId))
      .unique();

    return user;
  },
});

// Get current user with role
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_betterAuthId", (q) => q.eq("betterAuthId", identity.subject))
      .unique();

    return user;
  },
});

// Get all users (admin only)
export const getAll = query({
  args: {
    role: v.optional(v.union(v.literal("customer"), v.literal("admin"))),
  },
  handler: async (ctx, args) => {
    let users;

    if (args.role) {
      users = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("role"), args.role))
        .order("desc")
        .collect();
    } else {
      users = await ctx.db.query("users").order("desc").collect();
    }

    return users;
  },
});

// Update user role (admin only)
export const updateRole = mutation({
  args: {
    id: v.id("users"),
    role: v.union(v.literal("customer"), v.literal("admin")),
  },
  handler: async (ctx, { id, role }) => {
    const user = await ctx.db.get(id);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(id, {
      role,
    });
  },
});

// Check if user is admin
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_betterAuthId", (q) => q.eq("betterAuthId", identity.subject))
      .unique();

    if (user?.role === "admin") {
      return true;
    }

    return isInitialAdminEmail(identity.email);
  },
});

// Create or update the current user's profile record
export const upsertCurrentProfile = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, { email, name, phone }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_betterAuthId", (q) => q.eq("betterAuthId", identity.subject))
      .unique();

    if (existingUser) {
      const shouldBeInitialAdmin =
        existingUser.role !== "admin" && isInitialAdminEmail(email);

      await ctx.db.patch(existingUser._id, {
        email,
        name,
        phone,
        role: shouldBeInitialAdmin ? "admin" : existingUser.role,
      });
      return existingUser._id;
    }

    return await ctx.db.insert("users", {
      email,
      name,
      phone,
      role: isInitialAdminEmail(email) ? "admin" : "customer",
      betterAuthId: identity.subject,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});
