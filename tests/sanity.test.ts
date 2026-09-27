import { describe, it, expect } from "vitest";
import { auditReportData, formatSanityCliBanner } from "@/lib/sanity";
import { computeValuation } from "@/lib/valuation";
import type {
  Facts,
  Scenarios,
  FinancialModelBaseline,
  AnalystEstimates,
} from "@/lib/schemas";

const baseFacts: Facts = {
  ticker: "MSFT",
  company: "Microsoft Corporation",
  quarter: "Q4 2026",
  reportDate: "2026-07-28",
  revenueBillions: 76.4,
  revenueGrowthPct: 15.2,
  operatingIncomeBillions: 33.5,
  operatingMarginPct: 43.8,
  epsReported: 3.45,
  epsConsensus: 3.38,
  epsOperating: 3.49,
  currentPrice: 516.17,
  marketCapBillions: 3835.0,
  trailingEps: 13.56,
  forwardEpsConsensus: 15.2,
  segments: [
    {
      name: "Intelligent Cloud",
      revenueBillions: 33.2,
      growthPct: 21.0,
    },
    {
      name: "Productivity and Business Processes",
      revenueBillions: 23.5,
      growthPct: 12.0,
    },
    {
      name: "More Personal Computing",
      revenueBillions: 19.7,
      growthPct: 8.5,
    },
  ],
  oneTimeItems: [],
  sources: [],
};

const baseScenarios: Scenarios = {
  ticker: "MSFT",
  basisYear: "FY2027",
  currentPrice: 516.17,
  consensusTarget: 577.26,
  scenarios: [
    {
      name: "Bull",
      probability: 0.35,
      forwardEps: 24.5,
      multiple: 32.0,
      assumptions: ["Hyperscaler Cloud AI Acceleration"],
      keyDrivers: ["Azure Cloud AI Training"],
    },
    {
      name: "Base",
      probability: 0.5,
      forwardEps: 22.0,
      multiple: 26.0,
      assumptions: ["Midpoint execution"],
      keyDrivers: ["Stable M365 Copilot adoption"],
    },
    {
      name: "Panic",
      probability: 0.15,
      forwardEps: 18.0,
      multiple: 18.0,
      assumptions: ["Macro slowdown"],
      keyDrivers: ["Cloud workload de-prioritization"],
    },
  ],
};

const baseBaseline: FinancialModelBaseline = {
  baseRevenueBillions: 360.0,
  baseGrossMarginPct: 67.5,
  fixedOpexBillions: 75.0,
  taxRatePct: 16.5,
  dilutedSharesBillions: 7.43,
  multipleRegimes: {
    bull: 32.0,
    base: 26.0,
    panic: 18.0,
  },
  upstreamDrivers: [
    {
      id: "azure-ai-hyperscaler-workloads",
      name: "Azure Cloud AI Training Compute",
      exposureShare: 0.45,
      elasticity: 1.15,
      defaultShockPct: 0,
      minShockPct: -40,
      maxShockPct: 40,
    },
  ],
};

const baseEstimates: AnalystEstimates = {
  ticker: "MSFT",
  consensus: {
    consensus: "Strong Buy",
    totalAnalysts: 42,
    bullishCount: 38,
    bullishPct: 90.5,
    neutralCount: 4,
    neutralPct: 9.5,
    bearishCount: 0,
    bearishPct: 0,
  },
  priceTargets: {
    currentPrice: 516.17,
    low: 475.0,
    average: 577.26,
    median: 575.0,
    high: 650.0,
    currency: "USD",
  },
  synthesisNarrative: "Wall Street consensus remains overwhelmingly bullish.",
  estimates: [],
  sources: [],
};

