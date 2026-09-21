import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  normalizeTicker,
  getStoredWatchlist,
  saveStoredWatchlist,
  isTickerInWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  toggleInWatchlist,
  WATCHLIST_STORAGE_KEY,
  WATCHLIST_CHANGE_EVENT,
} from "@/lib/watchlist";
import { getTranslations } from "@/lib/i18n";

class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

describe("Watchlist Utility & Storage", () => {
  let mockStorage: LocalStorageMock;
  const originalWindow = global.window;

  beforeEach(() => {
    mockStorage = new LocalStorageMock();
    const eventListeners: Record<string, EventListener[]> = {};

    global.window = {
      localStorage: mockStorage,
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

    global.localStorage = mockStorage as unknown as Storage;
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
      const toggle2 = toggleInWatchlist(toggle1.updated, "NVDA-Q2-2027-analysis");
      expect(toggle2.added).toBe(false);
      expect(toggle2.updated).toEqual(["AMZN"]);
    });
  });

  describe("getStoredWatchlist and saveStoredWatchlist", () => {
    it("returns empty array when nothing is stored", () => {
      expect(getStoredWatchlist()).toEqual([]);
    });

    it("persists unique tickers and emits CustomEvent", () => {
      const eventSpy = vi.fn();
      window.addEventListener(WATCHLIST_CHANGE_EVENT, eventSpy);

      saveStoredWatchlist(["NVDA", "AMZN", "NVDA", "baba"]);

      const stored = getStoredWatchlist();
      expect(stored).toEqual(["NVDA", "AMZN", "BABA"]);
      expect(mockStorage.getItem(WATCHLIST_STORAGE_KEY)).toBe(
        JSON.stringify(["NVDA", "AMZN", "BABA"])
      );

      expect(eventSpy).toHaveBeenCalledTimes(1);
    });

    it("filters out non-string and empty elements in storage", () => {
      mockStorage.setItem(
        WATCHLIST_STORAGE_KEY,
        JSON.stringify(["NVDA", 123, null, "", "tsla"])
      );
      expect(getStoredWatchlist()).toEqual(["NVDA", "TSLA"]);
    });

    it("handles corrupt localStorage data gracefully", () => {
      mockStorage.setItem(WATCHLIST_STORAGE_KEY, "invalid-json{");
      expect(getStoredWatchlist()).toEqual([]);
    });
  });

  describe("i18n Localization Parity for Watchlist", () => {
    it("ensures all watchlist keys exist in both English and Chinese dictionaries", () => {
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
    });
  });
});
