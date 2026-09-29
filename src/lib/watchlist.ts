"use client";

import {
  useSyncExternalStore,
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";
import { useSession } from "./auth-client";

export const WATCHLIST_CHANGE_EVENT = "stress_alpha_watchlist_changed";
export const AUTH_REQUIRED_EVENT = "stress_alpha_auth_required";
export const WATCHLIST_STORAGE_KEY = "stress_alpha_watchlist";

function areArraysEqual(a: string[], b: string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function loadInitialSnapshot(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return Array.from(new Set(parsed.map(normalizeTicker).filter(Boolean)));
    }
  } catch {}
  return [];
}

// Database-backed reactive in-memory snapshot initialized from local client cache if available
let dbWatchlistSnapshot: string[] = loadInitialSnapshot();
let listeners: Array<() => void> = [];

function subscribe(callback: () => void): () => void {
  listeners.push(callback);
  if (typeof window !== "undefined") {
    window.addEventListener(WATCHLIST_CHANGE_EVENT, callback);
  }
  return () => {
    listeners = listeners.filter((l) => l !== callback);
    if (typeof window !== "undefined") {
      window.removeEventListener(WATCHLIST_CHANGE_EVENT, callback);
    }
  };
}

function getSnapshot(): string[] {
  return dbWatchlistSnapshot;
}

const SERVER_SNAPSHOT: string[] = [];
function getServerSnapshot(): string[] {
  return SERVER_SNAPSHOT;
}

function setWatchlistSnapshot(tickers: string[], forceNotify = false): void {
  const normalized = Array.from(
    new Set(tickers.map(normalizeTicker).filter(Boolean))
  );
  if (!forceNotify && areArraysEqual(dbWatchlistSnapshot, normalized)) {
    return;
  }
  dbWatchlistSnapshot = normalized;
  if (typeof window !== "undefined") {
    try {
      if (normalized.length > 0) {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(normalized));
      } else {
        localStorage.removeItem(WATCHLIST_STORAGE_KEY);
      }
    } catch {}
  }
  for (const callback of listeners) {
    try {
      callback();
    } catch (err) {
      console.warn("Error in watchlist listener callback:", err);
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(WATCHLIST_CHANGE_EVENT, { detail: normalized })
    );
  }
}

/**
 * Triggers the application-wide auth modal if an action requires authentication.
 */
export function requestAuthLogin(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_REQUIRED_EVENT));
  }
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

/**
 * Reads in-memory snapshot. Provided for backwards compatibility with tests.
 */
export function getStoredWatchlist(): string[] {
  return getSnapshot();
}

/**
 * Sets in-memory snapshot and broadcasts event. Provided for backwards compatibility with tests.
 */
export function saveStoredWatchlist(tickers: string[]): void {
  setWatchlistSnapshot(tickers, true);
}

/**
 * Database API Helper: Fetches the user's watchlist directly from Neon PostgreSQL.
 */
export async function fetchWatchlistFromDb(): Promise<{
  authenticated: boolean;
  watchlist: string[];
}> {
  try {
    const res = await fetch("/api/watchlist", {
      method: "GET",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) {
      return { authenticated: false, watchlist: [] };
    }
    const data = await res.json();
    return {
      authenticated: Boolean(data.authenticated),
      watchlist: Array.isArray(data.watchlist) ? data.watchlist : [],
    };
  } catch (err) {
    console.warn("Failed to fetch watchlist from database:", err);
    return { authenticated: false, watchlist: [] };
  }
}

/**
 * Database API Helper: Mutates the user's watchlist in Neon PostgreSQL.
 */
export async function mutateDbWatchlist(
  action: "add" | "remove" | "toggle" | "sync",
  tickerOrTickers: string | string[]
): Promise<{
  success: boolean;
  added?: boolean;
  removed?: boolean;
  watchlist: string[];
} | null> {
  try {
    const body: Record<string, unknown> = { action };
    if (Array.isArray(tickerOrTickers)) {
      body.tickers = tickerOrTickers;
    } else {
      body.ticker = tickerOrTickers;
    }

    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data && Array.isArray(data.watchlist)) {
      return data;
    }
  } catch (err) {
    console.warn(`Failed to execute ${action} on database watchlist:`, err);
  }
  return null;
}

/**
 * Database API Helper: Clears the user's database watchlist in Neon PostgreSQL.
 */
export async function clearDbWatchlist(): Promise<boolean> {
  try {
    const res = await fetch("/api/watchlist", { method: "DELETE" });
    return res.ok;
  } catch (err) {
    console.warn("Failed to clear database watchlist:", err);
    return false;
  }
}

// Aliases for compatibility
export const syncWatchlistWithServer = async (localTickers: string[]) => {
  const res = await mutateDbWatchlist("sync", localTickers);
  return res?.watchlist ?? null;
};
export const mutateServerWatchlist = async (
  action: "add" | "remove" | "toggle",
  ticker: string
) => {
  const res = await mutateDbWatchlist(action, ticker);
  return res?.watchlist ?? null;
};
export const clearServerWatchlist = clearDbWatchlist;

/**
 * One-time migration helper: migrates legacy localStorage items into the database once,
 * then purges the localStorage key so the database remains the sole source of truth.
 */