describe("Deterministic Sanity & Variant Perception Audit Engine", () => {
  it("calculates 100% data completeness when all modules are provided", () => {
    const audit = auditReportData({
      facts: baseFacts,
      scenarios: baseScenarios,
      baseline: baseBaseline,
      estimates: baseEstimates,
      moat: {
        ticker: "MSFT",
        overallMoatRating: "Wide",
        moatTrend: "Widening",
        moatSources: [
          {
            source: "Switching Costs",
            strength: "Strong",
            description: "High enterprise switching costs",
            durabilityYears: 15,
          },
        ],
        competitors: [],
        competitiveDynamicsSummary: "Strong enterprise lock-in",
        sources: [],
      },
      filing: {
        ticker: "MSFT",
        quarter: "Q4 2026",
        newRiskFactors: [],
        sections: [],
      },
      sentiment: {
        ticker: "MSFT",
        quarter: "Q4 2026",
        keyQuotes: [],
      },
      catalysts: {
        ticker: "MSFT",
        catalysts: [
          {
            id: "azure-cloud-ai",
            title: "Azure Cloud AI Expansion",
            direction: "growth",
            probability: 0.8,
            probabilityAnchor: "Earnings guidance",
            horizon: "near-term",
            description: "Surging AI inference demand",
            evidence: [],
          },
        ],
      },
      weightedFairValue: 670.81,
    });

    expect(audit.passed).toBe(true);
    expect(audit.dataCompletenessScore).toBe(100);
    expect(audit.populatedModulesCount).toBe(8);
    expect(audit.totalModulesCount).toBe(8);
    expect(audit.missingModules).toEqual([]);
  });

  it("calculates partial completeness and flags missing optional modules", () => {
    const audit = auditReportData({
      facts: baseFacts,
      scenarios: baseScenarios,
      weightedFairValue: 550,
    });

    expect(audit.passed).toBe(true);
    expect(audit.dataCompletenessScore).toBeLessThan(100);
    expect(audit.missingModules).toContain("estimates");
    expect(audit.missingModules).toContain("filing");
    expect(audit.missingModules).toContain("sentiment");
    expect(audit.missingModules).toContain("moat");
  });

  it("fails fast with critical error on ticker mismatch", () => {
    const audit = auditReportData({
      facts: baseFacts,
      scenarios: {
        ...baseScenarios,
        ticker: "GOOGL", // Mismatch
      },
      weightedFairValue: 500,
    });

    expect(audit.passed).toBe(false);
    expect(audit.status).toBe("fail");
    const issue = audit.issues.find((i) => i.code === "TICKER_MISMATCH");
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe("critical");
  });

  it("fails fast with critical error on non-positive current price", () => {
    const audit = auditReportData({
      facts: {
        ...baseFacts,
        currentPrice: -10,
      },
      scenarios: {
        ...baseScenarios,
        currentPrice: -10,
      },
      weightedFairValue: 500,
    });

    expect(audit.passed).toBe(false);
    const issue = audit.issues.find((i) => i.code === "INVALID_CURRENT_PRICE");
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe("critical");
  });

  it("fails fast if scenario probabilities do not sum to 1.0 (±0.05)", () => {
    const audit = auditReportData({
      facts: baseFacts,
      scenarios: {
        ...baseScenarios,
        scenarios: [
          {
            name: "Bull",
            probability: 0.1,
            forwardEps: 20,
            multiple: 25,
            assumptions: [],
            keyDrivers: [],
          },
          {
            name: "Base",
            probability: 0.2, // Sums to 0.3, way below 1.0
            forwardEps: 18,
            multiple: 20,
            assumptions: [],
            keyDrivers: [],
          },
        ],
      },
      weightedFairValue: 500,
    });

    expect(audit.passed).toBe(false);
    const issue = audit.issues.find(
      (i) => i.code === "PROBABILITY_SUM_INVALID"
    );
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe("critical");
  });

  it("warns when facts price and analyst estimates snapshot diverge > 5%", () => {
    const audit = auditReportData({
      facts: baseFacts, // Price 516.17
      scenarios: baseScenarios,
      estimates: {
        ...baseEstimates,
        priceTargets: {
          ...baseEstimates.priceTargets,
          currentPrice: 470.0, // > 8% difference
        },
      },
      weightedFairValue: 550,
    });

    expect(audit.passed).toBe(true); // Non-fatal
    const issue = audit.issues.find(
      (i) => i.code === "PRICE_TIMING_DISCREPANCY"
    );
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe("warning");
  });

  it("decomposes consensus divergence and correctly classifies high-conviction alpha", () => {
    // WFV 670.81 vs Consensus 577.26 -> Delta = +16.21%
    const audit = auditReportData({
      facts: baseFacts,
      scenarios: baseScenarios,
      baseline: baseBaseline,
      estimates: baseEstimates,
      weightedFairValue: 670.81,
      locale: "en",
    });

    expect(audit.passed).toBe(true);
    expect(audit.consensusAttribution).toBeDefined();
    const ca = audit.consensusAttribution!;

    expect(ca.consensusTarget).toBe(577.26);
    expect(ca.weightedFairValue).toBe(670.81);
    expect(ca.divergencePct).toBe(16.21);
    expect(ca.divergenceClassification).toBe("high_conviction_alpha");
    expect(ca.baseFairValue).toBe(572); // 22 * 26
    expect(ca.regimeStressHaircutPct).toBe(17.27); // (670.81 - 572) / 572
    expect(ca.rationaleComment).toContain("High-Conviction Alpha Opportunity");
  });

  it("decomposes in-line consensus target when delta is within ±5%", () => {
    // WFV 580 vs Consensus 577.26 -> Delta = +0.47%
    const audit = auditReportData({
      facts: baseFacts,
      scenarios: baseScenarios,
      baseline: baseBaseline,
      estimates: baseEstimates,
      weightedFairValue: 580.0,
      locale: "en",
    });

    expect(audit.consensusAttribution?.divergenceClassification).toBe(
      "in_line"
    );
    expect(audit.consensusAttribution?.rationaleComment).toContain(
      "Consensus In-Line"
    );
  });

  it("decomposes extreme consensus divergence when delta >= 30%", () => {
    // WFV 800 vs Consensus 577.26 -> Delta = +38.59%
    const audit = auditReportData({
      facts: baseFacts,
      scenarios: baseScenarios,
      baseline: baseBaseline,
      estimates: baseEstimates,
      weightedFairValue: 800.0,
      locale: "en",
    });

    expect(audit.consensusAttribution?.divergenceClassification).toBe(
      "extreme_divergence"
    );
    expect(audit.consensusAttribution?.rationaleComment).toContain(
      "Extreme Bullish Variant Perception"
    );
    const warn = audit.issues.find(
      (i) => i.code === "EXTREME_CONSENSUS_DIVERGENCE"
    );
    expect(warn).toBeDefined();
  });

  it("provides pre-localized Chinese commentary when locale is zh", () => {
    const audit = auditReportData({
      facts: baseFacts,
      scenarios: baseScenarios,
      baseline: baseBaseline,
      estimates: baseEstimates,
      weightedFairValue: 670.81,
      locale: "zh",
    });

    expect(audit.consensusAttribution?.rationaleComment).toContain(
      "高确信度 Alpha 机会"
    );
    expect(audit.summary).toContain("数据完整度");
  });

  it("formats a clean ASCII CLI terminal banner", () => {
    const audit = auditReportData({
      facts: baseFacts,
      scenarios: baseScenarios,
      baseline: baseBaseline,
      estimates: baseEstimates,
      weightedFairValue: 670.81,
    });

    const banner = formatSanityCliBanner(audit, "MSFT");
    expect(banner).toContain("DATA INTEGRITY & VARIANT PERCEPTION: MSFT");
    expect(banner).toContain("Consensus Target:");
    expect(banner).toContain("Consensus Spread:");
    expect(banner).toContain("Analytical Stance:");
  });

  it("automatically attaches sanityAudit to Valuation when computeValuation runs", () => {
    const valuation = computeValuation({
      facts: baseFacts,
      scenarios: baseScenarios,
      baseline: baseBaseline,
      estimates: baseEstimates,
    });

    expect(valuation.sanityAudit).toBeDefined();
    expect(valuation.sanityAudit?.passed).toBe(true);
    expect(valuation.sanityAudit?.consensusAttribution).toBeDefined();
    expect(valuation.sanityAudit?.consensusAttribution?.consensusTarget).toBe(
      577.26
    );
  });
});
