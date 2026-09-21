import { describe, it, expect } from "vitest";
import { auth } from "@/lib/auth";
import {
  user,
  session,
  account,
  verification,
  userWatchlistsTable,
  userRelations,
  sessionRelations,
  accountRelations,
  userWatchlistsRelations,
} from "@/db/schema";

describe("Better Auth & Database Cloud Watchlist Integration", () => {
  describe("Better Auth Instance Configuration", () => {
    it("initializes Better Auth with required email and password authentication", () => {
      expect(auth).toBeDefined();
      expect(auth.api).toBeDefined();
      expect(typeof auth.api.signUpEmail).toBe("function");
      expect(typeof auth.api.signInEmail).toBe("function");
      expect(typeof auth.api.getSession).toBe("function");
      expect(typeof auth.api.signOut).toBe("function");
    });

    it("has properly configured options and base URL", () => {
      expect(auth.options).toBeDefined();
      expect(auth.options.secret).toBeTruthy();
      expect(auth.options.baseURL).toBeTruthy();
    });
  });

  describe("Database Schema Integrity", () => {
    it("defines core Better Auth tables with required fields", () => {
      // User table
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.name).toBeDefined();
      expect(user.emailVerified).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();

      // Session table
      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.userId).toBeDefined();
      expect(session.token).toBeDefined();
      expect(session.expiresAt).toBeDefined();

      // Account table
      expect(account).toBeDefined();
      expect(account.id).toBeDefined();
      expect(account.userId).toBeDefined();
      expect(account.accountId).toBeDefined();
      expect(account.providerId).toBeDefined();
      expect(account.password).toBeDefined();

      // Verification table
      expect(verification).toBeDefined();
      expect(verification.id).toBeDefined();
      expect(verification.identifier).toBeDefined();
      expect(verification.value).toBeDefined();
      expect(verification.expiresAt).toBeDefined();
    });

    it("defines user_watchlists table for cloud synchronization", () => {
      expect(userWatchlistsTable).toBeDefined();
      expect(userWatchlistsTable.id).toBeDefined();
      expect(userWatchlistsTable.userId).toBeDefined();
      expect(userWatchlistsTable.ticker).toBeDefined();
      expect(userWatchlistsTable.createdAt).toBeDefined();
    });

    it("defines Drizzle ORM relations for user and watchlists", () => {
      expect(userRelations).toBeDefined();
      expect(sessionRelations).toBeDefined();
      expect(accountRelations).toBeDefined();
      expect(userWatchlistsRelations).toBeDefined();
    });
  });
});