function migrateLegacyStorageOnce(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      localStorage.removeItem(WATCHLIST_STORAGE_KEY);
      return parsed.filter((item): item is string => typeof item === "string");
    }
    localStorage.removeItem(WATCHLIST_STORAGE_KEY);
  } catch {
    try {
      localStorage.removeItem(WATCHLIST_STORAGE_KEY);
    } catch {}
  }
  return [];
}

export interface WatchlistHook {
  watchlist: string[];
  isFavorite: (tickerOrSlug?: string | null) => boolean;
  toggleFavorite: (tickerOrSlug: string) => boolean;
  addFavorite: (tickerOrSlug: string) => void;
  removeFavorite: (tickerOrSlug: string) => void;
  clearWatchlist: () => void;
  count: number;
  isAuthenticated: boolean;
  isSyncing: boolean;
}

/**
 * React hook for accessing and modifying the stock watchlist.
 * Directly reads from and writes to the Neon PostgreSQL database via Better Auth.
 */
export function useWatchlist(): WatchlistHook {
  const watchlist = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const { data: session, isPending: isSessionPending } = useSession();
  const userId = session?.user?.id;
  const isAuthenticated = !!session?.user;
  const [isDbFetching, setIsDbFetching] = useState(false);
  const isSyncing = isSessionPending || isDbFetching;
  const activeUserRef = useRef<string | null>(null);

  // Directly fetch watchlist from Neon PostgreSQL database on session change
  useEffect(() => {
    let isMounted = true;

    // While session determination is in-flight, preserve cached watchlist to avoid flicker
    if (isSessionPending) {
      return;
    }

    if (!userId) {
      activeUserRef.current = null;
      setWatchlistSnapshot([]);
      return;
    }

    if (activeUserRef.current === userId) return;
    activeUserRef.current = userId;

    const load = async () => {
      setIsDbFetching(true);
      // Fetch directly from Neon PostgreSQL database
      const dbResult = await fetchWatchlistFromDb();
      if (isMounted) {
        if (dbResult.authenticated) {
          setWatchlistSnapshot(dbResult.watchlist);
        } else {
          setWatchlistSnapshot([]);
        }
        setIsDbFetching(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [userId, isSessionPending]);

  const isFavorite = useCallback(
    (tickerOrSlug?: string | null): boolean => {
      return isTickerInWatchlist(watchlist, tickerOrSlug);
    },
    [watchlist]
  );

  const toggleFavorite = useCallback(
    (tickerOrSlug: string): boolean => {
      if (!isAuthenticated) {
        requestAuthLogin();
        return false;
      }

      const symbol = normalizeTicker(tickerOrSlug);
      if (!symbol) return false;

      const previous = getSnapshot();
      const { updated, added } = toggleInWatchlist(previous, symbol);

      // Optimistic in-memory update for instant feedback
      setWatchlistSnapshot(updated);

      // Persist directly to Neon PostgreSQL database
      mutateDbWatchlist("toggle", symbol).then((res) => {
        if (res && Array.isArray(res.watchlist)) {
          setWatchlistSnapshot(res.watchlist);
        } else {
          // Rollback if database mutation failed
          setWatchlistSnapshot(previous);
        }
      });

      return added;
    },
    [isAuthenticated]
  );

  const addFavorite = useCallback(
    (tickerOrSlug: string) => {
      if (!isAuthenticated) {
        requestAuthLogin();
        return;
      }

      const symbol = normalizeTicker(tickerOrSlug);
      if (!symbol) return;

      const previous = getSnapshot();
      const updated = addToWatchlist(previous, symbol);
      if (updated !== previous) {
        setWatchlistSnapshot(updated);
        mutateDbWatchlist("add", symbol).then((res) => {
          if (res && Array.isArray(res.watchlist)) {
            setWatchlistSnapshot(res.watchlist);
          } else {
            setWatchlistSnapshot(previous);
          }
        });
      }
    },
    [isAuthenticated]
  );

  const removeFavorite = useCallback(
    (tickerOrSlug: string) => {
      if (!isAuthenticated) {
        requestAuthLogin();
        return;
      }

      const symbol = normalizeTicker(tickerOrSlug);
      if (!symbol) return;

      const previous = getSnapshot();
      const updated = removeFromWatchlist(previous, symbol);
      setWatchlistSnapshot(updated);

      mutateDbWatchlist("remove", symbol).then((res) => {
        if (res && Array.isArray(res.watchlist)) {
          setWatchlistSnapshot(res.watchlist);
        } else {
          setWatchlistSnapshot(previous);
        }
      });
    },
    [isAuthenticated]
  );

  const clearWatchlist = useCallback(() => {
    if (!isAuthenticated) {
      requestAuthLogin();
      return;
    }

    const previous = getSnapshot();
    setWatchlistSnapshot([], true);
    clearDbWatchlist().then((ok) => {
      if (!ok) {
        setWatchlistSnapshot(previous, true);
      }
    });
  }, [isAuthenticated]);

  return {
    watchlist,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearWatchlist,
    count: watchlist.length,
    isAuthenticated,
    isSyncing,
  };
}
