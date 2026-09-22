import { describe, it, expect } from "vitest";
import { getTranslations } from "@/lib/i18n";
import type { ReportSummary } from "@/lib/repository/types";

describe("Multi-Quarter Earnings & Historical Navigation", () => {
  const mockReports: ReportSummary[] = [
    {
      slug: "NVDA-Q1-2027-analysis",
      name: "NVDA-Q1-2027-analysis",
      ticker: "NVDA",
      company: "NVIDIA Corporation",
      quarter: "Q1 2027",
      reportDate: "2026-05-22",
      currentPrice: 190.0,
      weightedFairValue: 295.0,
      upsidePct: 55.26,
      baseFairValue: 280.0,
      hasFacts: true,
      hasScenarios: true,
      hasValuation: true,
      hasBaseline: true,
      hasSentiment: false,
      hasFiling: false,
      hasCatalysts: true,
      hasReactions: false,
      hasEstimates: true,
    },
    {
      slug: "NVDA-Q2-2027-analysis",
      name: "NVDA-Q2-2027-analysis",
      ticker: "NVDA",
      company: "NVIDIA Corporation",
      quarter: "Q2 2027",
      reportDate: "2026-08-26",
      currentPrice: 219.73,
      weightedFairValue: 342.83,
      upsidePct: 56.02,
      baseFairValue: 330.0,
      hasFacts: true,
      hasScenarios: true,
      hasValuation: true,
      hasBaseline: true,
      hasSentiment: true,
      hasFiling: true,
      hasCatalysts: true,
      hasReactions: true,
      hasEstimates: true,
    },
    {
      slug: "AMZN-Q2-2026-analysis",
      name: "AMZN-Q2-2026-analysis",
      ticker: "AMZN",
      company: "Amazon.com, Inc.",
      quarter: "Q2 2026",
      reportDate: "2026-07-30",
      currentPrice: 253.5,
      weightedFairValue: 289.44,
      upsidePct: 14.18,
      baseFairValue: 294.0,
      hasFacts: true,
      hasScenarios: true,
      hasValuation: true,
      hasBaseline: true,
      hasSentiment: false,
      hasFiling: false,
      hasCatalysts: true,
      hasReactions: false,
      hasEstimates: true,
    },
  ];

  it("sorts multiple reports for the same ticker by reportDate descending", () => {
    const nvdaReports = mockReports
      .filter((r) => r.ticker === "NVDA")
      .sort(
        (a, b) =>
          (b.reportDate || "").localeCompare(a.reportDate || "") ||
          b.slug.localeCompare(a.slug)
      );

    expect(nvdaReports).toHaveLength(2);
    expect(nvdaReports[0].quarter).toBe("Q2 2027");
    expect(nvdaReports[0].reportDate).toBe("2026-08-26");
    expect(nvdaReports[1].quarter).toBe("Q1 2027");
    expect(nvdaReports[1].reportDate).toBe("2026-05-22");
  });

  it("correctly identifies latest vs historical quarter given an active slug", () => {
    const nvdaReports = mockReports
      .filter((r) => r.ticker === "NVDA")
      .sort((a, b) => (b.reportDate || "").localeCompare(a.reportDate || ""));

    const latest = nvdaReports[0];
    expect(latest.slug).toBe("NVDA-Q2-2027-analysis");

    // Case 1: user is viewing latest quarter
    const viewingSlug1 = "NVDA-Q2-2027-analysis";
    const isHistorical1 = Boolean(latest && latest.slug !== viewingSlug1);
    expect(isHistorical1).toBe(false);

    // Case 2: user is viewing historical quarter
    const viewingSlug2 = "NVDA-Q1-2027-analysis";
    const isHistorical2 = Boolean(latest && latest.slug !== viewingSlug2);
    expect(isHistorical2).toBe(true);
  });

  it("groups reports by ticker for hierarchical selector view", () => {
    const groupMap = new Map<string, ReportSummary[]>();
    for (const r of mockReports) {
      const key = r.ticker || r.slug;
      const list = groupMap.get(key) ?? [];
      list.push(r);
      groupMap.set(key, list);
    }

    expect(groupMap.size).toBe(2);
    const nvdaGroup = groupMap.get("NVDA");
    expect(nvdaGroup).toBeDefined();
    expect(nvdaGroup).toHaveLength(2);

    const amznGroup = groupMap.get("AMZN");
    expect(amznGroup).toBeDefined();
    expect(amznGroup).toHaveLength(1);
  });

  it("provides comprehensive localized text for multi-quarter navigation in EN and ZH", () => {
    const en = getTranslations("en");
    const zh = getTranslations("zh");

    // English tokens
    expect(en.header.quarterHistory).toBe("Quarterly Reports");
    expect(en.header.latestBadge).toBe("Latest");
    expect(en.header.historicalBadge).toBe("Historical");
    expect(en.header.historicalBanner("Q1 2027", "2026-05-22")).toContain(
      "Historical Analysis"
    );
    expect(en.header.jumpToLatest("Q2 2027")).toBe("Jump to Latest (Q2 2027)");
    expect(en.header.noEarlierQuarters).toBe(
      "No earlier quarterly reports in archive"
    );
    expect(en.selector.quartersCount(2)).toBe("2 Quarters");
    expect(en.selector.quartersCount(1)).toBe("1 Quarter");

    // Chinese tokens
    expect(zh.header.quarterHistory).toBe("季度研报历史");
    expect(zh.header.latestBadge).toBe("最新");
    expect(zh.header.historicalBadge).toBe("历史");
    expect(zh.header.historicalBanner("Q1 2027", "2026-05-22")).toContain(
      "历史财报分析"
    );
    expect(zh.header.jumpToLatest("Q2 2027")).toBe("跳转至最新 (Q2 2027)");
    expect(zh.header.noEarlierQuarters).toBe("归档中暂无更早历史研报");
    expect(zh.selector.quartersCount(2)).toBe("2 个季度");
  });
});
