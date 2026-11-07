"use client";

import {
  useSyncExternalStore,
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";
import { useSession } from "./auth-client";
import { normalizeTicker } from "./utils";

export const NOTES_STORAGE_KEY = "stress_alpha_stock_notes";
export const NOTES_CHANGE_EVENT = "stress_alpha_notes_changed";

export interface StockNoteItem {
  content: string;
  updatedAt: string; // ISO 8601 string
}

export type StockNotesMap = Record<string, StockNoteItem>;

function loadInitialNotesSnapshot(): StockNotesMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const normalized: StockNotesMap = {};
      for (const [key, value] of Object.entries(parsed)) {
        const symbol = normalizeTicker(key);
        if (!symbol) continue;
        if (typeof value === "string") {
          normalized[symbol] = {
            content: value,
            updatedAt: new Date().toISOString(),
          };
        } else if (
          typeof value === "object" &&
          value !== null &&
          "content" in value
        ) {
          normalized[symbol] = {
            content: String((value as { content: unknown }).content ?? ""),
            updatedAt:
              String((value as { updatedAt?: unknown }).updatedAt ?? "") ||
              new Date().toISOString(),
          };
        }
      }
      return normalized;
    }
  } catch {}
  return {};
}

let dbNotesSnapshot: StockNotesMap = loadInitialNotesSnapshot();
let noteListeners: Array<() => void> = [];

function subscribe(callback: () => void): () => void {
  noteListeners.push(callback);
  if (typeof window !== "undefined") {
    window.addEventListener(NOTES_CHANGE_EVENT, callback);
  }
  return () => {
    noteListeners = noteListeners.filter((l) => l !== callback);
    if (typeof window !== "undefined") {
      window.removeEventListener(NOTES_CHANGE_EVENT, callback);
    }
  };
}

function getSnapshot(): StockNotesMap {
  return dbNotesSnapshot;
}

const SERVER_SNAPSHOT: StockNotesMap = {};
function getServerSnapshot(): StockNotesMap {
  return SERVER_SNAPSHOT;
}

export function setNotesSnapshot(
  next: StockNotesMap,
  persistToLocal = true
): void {
  dbNotesSnapshot = next;
  if (persistToLocal && typeof window !== "undefined") {
    try {
      if (Object.keys(next).length > 0) {
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(next));
      } else {
        localStorage.removeItem(NOTES_STORAGE_KEY);
      }
    } catch {}
  }

  for (const cb of noteListeners) {
    try {
      cb();
    } catch (err) {
      console.warn("Error in notes listener callback:", err);
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NOTES_CHANGE_EVENT, { detail: next }));
  }
}

/**
 * Access in-memory notes snapshot. Backwards compatibility for tests.
 */
export function getStoredNotes(): StockNotesMap {
  return getSnapshot();
}

/**
 * Replace in-memory notes snapshot. Backwards compatibility for tests.
 */
export function saveStoredNotes(notes: StockNotesMap): void {
  setNotesSnapshot(notes, true);
}

/**
 * Fetch all user notes from database via /api/notes
 */
export async function fetchNotesFromDb(): Promise<{
  authenticated: boolean;
  notes: StockNotesMap;
}> {
  try {
    const res = await fetch("/api/notes", {
      method: "GET",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) {
      return { authenticated: false, notes: {} };
    }
    const data = await res.json();
    return {
      authenticated: Boolean(data.authenticated),
      notes: data.notes && typeof data.notes === "object" ? data.notes : {},
    };
  } catch (err) {
    console.warn("Failed to fetch notes from database:", err);
    return { authenticated: false, notes: {} };
  }
}

/**
 * Save single note to database via POST /api/notes
 */
export async function saveNoteToDb(
  ticker: string,
  content: string
): Promise<{ success: boolean; note?: StockNoteItem } | null> {
  try {
    const symbol = normalizeTicker(ticker);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: symbol, content }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Failed to persist note to database:", err);
    return null;
  }
}

/**
 * Batch sync local notes to database via POST /api/notes
 */
export async function syncNotesWithDb(
  notes: StockNotesMap
): Promise<StockNotesMap | null> {
  try {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync", notes }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.notes && typeof data.notes === "object" ? data.notes : null;
  } catch (err) {
    console.warn("Failed to sync notes with database:", err);
    return null;
  }
}

/**
 * Delete a note from database via DELETE /api/notes?ticker=XYZ
 */
