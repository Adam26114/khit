import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { phoneNumberClient } from "better-auth/client/plugins";

// Create auth client with Convex plugin
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [convexClient(), phoneNumberClient()],
});

// Export hooks
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
