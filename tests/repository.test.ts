import { describe, it, expect, beforeEach } from "vitest";
import {
  DrizzleReportRepository,
  InMemoryReportRepository,
  getReportRepository,
  setReportRepository,
  type IReportRepository,
} from "@/lib/repository";
import { FactsSchema, ScenariosSchema, type ReportData } from "@/lib/schemas";
import { getDb } from "@/db";
import { reportsTable, tickersTable, type ReportInsert } from "@/db/schema";

describe("Data Access Layer: Repository Pattern", () => {
  const mockReport: ReportData = {
    folderSlug: "TEST-Q1-2026-analysis",
    folderName: "TEST-Q1-2026-analysis",
    facts: FactsSchema.parse({
      ticker: "TEST",
      company: "Test Corp",
      quarter: "Q1 2026",
      reportDate: "2026-01-15",
      revenueBillions: 10,
      revenueGrowthPct: 15,
      operatingIncomeBillions: 3,
      operatingMarginPct: 30,
      epsReported: 1.5,
      epsOperating: 1.5,
      currentPrice: 100,
      segments: [
        {
          name: "Cloud",
          revenueBillions: 10,
          growthPct: 15,
        },
      ],
    }),
    scenarios: ScenariosSchema.parse({
      ticker: "TEST",
      basisYear: "FY2026",
      currentPrice: 100,
      scenarios: [
        {
          name: "Base",
          probability: 1.0,
          forwardEps: 2.0,
          multiple: 60,
        },
      ],
    }),
    valuation: {
      ticker: "TEST",
      analysisDate: "2026-01-15",
      currentPrice: 100,
      consensusTarget: 115,
      weightedFairValue: 120,
      upsidePct: 20,
      verdictVsConsensus: "Above consensus by 4.3%",
      sensitivity: [],
      scenarioResults: [
        {
          name: "Base",
          probability: 1.0,
          fairValue: 120,
          upsideFromCurrent: 20,
        },
      ],
    },
  };

  describe("DrizzleReportRepository (Neon Database)", () => {
    const drizzleRepo = new DrizzleReportRepository();

    it("lists all reports with enriched metadata from Neon DB", async () => {
      const reports = await drizzleRepo.listReports();
      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBeGreaterThanOrEqual(8);

      const nvda = reports.find((r) => r.ticker === "NVDA");
      expect(nvda).toBeDefined();
      expect(typeof nvda?.currentPrice).toBe("number");
      expect(nvda?.currentPrice).toBeGreaterThan(0);
      expect(typeof nvda?.weightedFairValue).toBe("number");
      expect(nvda?.weightedFairValue).toBeGreaterThan(0);
      expect(typeof nvda?.upsidePct).toBe("number");
      expect(nvda?.moatRating).toMatch(/^(Wide|Narrow|None)$/);
      expect(typeof nvda?.operatingMarginPct).toBe("number");
      if (nvda?.analystTarget) {
        expect(nvda.analystTarget).toBeGreaterThan(0);
      }
    });

    it("checks report existence correctly with hasReport()", async () => {
      expect(await drizzleRepo.hasReport("NVDA-Q2-2027-analysis")).toBe(true);
      expect(await drizzleRepo.hasReport("AMZN-Q2-2026-analysis")).toBe(true);
      expect(await drizzleRepo.hasReport("DOES-NOT-EXIST-analysis")).toBe(
        false
      );
    });

    it("loads complete report artifacts for a valid slug", async () => {
      const report = await drizzleRepo.getReport("NVDA-Q2-2027-analysis");
      expect(report).not.toBeNull();
      expect(report?.folderSlug).toBe("NVDA-Q2-2027-analysis");
      expect(report?.facts.ticker).toBe("NVDA");
      expect(report?.facts.revenueGrowthPct).toBeGreaterThan(0);
      expect(report?.scenarios.scenarios.length).toBeGreaterThan(0);
      expect(report?.valuation?.weightedFairValue).toBeGreaterThan(0);
      expect(report?.moat?.overallMoatRating).toMatch(/^(Wide|Narrow|None)$/);
      expect(report?.reportMarkdown).toBeTruthy();
    });

    it("returns null for non-existent slug", async () => {
      const report = await drizzleRepo.getReport("NONEXISTENT-SLUG");
      expect(report).toBeNull();
    });

    it("safely performs isolated write/mutation operations on ephemeral test branch", async () => {
      const db = getDb();
      const testTicker =
        "TEST_EPHEMERAL_" +
        Math.random().toString(36).substring(2, 6).toUpperCase();
      const testSlug = `${testTicker}-Q1-2026-analysis`;

      // Insert into tickers table on the branch
      await db.insert(tickersTable).values({
        ticker: testTicker,
        company: "Ephemeral Test Corp",
        currency: "USD",
        currentPrice: "100.00",
      });

      // Insert into reports table on the branch
      const insertData: ReportInsert = {
        slug: testSlug,
        ticker: testTicker,
        quarter: mockReport.facts.quarter,
        year: 2026,
        reportDate: mockReport.facts.reportDate,
        status: "published",
        reportPrice: "100.00",
        weightedFairValue: "120.00",
        baseFairValue: "120.00",
        bullFairValue: "140.00",
        bearFairValue: "80.00",
        moatRating: "Wide",
        facts: {
          ...mockReport.facts,
          ticker: testTicker,
        },
        scenarios: {
          ...mockReport.scenarios,
          ticker: testTicker,
        },
        valuation: {
          ...mockReport.valuation!,
          ticker: testTicker,
        },
      };
      await db.insert(reportsTable).values(insertData);

      expect(await drizzleRepo.hasReport(testSlug)).toBe(true);
      const fetched = await drizzleRepo.getReport(testSlug);
      expect(fetched).not.toBeNull();
      expect(fetched?.facts.ticker).toBe(testTicker);
      expect(fetched?.valuation?.weightedFairValue).toBe(120);
    });

    it("manages market events, upstream dependencies, and valuation revisions on ephemeral test branch", async () => {
      const testTicker = "NVDA";

      // 1. Market Event
      const eventId = `evt-test-${Date.now()}`;
      await drizzleRepo.saveMarketEvent({
        id: eventId,
        ticker: testTicker,
        title: "Test AI Packaging Expansion",
        summary: "TSMC expands CoWoS packaging allocation.",
        publisher: "Bloomberg",
        publishedAt: new Date(),
        eventType: "upstream_earnings",
        transmissionType: "driver_shock",
        transmissionPayload: {
          driverId: "hyperscaler-capex",
          deltaShockPct: 20,
        },
        impliedWfvImpactPct: "4.50",
      });

      const events = await drizzleRepo.getMarketEvents(testTicker, 10);
      expect(events.length).toBeGreaterThanOrEqual(1);
      const foundEvent = events.find((e) => e.id === eventId);
      expect(foundEvent).toBeDefined();
      expect(foundEvent?.ticker).toBe(testTicker);
      expect(foundEvent?.eventType).toBe("upstream_earnings");

      // 2. Upstream Dependency
      const depId = `updep-TSM-NVDA-hyperscaler-capex`;
      await drizzleRepo.saveUpstreamDependency({
        id: depId,
        sourceTicker: "TSM",
        targetTicker: testTicker,
        driverId: "hyperscaler-capex",
        driverName: "Hyperscaler Cloud CapEx Growth",
        exposureShare: "0.70",
        elasticity: "0.85",
        notes: "Test dependency allocation",
      });

      const deps = await drizzleRepo.getUpstreamDependencies(testTicker);
      expect(deps.length).toBeGreaterThanOrEqual(1);
      const foundDep = deps.find((d) => d.id === depId);
      expect(foundDep).toBeDefined();
      expect(foundDep?.sourceTicker).toBe("TSM");
      expect(foundDep?.targetTicker).toBe(testTicker);

      // 3. Valuation Revision
      const revId = `rev-test-${Date.now()}`;
      await drizzleRepo.saveValuationRevision({
        id: revId,
        ticker: testTicker,
        revisionDate: new Date(),
        triggerType: "peer_earnings_shock",
        headline: "TSMC CapEx Surge Drives Multiple Expansion",
        rationale: "Hyperscaler CapEx guidance lifted by 20%.",
        priorWfv: "140.00",
        newWfv: "155.00",
        wfvDeltaPct: "10.71",
        fullStateDiff: {
          priorRegimes: { bull: 175, base: 140, panic: 90 },
          newRegimes: { bull: 195, base: 155, panic: 95 },
        },
      });

      const revisions = await drizzleRepo.getValuationRevisions(testTicker, 10);
      expect(revisions.length).toBeGreaterThanOrEqual(1);
      const foundRev = revisions.find((r) => r.id === revId);
      expect(foundRev).toBeDefined();
      expect(foundRev?.triggerType).toBe("peer_earnings_shock");
    });

    it("manages relational financial metrics time-series on ephemeral test branch", async () => {
      const testTicker = "NVDA";
      const sampleMetrics = [
        {
          ticker: testTicker,
          fiscalYear: 2027,
          fiscalQuarter: "Q2",
          periodEndDate: "2026-08-26",
          revenue: "30040000000.00",
          grossProfit: "22530000000.00",
          operatingIncome: "18642000000.00",
          netIncome: "16599000000.00",
          dilutedEps: "0.6800",
          grossMarginPct: "75.00",
          operatingMarginPct: "62.06",
        },
        {
          ticker: testTicker,
          fiscalYear: 2027,
          fiscalQuarter: "Q1",
          periodEndDate: "2026-05-22",
          revenue: "26044000000.00",
          grossProfit: "20406000000.00",
          operatingIncome: "16909000000.00",
          netIncome: "14881000000.00",
          dilutedEps: "0.6100",
          grossMarginPct: "78.35",
          operatingMarginPct: "64.92",
        },
      ];

      await drizzleRepo.saveFinancialMetrics(sampleMetrics);

      const metrics = await drizzleRepo.getFinancialMetrics(testTicker);
      expect(metrics.length).toBeGreaterThanOrEqual(2);

      const q2 = metrics.find(
        (m) => m.fiscalYear === 2027 && m.fiscalQuarter === "Q2"
      );
      expect(q2).toBeDefined();
      expect(q2?.ticker).toBe(testTicker);
      expect(Number(q2?.revenue)).toBe(30040000000);
      expect(Number(q2?.dilutedEps)).toBe(0.68);
      expect(Number(q2?.operatingMarginPct)).toBe(62.06);

      // Verify non-destructive upsert behavior
      await drizzleRepo.saveFinancialMetrics([
        {
          ...sampleMetrics[0],
          revenue: "30500000000.00",
        },
      ]);

      const updatedMetrics = await drizzleRepo.getFinancialMetrics(testTicker);
      const updatedQ2 = updatedMetrics.find(
        (m) => m.fiscalYear === 2027 && m.fiscalQuarter === "Q2"
      );
      expect(Number(updatedQ2?.revenue)).toBe(30500000000);
    });
  });

  describe("InMemoryReportRepository", () => {
    let memRepo: InMemoryReportRepository;

    beforeEach(() => {
      memRepo = new InMemoryReportRepository();
    });

    it("starts empty and allows adding mock reports", async () => {
      expect(await memRepo.listReports()).toEqual([]);
      expect(await memRepo.hasReport("TEST-Q1-2026-analysis")).toBe(false);

      memRepo.addReport(mockReport);

      expect(await memRepo.hasReport("TEST-Q1-2026-analysis")).toBe(true);
      const list = await memRepo.listReports();
      expect(list.length).toBe(1);
      expect(list[0].ticker).toBe("TEST");
      expect(list[0].weightedFairValue).toBe(120);
      expect(list[0].upsidePct).toBe(20);
    });

    it("gets report by slug or returns null if missing", async () => {
      memRepo.addReport(mockReport);
      const found = await memRepo.getReport("TEST-Q1-2026-analysis");
      expect(found).not.toBeNull();
      expect(found?.facts.ticker).toBe("TEST");

      const notFound = await memRepo.getReport("OTHER-SLUG");
      expect(notFound).toBeNull();
    });

    it("supports removing reports", async () => {
      memRepo.addReport(mockReport);
      expect(await memRepo.hasReport("TEST-Q1-2026-analysis")).toBe(true);

      const removed = memRepo.removeReport("TEST-Q1-2026-analysis");
      expect(removed).toBe(true);
      expect(await memRepo.hasReport("TEST-Q1-2026-analysis")).toBe(false);
      expect(await memRepo.listReports()).toEqual([]);
    });

    it("supports market events, upstream dependencies, and valuation revisions in memory", async () => {
      const testTicker = "MSFT";

      // Market Events
      await memRepo.saveMarketEvent({
        id: "evt-msft-1",
        ticker: testTicker,
        title: "Azure Cloud Growth Accelerates",
        summary: "Q3 revenue up 29%.",
        publisher: "Reuters",
        publishedAt: new Date("2026-09-20"),
        eventType: "product_release",
        transmissionType: "catalyst_prob",
        transmissionPayload: { catalystId: "azure-ai", newProbability: 0.85 },
      });

      const events = await memRepo.getMarketEvents(testTicker);
      expect(events.length).toBe(1);
      expect(events[0].id).toBe("evt-msft-1");
      expect(events[0].ticker).toBe(testTicker);

      // Upstream Dependencies
      await memRepo.saveUpstreamDependency({
        sourceTicker: "NVDA",
        targetTicker: testTicker,
        driverId: "gpu-supply",
        exposureShare: "0.45",
        elasticity: "0.90",
      });

      const deps = await memRepo.getUpstreamDependencies(testTicker);
      expect(deps.length).toBe(1);
      expect(deps[0].sourceTicker).toBe("NVDA");

      // Valuation Revisions
      await memRepo.saveValuationRevision({
        id: "rev-msft-1",
        ticker: testTicker,
        revisionDate: new Date("2026-09-21"),
        triggerType: "catalyst_activation",
        headline: "Copilot Adoption Reaches Critical Mass",
        rationale: "Enterprise seats surpassed 50M.",
        priorWfv: "450.00",
        newWfv: "490.00",
        wfvDeltaPct: "8.89",
        fullStateDiff: {
          priorRegimes: { bull: 520, base: 450, panic: 340 },
          newRegimes: { bull: 560, base: 490, panic: 360 },
        },
      });

      const revs = await memRepo.getValuationRevisions(testTicker);
      expect(revs.length).toBe(1);
      expect(revs[0].id).toBe("rev-msft-1");
      expect(revs[0].priorWfv).toBe("450.00");
    });

    it("manages relational financial metrics time-series in memory", async () => {
      const testTicker = "AAPL";
      await memRepo.saveFinancialMetrics([
        {
          ticker: testTicker,
          fiscalYear: 2026,
          fiscalQuarter: "Q3",
          periodEndDate: "2026-08-01",
          revenue: "109420000000.00",
          grossProfit: "50880300000.00",
          operatingIncome: "35700000000.00",
          netIncome: "29988000000.00",
          dilutedEps: "2.0200",
          grossMarginPct: "46.50",
          operatingMarginPct: "32.60",
        },
      ]);

      const metrics = await memRepo.getFinancialMetrics(testTicker);
      expect(metrics.length).toBe(1);
      expect(metrics[0].ticker).toBe(testTicker);
      expect(metrics[0].revenue).toBe("109420000000.00");
      expect(metrics[0].dilutedEps).toBe("2.0200");
      expect(metrics[0].grossMarginPct).toBe("46.50");
    });
  });

  describe("Repository Singleton & Swapping", () => {
    beforeEach(() => {
      setReportRepository(null);
    });

    it("provides DrizzleReportRepository as default repository", () => {
      const repo = getReportRepository();
      expect(repo).toBeInstanceOf(DrizzleReportRepository);
    });

    it("allows swapping with an in-memory repository", () => {
      const customRepo: IReportRepository = new InMemoryReportRepository();
      setReportRepository(customRepo);
      expect(getReportRepository()).toBe(customRepo);
    });
  });
});