export async function deleteNoteFromDb(ticker: string): Promise<boolean> {
  try {
    const symbol = normalizeTicker(ticker);
    const res = await fetch(`/api/notes?ticker=${encodeURIComponent(symbol)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (err) {
    console.warn("Failed to delete note from database:", err);
    return false;
  }
}

/**
 * Main hook for accessing all saved stock notes.
 */
export function useStockNotes() {
  const notes = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { data: session, isPending: isSessionPending } = useSession();
  const userId = session?.user?.id;
  const isAuthenticated = Boolean(session?.user);
  const [isSyncing, setIsSyncing] = useState(false);
  const activeUserRef = useRef<string | null>(null);

  // Sync with cloud database on user authentication
  useEffect(() => {
    let isMounted = true;
    if (isSessionPending) return;

    if (!userId) {
      activeUserRef.current = null;
      return;
    }

    if (activeUserRef.current === userId) return;
    activeUserRef.current = userId;

    const sync = async () => {
      setIsSyncing(true);
      const localNotes = getSnapshot();

      // If local notes exist, push them to cloud first
      if (Object.keys(localNotes).length > 0) {
        await syncNotesWithDb(localNotes);
      }

      // Fetch consolidated cloud notes
      const dbResult = await fetchNotesFromDb();
      if (isMounted && dbResult.authenticated) {
        // Merge cloud notes into memory snapshot
        const merged: StockNotesMap = { ...localNotes, ...dbResult.notes };
        setNotesSnapshot(merged, true);
      }
      if (isMounted) setIsSyncing(false);
    };

    sync();

    return () => {
      isMounted = false;
    };
  }, [userId, isSessionPending]);

  const hasNote = useCallback(
    (tickerOrSlug?: string | null): boolean => {
      if (!tickerOrSlug) return false;
      const symbol = normalizeTicker(tickerOrSlug);
      const item = notes[symbol];
      return Boolean(item && item.content && item.content.trim().length > 0);
    },
    [notes]
  );

  const getNote = useCallback(
    (tickerOrSlug?: string | null): StockNoteItem | null => {
      if (!tickerOrSlug) return null;
      const symbol = normalizeTicker(tickerOrSlug);
      return notes[symbol] ?? null;
    },
    [notes]
  );

  const saveNote = useCallback(
    (tickerOrSlug: string, content: string) => {
      const symbol = normalizeTicker(tickerOrSlug);
      if (!symbol) return;

      const current = getSnapshot();
      const nowIso = new Date().toISOString();
      const updatedItem: StockNoteItem = {
        content,
        updatedAt: nowIso,
      };

      const updatedMap: StockNotesMap = {
        ...current,
        [symbol]: updatedItem,
      };

      // Optimistic in-memory & localStorage update (instant 0ms feedback)
      setNotesSnapshot(updatedMap, true);

      // Async cloud sync if logged in
      if (isAuthenticated) {
        saveNoteToDb(symbol, content);
      }
    },
    [isAuthenticated]
  );

  const deleteNote = useCallback(
    (tickerOrSlug: string) => {
      const symbol = normalizeTicker(tickerOrSlug);
      if (!symbol) return;

      const current = getSnapshot();
      if (!(symbol in current)) return;

      const updatedMap: StockNotesMap = { ...current };
      delete updatedMap[symbol];

      // Optimistic update
      setNotesSnapshot(updatedMap, true);

      // Async cloud delete
      if (isAuthenticated) {
        deleteNoteFromDb(symbol);
      }
    },
    [isAuthenticated]
  );

  const noteTickersWithContent = Object.keys(notes).filter(
    (k) => notes[k]?.content && notes[k].content.trim().length > 0
  );

  return {
    notes,
    hasNote,
    getNote,
    saveNote,
    deleteNote,
    count: noteTickersWithContent.length,
    isAuthenticated,
    isSyncing,
  };
}

/**
 * Convenient single-stock hook for reading and editing a specific stock's note.
 */
export function useStockNote(tickerOrSlug?: string | null) {
  const { notes, saveNote, deleteNote, isAuthenticated, isSyncing } =
    useStockNotes();
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const symbol = tickerOrSlug ? normalizeTicker(tickerOrSlug) : "";
  const currentItem = symbol ? notes[symbol] : null;
  const content = currentItem?.content ?? "";
  const updatedAt = currentItem?.updatedAt ?? null;
  const hasNote = Boolean(content.trim().length > 0);

  const handleSave = useCallback(
    (nextContent: string) => {
      if (!symbol) return;
      setIsSaving(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveNote(symbol, nextContent);

      saveTimeoutRef.current = setTimeout(() => {
        setIsSaving(false);
      }, 350);
    },
    [symbol, saveNote]
  );

  const handleDelete = useCallback(() => {
    if (!symbol) return;
    deleteNote(symbol);
  }, [symbol, deleteNote]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  return {
    ticker: symbol,
    content,
    updatedAt,
    hasNote,
    saveNote: handleSave,
    deleteNote: handleDelete,
    isSaving,
    isAuthenticated,
    isSyncing,
  };
}
