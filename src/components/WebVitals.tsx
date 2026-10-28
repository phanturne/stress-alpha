"use client";

import { useReportWebVitals } from "next/web-vitals";

/**
 * Real-User Performance & Core Web Vitals Telemetry.
 * Tracks INP (Interaction to Next Paint), LCP, CLS, and FID
 * to detect frontend interaction degradation or navigation lag.
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    // In development mode, warn on slow interactions (INP > 150ms)
    if (process.env.NODE_ENV === "development") {
      if (metric.name === "INP" && metric.value > 150) {
        console.warn(
          `[Web Vitals] ⚠️ High Interaction to Next Paint (INP): ${Math.round(metric.value)}ms (${metric.rating})`
        );
      }
    }

    // Expose metric to window.__stressAlphaVitals for automated benchmark and E2E inspection
    if (typeof window !== "undefined") {
      const win = window as unknown as {
        __stressAlphaVitals?: Record<string, number>;
      };
      if (!win.__stressAlphaVitals) {
        win.__stressAlphaVitals = {};
      }
      win.__stressAlphaVitals[metric.name] = Math.round(metric.value);
    }
  });

  return null;
}
