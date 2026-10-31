import { describe, it, expect, beforeEach } from "vitest";
import {
  MarketEventSchema,
  UpstreamDependencySchema,
  ValuationRevisionSchema,
  ValuationRevisionsListSchema,
  type FinancialModelBaseline,
  type Facts,
  type Scenarios,
  type MarketEvent,
  type ReportData,
} from "../src/lib/schemas";
import {
  isClickbaitOrJunk,
  isMaterialMarketEvent,
  deduplicateArticles,
  filterCandidateNews,
  isRelevantToTicker,
} from "../src/lib/news-filter";
import {
  calculateEventTransmissionImpact,
  calculateNewsTransmissionImpact,
} from "../src/lib/news-transmission";
import {
  mapArticleToTransmission,
  ingestNewsForTicker,
  fetchPolygonGlobalNews,
  ingestGlobalNewsFirehose,
} from "../src/lib/services/news-ingestion";
import {
  InMemoryReportRepository,
  setReportRepository,
} from "../src/lib/repository";
import { GET as getNewsHandler } from "../src/app/api/news/route";
import { GET as getRevisionsHandler } from "../src/app/api/revisions/route";
import { NextRequest } from "next/server";

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

    it("validates a valuation revision ledger entry and list", () => {
      const validRevision = {
        id: "rev-nvda-1",
        ticker: "NVDA",
        revisionDate: "2026-09-22T14:30:00Z",
        triggerType: "peer_earnings_shock",
        triggerEventId: "evt-meta-muse-2026",
        headline: "TSMC CoWoS Allocation Surge Lifts Multiple",
        rationale: "Hyperscaler CapEx driver shock flow-through.",
        priorWfv: 140,
        newWfv: 155,
        wfvDeltaPct: 10.71,
        fullStateDiff: {
          priorRegimes: { bull: 175, base: 140, panic: 90 },
          newRegimes: { bull: 195, base: 155, panic: 95 },
          priorProbabilities: { bull: 0.35, base: 0.5, panic: 0.15 },
          newProbabilities: { bull: 0.42, base: 0.48, panic: 0.1 },
          driverShocksApplied: { "hyperscaler-capex": 20 },
        },
      };

      const parsed = ValuationRevisionSchema.safeParse(validRevision);
      expect(parsed.success).toBe(true);

      const listParsed = ValuationRevisionsListSchema.safeParse({
        ticker: "NVDA",
        revisions: [validRevision],
      });
      expect(listParsed.success).toBe(true);
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

      expect(
        isClickbaitOrJunk(
          "Prediction: Micron Could Turn $10,000 Into a Fortune by 2030",
          "Yahoo"
        )
      ).toBe(true);

      expect(
        isClickbaitOrJunk(
          "Jim Cramer On Micron (MU): Nothing Is Working",
          "Yahoo"
        )
      ).toBe(true);

      expect(
        isClickbaitOrJunk(
          "Micron Just Broke Support, So Buy MUU Into Strength",
          "SeekingAlpha"
        )
      ).toBe(true);

      expect(
        isClickbaitOrJunk(
          "Could Investing $200 Per Month in VOO Make You a Millionaire?",
          "Yahoo"
        )
      ).toBe(true);
    });

    it("rejects class-action lawsuit and shareholder rights solicitation spam", () => {
      expect(
        isClickbaitOrJunk(
          "Robbins LLP Reminds Investors of Lead Plaintiff Deadline in Securities Class Action Lawsuit",
          "GlobeNewswire"
        )
      ).toBe(true);

      expect(
        isClickbaitOrJunk(
          "Glancy Prongay & Murray LLP Reminds Investors of Deadline Alert in Class Action",
          "PR Newswire"
        )
      ).toBe(true);

      expect(
        isClickbaitOrJunk(
          "Rosen Law Firm, a Top Ranked Shareholder Rights Law Firm, Announces Investigation",
          "GlobeNewswire"
        )
      ).toBe(true);

      expect(
        isClickbaitOrJunk(
          "Levi & Korsinsky Encourages Tech Investors to Secure Counsel in Pending Securities Class Action",
          "Business Wire"
        )
      ).toBe(true);

      expect(
        isClickbaitOrJunk(
          "Shareholder Alert: Bronstein, Gewirtz & Grossman, LLC Reminds Investors of Class Action Lawsuit",
          "PR Newswire"
        )
      ).toBe(true);
    });

    it("approves genuine market catalysts and corporate actions", () => {
      expect(
        isClickbaitOrJunk(
          "Why Micron Is Betting $35 Billion on Its Own Stock",
          "Yahoo"
        )
      ).toBe(false);

      expect(
        isClickbaitOrJunk(
          "Sterne Kessler Client Netlist Negotiates $600 Million Settlement with Micron Technology",
          "Yahoo"
        )
      ).toBe(false);

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

    it("filters news by target ticker relevance", () => {
      const articles = [
        {
          title: "Is Solana Too Cheap to Ignore at Today's Prices?",
          publisher: "Yahoo",
        },
        {
          title: "Dutch Bros (BROS) Is 52% Below Its All-Time High",
          publisher: "Yahoo",
        },
        {
          title:
            "What Does Broadcom (AVGO) Face As AI Chip Supply Turns Into A Bottleneck?",
          publisher: "Yahoo",
        },
        {
          title: "ASML is the Most Important Company in the AI Ecosystem",
          publisher: "Yahoo",
        },
      ];

      const nvdaRelevant = articles.filter((a) =>
        isRelevantToTicker(a, "NVDA")
      );
      expect(nvdaRelevant.length).toBe(2);
      expect(nvdaRelevant[0].title).toContain("Broadcom");
      expect(nvdaRelevant[1].title).toContain("ASML");
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

    it("calculates news transmission impact wrapper against loaded ReportData", () => {
      const mockReportData: ReportData = {
        folderSlug: "NVDA-Q2-2027-analysis",
        folderName: "NVDA-Q2-2027-analysis",
        facts: mockFacts,
        scenarios: mockScenarios,
        baseline: mockBaseline,
      };

      const shockEvent: MarketEvent = {
        id: "evt-capex-flow",
        ticker: "NVDA",
        title: "Cloud Giants Boost AI CapEx by 25%",
        summary: "Hyperscalers increase spend.",
        publisher: "Bloomberg",
        publishedAt: "2026-09-22T10:00:00Z",
        eventType: "upstream_earnings",
        transmissionType: "driver_shock",
        sources: [],
        transmissionPayload: {
          driverId: "hyperscaler-capex",
          deltaShockPct: 25,
        },
      };

      const impactPct = calculateNewsTransmissionImpact(
        shockEvent,
        mockReportData
      );
      expect(typeof impactPct).toBe("number");
      expect(impactPct).toBeGreaterThan(0);

      // Returns undefined for null report data
      expect(calculateNewsTransmissionImpact(shockEvent, null)).toBeUndefined();
    });
  });

  describe("Deterministic Transmission Classifier & Filtering Service", () => {
    it("filters candidates and eliminates junk articles", () => {
      const articles = [
        {
          title: "TSMC Raises Advanced Packaging Allocation by 20%",
          publisher: "Bloomberg",
          url: "https://bloomberg.com/tsmc",
        },
        {
          title: "3 Stocks to Buy Right Now",
          publisher: "Motley Fool",
        },
        {
          title: "Form 8-K: Material Definitive Agreement",
          publisher: "SEC EDGAR",
        },
      ];

      const filtered = filterCandidateNews(articles, {
        requireMateriality: true,
      });
      expect(filtered.length).toBe(2);
      expect(filtered.some((a) => a.publisher === "Motley Fool")).toBe(false);
    });

    it("classifies CapEx and Packaging articles into driver_shock transmission", () => {
      const article1 = {
        title: "TSMC Boosts CoWoS Packaging CapEx Allocation by 25%",
        publisher: "Commercial Times",
        summary: "Advanced packaging lines running at 100% capacity.",
      };
      const res1 = mapArticleToTransmission(article1);
      expect(res1.eventType).toBe("upstream_earnings");
      expect(res1.transmissionType).toBe("driver_shock");
      expect(res1.transmissionPayload?.driverId).toBe("advanced-packaging");
      expect(res1.transmissionPayload?.deltaShockPct).toBe(25);

      const article2 = {
        title: "Cloud Provider Cuts Capital Expenditure Guidance by 15%",
        publisher: "Reuters",
        summary: "Hyperscaler slows server deployment pacing.",
      };
      const res2 = mapArticleToTransmission(article2);
      expect(res2.eventType).toBe("upstream_earnings");
      expect(res2.transmissionType).toBe("driver_shock");
      expect(res2.transmissionPayload?.deltaShockPct).toBe(-15);
    });

    it("classifies Wall Street rating revisions into qpce_skew transmission", () => {
      const article = {
        title: "Goldman Sachs Upgrades Stock with $180 Price Target",
        publisher: "Goldman Sachs Research",
        summary: "Analyst upgraded shares following survey results.",
      };
      const res = mapArticleToTransmission(article);
      expect(res.eventType).toBe("analyst_rating");
      expect(res.transmissionType).toBe("qpce_skew");
      expect(res.transmissionPayload?.analystAction?.action).toBe("Upgraded");
      expect(res.transmissionPayload?.analystAction?.firm).toBe(
        "Goldman Sachs"
      );
      expect(res.transmissionPayload?.analystAction?.newTarget).toBe(180);
    });

    it("classifies product releases and commercialization into catalyst_prob", () => {
      const article = {
        title:
          "Company Releases General Availability of Enterprise AI Platform",
        publisher: "TechCrunch",
        summary: "Commercial rollout opens to all Fortune 500 customers.",
      };
      const res = mapArticleToTransmission(article);
      expect(res.eventType).toBe("product_release");
      expect(res.transmissionType).toBe("catalyst_prob");
      expect(res.transmissionPayload?.newProbability).toBe(0.8);
    });

    it("classifies Form 8-K filings appropriately", () => {
      const secArticle = {
        title: "Form 8-K: Current Report Filing",
        publisher: "SEC EDGAR",
        summary: "Filing regarding executive appointment.",
      };
      const res = mapArticleToTransmission(secArticle);
      expect(res.eventType).toBe("sec_filing");
      expect(res.transmissionType).toBe("none");
    });

    it("classifies share buyback programs into operating EPS transmission", () => {
      const article = {
        title: "Why Micron Is Betting $35 Billion on Its Own Stock",
        publisher: "Yahoo",
        summary: "Board authorizes aggressive share repurchase expansion.",
      };
      const res = mapArticleToTransmission(article);
      expect(res.eventType).toBe("general_catalyst");
      expect(res.transmissionType).toBe("segment_growth");
      expect(res.transmissionPayload?.grossMarginBpsDelta).toBe(120);
    });

    it("classifies legal and patent settlements appropriately", () => {
      const article = {
        title:
          "Sterne Kessler Client Netlist Negotiates $600 Million Settlement with Micron Technology",
        publisher: "Yahoo",
        summary: "Parties conclude patent dispute with cash settlement.",
      };
      const res = mapArticleToTransmission(article);
      expect(res.eventType).toBe("sec_filing");
      expect(res.transmissionType).toBe("segment_growth");
      expect(res.transmissionPayload?.grossMarginBpsDelta).toBe(-60);
    });

    it("classifies upstream supplier earnings into foundry driver shock", () => {
      const article = {
        title: "Taiwan Semiconductor Profit Rose 69% Last Quarter",
        publisher: "Yahoo",
        summary:
          "TSMC reports record quarterly profit on AI accelerator demand.",
      };
      const res = mapArticleToTransmission(article);
      expect(res.eventType).toBe("upstream_earnings");
      expect(res.transmissionType).toBe("driver_shock");
      expect(res.transmissionPayload?.deltaShockPct).toBe(10);
    });
  });

  describe("API Routes & Ingestion Orchestrator", () => {
    let mockRepo: InMemoryReportRepository;

    beforeEach(() => {
      mockRepo = new InMemoryReportRepository();
      setReportRepository(mockRepo);
    });

    it("ingests news for ticker and stores events in repository", async () => {
      const result = await ingestNewsForTicker("NVDA", {
        repository: mockRepo,
        lookbackDays: 7,
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.events)).toBe(true);

      const repoEvents = await mockRepo.getMarketEvents("NVDA");
      expect(repoEvents.length).toBe(result.events.length);
    });

    it("handles GET /api/news with query parameters", async () => {
      // Seed mock event
      await mockRepo.saveMarketEvent({
        id: "evt-api-test",
        ticker: "NVDA",
        title: "API Test Event",
        summary: "Testing GET /api/news",
        publisher: "Bloomberg",
        publishedAt: new Date(),
        eventType: "product_release",
        transmissionType: "catalyst_prob",
      });

      await mockRepo.saveUpstreamDependency({
        sourceTicker: "TSM",
        targetTicker: "NVDA",
        driverId: "packaging",
        exposureShare: "0.50",
        elasticity: "0.80",
      });

      // 1. Missing ticker -> 400
      const badReq = new NextRequest("http://localhost:3000/api/news");
      const badRes = await getNewsHandler(badReq);
      expect(badRes.status).toBe(400);

      // 2. Valid request -> 200 with events and upstreamDependencies
      const validReq = new NextRequest(
        "http://localhost:3000/api/news?ticker=NVDA&limit=10"
      );
      const validRes = await getNewsHandler(validReq);
      expect(validRes.status).toBe(200);

      const data = await validRes.json();
      expect(data).toHaveProperty("events");
      expect(data).toHaveProperty("upstreamDependencies");
      expect(data.events.length).toBeGreaterThanOrEqual(1);
      expect(data.upstreamDependencies.length).toBeGreaterThanOrEqual(1);
      expect(data.events[0].ticker).toBe("NVDA");
    });

    it("handles GET /api/revisions to fetch valuation history", async () => {
      // Seed mock valuation revision
      await mockRepo.saveValuationRevision({
        id: "rev-api-test",
        ticker: "NVDA",
        revisionDate: new Date(),
        triggerType: "peer_earnings_shock",
        headline: "Peer Shock Revision",
        rationale: "TSMC guidance lifted.",
        priorWfv: "135.00",
        newWfv: "150.00",
        wfvDeltaPct: "11.11",
        fullStateDiff: {
          priorRegimes: { bull: 160, base: 135, panic: 90 },
          newRegimes: { bull: 180, base: 150, panic: 95 },
        },
      });

      // 1. Missing ticker -> 400
      const badReq = new NextRequest("http://localhost:3000/api/revisions");
      const badRes = await getRevisionsHandler(badReq);
      expect(badRes.status).toBe(400);

      // 2. Valid request -> 200 with revisions array
      const validReq = new NextRequest(
        "http://localhost:3000/api/revisions?ticker=NVDA&limit=10"
      );
      const validRes = await getRevisionsHandler(validReq);
      expect(validRes.status).toBe(200);

      const data = await validRes.json();
      expect(data).toHaveProperty("revisions");
      expect(data.revisions.length).toBeGreaterThanOrEqual(1);
      expect(data.revisions[0].id).toBe("rev-api-test");
      expect(Number(data.revisions[0].priorWfv)).toBe(135);
    });
  });

  describe("Polygon Global News Firehose Service", () => {
    it("returns empty array gracefully when API key is missing or on failure", async () => {
      const origMassive = process.env.MASSIVE_API_KEY;
      const origPolygon = process.env.POLYGON_API_KEY;
      delete process.env.MASSIVE_API_KEY;
      delete process.env.POLYGON_API_KEY;

      try {
        const result = await fetchPolygonGlobalNews({ apiKey: "" });
        expect(result).toEqual([]);
      } finally {
        if (origMassive) process.env.MASSIVE_API_KEY = origMassive;
        if (origPolygon) process.env.POLYGON_API_KEY = origPolygon;
      }
    });

    it("fetches and maps Polygon Reference News schema correctly", async () => {
      const origFetch = globalThis.fetch;
      const mockPolygonPayload = {
        results: [
          {
            id: "poly-sample-1",
            title: "TSMC Boosts CoWoS Packaging CapEx Allocation by 25%",
            publisher: {
              name: "Bloomberg",
              homepage_url: "https://bloomberg.com",
            },
            article_url: "https://bloomberg.com/news/tsmc-cowos",
            published_utc: "2026-10-18T14:30:00Z",
            description: "Advanced packaging lines running at 100% capacity.",
            tickers: ["TSM", "NVDA"],
          },
        ],
      };

      let requestedUrl = "";
      globalThis.fetch = (async (url: any) => {
        requestedUrl = String(url);
        return {
          ok: true,
          json: async () => mockPolygonPayload,
        } as Response;
      }) as typeof fetch;

      try {
        const articles = await fetchPolygonGlobalNews({
          apiKey: "test-polygon-key",
          lookbackDays: 3,
          limit: 10,
        });

        expect(requestedUrl).toContain(
          "https://api.polygon.io/v2/reference/news"
        );
        expect(requestedUrl).toContain("limit=10");
        expect(requestedUrl).toContain("apiKey=test-polygon-key");
        expect(requestedUrl).toContain("sort=published_utc");
        expect(requestedUrl).toContain("order=desc");
        expect(requestedUrl).toContain("published_utc.gte=");

        expect(articles.length).toBe(1);
        expect(articles[0].title).toBe(
          "TSMC Boosts CoWoS Packaging CapEx Allocation by 25%"
        );
        expect(articles[0].publisher).toBe("Bloomberg");
        expect(articles[0].url).toBe("https://bloomberg.com/news/tsmc-cowos");
        expect(articles[0].publishedAt).toBe("2026-10-18T14:30:00Z");
        expect(articles[0].tickers).toEqual(["TSM", "NVDA"]);
        expect(articles[0].summary).toBe(
          "Advanced packaging lines running at 100% capacity."
        );
      } finally {
        globalThis.fetch = origFetch;
      }
    });

    it("ingests global news firehose end-to-end with InMemoryReportRepository", async () => {
      const repo = new InMemoryReportRepository();

      const mockReportData: ReportData = {
        folderSlug: "NVDA-Q2-2027-analysis",
        folderName: "NVDA-Q2-2027-analysis",
        facts: {
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
          segments: [
            { name: "Data Center", revenueBillions: 26, growthPct: 150 },
          ],
        },
        scenarios: {
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
        },
        baseline: {
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
              id: "advanced-packaging",
              name: "CoWoS Packaging Growth",
              exposureShare: 0.7,
              elasticity: 0.85,
              defaultShockPct: 0,
              minShockPct: -50,
              maxShockPct: 50,
            },
          ],
        },
      };

      repo.addReport(mockReportData);
      repo.addReport({
        ...mockReportData,
        folderSlug: "KO-Q2-2027-analysis",
        folderName: "KO-Q2-2027-analysis",
        facts: {
          ...mockReportData.facts,
          ticker: "KO",
          company: "The Coca-Cola Company",
        },
        scenarios: { ...mockReportData.scenarios, ticker: "KO" },
      });

      const requestedSlugs: string[] = [];
      const origGetReport = repo.getReport.bind(repo);
      repo.getReport = async (slug: string) => {
        requestedSlugs.push(slug);
        return origGetReport(slug);
      };

      const mockFirehoseResults = {
        results: [
          // 1. Legal spam: Should be rejected by layer 1 filter
          {
            id: "poly-lawyer-1",
            title:
              "Robbins LLP Reminds Investors of Lead Plaintiff Deadline in Securities Class Action Lawsuit Against NVIDIA",
            publisher: { name: "GlobeNewswire" },
            article_url: "https://globenewswire.com/lawsuit-nvda",
            published_utc: "2026-10-18T10:00:00Z",
            description:
              "Investors who suffered losses are encouraged to contact counsel.",
            tickers: ["NVDA"],
          },
          // 2. Syndication clickbait: Should be rejected by layer 1 filter
          {
            id: "poly-clickbait-1",
            title: "3 Stocks to Buy Instead of NVIDIA Right Now",
            publisher: { name: "Motley Fool" },
            article_url: "https://fool.com/3-stocks",
            published_utc: "2026-10-18T11:00:00Z",
            description: "Here are 3 great tech stocks.",
            tickers: ["NVDA"],
          },
          // 3. Genuine upstream fundamental transmission: Should be vetted and ingested
          {
            id: "poly-fundamental-1",
            title: "TSMC Boosts CoWoS Packaging CapEx Allocation by 25%",
            publisher: { name: "Bloomberg" },
            article_url: "https://bloomberg.com/tsmc-packaging",
            published_utc: "2026-10-18T12:00:00Z",
            description:
              "TSMC expands advanced packaging capacity to meet AI demand.",
            tickers: ["TSM", "NVDA"],
          },
          // 4. Untracked company: Should be ignored (not in active universe)
          {
            id: "poly-untracked-1",
            title: "Chipotle Opens 50 New Digital-Only Drive-Thru Locations",
            publisher: { name: "Reuters" },
            article_url: "https://reuters.com/cmg-expansion",
            published_utc: "2026-10-18T13:00:00Z",
            description: "Fast-casual restaurant chain expands.",
            tickers: ["CMG"],
          },
        ],
      };

      const origFetch = globalThis.fetch;
      globalThis.fetch = (async () => {
        return {
          ok: true,
          json: async () => mockFirehoseResults,
        } as Response;
      }) as typeof fetch;

      try {
        const firehoseSummary = await ingestGlobalNewsFirehose({
          apiKey: "test-firehose-key",
          lookbackDays: 3,
          repository: repo,
        });

        expect(firehoseSummary.success).toBe(true);
        expect(firehoseSummary.totalFetched).toBe(4);
        expect(firehoseSummary.totalIngested).toBe(1);
        expect(firehoseSummary.eventsByTicker).toHaveProperty("NVDA");

        const nvdaEvents = firehoseSummary.eventsByTicker["NVDA"];
        expect(nvdaEvents.length).toBe(1);
        expect(nvdaEvents[0].title).toBe(
          "TSMC Boosts CoWoS Packaging CapEx Allocation by 25%"
        );
        expect(nvdaEvents[0].transmissionType).toBe("driver_shock");
        expect(nvdaEvents[0].impliedWfvImpactPct).toBeDefined();
        expect(Number(nvdaEvents[0].impliedWfvImpactPct)).toBeGreaterThan(0);
        // Lazy-loading invariant: full report is fetched ONLY for tickers with material news
        expect(requestedSlugs).toEqual(["NVDA-Q2-2027-analysis"]);
      } finally {
        globalThis.fetch = origFetch;
      }
    });
  });
});
