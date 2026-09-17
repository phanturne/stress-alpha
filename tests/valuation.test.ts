import { describe, it, expect } from "vitest";
import {
  round2,
  computeStressedValuation,
  computeValuation,
  deriveEffectiveBaseline,
} from "@/lib/valuation";
import type { FinancialModelBaseline, Facts, Scenarios } from "@/lib/schemas";
import { FactsSchema } from "@/lib/schemas";

describe("round2 precision helper", () => {
  it("rounds positive floats to 2 decimal places", () => {
    expect(round2(123.456)).toBe(123.46);
    expect(round2(123.451)).toBe(123.45);
    expect(round2(10)).toBe(10);
  });

  it("rounds negative floats accurately", () => {
    expect(round2(-45.678)).toBe(-45.68);
    expect(round2(-0.001)).toBe(-0);
  });
});

describe("computeStressedValuation", () => {
  const mockBaseline: FinancialModelBaseline = {
    baseRevenueBillions: 100,
    baseGrossMarginPct: 50,
    fixedOpexBillions: 20,
    taxRatePct: 20,
    dilutedSharesBillions: 2,
    multipleRegimes: { bull: 30, base: 20, panic: 10 },
    upstreamDrivers: [
      {
        id: "driver-a",
        name: "Driver A",
        exposureShare: 0.6,
        elasticity: 1.0,
        defaultShockPct: 0,
        minShockPct: -40,
        maxShockPct: 40,
      },
      {
        id: "driver-b",
        name: "Driver B",
        exposureShare: 0.4,
        elasticity: 0.5,
        defaultShockPct: 0,
        minShockPct: -30,
        maxShockPct: 30,
      },
    ],
  };

  const currentPrice = 150;

  it("calculates exact accounting flow-through under unperturbed baseline", () => {
    const result = computeStressedValuation(mockBaseline, currentPrice, {});

    // Revenue: 100
    expect(result.stressRevenueBillions).toBe(100);
    // Gross profit: 100 * 50% = 50
    expect(result.stressGrossProfitBillions).toBe(50);
    // Operating income: 50 - 20 = 30
    expect(result.stressOperatingIncomeBillions).toBe(30);
    // Net income: 30 * (1 - 0.20) = 24
    expect(result.stressNetIncomeBillions).toBe(24);
    // EPS: 24B / 2B shares = 12.00
    expect(result.stressEps).toBe(12);

    // Regime targets
    expect(result.valuationBands.bull.targetPrice).toBe(12 * 30); // 360
    expect(result.valuationBands.base.targetPrice).toBe(12 * 20); // 240
    expect(result.valuationBands.panic.targetPrice).toBe(12 * 10); // 120

    // Delat from current price ($150)
    // Bull: (360 - 150) / 150 = +140%
    expect(result.valuationBands.bull.deltaFromCurrentPct).toBe(140);
    // Base: (240 - 150) / 150 = +60%
    expect(result.valuationBands.base.deltaFromCurrentPct).toBe(60);
    // Panic: (120 - 150) / 150 = -20%
    expect(result.valuationBands.panic.deltaFromCurrentPct).toBe(-20);

    // Asymmetry metrics
    expect(result.asymmetry.downsideToPanicPct).toBe(-20);
    expect(result.asymmetry.upsideToBullPct).toBe(140);
    // Risk-Reward: |140 / -20| = 7.0
    expect(result.asymmetry.riskRewardRatio).toBe(7);
    // Market priced-in multiple: 150 / 12 = 12.5x
    expect(result.asymmetry.marketPricedInMultiple).toBe(12.5);
  });

  it("correctly models upstream driver shocks with elasticity", () => {
    // Driver A has exposure 0.6, elasticity 1.0. Shock: -10% -> -6% rev shock
    // Driver B has exposure 0.4, elasticity 0.5. Shock: -20% -> -4% rev shock
    // Total rev shock: -10% -> Stressed Revenue = $90B
    const result = computeStressedValuation(mockBaseline, currentPrice, {
      driverShocks: {
        "driver-a": -10,
        "driver-b": -20,
      },
    });

    expect(result.stressRevenueBillions).toBe(90);
    // Gross profit: 90 * 50% = 45
    expect(result.stressGrossProfitBillions).toBe(45);
    // Operating income: 45 - 20 = 25 (operating leverage: rev fell 10%, op income fell 16.7%!)
    expect(result.stressOperatingIncomeBillions).toBe(25);
    // Net income: 25 * (1 - 0.20) = 20
    expect(result.stressNetIncomeBillions).toBe(20);
    // EPS: 20 / 2 = 10.0
    expect(result.stressEps).toBe(10);
    expect(result.valuationBands.base.targetPrice).toBe(200);
  });

  it("correctly applies gross margin delta and fixed opex shift", () => {
    // Gross margin: -200 bps (-2%) -> 48%
    // Fixed OpEx: +10% -> 22B
    const result = computeStressedValuation(mockBaseline, currentPrice, {
      grossMarginBpsDelta: -200,
      fixedOpexShiftPct: 10,
    });

    expect(result.stressRevenueBillions).toBe(100);
    expect(result.stressGrossProfitBillions).toBe(48); // 100 * 48%
    expect(result.stressOperatingIncomeBillions).toBe(26); // 48 - 22
    expect(result.stressNetIncomeBillions).toBe(20.8); // 26 * 0.8
    expect(result.stressEps).toBe(10.4); // 20.8 / 2
  });

  it("handles operating losses gracefully (floors net income at 0)", () => {
    // Severe shock: GM compresses to 10%, revenue falls 50%
    // Gross profit = 50 * 10% = 5B, OpEx = 20B -> Operating income = -15B
    const result = computeStressedValuation(mockBaseline, currentPrice, {
      driverShocks: { "driver-a": -50, "driver-b": -50 }, // -30% + -10% = -40% rev shock -> 60B
      grossMarginBpsDelta: -4500, // 50% - 45% = 5% margin -> 3B gross profit
    });

    expect(result.stressGrossProfitBillions).toBe(3);
    expect(result.stressOperatingIncomeBillions).toBe(-17); // 3 - 20
    expect(result.stressNetIncomeBillions).toBe(0); // floored at 0
    expect(result.stressEps).toBe(0);
    expect(result.valuationBands.base.targetPrice).toBe(0);
  });

  it("handles edge cases: zero shares and zero current price", () => {
    const zeroShareBaseline: FinancialModelBaseline = {
      ...mockBaseline,
      dilutedSharesBillions: 0,
    };
    const result = computeStressedValuation(zeroShareBaseline, 0);

    expect(result.stressEps).toBe(0);
    expect(result.valuationBands.bull.deltaFromCurrentPct).toBe(0);
    expect(result.asymmetry.riskRewardRatio).toBe(0);
  });
});

