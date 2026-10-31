import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db";
import { user, session, account, verification } from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 6,
  },
  secret:
    process.env.BETTER_AUTH_SECRET ||
    (process.env.NODE_ENV === "production"
      ? (() => {
          throw new Error(
            "CRITICAL: BETTER_AUTH_SECRET environment variable is required in production."
          );
        })()
      : "stress-alpha-dev-secret-key-64-character-entropy-token-vault-99"),
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined) ||
    "http://localhost:3000",
  plugins: [nextCookies()],
});
