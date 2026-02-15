import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { components } from "./_generated/api";
import { type DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";

// The component client has methods needed for integrating Convex with Better Auth
export const authComponent = createClient<DataModel>(components.betterAuth);

// Better Auth options factory
export function createAuthOptions(ctx: GenericCtx<DataModel>): BetterAuthOptions {
  return {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [convex({ authConfig })],
    socialProviders: {},
  };
}

// Better Auth instance factory
export function createAuth(ctx: GenericCtx<DataModel>) {
  return betterAuth(createAuthOptions(ctx));
}

// For schema generation
export const options = createAuthOptions({} as GenericCtx<DataModel>);
