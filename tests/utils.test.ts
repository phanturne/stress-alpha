import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatPercent,
  formatBillions,
  getReportRecencyWeight,
  compareReportsByRecency,
  deduplicateReportsToLatest,
} from "@/lib/utils";
import { getTranslations } from "@/lib/i18n";

describe("Formatting & Class Utilities", () => {
  describe("cn (tailwind merge + clsx)", () => {
    it("merges standard class strings", () => {
      expect(cn("px-2", "py-1")).toBe("px-2 py-1");
    });

    it("handles conditional classes and falsy values", () => {
      const condition = false;
      expect(cn("base-class", condition && "hidden", null, undefined)).toBe(
        "base-class"
      );
    });

    it("resolves conflicting tailwind classes cleanly", () => {
      expect(cn("p-2", "p-4")).toBe("p-4");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });
  });

  describe("formatCurrency", () => {
    it("formats currency with default 2 decimals", () => {
      expect(formatCurrency(128.5)).toBe("$128.50");
      expect(formatCurrency(1000)).toBe("$1,000.00");
    });

    it("formats negative currency with leading minus sign before dollar sign", () => {
      expect(formatCurrency(-0.24)).toBe("-$0.24");
      expect(formatCurrency(-1500.5)).toBe("-$1,500.50");
    });
  });

  describe("formatPercent", () => {
    it("formats positive percentages with plus sign by default", () => {
      expect(formatPercent(15.25)).toBe("+15.3%");
    });

    it("formats negative percentages with minus sign", () => {
      expect(formatPercent(-8.4)).toBe("-8.4%");
    });

    it("formats zero without sign", () => {
      expect(formatPercent(0)).toBe("0.0%");
    });

    it("respects includeSign = false", () => {
      expect(formatPercent(15.25, false)).toBe("15.3%");
    });
  });

  describe("formatBillions", () => {
    it("formats amounts in billions with 1 decimal default", () => {
      expect(formatBillions(30.04)).toBe("$30.0B");
      expect(formatBillions(125.46)).toBe("$125.5B");
    });

    it("formats amounts with custom decimals", () => {
      expect(formatBillions(30.04, 2)).toBe("$30.04B");
      expect(formatBillions(30.04, 0)).toBe("$30B");
    });
  });
});

describe("i18n Translation Dictionary", () => {
  it("returns English translations by default", () => {
    const t = getTranslations("en");
    expect(t.header.cockpit).toBe("Model");
    expect(t.header.memo).toBe("Memo");
  });

  it("returns Chinese translations when requested", () => {
    const t = getTranslations("zh");
    expect(t.header.cockpit).toBe("模型");
    expect(t.header.memo).toBe("备忘录");
  });

  it("falls back to English for unknown locales", () => {
    const t = getTranslations("fr" as any);
    expect(t.header.cockpit).toBe("Model");
  });
});

describe("Report Recency & Deduplication Engine", () => {
  it("calculates recency weights correctly across quarter string formats", () => {
    expect(getReportRecencyWeight({ quarter: "Q4 2026" })).toBe(20264);
    expect(getReportRecencyWeight({ quarter: "Q2 2027" })).toBe(20272);
    expect(getReportRecencyWeight({ quarter: "1Q2026" })).toBe(20261);
    expect(getReportRecencyWeight({ quarter: "4Q 2026" })).toBe(20264);
    expect(getReportRecencyWeight({ slug: "ONDS-Q4-2026-analysis" })).toBe(
      20264
    );
    expect(getReportRecencyWeight({ reportDate: "2026-08-14" })).toBe(20263); // August = Q3
  });

  it("correctly marks ONDS Q4 2026 as newer than Q2 2026 even with Yahoo Finance non-ISO date", () => {
    const q4Report = {
      slug: "ONDS-Q4-2026-analysis",
      ticker: "ONDS",
      quarter: "Q4 2026",
      reportDate: "1Q2026",
    };
    const q2Report = {
      slug: "ONDS-Q2-2026-analysis",
      ticker: "ONDS",
      quarter: "Q2 2026",
      reportDate: "2026-08-14",
    };

    const sorted = [q2Report, q4Report].sort(compareReportsByRecency);
    expect(sorted[0].slug).toBe("ONDS-Q4-2026-analysis");
    expect(sorted[1].slug).toBe("ONDS-Q2-2026-analysis");

    const deduplicated = deduplicateReportsToLatest([q2Report, q4Report]);
    expect(deduplicated).toHaveLength(1);
    expect(deduplicated[0].slug).toBe("ONDS-Q4-2026-analysis");
  });

  it("sorts across year boundaries (Q1 2027 is newer than Q4 2026)", () => {
    const r2026 = { quarter: "Q4 2026", slug: "TEST-Q4-2026-analysis" };
    const r2027 = { quarter: "Q1 2027", slug: "TEST-Q1-2027-analysis" };

    const sorted = [r2026, r2027].sort(compareReportsByRecency);
    expect(sorted[0].slug).toBe("TEST-Q1-2027-analysis");
    expect(sorted[1].slug).toBe("TEST-Q4-2026-analysis");
  });

  it("breaks ties with ISO report dates when quarters are identical", () => {
    const earlier = {
      quarter: "Q4 2026",
      reportDate: "2026-10-15",
      slug: "TEST-Q4-2026-v1",
    };
    const later = {
      quarter: "Q4 2026",
      reportDate: "2026-10-25",
      slug: "TEST-Q4-2026-v2",
    };

    const sorted = [earlier, later].sort(compareReportsByRecency);
    expect(sorted[0].slug).toBe("TEST-Q4-2026-v2");
    expect(sorted[1].slug).toBe("TEST-Q4-2026-v1");
  });
});
