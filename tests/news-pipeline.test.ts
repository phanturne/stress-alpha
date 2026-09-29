import { describe, it, expect } from "vitest";
import {
  MarketEventSchema,
  UpstreamDependencySchema,
  type FinancialModelBaseline,
  type Facts,
  type Scenarios,
  type MarketEvent,
} from "../src/lib/schemas";
import {
  isClickbaitOrJunk,
  isMaterialMarketEvent,
  deduplicateArticles,
} from "../src/lib/news-filter";
import { calculateEventTransmissionImpact } from "../src/lib/news-transmission";

describe("News & Catalyst Pipeline", () => {
  describe("Zod Schema Validation", () => {
    it("validates a valid market event with transmission vector", () => {
      const validEvent = {
        id: "evt-meta-muse-2026",
        ticker: "META",
        title: "Meta Announces General Availability of Muse Multimodal Engine",
        summary:
          "Meta announced enterprise rollout of its next-gen multimodal AI system Muse.",
        sourceUrl: "https://about.meta.com/news/muse",
        publisher: "Meta Press Release",
        publishedAt: "2026-09-22T14:30:00Z",
        eventType: "product_release",
        priceMovePct: 3.4,
        abnormalReturnSigma: 2.8,
        transmissionType: "catalyst_prob",
        transmissionPayload: {
          catalystId: "genai-monetization",
          newProbability: 0.8,
          rationale: "Enterprise commercialization tier launched.",
        },
        impliedWfvImpactPct: 4.5,
      };

      const parsed = MarketEventSchema.safeParse(validEvent);
      expect(parsed.success).toBe(true);
    });

    it("validates an upstream dependency graph record", () => {
      const dependency = {
        sourceTicker: "TSM",
        targetTicker: "NVDA",
        driverId: "hyperscaler-capex",
        driverName: "Hyperscaler Cloud CapEx Growth",
        exposureShare: 0.7,
        elasticity: 0.85,
        notes: "CoWoS advanced packaging capacity allocation.",
      };

      const parsed = UpstreamDependencySchema.safeParse(dependency);
      expect(parsed.success).toBe(true);
    });
  });

  describe("Clickbait & Materiality Filtering (Deterministic)", () => {
    it("rejects algorithmic junk and clickbait syndicators", () => {
      expect(
        isClickbaitOrJunk("3 Tech Stocks to Buy Instead of Meta", "Motley Fool")
      ).toBe(true);

      expect(
        isClickbaitOrJunk(
          "Why NVIDIA Stock Is Down 1.8% Today",
          "Zacks Investment Research"
        )
      ).toBe(true);

      expect(
        isClickbaitOrJunk(
          "Forget Apple, Buy This Semiconductor Stock Instead",
          "InvestorPlace"
        )
      ).toBe(true);
    });

    it("approves genuine market catalysts and press releases", () => {
      expect(
        isClickbaitOrJunk(
          "TSMC Approves $15B Advanced Packaging CapEx Expansion",
          "Bloomberg"
        )
      ).toBe(false);

      expect(
        isClickbaitOrJunk(
          "Meta Unveils Muse Multimodal Foundation Architecture",
          "Reuters"
        )
      ).toBe(false);

      expect(
        isClickbaitOrJunk(
          "DOJ Concludes Antitrust Review of Cloud Licensing",
          "Wall Street Journal"
        )
      ).toBe(false);
    });

    it("evaluates materiality thresholds correctly", () => {
      // SEC filing automatically passes
      expect(
        isMaterialMarketEvent({
          title: "Form 8-K: Material Definitive Agreement",
          publisher: "SEC EDGAR",
          isSecFiling: true,
        })
      ).toBe(true);

      // Abnormal volatility >= 2.5 sigma passes
      expect(
        isMaterialMarketEvent({
          title: "Stock Surges on Rumors",
          publisher: "Financial Times",
          abnormalReturnSigma: 2.7,
        })
      ).toBe(true);

      // Price move >= 3.0% passes
      expect(
        isMaterialMarketEvent({
          title: "Sudden Midday Rally",
          publisher: "CNBC",
          priceMovePct: 3.5,
        })
      ).toBe(true);

      // Junk without volatility fails
      expect(
        isMaterialMarketEvent({
          title: "Why Apple Is Down Today",
          publisher: "Motley Fool",
          priceMovePct: 0.8,
        })
      ).toBe(false);
    });

    it("deduplicates syndicated headlines cleanly", () => {
      const articles = [
        {
          title: "TSMC Expands CoWoS Packaging Capacity with $10B Investment",
          publisher: "Bloomberg",
        },
        {
          title: "TSMC Expands CoWoS Packaging Capacity With $10B Investment",
          publisher: "Yahoo Finance Syndication",
        },
        {
          title: "3 Stocks to Buy Right Now",
          publisher: "Motley Fool",
        },
        {
          title: "Meta Releases Llama 4 and Muse Architecture",
          publisher: "Reuters",
        },
      ];

      const deduplicated = deduplicateArticles(articles);
      expect(deduplicated.length).toBe(2);
      expect(deduplicated[0].publisher).toBe("Bloomberg");
      expect(deduplicated[1].publisher).toBe("Reuters");
    });
  });

  describe("Deterministic Valuation Transmission Engine", () => {
    const mockBaseline: FinancialModelBaseline = {
      baseRevenueBillions: 100,
      baseGrossMarginPct: 70,
      fixedOpexBillions: 20,
      taxRatePct: 15,
      dilutedSharesBillions: 2.5,
      multipleRegimes: {
        bull: 35,
        base: 28,
        panic: 18,
      },
      upstreamDrivers: [
        {
          id: "hyperscaler-capex",
          name: "Hyperscaler Cloud CapEx Growth",
          exposureShare: 0.7,
          elasticity: 0.85,
          defaultShockPct: 0,
          minShockPct: -50,
          maxShockPct: 50,
        },
      ],
    };

    const mockFacts: Facts = {
      ticker: "NVDA",
      company: "NVIDIA Corporation",
      quarter: "Q2 2027",
      reportDate: "2026-08-26",
      revenueBillions: 30,
      revenueGrowthPct: 122,
      operatingIncomeBillions: 18.6,
      operatingMarginPct: 62,
      epsReported: 0.68,
      epsOperating: 0.68,
      epsConsensus: 0.65,
      currentPrice: 125,
      marketCapBillions: 3000,
      trailingEps: 2.5,
      forwardEpsConsensus: 3.8,
      oneTimeItems: [],
      sources: [],
      segments: [{ name: "Data Center", revenueBillions: 26, growthPct: 150 }],
    };

    const mockScenarios: Scenarios = {
      ticker: "NVDA",
      basisYear: "FY2027",
      currentPrice: 125,
      consensusTarget: 145,
      scenarios: [
        {
          name: "Bull",
          forwardEps: 4.5,
          multiple: 35,
          probability: 0.35,
          assumptions: [],
          keyDrivers: [],
        },
        {
          name: "Base",
          forwardEps: 3.8,
          multiple: 28,
          probability: 0.5,
          assumptions: [],
          keyDrivers: [],
        },
        {
          name: "Bear",
          forwardEps: 2.8,
          multiple: 20,
          probability: 0.15,
          assumptions: [],
          keyDrivers: [],
        },
      ],
    };

    it("calculates upstream driver shock impact with zero LLM math", () => {
      const shockEvent: MarketEvent = {
        id: "evt-tsmc-capex",
        ticker: "NVDA",
        title: "TSMC Raises AI Semiconductor CapEx Guidance by +20%",
        summary: "TSMC announced increased packaging expansion.",
        publisher: "Bloomberg",
        publishedAt: "2026-09-22T08:00:00Z",
        eventType: "upstream_earnings",
        transmissionType: "driver_shock",
        sources: [],
        transmissionPayload: {
          driverId: "hyperscaler-capex",
          deltaShockPct: 20, // +20% shock
        },
      };

      const result = calculateEventTransmissionImpact({
        event: shockEvent,
        baseline: mockBaseline,
        facts: mockFacts,
        scenarios: mockScenarios,
      });

      // 20% shock * 0.70 exposure * 0.85 elasticity = +11.9% revenue lift
      expect(result.impliedRevenueDeltaBillions).toBeGreaterThan(0);
      expect(result.impliedEpsDelta).toBeGreaterThan(0);
      expect(result.impliedWfvDeltaPct).toBeGreaterThan(0);
      expect(result.impliedWfv).toBeGreaterThan(mockFacts.currentPrice);
      expect(result.transmissionSummary).toContain("Revenue impact:");
    });

    it("calculates sell-side analyst upgrade momentum impact deterministically", () => {
      const upgradeEvent: MarketEvent = {
        id: "evt-ms-upgrade",
        ticker: "NVDA",
        title: "Morgan Stanley Raises Price Target to $165",
        summary:
          "Analyst raised target from $140 to $165 on datacenter demand.",
        publisher: "Morgan Stanley Research",
        publishedAt: "2026-09-22T10:00:00Z",
        eventType: "analyst_rating",
        transmissionType: "qpce_skew",
        sources: [],
        transmissionPayload: {
          analystAction: {
            firm: "Morgan Stanley",
            action: "TargetRaised",
            priorTarget: 140,
            newTarget: 165,
          },
        },
      };

      const result = calculateEventTransmissionImpact({
        event: upgradeEvent,
        baseline: mockBaseline,
        facts: mockFacts,
        scenarios: mockScenarios,
      });

      expect(result.impliedWfvDeltaPct).toBeGreaterThan(0);
      expect(result.transmissionSummary).toContain(
        "Morgan Stanley TargetRaised"
      );
    });
  });
});
