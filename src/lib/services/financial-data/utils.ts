/**
 * Shared utility functions for financial calculations and API key resolution.
 */

export function safeNum(val: unknown, fallback = 0): number {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function round3(num: number): number {
  return Math.round((num + Number.EPSILON) * 1000) / 1000;
}

export function getMassiveApiKey(provided?: string): string | undefined {
  return provided || process.env.MASSIVE_API_KEY;
}

export function getFinnhubApiKey(provided?: string): string | undefined {
  return provided || process.env.FINNHUB_API_KEY;
}
