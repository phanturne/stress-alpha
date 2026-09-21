import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, decimals: number = 2): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatPercent(
  value: number,
  includeSign: boolean = true
): string {
  const sign = includeSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatBillions(value: number, decimals: number = 1): string {
  return `$${value.toFixed(decimals)}B`;
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
