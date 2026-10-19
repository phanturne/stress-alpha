import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchFinnhubEarningsCalendar,
  syncEarningsCalendar,
  type EarningsCalendarEntry,
} from "@/lib/services/earnings-calendar";
import * as financialDataModule from "@/lib/services/financial-data";
import { InMemoryReportRepository } from "@/lib/repository";
import type { ReportData } from "@/lib/schemas";

describe("Automated Earnings Ingestion & Scaffolding Engine", () => {
  const originalFetch = global.fetch;
  const originalFinnhubKey = process.env.FINNHUB_API_KEY;

  beforeEach(() => {
    process.env.FINNHUB_API_KEY = "test-finnhub-token";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalFinnhubKey) {
      process.env.FINNHUB_API_KEY = originalFinnhubKey;
    } else {
      delete process.env.FINNHUB_API_KEY;
    }
    vi.restoreAllMocks();
  });

  describe("Finnhub Earnings Calendar Parsing", () => {
    it("fetches and parses valid earnings calendar entries with typed attributes", async () => {
      const mockApiResponse = {
        earningsCalendar: [
          {
            date: "2026-10-19",
            epsActual: 1.25,
            epsEstimate: 1.18,
            hour: "amc",
            quarter: 3,
            revenueActual: 35100000000,
            revenueEstimate: 34200000000,
            symbol: "NVDA",
            year: 2026,
          },
          {
            date: "2026-10-19",
            epsActual: null,
            epsEstimate: 0.95,
            hour: "bmo",
            quarter: 4,
            revenueActual: null,
            revenueEstimate: 12500000000,
            symbol: " msft ",
            year: 2026,
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResponse,
      } as Response);

      const entries = await fetchFinnhubEarningsCalendar({
        date: "2026-10-19",
        apiKey: "custom-token",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "https://finnhub.io/api/v1/calendar/earnings?from=2026-10-19&to=2026-10-19&token=custom-token"
        ),
        expect.anything()
      );

      expect(entries).toHaveLength(2);

      const nvda = entries[0];
      expect(nvda.symbol).toBe("NVDA");
      expect(nvda.date).toBe("2026-10-19");
      expect(nvda.hour).toBe("amc");
      expect(nvda.year).toBe(2026);
      expect(nvda.quarter).toBe(3);
      expect(nvda.epsActual).toBe(1.25);
      expect(nvda.epsEstimate).toBe(1.18);
      expect(nvda.revenueActual).toBe(35100000000);
      expect(nvda.revenueEstimate).toBe(34200000000);

      const msft = entries[1];
      expect(msft.symbol).toBe("MSFT"); // trimmed & uppercase
      expect(msft.hour).toBe("bmo");
      expect(msft.quarter).toBe(4);
      expect(msft.epsActual).toBeNull();
      expect(msft.revenueActual).toBeNull();
      expect(msft.epsEstimate).toBe(0.95);
    });

    it("handles missing API key gracefully by returning an empty array without throwing", async () => {
      delete process.env.FINNHUB_API_KEY;
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const entries = await fetchFinnhubEarningsCalendar();
      expect(entries).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("No FINNHUB_API_KEY")
      );
    });

    it("handles HTTP error status codes gracefully", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
      } as Response);

      const entries = await fetchFinnhubEarningsCalendar({
        date: "2026-10-19",
      });
      expect(entries).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Finnhub returned HTTP 403")
      );
    });

    it("handles network failure or JSON parse errors gracefully", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      global.fetch = vi.fn().mockRejectedValue(new Error("Connection reset"));

      const entries = await fetchFinnhubEarningsCalendar({
        date: "2026-10-19",
      });
      expect(entries).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error fetching earnings calendar"),
        expect.anything()
      );
    });
  });

  describe("Universe Gating and Session Filtering", () => {
    const sampleEntries: EarningsCalendarEntry[] = [
      {
        symbol: "AAPL",
        date: "2026-10-19",
        hour: "bmo",
        year: 2026,
        quarter: 4,
      },
      {
        symbol: "NVDA",
        date: "2026-10-19",
        hour: "amc",
        year: 2026,
        quarter: 3,
      },
      {
        symbol: "TSLA",
        date: "2026-10-19",
        hour: "bmo",
        year: 2026,
        quarter: 3,
      },
      {
        symbol: "PENNY",
        date: "2026-10-19",
        hour: "bmo",
        year: 2026,
        quarter: 1,
      },
    ];

    it("filters candidates by session (bmo vs amc) and universe coverage", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ earningsCalendar: sampleEntries }),
      } as Response);

      const repo = new InMemoryReportRepository();
      const universe = ["AAPL", "NVDA", "TSLA"]; // PENNY is excluded

      // BMO session run
      const bmoResult = await syncEarningsCalendar({
        date: "2026-10-19",
        session: "bmo",
        universe,
        dryRun: true,
        repository: repo,
      });

      expect(bmoResult.totalOnCalendar).toBe(4);
      expect(bmoResult.matchedUniverse).toBe(2); // AAPL and TSLA (PENNY is not in universe, NVDA is AMC)
      expect(bmoResult.results.map((r) => r.symbol).sort()).toEqual([
        "AAPL",
        "TSLA",
      ]);

      // AMC session run
      const amcResult = await syncEarningsCalendar({
        date: "2026-10-19",
        session: "amc",
        universe,
        dryRun: true,
        repository: repo,
      });

      expect(amcResult.totalOnCalendar).toBe(4);
      expect(amcResult.matchedUniverse).toBe(1); // NVDA only
      expect(amcResult.results[0].symbol).toBe("NVDA");

      // ALL sessions (no session filter)
      const allResult = await syncEarningsCalendar({
        date: "2026-10-19",
        universe,
        dryRun: true,
        repository: repo,
      });

      expect(allResult.matchedUniverse).toBe(3); // AAPL, NVDA, TSLA
      expect(allResult.results.map((r) => r.symbol).sort()).toEqual([
        "AAPL",
        "NVDA",
        "TSLA",
      ]);
    });
  });

  describe("Deduplication and Force Overwrite", () => {
    it("skips scaffolding when report already exists and has populated revenue", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          earningsCalendar: [
            {
              symbol: "NVDA",
              date: "2026-10-19",
              hour: "amc",
              year: 2026,
              quarter: 3,
            },
          ],
        }),
      } as Response);

      const existingReport = {
        folderSlug: "nvda-2026q3",
        folderName: "nvda-2026q3",
        facts: {
          ticker: "NVDA",
          company: "NVIDIA Corporation",
          currentPrice: 135.5,
          quarter: "Q3 2026",
          reportDate: "2026-10-19",
          operatingMarginPct: 62.5,
          revenueGrowthPct: 94.2,
          revenueBillions: 35.1,
          operatingIncomeBillions: 21.8,
          netIncomeBillions: 19.3,
          operatingEps: 0.78,
          gaapEps: 0.75,
          dilutedSharesBillions: 24.6,
          marketCapBillions: 3330,
          sharesOutstandingBillions: 24.6,
          cashAndEquivalentsBillions: 12.0,
          shortTermInvestmentsBillions: 22.8,
          totalDebtBillions: 9.5,
          freeCashFlowBillions: 16.5,
          asOfDate: "2026-10-19",
          epsReported: 0.75,
          epsConsensus: 0.72,
          epsOperating: 0.78,
          segments: [],
          oneTimeItems: [],
          trailingEps: 2.5,
          forwardEpsConsensus: 3.5,
          sources: [],
        },
        scenarios: {
          ticker: "NVDA",
          basisYear: "FY2027",
          currentPrice: 135.5,
          consensusTarget: 150.0,
          scenarios: [
            {
              name: "Base Regime",
              probability: 0.5,
              forwardEps: 4.2,
              multiple: 35,
              assumptions: ["Steady growth"],
              keyDrivers: ["Datacenter demand"],
            },
          ],
        },
      } as unknown as ReportData;

      const repo = new InMemoryReportRepository([{ report: existingReport }]);
      const bundleSpy = vi.spyOn(
        financialDataModule,
        "fetchCompletePipelineBundle"
      );

      // 1. Without force -> should skip
      const skipResult = await syncEarningsCalendar({
        date: "2026-10-19",
        universe: ["NVDA"],
        force: false,
        repository: repo,
      });

      expect(skipResult.matchedUniverse).toBe(1);
      expect(skipResult.skipped).toBe(1);
      expect(skipResult.scaffolded).toBe(0);
      expect(skipResult.results[0].status).toBe("skipped");
      expect(bundleSpy).not.toHaveBeenCalled();

      // 2. With force=true -> should proceed with scaffolding
      vi.spyOn(
        financialDataModule,
        "fetchCompletePipelineBundle"
      ).mockResolvedValue({
        ticker: "NVDA",
        asOfDate: "2026-10-19",
        profile: {} as any,
        analystEstimatesEn: {} as any,
        analystEstimatesZh: {} as any,
        reactions: {} as any,
        filings: [],
        factsDraft: existingReport.facts,
        factsZh: existingReport.facts,
        baseline: {
          baseRevenueBillions: 35.1,
          baseGrossMarginPct: 75,
          fixedOpexBillions: 3.5,
          taxRatePct: 16.5,
          dilutedSharesBillions: 24.6,
          multipleRegimes: { bull: 45, base: 35, panic: 22 },
          upstreamDrivers: [],
        } as any,
        scenariosEn: existingReport.scenarios,
        scenariosZh: existingReport.scenarios,
        moatEn: {
          overallMoatRating: "Wide",
          moatTrend: "Stable",
          summary: "Wide moat",
          sourcesOfMoat: [],
          competitors: [],
        } as any,
        moatZh: {
          overallMoatRating: "Wide",
          moatTrend: "Stable",
          summary: "宽护城河",
          sourcesOfMoat: [],
          competitors: [],
        } as any,
        catalystsEn: { pipeline: [] } as any,
        catalystsZh: { pipeline: [] } as any,
        sentiment: { overallTone: "Optimistic" } as any,
        filingEn: { riskFactors: [] } as any,
        filingZh: { riskFactors: [] } as any,
      } as any);

      const forceResult = await syncEarningsCalendar({
        date: "2026-10-19",
        universe: ["NVDA"],
        force: true,
        repository: repo,
      });

      expect(forceResult.scaffolded).toBe(1);
      expect(forceResult.skipped).toBe(0);
      expect(forceResult.results[0].status).toBe("scaffolded");
    });
  });

  describe("Dry Run Simulation Mode", () => {
    it("reports simulated scaffolding without mutating repository", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          earningsCalendar: [
            {
              symbol: "NVDA",
              date: "2026-10-19",
              hour: "amc",
              year: 2026,
              quarter: 3,
            },
          ],
        }),
      } as Response);

      const repo = new InMemoryReportRepository();
      const bundleSpy = vi.spyOn(
        financialDataModule,
        "fetchCompletePipelineBundle"
      );

      const result = await syncEarningsCalendar({
        date: "2026-10-19",
        universe: ["NVDA"],
        dryRun: true,
        repository: repo,
      });

      expect(result.scaffolded).toBe(1);
      expect(result.results[0].status).toBe("scaffolded");
      expect(bundleSpy).not.toHaveBeenCalled();

      // Repository must remain empty
      const saved = await repo.getReport("nvda-2026q3");
      expect(saved).toBeNull();
    });
  });

  describe("End-to-End Autonomous Valuation & Revision Ingestion", () => {
    it("scaffolds report, computes deterministic valuation, runs sanity audit, and persists revision", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          earningsCalendar: [
            {
              symbol: "NVDA",
              date: "2026-10-19",
              hour: "amc",
              year: 2026,
              quarter: 3,
            },
          ],
        }),
      } as Response);

      const repo = new InMemoryReportRepository();

      const mockFacts = {
        ticker: "NVDA",
        company: "NVIDIA Corporation",
        currentPrice: 135.5,
        quarter: "Q3 2026",
        reportDate: "2026-10-19",
        operatingMarginPct: 62.5,
        revenueGrowthPct: 94.2,
        revenueBillions: 35.1,
        operatingIncomeBillions: 21.8,
        netIncomeBillions: 19.3,
        operatingEps: 0.78,
        gaapEps: 0.75,
        dilutedSharesBillions: 24.6,
        marketCapBillions: 3330,
        sharesOutstandingBillions: 24.6,
        cashAndEquivalentsBillions: 12.0,
        shortTermInvestmentsBillions: 22.8,
        totalDebtBillions: 9.5,
        freeCashFlowBillions: 16.5,
        asOfDate: "2026-10-19",
      };

      const mockScenarios = {
        ticker: "NVDA",
        quarter: "Q3 2026",
        analysisDate: "2026-10-19",
        currentPrice: 135.5,
        consensusTarget: 150.0,
        scenarios: [
          {
            name: "Bull Regime",
            probability: 0.25,
            forwardEps: 5.5,
            multiple: 42,
            assumptions: ["Accelerating GPU sales"],
            keyDrivers: ["Blackwell ramp"],
          },
          {
            name: "Base Regime",
            probability: 0.55,
            forwardEps: 4.8,
            multiple: 35,
            assumptions: ["Steady enterprise adoption"],
            keyDrivers: ["Datacenter stability"],
          },
          {
            name: "Panic Floor",
            probability: 0.2,
            forwardEps: 3.2,
            multiple: 22,
            assumptions: ["Hyperscaler capex pause"],
            keyDrivers: ["Macro slowdown"],
          },
        ],
      };

      const mockBaseline = {
        baseRevenueBillions: 35.1,
        baseGrossMarginPct: 75.0,
        fixedOpexBillions: 3.5,
        taxRatePct: 16.5,
        dilutedSharesBillions: 24.6,
        multipleRegimes: { bull: 42, base: 35, panic: 22 },
        upstreamDrivers: [
          {
            id: "tsmc_wafer",
            name: "TSMC CoWoS Allocation",
            exposureShare: 0.6,
            elasticity: 1.0,
            defaultShockPct: 0,
          },
        ],
      };

      vi.spyOn(
        financialDataModule,
        "fetchCompletePipelineBundle"
      ).mockResolvedValue({
        ticker: "NVDA",
        asOfDate: "2026-10-19",
        profile: {} as any,
        analystEstimatesEn: {
          consensus: {
            consensus: "Strong Buy",
            totalAnalysts: 35,
            bullishPct: 88,
          },
          priceTargets: { low: 120, average: 150, high: 200 },
          estimates: [],
        } as any,
        analystEstimatesZh: {} as any,
        reactions: {} as any,
        filings: [],
        factsDraft: mockFacts as any,
        factsZh: mockFacts as any,
        baseline: mockBaseline as any,
        scenariosEn: mockScenarios as any,
        scenariosZh: mockScenarios as any,
        moatEn: {
          overallMoatRating: "Wide",
          moatTrend: "Stable",
          summary: "Wide CUDA ecosystem moat",
          sourcesOfMoat: ["Network Effects", "Switching Costs"],
          competitors: [],
        } as any,
        moatZh: {
          overallMoatRating: "Wide",
          moatTrend: "Stable",
          summary: "宽护城河",
          sourcesOfMoat: [],
          competitors: [],
        } as any,
        catalystsEn: { pipeline: [] } as any,
        catalystsZh: { pipeline: [] } as any,
        sentiment: { overallTone: "Optimistic" } as any,
        filingEn: { riskFactors: [] } as any,
        filingZh: { riskFactors: [] } as any,
      } as any);

      const result = await syncEarningsCalendar({
        date: "2026-10-19",
        universe: ["NVDA"],
        repository: repo,
      });

      expect(result.scaffolded).toBe(1);
      expect(result.results[0].status).toBe("scaffolded");
      expect(result.results[0].folderSlug).toBe("nvda-2026q3");

      // Verify report was persisted in repository
      const savedReport = await repo.getReport("nvda-2026q3");
      expect(savedReport).toBeDefined();
      expect(savedReport?.folderSlug).toBe("nvda-2026q3");
      expect(savedReport?.facts.revenueBillions).toBe(35.1);

      // Verify deterministic valuation was computed and attached
      expect(savedReport?.valuation).toBeDefined();
      expect(savedReport?.valuation?.weightedFairValue).toBeGreaterThan(0);
      expect(typeof savedReport?.valuation?.upsidePct).toBe("number");

      // Verify sanity audit was computed and attached
      expect(savedReport?.valuation?.sanityAudit).toBeDefined();
      expect(
        savedReport?.valuation?.sanityAudit?.dataCompletenessScore
      ).toBeGreaterThan(0);

      // Verify valuation revision ledger snapshot was saved
      const revisions = await repo.getValuationRevisions("NVDA");
      expect(revisions.length).toBe(1);
      expect(revisions[0].ticker).toBe("NVDA");
      expect(revisions[0].triggerType).toBe("quarterly_filing");
      expect(Number(revisions[0].newWfv)).toBe(
        savedReport?.valuation?.weightedFairValue
      );
    });
  });
});
