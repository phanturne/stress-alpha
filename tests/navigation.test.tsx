// @vitest-environment happy-dom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReportNavigation } from "@/hooks/useReportNavigation";
import type { StressTestParams } from "@/lib/valuation";

// Mock next/navigation router
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockPrefetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
  }),
}));

const defaultStressParams: StressTestParams = {
  driverShocks: {},
  grossMarginBpsDelta: 0,
  fixedOpexShiftPct: 0,
};

describe("useReportNavigation Hook Invariants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState(null, "", "/");
  });

  it("defaults to screener view on homepage when no report is in URL", async () => {
    let currentSlug: string | null = null;
    const setCurrentSlug = vi.fn((slug: string | null) => {
      currentSlug = slug;
    });
    const setLocale = vi.fn();

    const { result } = renderHook(() =>
      useReportNavigation({
        currentSlug,
        setCurrentSlug,
        initialMode: "screener",
        locale: "en",
        setLocale,
        stressParams: defaultStressParams,
        isLoading: false,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.viewMode).toBe("screener");
    expect(currentSlug).toBeNull();
  });

  it("transitions to cockpit on handleSelectReport on first try and updates history", async () => {
    let currentSlug: string | null = null;
    const setCurrentSlug = vi.fn((slug: string | null) => {
      currentSlug = slug;
    });
    const setLocale = vi.fn();

    const { result, rerender } = renderHook(() =>
      useReportNavigation({
        currentSlug,
        setCurrentSlug,
        initialMode: "screener",
        locale: "en",
        setLocale,
        stressParams: defaultStressParams,
        isLoading: false,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.viewMode).toBe("screener");

    // User clicks report (or Cockpit nav button) on homepage
    await act(async () => {
      result.current.handleSelectReport("NVDA-Q2-2027-analysis");
    });

    // Invariant: viewMode becomes cockpit immediately
    expect(result.current.viewMode).toBe("cockpit");
    expect(setCurrentSlug).toHaveBeenCalledWith("NVDA-Q2-2027-analysis");
    expect(window.location.search).toContain("report=NVDA-Q2-2027-analysis");

    // Simulate parent re-rendering with updated currentSlug
    currentSlug = "NVDA-Q2-2027-analysis";
    await act(async () => {
      rerender();
    });

    // Invariant: viewMode must NOT regress back to "screener"!
    expect(result.current.viewMode).toBe("cockpit");
  });

  it("restores cockpit view and currentSlug when URL contains report", async () => {
    window.history.pushState(
      null,
      "",
      "/?report=GOOGL-Q4-2025-analysis&mode=cockpit"
    );

    let currentSlug: string | null = null;
    const setCurrentSlug = vi.fn((slug: string | null) => {
      currentSlug = slug;
    });
    const setLocale = vi.fn();

    const { result } = renderHook(() =>
      useReportNavigation({
        currentSlug,
        setCurrentSlug,
        locale: "en",
        setLocale,
        stressParams: defaultStressParams,
        isLoading: false,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.viewMode).toBe("cockpit");
    expect(setCurrentSlug).toHaveBeenCalledWith("GOOGL-Q4-2025-analysis");
  });
});
