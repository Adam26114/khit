// Convex auth configuration
// Better Auth is configured via the auth.ts file in src/lib/
// This file just exports the auth config provider for Convex

import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config";
import type { AuthConfig } from "convex/server";

export default {
  providers: [getAuthConfigProvider()],
} satisfies AuthConfig;
