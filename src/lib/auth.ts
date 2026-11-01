import crypto from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db";
import { user, session, account, verification } from "@/db/schema";

const resolvedAuthSecret =
  process.env.BETTER_AUTH_SECRET ||
  (process.env.DATABASE_URL
    ? crypto
        .createHmac("sha256", "stress-alpha-better-auth-key-derivation-v1")
        .update(process.env.DATABASE_URL)
        .digest("hex")
    : "stress-alpha-dev-secret-key-64-character-entropy-token-vault-99");

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
  secret: resolvedAuthSecret,
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined) ||
    "http://localhost:3000",
  plugins: [nextCookies()],
});
