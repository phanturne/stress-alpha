import { describe, it, expect } from "vitest";
import { renderReport, type ReportInput } from "@/lib/report";
import { FactsSchema, type Facts, type Valuation } from "@/lib/schemas";

describe("renderReport markdown generation", () => {
  const mockFacts: Facts = FactsSchema.parse({
    ticker: "NVDA",
    company: "NVIDIA Corporation",
    quarter: "Q2 2027",
    reportDate: "2026-08-27",
    analysisDate: "2026-08-28",
    currentPrice: 128.5,
    marketCapBillions: 3150,
    revenueBillions: 30.04,
    revenueGrowthPct: 122,
    operatingIncomeBillions: 18.64,
    operatingMarginPct: 62.1,
    epsReported: 0.68,
    epsOperating: 0.68,
    segments: [
      {
        name: "Data Center",
        revenueBillions: 26.3,
        growthPct: 154,
        operatingMarginPct: 75,
      },
      {
        name: "Gaming",
        revenueBillions: 2.9,
        growthPct: 16,
      },
    ],
    oneTimeItems: [
      {
        description: "Inventory provision adjustment",
        amountBillions: 0.15,
        isOperating: true,
      },
    ],
  });

  const mockValuation: Valuation = {
    ticker: "NVDA",
    analysisDate: "2026-08-28",
    currentPrice: 128.5,
    weightedFairValue: 148.2,
    upsidePct: 15.3,
    consensusTarget: 140.0,
    verdictVsConsensus: "Above consensus ($140) by 5.9% — more bullish",
    scenarioResults: [
      {
        name: "Bull",
        probability: 0.3,
        fairValue: 180.0,
        upsideFromCurrent: 40.1,
      },
      {
        name: "Base",
        probability: 0.5,
        fairValue: 145.0,
        upsideFromCurrent: 12.8,
      },
      {
        name: "Panic",
        probability: 0.2,
        fairValue: 108.0,
        upsideFromCurrent: -16.0,
      },
    ],
    sensitivity: [
      {
        scenario: "Base",
        parameter: "EPS +10%",
        baseValue: 4.5,
        altValue: 4.95,
        fairValueDelta: 14.5,
      },
    ],
  };

  const reportInput: ReportInput = {
    facts: mockFacts,
    valuation: mockValuation,
    catalysts: {
      ticker: "NVDA",
      catalysts: [
        {
          id: "blackwell-ramp",
          title: "Blackwell Ultra production ramp",
          direction: "growth",
          probability: 0.85,
          probabilityAnchor: "TSMC supply commitments",
          horizon: "near-term",
          description: "Expands gross margin moat to 76%",
          evidence: [],
        },
      ],
    },
  };

  it("renders comprehensive English report", () => {
    const md = renderReport(reportInput, { language: "en" });

    expect(md).toContain("# Earnings Analysis: NVDA — Q2 2027");
    expect(md).toContain("Weighted Fair Value");
    expect(md).toContain("**$148.2**");
    expect(md).toContain("+15.3%");
    expect(md).toContain("Data Center");
    expect(md).toContain("Blackwell Ultra production ramp");
    expect(md).toContain("Income Quality Adjustment");
  });

  it("renders comprehensive Chinese report", () => {
    const md = renderReport(reportInput, { language: "zh" });

    expect(md).toContain(
      "# 财报深度分析与压力测试研报：NVDA (NVIDIA Corporation) — Q2 2027"
    );
    expect(md).toContain("概率加权公允价值");
    expect(md).toContain("**$148.2**");
    expect(md).toContain("核心估值结论与投资摘要");
    expect(md).toContain("业务单元与分部数据");
  });

  it("renders gracefully when optional sections are omitted", () => {
    const minimalInput: ReportInput = {
      facts: {
        ...mockFacts,
        oneTimeItems: [],
        segments: [],
      },
      valuation: mockValuation,
    };

    expect(() => renderReport(minimalInput, { language: "en" })).not.toThrow();
    const md = renderReport(minimalInput, { language: "en" });
    expect(md).toContain("Earnings Analysis: NVDA");
  });
});