describe("computeValuation", () => {
  const mockFacts: Facts = FactsSchema.parse({
    ticker: "TEST",
    company: "Test Corp",
    quarter: "Q1 2026",
    reportDate: "2026-05-01",
    analysisDate: "2026-05-02",
    currentPrice: 100,
    marketCapBillions: 200,
    revenueBillions: 50,
    revenueGrowthPct: 15,
    operatingIncomeBillions: 15,
    operatingMarginPct: 30,
    epsReported: 6,
    epsOperating: 6,
    segments: [{ name: "Core", revenueBillions: 50, growthPct: 15 }],
  });

  const mockScenarios: Scenarios = {
    ticker: "TEST",
    basisYear: "FY2027",
    currentPrice: 100,
    consensusTarget: 110,
    scenarios: [
      {
        name: "Bull",
        probability: 0.25,
        forwardEps: 8,
        multiple: 25,
        assumptions: ["Strong growth"],
        keyDrivers: [],
      },
      {
        name: "Base",
        probability: 0.5,
        forwardEps: 6,
        multiple: 20,
        assumptions: ["In-line growth"],
        keyDrivers: [],
      },
      {
        name: "Panic",
        probability: 0.25,
        forwardEps: 4,
        multiple: 15,
        assumptions: ["Severe slowdown"],
        keyDrivers: [],
      },
    ],
  };

  it("calculates probability-weighted fair value and upside", () => {
    const valuation = computeValuation({
      facts: mockFacts,
      scenarios: mockScenarios,
    });

    // Bull: 8 * 25 = 200 (prob 0.25) -> 50
    // Base: 6 * 20 = 120 (prob 0.50) -> 60
    // Panic: 4 * 15 = 60 (prob 0.25) -> 15
    // Weighted FV = 50 + 60 + 15 = 125
    expect(valuation.weightedFairValue).toBe(125);
    // Upside: (125 - 100) / 100 = 25%
    expect(valuation.upsidePct).toBe(25);
    expect(valuation.scenarioResults).toHaveLength(3);
    expect(valuation.scenarioResults[0].fairValue).toBe(200);
    expect(valuation.scenarioResults[1].fairValue).toBe(120);
    expect(valuation.scenarioResults[2].fairValue).toBe(60);
  });

  it("generates 4 sensitivity entries per scenario (EPS ±10%, multiple ±2)", () => {
    const valuation = computeValuation({
      facts: mockFacts,
      scenarios: mockScenarios,
    });

    // 3 scenarios * 4 sensitivity parameters = 12 entries
    expect(valuation.sensitivity).toHaveLength(12);

    const baseEpsPlus = valuation.sensitivity.find(
      (s) => s.scenario === "Base" && s.parameter === "EPS +10%"
    );
    expect(baseEpsPlus).toBeDefined();
    expect(baseEpsPlus?.baseValue).toBe(6);
    expect(baseEpsPlus?.altValue).toBe(6.6);
    // Delta: (6.6 * 20) - (6 * 20) = 132 - 120 = +12
    expect(baseEpsPlus?.fairValueDelta).toBe(12);
  });

  it("evaluates consensus target verdict accurately", () => {
    // Case 1: More bullish (> +5% delta)
    const valuationBullish = computeValuation({
      facts: mockFacts,
      scenarios: { ...mockScenarios, consensusTarget: 100 }, // FV 125 vs 100 (+25%)
    });
    expect(valuationBullish.verdictVsConsensus).toContain("Above consensus");

    // Case 2: In line (within ±5%)
    const valuationInLine = computeValuation({
      facts: mockFacts,
      scenarios: { ...mockScenarios, consensusTarget: 124 }, // FV 125 vs 124 (+0.8%)
    });
    expect(valuationInLine.verdictVsConsensus).toContain(
      "In line with consensus"
    );

    // Case 3: More cautious (< -5% delta)
    const valuationCautious = computeValuation({
      facts: mockFacts,
      scenarios: { ...mockScenarios, consensusTarget: 150 }, // FV 125 vs 150 (-16.7%)
    });
    expect(valuationCautious.verdictVsConsensus).toContain("Below consensus");
  });
});

describe("deriveEffectiveBaseline", () => {
  it("derives consistent baseline when baseline file is absent", () => {
    const facts: Facts = FactsSchema.parse({
      ticker: "ABC",
      company: "ABC Inc",
      quarter: "Q1 2026",
      reportDate: "2026-05-01",
      analysisDate: "2026-05-02",
      currentPrice: 50,
      marketCapBillions: 100,
      revenueBillions: 40,
      revenueGrowthPct: 10,
      operatingIncomeBillions: 10,
      operatingMarginPct: 25,
      epsReported: 4,
      epsOperating: 4,
      segments: [{ name: "Main", revenueBillions: 40, growthPct: 10 }],
    });

    const derived = deriveEffectiveBaseline(facts);
    expect(derived.baseRevenueBillions).toBe(40);
    // Diluted shares: (100 * 1000) / 50 = 2000 / 1000 = 2.0B shares
    expect(derived.dilutedSharesBillions).toBe(2);
    expect(derived.multipleRegimes).toEqual({ bull: 34, base: 28, panic: 18 });
    expect(derived.upstreamDrivers.length).toBeGreaterThan(0);
  });
});
