import { describe, it, expect, beforeEach } from "vitest";
import {
  DrizzleReportRepository,
  InMemoryReportRepository,
  getReportRepository,
  setReportRepository,
  type IReportRepository,
} from "@/lib/repository";
import { FactsSchema, ScenariosSchema, type ReportData } from "@/lib/schemas";

describe("Data Access Layer: Repository Pattern", () => {
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
      expect(nvda?.weightedFairValue).toBe(364.36);
      expect(typeof nvda?.upsidePct).toBe("number");
      expect(nvda?.moatRating).toBe("Wide");
      expect(nvda?.operatingMarginPct).toBe(65);
      expect(nvda?.analystTarget).toBe(328.66);
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
      expect(report?.facts.revenueGrowthPct).toBe(106);
      expect(report?.scenarios.scenarios.length).toBeGreaterThan(0);
      expect(report?.valuation?.weightedFairValue).toBe(364.36);
      expect(report?.moat?.overallMoatRating).toBe("Wide");
      expect(report?.reportMarkdown).toBeTruthy();
    });

    it("returns null for non-existent slug", async () => {
      const report = await drizzleRepo.getReport("NONEXISTENT-SLUG");
      expect(report).toBeNull();
    });
  });

  describe("InMemoryReportRepository", () => {
    let memRepo: InMemoryReportRepository;

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
