"use client";

import { useState, useEffect } from "react";

export interface VisitedReport {
  slug: string;
  ticker: string;
}

export const LAST_REPORT_STORAGE_KEY = "stress_alpha_last_report";
export const LAST_REPORT_EVENT = "stress_alpha_last_report_updated";

/**
 * Retrieve the last visited report from localStorage.
 * Handles both structured JSON { slug, ticker } and fallback plain slug strings.
 */
export function getStoredLastReport(): VisitedReport | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_REPORT_STORAGE_KEY);
    if (!raw) return null;

    if (raw.startsWith("{")) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.slug === "string") {
        const ticker =
          typeof parsed.ticker === "string" && parsed.ticker.trim()
            ? parsed.ticker.trim().toUpperCase()
            : parsed.slug.split("-")[0].toUpperCase();
        return { slug: parsed.slug, ticker };
      }
    }

    // Fallback: raw was a plain slug string e.g. "NVDA-2025Q4"
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const ticker = trimmed.split("-")[0].toUpperCase();
    return { slug: trimmed, ticker };
  } catch {
    return null;
  }
}

/**
 * Persist the last visited report to localStorage and broadcast an update event.
 */
export function setStoredLastReport(slug: string, ticker: string): void {
  if (typeof window === "undefined") return;
  if (!slug || !slug.trim()) return;

  const normalizedTicker = (ticker || slug.split("-")[0] || "")
    .trim()
    .toUpperCase();
  const payload: VisitedReport = {
    slug: slug.trim(),
    ticker: normalizedTicker,
  };

  try {
    localStorage.setItem(LAST_REPORT_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(
      new CustomEvent<VisitedReport>(LAST_REPORT_EVENT, { detail: payload })
    );
  } catch {
    // Gracefully handle storage quota or disabled localStorage
  }
}

/**
 * Clear the stored last visited report.
 */
export function clearStoredLastReport(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LAST_REPORT_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(LAST_REPORT_EVENT));
  } catch {
    // Ignore error
  }
}

/**
 * React hook to reactively track the last visited report.
 * Automatically synchronizes with localStorage and cross-component updates.
 */
export function useRecentReport(
  currentSlug?: string | null,
  currentTicker?: string
): {
  recentReport: VisitedReport | null;
  setRecentReport: (slug: string, ticker: string) => void;
  clearRecentReport: () => void;
} {
  const [recentReport, setRecentReportState] = useState<VisitedReport | null>(
    () => {
      if (currentSlug && currentTicker) {
        return {
          slug: currentSlug,
          ticker: currentTicker.toUpperCase(),
        };
      }
      return null;
    }
  );

  // Restore stored report on client mount (prevents SSR hydration mismatch)
  useEffect(() => {
    if (!currentSlug) {
      const stored = getStoredLastReport();
      if (stored) {
        Promise.resolve().then(() => {
          setRecentReportState(stored);
        });
      }
    }
  }, [currentSlug]);

  // Auto-record if currentSlug and currentTicker are provided
  useEffect(() => {
    if (currentSlug) {
      const derivedTicker = currentTicker || currentSlug.split("-")[0] || "";
      if (derivedTicker) {
        setStoredLastReport(currentSlug, derivedTicker);
        Promise.resolve().then(() => {
          setRecentReportState({
            slug: currentSlug,
            ticker: derivedTicker.toUpperCase(),
          });
        });
      }
    }
  }, [currentSlug, currentTicker]);

  // Subscribe to storage and custom event updates
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<VisitedReport>;
      if (customEvent.detail && customEvent.detail.slug) {
        setRecentReportState(customEvent.detail);
      } else {
        setRecentReportState(getStoredLastReport());
      }
    };

    window.addEventListener(LAST_REPORT_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(LAST_REPORT_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return {
    recentReport,
    setRecentReport: (slug: string, ticker: string) => {
      setStoredLastReport(slug, ticker);
      setRecentReportState({
        slug,
        ticker: (ticker || slug.split("-")[0]).toUpperCase(),
      });
    },
    clearRecentReport: () => {
      clearStoredLastReport();
      setRecentReportState(null);
    },
  };
}
