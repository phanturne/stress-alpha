"use client";

import { useSyncExternalStore, useCallback } from "react";

export const WATCHLIST_STORAGE_KEY = "stress_alpha_watchlist";
export const WATCHLIST_CHANGE_EVENT = "stress_alpha_watchlist_changed";

let cachedSnapshot: string[] = [];
let cachedRaw: string | null = null;

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(WATCHLIST_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(WATCHLIST_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedSnapshot;
    }
    cachedRaw = raw;
    cachedSnapshot = getStoredWatchlist();
    return cachedSnapshot;
  } catch {
    return [];
  }
}

const SERVER_SNAPSHOT: string[] = [];
function getServerSnapshot(): string[] {
  return SERVER_SNAPSHOT;
}

/**
 * Normalizes a ticker or report slug into an uppercase ticker symbol.
 * E.g. "NVDA-Q2-2027-analysis" -> "NVDA", "nvda" -> "NVDA"
 */
export function normalizeTicker(tickerOrSlug?: string | null): string {
  if (!tickerOrSlug) return "";
  const cleaned = tickerOrSlug.trim();
  if (cleaned.includes("-")) {
    const candidate = cleaned.split("-")[0].toUpperCase().trim();
    if (candidate) return candidate;
  }
  return cleaned.toUpperCase();
}

/**
 * Safely reads the watchlist from localStorage (SSR-safe).
 */
export function getStoredWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return Array.from(
        new Set(
          parsed
            .filter((item): item is string => typeof item === "string")
            .map(normalizeTicker)
            .filter(Boolean)
        )
      );
    }
  } catch (err) {
    console.warn("Failed to parse watchlist from localStorage:", err);
  }
  return [];
}

/**
 * Saves the watchlist to localStorage and broadcasts an update event.
 */
export function saveStoredWatchlist(tickers: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const unique = Array.from(
      new Set(tickers.map(normalizeTicker).filter(Boolean))
    );
    const serialized = JSON.stringify(unique);
    localStorage.setItem(WATCHLIST_STORAGE_KEY, serialized);
    cachedRaw = serialized;
    cachedSnapshot = unique;
    // Dispatch local CustomEvent for reactive updates in the same window
    window.dispatchEvent(
      new CustomEvent(WATCHLIST_CHANGE_EVENT, { detail: unique })
    );
  } catch (err) {
    console.warn("Failed to persist watchlist to localStorage:", err);
  }
}

/**
 * Checks whether a ticker or report slug exists in the given watchlist.
 */
export function isTickerInWatchlist(
  watchlist: string[],
  tickerOrSlug?: string | null
): boolean {
  if (!tickerOrSlug) return false;
  const symbol = normalizeTicker(tickerOrSlug);
  return watchlist.includes(symbol);
}

/**
 * Pure function: adds a normalized ticker to a watchlist if not already present.
 */
export function addToWatchlist(
  current: string[],
  tickerOrSlug: string
): string[] {
  const symbol = normalizeTicker(tickerOrSlug);
  if (!symbol) return current;
  if (current.includes(symbol)) return current;
  return [...current, symbol];
}

/**
 * Pure function: removes a normalized ticker from a watchlist.
 */
export function removeFromWatchlist(
  current: string[],
  tickerOrSlug: string
): string[] {
  const symbol = normalizeTicker(tickerOrSlug);
  if (!symbol) return current;
  return current.filter((item) => item !== symbol);
}

/**
 * Pure function: toggles a normalized ticker in a watchlist.
 */
export function toggleInWatchlist(
  current: string[],
  tickerOrSlug: string
): { updated: string[]; added: boolean } {
  const symbol = normalizeTicker(tickerOrSlug);
  if (!symbol) return { updated: current, added: false };
  if (current.includes(symbol)) {
    return {
      updated: current.filter((item) => item !== symbol),
      added: false,
    };
  }
  return {
    updated: [...current, symbol],
    added: true,
  };
}

export interface WatchlistHook {
  watchlist: string[];
  isFavorite: (tickerOrSlug?: string | null) => boolean;
  toggleFavorite: (tickerOrSlug: string) => boolean;
  addFavorite: (tickerOrSlug: string) => void;
  removeFavorite: (tickerOrSlug: string) => void;
  clearWatchlist: () => void;
  count: number;
}

/**
 * React hook for accessing and modifying the institutional stock watchlist.
 * Synchronizes reactively across components and browser tabs using useSyncExternalStore.
 */
export function useWatchlist(): WatchlistHook {
  const watchlist = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const isFavorite = useCallback(
    (tickerOrSlug?: string | null): boolean => {
      return isTickerInWatchlist(watchlist, tickerOrSlug);
    },
    [watchlist]
  );

  const addFavorite = useCallback((tickerOrSlug: string) => {
    const current = getStoredWatchlist();
    const updated = addToWatchlist(current, tickerOrSlug);
    if (updated !== current) {
      saveStoredWatchlist(updated);
    }
  }, []);

  const removeFavorite = useCallback((tickerOrSlug: string) => {
    const current = getStoredWatchlist();
    const updated = removeFromWatchlist(current, tickerOrSlug);
    saveStoredWatchlist(updated);
  }, []);

  const toggleFavorite = useCallback((tickerOrSlug: string): boolean => {
    const current = getStoredWatchlist();
    const { updated, added } = toggleInWatchlist(current, tickerOrSlug);
    saveStoredWatchlist(updated);
    return added;
  }, []);

  const clearWatchlist = useCallback(() => {
    saveStoredWatchlist([]);
  }, []);

  return {
    watchlist,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearWatchlist,
    count: watchlist.length,
  };
}
