import { describe, it, expect } from "vitest";
import {
  FactsSchema,
  ScenariosSchema,
  CatalystsSchema,
  FinancialModelBaselineSchema,
  ValuationSchema,
  MoatCompetitorsSchema,
  EarningsSentimentSchema,
  AnalystEstimatesSchema,
} from "@/lib/schemas";

describe("FactsSchema Unit Tests", () => {
  const validMinimalFacts = {
    ticker: "NVDA",
    company: "NVIDIA Corporation",
    quarter: "Q2 2027",
    reportDate: "2026-08-27",
    revenueBillions: 30.0,
    revenueGrowthPct: 122.0,
    operatingIncomeBillions: 18.6,
    operatingMarginPct: 62.0,
    epsReported: 0.68,
    epsOperating: 0.68,
    currentPrice: 128.5,
    segments: [
      {
        name: "Data Center",
        revenueBillions: 26.3,
        growthPct: 154.0,
      },
    ],
  };

  it("parses valid minimal facts and applies defaults", () => {
    const parsed = FactsSchema.parse(validMinimalFacts);
    expect(parsed.ticker).toBe("NVDA");
    expect(parsed.epsConsensus).toBe(0);
    expect(parsed.oneTimeItems).toEqual([]);
    expect(parsed.sources).toEqual([]);
    expect(parsed.marketCapBillions).toBe(0);
  });

  it("rejects facts with missing required ticker or company", () => {
    const { ticker, ...withoutTicker } = validMinimalFacts;
    void ticker;
    expect(FactsSchema.safeParse(withoutTicker).success).toBe(false);
  });

  it("rejects facts with empty segments array (min 1 required)", () => {
    const invalid = { ...validMinimalFacts, segments: [] };
    expect(FactsSchema.safeParse(invalid).success).toBe(false);
  });

  it("parses facts with one-time items correctly", () => {
    const withOneTime = {
      ...validMinimalFacts,
      oneTimeItems: [
        {
          description: "Legal settlement",
          amountBillions: 0.25,
          isOperating: false,
          note: "Non-recurring charge",
        },
      ],
    };
    const parsed = FactsSchema.parse(withOneTime);
    expect(parsed.oneTimeItems).toHaveLength(1);
    expect(parsed.oneTimeItems[0].isOperating).toBe(false);
  });
});

