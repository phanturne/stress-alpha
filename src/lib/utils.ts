import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, decimals: number = 2): string {
  const isNegative = amount < 0;
  const absFormatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return isNegative ? `-$${absFormatted}` : `$${absFormatted}`;
}

export function formatPercent(
  value: number,
  includeSign: boolean = true
): string {
  const sign = includeSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatBillions(value: number, decimals: number = 1): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}B`;
}

/**
 * Normalizes a ticker or report slug into an uppercase ticker symbol.
 * E.g. "NVDA-Q2-2027-analysis" -> "NVDA", "nvda" -> "NVDA"
 * Rejects malformed strings outside /^[A-Z0-9.-]{1,10}$/.
 */
export function normalizeTicker(tickerOrSlug?: string | null): string {
  if (!tickerOrSlug) return "";
  const cleaned = tickerOrSlug.trim();
  const candidate = cleaned.includes("-")
    ? cleaned.split("-")[0].toUpperCase().trim()
    : cleaned.toUpperCase();
  return /^[A-Z0-9.-]{1,10}$/.test(candidate) ? candidate : "";
}

/**
 * Redacts raw internal error stack/connection strings in production API responses.
 */
export function formatSafeErrorDetails(error: unknown): string | undefined {
  if (process.env.NODE_ENV === "production") {
    return undefined;
  }
  return error instanceof Error ? error.message : String(error);
}

export interface ReportRecencyItem {
  quarter?: string | null;
  reportDate?: string | null;
  slug?: string | null;
  year?: number | null;
  publishedAt?: Date | string | null;
}

/**
 * Computes a deterministic integer score reflecting the quarter/date recency of a report.
 * Higher score = more recent earnings quarter.
 * e.g. "Q4 2026" -> 20264, "Q2 2027" -> 20272, "1Q2026" -> 20261.
 */
export function getReportRecencyWeight(r: ReportRecencyItem): number {
  // 1. Try matching standard quarter pattern "Q4 2026", "Q2 2027", "Q4-2026", "Q4_2026"
  if (r.quarter) {
    const match = r.quarter.match(/Q([1-4])[\s-_]*(\d{4})/i);
    if (match) {
      const q = parseInt(match[1], 10);
      const year = parseInt(match[2], 10);
      return year * 10 + q;
    }
    // Try inverted quarter pattern "4Q 2026", "1Q2026"
    const invMatch = r.quarter.match(/([1-4])Q[\s-_]*(\d{4})/i);
    if (invMatch) {
      const q = parseInt(invMatch[1], 10);
      const year = parseInt(invMatch[2], 10);
      return year * 10 + q;
    }
  }

  // 2. Try parsing quarter & year from slug, e.g. "ONDS-Q4-2026-analysis"
  if (r.slug) {
    const slugMatch = r.slug.match(/[-_]Q([1-4])[-_](\d{4})/i);
    if (slugMatch) {
      const q = parseInt(slugMatch[1], 10);
      const year = parseInt(slugMatch[2], 10);
      return year * 10 + q;
    }
    const invSlugMatch = r.slug.match(/[-_]([1-4])Q[-_](\d{4})/i);
    if (invSlugMatch) {
      const q = parseInt(invSlugMatch[1], 10);
      const year = parseInt(invSlugMatch[2], 10);
      return year * 10 + q;
    }
  }

  // 3. Try parsing reportDate
  if (r.reportDate) {
    // If ISO date "2026-08-14"
    if (/^\d{4}-\d{2}-\d{2}/.test(r.reportDate)) {
      const parts = r.reportDate.split("-");
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const q = Math.ceil(month / 3);
      return year * 10 + q;
    }
    // If quarter string in reportDate, e.g. "1Q2026" or "Q4 2026"
    const rdMatch =
      r.reportDate.match(/Q([1-4])[\s-_]*(\d{4})/i) ||
      r.reportDate.match(/([1-4])Q[\s-_]*(\d{4})/i);
    if (rdMatch) {
      const q = parseInt(rdMatch[1], 10);
      const year = parseInt(rdMatch[2], 10);
      return year * 10 + q;
    }
  }

  // 4. Try explicit year if present (treat as Q0)
  if (r.year && r.year > 2000 && r.year < 2100) {
    return r.year * 10;
  }

  // 5. Fallback to publishedAt timestamp
  if (r.publishedAt) {
    const ts = new Date(r.publishedAt).getTime();
    if (!isNaN(ts) && ts > 0) return ts;
  }

  return 0;
}

/**
 * Deterministic comparator to sort reports in descending order of recency (latest first).
 */
export function compareReportsByRecency<T extends ReportRecencyItem>(
  a: T,
  b: T
): number {
  const scoreA = getReportRecencyWeight(a);
  const scoreB = getReportRecencyWeight(b);

  if (scoreA !== scoreB) {
    return scoreB - scoreA;
  }

  // If recency weights are identical, prefer valid ISO reportDate descending
  const dateA = a.reportDate || "";
  const dateB = b.reportDate || "";
  const isIsoA = /^\d{4}-\d{2}-\d{2}/.test(dateA);
  const isIsoB = /^\d{4}-\d{2}-\d{2}/.test(dateB);
  if (isIsoA && isIsoB && dateA !== dateB) {
    return dateB.localeCompare(dateA);
  } else if (isIsoA && !isIsoB) {
    return -1; // a is valid ISO date, preferred
  } else if (!isIsoA && isIsoB) {
    return 1; // b is valid ISO date, preferred
  }

  // Fallback to publishedAt timestamp descending
  if (a.publishedAt && b.publishedAt) {
    const tsA = new Date(a.publishedAt).getTime();
    const tsB = new Date(b.publishedAt).getTime();
    if (!isNaN(tsA) && !isNaN(tsB) && tsA !== tsB) {
      return tsB - tsA;
    }
  }

  // Final fallback to slug descending
  return (b.slug || "").localeCompare(a.slug || "");
}

/**
 * Deduplicates reports by unique ticker symbol, selecting the latest earnings report as primary.
 */
export function deduplicateReportsToLatest<
  T extends ReportRecencyItem & { ticker?: string; slug?: string },
>(reports: T[]): T[] {
  const groupMap = new Map<string, T[]>();

  for (const r of reports) {
    const symbol = normalizeTicker(r.ticker || r.slug);
    if (!symbol) continue;
    const existing = groupMap.get(symbol);
    if (existing) {
      existing.push(r);
    } else {
      groupMap.set(symbol, [r]);
    }
  }

  const uniqueReports: T[] = [];

  groupMap.forEach((reps) => {
    const sorted = [...reps].sort(compareReportsByRecency);
    if (sorted[0]) {
      uniqueReports.push(sorted[0]);
    }
  });

  return uniqueReports;
}
