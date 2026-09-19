import { describe, it, expect } from "vitest";
import { computeSnowflakeScore } from "@/lib/snowflake";
import type { ReportData } from "@/lib/schemas";
import { computeStressedValuation } from "@/lib/valuation";

describe("Snowflake Scoring Engine", () => {
  const mockReportData: ReportData = {
    folderSlug: "mock-test",
    folderName: "Mock Test Analysis",
    facts: {
      ticker: "TEST",
      company: "Test Technologies",
      quarter: "Q4 2026",
      reportDate: "2026-08-15",
      revenueBillions: 10,
      revenueGrowthPct: 45,
      revenueEstimateBillions: 9.5,
      operatingIncomeBillions: 3.5,
      operatingMarginPct: 35,
      operatingIncomeGrowthPct: 60,
      epsReported: 2.5,
      epsConsensus: 2.2,
      epsOperating: 2.5,
      segments: [
        {
          name: "Cloud Solutions",
          revenueBillions: 6,
          growthPct: 55,
          operatingIncomeBillions: 2.4,
          operatingMarginPct: 40,
        },
        {
          name: "Enterprise Software",
          revenueBillions: 4,
          growthPct: 30,
          operatingIncomeBillions: 1.1,
          operatingMarginPct: 27.5,
        },
      ],
      oneTimeItems: [],
      currentPrice: 120,
      marketCapBillions: 150,
      trailingEps: 8.0,
      forwardEpsConsensus: 10.5,
      sources: [],
    },
    scenarios: {
      ticker: "TEST",
      basisYear: "FY2027",
      currentPrice: 120,
      consensusTarget: 155,
      scenarios: [
        {
          name: "Bull",
          probability: 0.25,
          forwardEps: 12,
          multiple: 22,
          assumptions: [],
          keyDrivers: [],
        },
        {
          name: "Base",
          probability: 0.55,
          forwardEps: 10.5,
          multiple: 16,
          assumptions: [],
          keyDrivers: [],
        },
        {
          name: "Bear",
          probability: 0.2,
          forwardEps: 8,
          multiple: 10,
          assumptions: [],
          keyDrivers: [],
        },
      ],
    },
    valuation: {
      ticker: "TEST",
      currentPrice: 120,
      weightedFairValue: 160,
      upsidePct: 33.3,
      consensusTarget: 155,
      verdictVsConsensus: "Strong Conviction",
      scenarioResults: [],
      sensitivity: [],
    },
    catalysts: {
      ticker: "TEST",
      catalysts: [
        {
          id: "cloud-surge",
          title: "AI Workload Adoption",
          direction: "growth",
          probability: 0.7,
          probabilityAnchor: "Customer commitments",
          horizon: "near-term",
          description: "Hyper-growth in AI cloud workloads",
          evidence: [],
        },
        {
          id: "enterprise-expansion",
          title: "Global Enterprise Deals",
          direction: "growth",
          probability: 0.6,
          probabilityAnchor: "Pipeline expansion",
          horizon: "medium-term",
          description: "Expansion into Fortune 500",
          evidence: [],
        },
        {
          id: "macro-risk",
          title: "IT Budget Scrutiny",
          direction: "risk",
          probability: 0.35,
          probabilityAnchor: "Macro sentiment",
          horizon: "near-term",
          description: "Macro headwinds slowing sales cycles",
          evidence: [],
        },
      ],
    },
    moat: {
      ticker: "TEST",
      overallMoatRating: "Wide",
      moatTrend: "Widening",
      sources: [],
      competitiveDynamicsSummary: "Strong switching costs and network effects",
      moatSources: [
        {
          source: "Switching Costs",
          strength: "Strong",
          durabilityYears: 8,
          description: "Mission-critical enterprise software stack",
        },
        {
          source: "Network Effects",
          strength: "Moderate",
          durabilityYears: 6,
          description: "Marketplace and data flywheel",
        },
      ],
      competitors: [
        {
          ticker: "COMP1",
          name: "Competitor One",
          marketCapBillions: 80,
          revenueBillions: 12,
          revenueGrowthPct: 15,
          grossMarginPct: 55,
          operatingMarginPct: 18,
          pricingPower: "Inferior",
          productComparison: "Legacy offering",
          keyAdvantageOrVulnerability: "Legacy architecture vulnerability",
        },
      ],
    },
    baseline: {
      baseRevenueBillions: 40,
      baseGrossMarginPct: 65,
      fixedOpexBillions: 10,
      taxRatePct: 18,
      dilutedSharesBillions: 1.25,
      multipleRegimes: {
        bull: 22,
        base: 16,
        panic: 9,
      },
      upstreamDrivers: [
        {
          id: "cloud-spend",
          name: "Cloud Spend Growth",
          exposureShare: 0.7,
          elasticity: 1.0,
          defaultShockPct: 0,
          minShockPct: -30,
          maxShockPct: 30,
        },
      ],
    },
  };

  const stressResult = computeStressedValuation(
    mockReportData.baseline!,
    mockReportData.facts.currentPrice,
    {}
  );

  it("calculates deterministic 5-pillar scores summing up to total score out of 30", () => {
    const result = computeSnowflakeScore(mockReportData, stressResult, "en");

    expect(result.maxScore).toBe(30);
    expect(result.pillarList).toHaveLength(5);
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(30);
    expect(result.percentage).toBe(Math.round((result.totalScore / 30) * 100));

    // Verify all 5 pillars have exactly 6 criteria
    for (const pillar of result.pillarList) {
      expect(pillar.maxScore).toBe(6);
      expect(pillar.criteria).toHaveLength(6);
      expect(pillar.score).toBe(pillar.criteria.filter((c) => c.passed).length);
    }
  });

  it("assigns high conviction rating for strong fundamental metrics", () => {
    const result = computeSnowflakeScore(mockReportData, stressResult, "en");
    expect(result.totalScore).toBeGreaterThanOrEqual(24);
    expect(result.ratingTier).toBe("exceptional");
    expect(result.ratingLabel).toBe("Exceptional Alpha Conviction");
  });

  it("supports bilingual labels in Chinese without error", () => {
    const zhResult = computeSnowflakeScore(mockReportData, stressResult, "zh");
    expect(zhResult.ratingLabelZh).toBe("顶级阿尔法强置信度");
    expect(zhResult.pillars.valuation.labelZh).toBe("估值与安全边际");
    expect(zhResult.pillars.future.labelZh).toBe("未来增长与催化剂");
    expect(zhResult.pillars.earnings.labelZh).toBe("盈利质量与利润率");
    expect(zhResult.pillars.moat.labelZh).toBe("经济护城河与竞争优势");
    expect(zhResult.pillars.resilience.labelZh).toBe("压力韧性与下行底线");
  });

  it("handles sparse or missing optional data gracefully without crashing", () => {
    const sparseData: ReportData = {
      folderSlug: "sparse",
      folderName: "Sparse Report",
      facts: {
        ticker: "MIN",
        company: "Minimal Corp",
        quarter: "Q1 2026",
        reportDate: "2026-01-01",
        revenueBillions: 1,
        revenueGrowthPct: -5,
        operatingIncomeBillions: 0.05,
        operatingMarginPct: 5,
        epsReported: 0.1,
        epsConsensus: 0.2,
        epsOperating: 0.1,
        segments: [
          {
            name: "Main",
            revenueBillions: 1,
            growthPct: -5,
          },
        ],
        oneTimeItems: [],
        currentPrice: 50,
        marketCapBillions: 10,
        trailingEps: 0.4,
        forwardEpsConsensus: 0.5,
        sources: [],
      },
      scenarios: {
        ticker: "MIN",
        basisYear: "FY2026",
        currentPrice: 50,
        consensusTarget: 60,
        scenarios: [
          {
            name: "Base",
            probability: 1,
            forwardEps: 0.4,
            multiple: 10,
            assumptions: [],
            keyDrivers: [],
          },
        ],
      },
    };

    const result = computeSnowflakeScore(sparseData, undefined, "en");
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.pillarList).toHaveLength(5);
    expect(result.ratingTier).toBeDefined();
  });
});
