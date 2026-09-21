import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  normalizeTicker,
  getStoredWatchlist,
  saveStoredWatchlist,
  isTickerInWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  toggleInWatchlist,
  fetchWatchlistFromDb,
  mutateDbWatchlist,
  clearDbWatchlist,
  requestAuthLogin,
  AUTH_REQUIRED_EVENT,
  WATCHLIST_CHANGE_EVENT,
} from "@/lib/watchlist";
import { getTranslations } from "@/lib/i18n";

describe("Watchlist Utility & Database Store", () => {
  const originalWindow = global.window;
  const originalFetch = global.fetch;

  beforeEach(() => {
    saveStoredWatchlist([]);
    const eventListeners: Record<string, EventListener[]> = {};

    global.window = {
      addEventListener: vi.fn((event: string, cb: EventListener) => {
        if (!eventListeners[event]) eventListeners[event] = [];
        eventListeners[event].push(cb);
      }),
      removeEventListener: vi.fn((event: string, cb: EventListener) => {
        if (eventListeners[event]) {
          eventListeners[event] = eventListeners[event].filter((l) => l !== cb);
        }
      }),
      dispatchEvent: vi.fn((event: Event) => {
        const listeners = eventListeners[event.type] || [];
        for (const l of listeners) {
          l(event);
        }
        return true;
      }),
    } as unknown as Window & typeof globalThis;

    if (typeof global.CustomEvent === "undefined") {
      class CustomEventMock<T = unknown> extends Event {
        detail: T;
        constructor(type: string, params?: { detail?: T }) {
          super(type);
          this.detail = params?.detail as T;
        }
      }
      global.CustomEvent = CustomEventMock as unknown as typeof CustomEvent;
    }
  });

  afterEach(() => {
    global.window = originalWindow;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("normalizeTicker", () => {
    it("extracts uppercase ticker symbol from report slug", () => {
      expect(normalizeTicker("NVDA-Q2-2027-analysis")).toBe("NVDA");
      expect(normalizeTicker("AMZN-Q2-2025-analysis")).toBe("AMZN");
      expect(normalizeTicker("BABA-Q1-2026-analysis")).toBe("BABA");
      expect(normalizeTicker("tsla")).toBe("TSLA");
    });

    it("normalizes raw ticker symbols", () => {
      expect(normalizeTicker("aapl")).toBe("AAPL");
      expect(normalizeTicker("  msft  ")).toBe("MSFT");
      expect(normalizeTicker("GOOGL")).toBe("GOOGL");
    });

    it("handles null, undefined, or empty values safely", () => {
      expect(normalizeTicker(null)).toBe("");
      expect(normalizeTicker(undefined)).toBe("");
      expect(normalizeTicker("")).toBe("");
    });
  });

  describe("Pure Transformation Functions", () => {
    it("isTickerInWatchlist correctly checks tickers and slugs case-insensitively", () => {
      const list = ["NVDA", "AMZN", "MSFT"];
      expect(isTickerInWatchlist(list, "NVDA")).toBe(true);
      expect(isTickerInWatchlist(list, "nvda")).toBe(true);
      expect(isTickerInWatchlist(list, "NVDA-Q2-2027-analysis")).toBe(true);
      expect(isTickerInWatchlist(list, "amzn-q2-2025-analysis")).toBe(true);
      expect(isTickerInWatchlist(list, "AAPL")).toBe(false);
      expect(isTickerInWatchlist(list, null)).toBe(false);
      expect(isTickerInWatchlist(list, "")).toBe(false);
    });

    it("addToWatchlist adds unique normalized symbols", () => {
      const initial = ["NVDA"];
      const res1 = addToWatchlist(initial, "amzn");
      expect(res1).toEqual(["NVDA", "AMZN"]);

      // Adding duplicate should not duplicate
      const res2 = addToWatchlist(res1, "NVDA");
      expect(res2).toEqual(["NVDA", "AMZN"]);

      // Adding slug should extract ticker and avoid duplicates
      const res3 = addToWatchlist(res2, "AMZN-Q2-2025-analysis");
      expect(res3).toEqual(["NVDA", "AMZN"]);

      // Adding new slug
      const res4 = addToWatchlist(res3, "TSLA-Q4-2026-analysis");
      expect(res4).toEqual(["NVDA", "AMZN", "TSLA"]);
    });

    it("removeFromWatchlist removes normalized symbol cleanly", () => {
      const initial = ["NVDA", "AMZN", "TSLA"];
      const res1 = removeFromWatchlist(initial, "amzn");
      expect(res1).toEqual(["NVDA", "TSLA"]);

      const res2 = removeFromWatchlist(res1, "NVDA-Q2-2027-analysis");
      expect(res2).toEqual(["TSLA"]);

      // Removing non-existent item returns same list
      const res3 = removeFromWatchlist(res2, "GOOGL");
      expect(res3).toEqual(["TSLA"]);
    });

    it("toggleInWatchlist toggles presence and reports added flag", () => {
      const initial = ["NVDA"];

      // Add AMZN
      const toggle1 = toggleInWatchlist(initial, "amzn");
      expect(toggle1.added).toBe(true);
      expect(toggle1.updated).toEqual(["NVDA", "AMZN"]);

      // Remove NVDA via slug
      const toggle2 = toggleInWatchlist(
        toggle1.updated,
        "NVDA-Q2-2027-analysis"
      );
      expect(toggle2.added).toBe(false);
      expect(toggle2.updated).toEqual(["AMZN"]);
    });
  });

  describe("Reactive Watchlist Snapshot Management", () => {
    it("returns empty array initially", () => {
      expect(getStoredWatchlist()).toEqual([]);
    });

    it("updates in-memory snapshot and broadcasts event", () => {
      const eventSpy = vi.fn();
      window.addEventListener(WATCHLIST_CHANGE_EVENT, eventSpy);

      saveStoredWatchlist(["NVDA", "AMZN", "NVDA", "baba"]);

      const stored = getStoredWatchlist();
      expect(stored).toEqual(["NVDA", "AMZN", "BABA"]);
      expect(eventSpy).toHaveBeenCalledTimes(1);
    });

    it("dispatches AUTH_REQUIRED_EVENT when requestAuthLogin is called", () => {
      const authSpy = vi.fn();
      window.addEventListener(AUTH_REQUIRED_EVENT, authSpy);

      requestAuthLogin();
      expect(authSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Database API Direct Helpers", () => {
    it("fetchWatchlistFromDb fetches directly from /api/watchlist", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          authenticated: true,
          watchlist: ["NVDA", "AMZN", "MSFT"],
        }),
      } as Response);

      const res = await fetchWatchlistFromDb();
      expect(res.authenticated).toBe(true);
      expect(res.watchlist).toEqual(["NVDA", "AMZN", "MSFT"]);
      expect(global.fetch).toHaveBeenCalledWith("/api/watchlist", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });
    });

    it("fetchWatchlistFromDb returns empty list when unauthenticated", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          authenticated: false,
          watchlist: [],
        }),
      } as Response);

      const res = await fetchWatchlistFromDb();
      expect(res.authenticated).toBe(false);
      expect(res.watchlist).toEqual([]);
    });

    it("mutateDbWatchlist executes toggle mutation against /api/watchlist", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          added: true,
          watchlist: ["NVDA", "GOOGL"],
        }),
      } as Response);

      const res = await mutateDbWatchlist("toggle", "GOOGL");
      expect(res?.success).toBe(true);
      expect(res?.added).toBe(true);
      expect(res?.watchlist).toEqual(["NVDA", "GOOGL"]);
      expect(global.fetch).toHaveBeenCalledWith("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", ticker: "GOOGL" }),
      });
    });

    it("mutateDbWatchlist executes batch sync mutation against /api/watchlist", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          watchlist: ["NVDA", "AAPL", "MSFT"],
        }),
      } as Response);

      const res = await mutateDbWatchlist("sync", ["NVDA", "AAPL"]);
      expect(res?.success).toBe(true);
      expect(res?.watchlist).toEqual(["NVDA", "AAPL", "MSFT"]);
      expect(global.fetch).toHaveBeenCalledWith("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync", tickers: ["NVDA", "AAPL"] }),
      });
    });

    it("clearDbWatchlist sends DELETE request to /api/watchlist", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
      } as Response);

      const success = await clearDbWatchlist();
      expect(success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith("/api/watchlist", {
        method: "DELETE",
      });
    });
  });

  describe("i18n Localization Parity for Watchlist & Auth", () => {
    it("ensures all watchlist and auth keys exist in both English and Chinese dictionaries", () => {
      const en = getTranslations("en");
      const zh = getTranslations("zh");

      // Header keys
      expect(en.header.watchlist).toBeTruthy();
      expect(zh.header.watchlist).toBeTruthy();
      expect(en.header.addToWatchlist).toContain("(F)");
      expect(zh.header.addToWatchlist).toContain("(F)");
      expect(en.header.removeFromWatchlist).toContain("(F)");
      expect(zh.header.removeFromWatchlist).toContain("(F)");
      expect(en.header.bookmarked).toBeTruthy();
      expect(zh.header.bookmarked).toBeTruthy();
      expect(en.header.signInRequiredToast).toBeTruthy();
      expect(zh.header.signInRequiredToast).toBeTruthy();
      expect(en.header.addedToWatchlistToast("NVDA")).toContain("NVDA");
      expect(zh.header.addedToWatchlistToast("NVDA")).toContain("NVDA");
      expect(en.header.removedFromWatchlistToast("NVDA")).toContain("NVDA");
      expect(zh.header.removedFromWatchlistToast("NVDA")).toContain("NVDA");

      // Selector keys
      expect(en.selector.watchlistSection).toBeTruthy();
      expect(zh.selector.watchlistSection).toBeTruthy();
      expect(en.selector.allReportsSection).toBeTruthy();
      expect(zh.selector.allReportsSection).toBeTruthy();

      // Screener keys
      expect(en.screener.filterWatchlist).toBeTruthy();
      expect(zh.screener.filterWatchlist).toBeTruthy();
      expect(en.screener.colFavorite).toBeTruthy();
      expect(zh.screener.colFavorite).toBeTruthy();
      expect(en.screener.watchlistEmptyTitle).toBeTruthy();
      expect(zh.screener.watchlistEmptyTitle).toBeTruthy();
      expect(en.screener.watchlistEmptyDesc).toBeTruthy();
      expect(zh.screener.watchlistEmptyDesc).toBeTruthy();
      expect(en.screener.viewAllReports).toBeTruthy();
      expect(zh.screener.viewAllReports).toBeTruthy();

      // Shortcuts key
      expect(en.shortcuts.toggleFavorite).toContain("(F)");
      expect(zh.shortcuts.toggleFavorite).toContain("(F)");

      // Auth keys
      expect(en.auth.signIn).toBeTruthy();
      expect(zh.auth.signIn).toBeTruthy();
      expect(en.auth.signOut).toBeTruthy();
      expect(zh.auth.signOut).toBeTruthy();
      expect(en.auth.signUp).toBeTruthy();
      expect(zh.auth.signUp).toBeTruthy();
      expect(en.auth.cloudSyncActive).toBeTruthy();
      expect(zh.auth.cloudSyncActive).toBeTruthy();
    });
  });
});