describe("ScenariosSchema Unit Tests", () => {
  const validScenarios = {
    ticker: "NVDA",
    basisYear: "FY2027",
    currentPrice: 128.5,
    scenarios: [
      {
        name: "Bull",
        probability: 0.3,
        forwardEps: 5.5,
        multiple: 32,
        assumptions: ["Strong Blackwell ramp"],
        keyDrivers: ["Data Center revenue"],
      },
      {
        name: "Base",
        probability: 0.5,
        forwardEps: 4.8,
        multiple: 26,
        assumptions: ["Steady growth"],
        keyDrivers: [],
      },
      {
        name: "Panic",
        probability: 0.2,
        forwardEps: 3.5,
        multiple: 17,
        assumptions: ["CapEx pullback"],
        keyDrivers: [],
      },
    ],
  };

  it("parses valid scenario tree", () => {
    const parsed = ScenariosSchema.parse(validScenarios);
    expect(parsed.scenarios).toHaveLength(3);
    expect(parsed.consensusTarget).toBe(0); // default applied
  });

  it("rejects probability outside [0, 1]", () => {
    const invalid = {
      ...validScenarios,
      scenarios: [
        {
          ...validScenarios.scenarios[0],
          probability: 1.5, // invalid
        },
      ],
    };
    expect(ScenariosSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects empty scenarios list", () => {
    const invalid = { ...validScenarios, scenarios: [] };
    expect(ScenariosSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("FinancialModelBaselineSchema Unit Tests", () => {
  const validBaseline = {
    baseRevenueBillions: 120.0,
    baseGrossMarginPct: 75.0,
    fixedOpexBillions: 15.0,
    dilutedSharesBillions: 24.5,
    multipleRegimes: {
      bull: 32,
      base: 26,
      panic: 17,
    },
    upstreamDrivers: [
      {
        id: "cloud-capex",
        name: "Cloud CapEx",
        exposureShare: 0.6,
        elasticity: 1.1,
      },
    ],
  };

  it("parses valid baseline and populates default tax rate", () => {
    const parsed = FinancialModelBaselineSchema.parse(validBaseline);
    expect(parsed.taxRatePct).toBe(16.5);
    expect(parsed.upstreamDrivers[0].defaultShockPct).toBe(0);
  });

  it("rejects invalid gross margin (>100 or <0)", () => {
    expect(
      FinancialModelBaselineSchema.safeParse({
        ...validBaseline,
        baseGrossMarginPct: 105,
      }).success
    ).toBe(false);
    expect(
      FinancialModelBaselineSchema.safeParse({
        ...validBaseline,
        baseGrossMarginPct: -5,
      }).success
    ).toBe(false);
  });

  it("rejects non-positive multiple regimes", () => {
    expect(
      FinancialModelBaselineSchema.safeParse({
        ...validBaseline,
        multipleRegimes: { bull: 32, base: 26, panic: -5 },
      }).success
    ).toBe(false);
  });
});

describe("CatalystsSchema Unit Tests", () => {
  it("validates catalyst direction enum and probability anchors", () => {
    const valid = {
      ticker: "NVDA",
      catalysts: [
        {
          id: "cat-1",
          title: "Blackwell shipment start",
          direction: "growth",
          probability: 0.8,
          probabilityAnchor: "Foundry tape-out confirmed",
          horizon: "near-term",
          description: "Accelerates Q4 revenue",
          evidence: [],
        },
      ],
    };
    expect(CatalystsSchema.safeParse(valid).success).toBe(true);

    const invalidDirection = {
      ...valid,
      catalysts: [{ ...valid.catalysts[0], direction: "neutral" }],
    };
    expect(CatalystsSchema.safeParse(invalidDirection).success).toBe(false);
  });
});

describe("EarningsSentimentSchema Unit Tests", () => {
  it("validates management tone numeric range and quote sentiments", () => {
    const valid = {
      managementTone: {
        overallConfidence: 8.5,
        specificity: 7.0,
        forwardConfidence: 9.0,
        capexJustification: 8.0,
        competitivePositioning: 9.5,
        riskAcknowledgment: 6.0,
      },
      keyQuotes: [
        {
          quote: "Demand for Blackwell is incredible.",
          speaker: "Jensen Huang",
          context: "Prepared remarks",
          sentiment: "bullish",
        },
      ],
    };
    expect(EarningsSentimentSchema.safeParse(valid).success).toBe(true);

    const invalid = {
      ...valid,
      managementTone: {
        ...valid.managementTone,
        overallConfidence: "high", // must be number
      },
    };
    expect(EarningsSentimentSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("MoatCompetitorsSchema Unit Tests", () => {
  it("validates economic moat ratings and competitor peers", () => {
    const valid = {
      ticker: "NVDA",
      overallMoatRating: "Wide",
      moatTrend: "Widening",
      competitiveDynamicsSummary: "Strong AI compute dominance",
      moatSources: [
        {
          source: "Switching Costs",
          strength: "Strong",
          durabilityYears: 10,
          description: "Massive developer lock-in with CUDA",
        },
      ],
      competitors: [
        {
          ticker: "AMD",
          name: "Advanced Micro Devices",
          marketCapBillions: 250,
          revenueBillions: 25,
          grossMarginPct: 52,
          operatingMarginPct: 22,
          pricingPower: "Parity",
          productComparison: "MI300 series vs H100",
          keyAdvantageOrVulnerability: "Gaining MI300 traction",
        },
      ],
    };
    expect(MoatCompetitorsSchema.safeParse(valid).success).toBe(true);
  });
});

describe("AnalystEstimatesSchema Unit Tests", () => {
  it("validates consensus target price and rating breakdowns", () => {
    const valid = {
      ticker: "NVDA",
      consensus: {
        consensus: "Strong Buy",
        totalAnalysts: 45,
        bullishCount: 40,
        bullishPct: 88.9,
        neutralCount: 5,
        neutralPct: 11.1,
        bearishCount: 0,
        bearishPct: 0,
      },
      priceTargets: {
        currentPrice: 128.5,
        low: 100.0,
        average: 148.0,
        high: 200.0,
        currency: "USD",
      },
      synthesisNarrative: "Overwhelmingly bullish post-earnings revisions",
      estimates: [
        {
          firm: "Rosenblatt",
          rating: "Buy",
          priceTarget: 200,
          upsidePct: 55.6,
          date: "2026-08-28",
        },
      ],
    };
    expect(AnalystEstimatesSchema.safeParse(valid).success).toBe(true);
  });
});
