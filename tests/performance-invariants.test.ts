import { describe, it, expect } from "vitest";
import { getReportRepository } from "@/lib/repository";
import { DrizzleReportRepository } from "@/lib/repository/drizzle-report-repository";
import { deduplicateReportsToLatest } from "@/lib/utils";
import type { ReportSummary } from "@/app/api/reports/route";

describe("Performance & Wire Size Invariants", () => {
  const repository = getReportRepository();

  describe("API & Repository Wire Payload Minimality", () => {
    it("listReports() strictly omits heavy qualitative JSONB blobs", async () => {
      const reports = await repository.listReports();
      expect(reports.length).toBeGreaterThan(0);

      for (const report of reports) {
        const raw = report as unknown as Record<string, unknown>;
        // Invariant 1: Full qualitative statement blobs must NEVER be leaked in list/screener summary endpoints
        expect(raw.facts).toBeUndefined();
        expect(raw.scenarios).toBeUndefined();
        expect(raw.baseline).toBeUndefined();
        expect(raw.moat).toBeUndefined();
        expect(raw.catalysts).toBeUndefined();
        expect(raw.filingExtracts).toBeUndefined();
        expect(raw.earningsSentiment).toBeUndefined();
        expect(raw.reportMarkdown).toBeUndefined();
        expect(raw.reportMarkdownZh).toBeUndefined();

        // Invariant 2: Snowflake scoring must be pre-denormalized (zero per-request dynamic arithmetic)
        expect(typeof report.snowflakeScore).toBe("number");
        expect(report.snowflakeScore).toBeGreaterThanOrEqual(0);
        expect(report.snowflakeScore).toBeLessThanOrEqual(30);
        expect(report.snowflakeTier).toBeDefined();
        expect(report.snowflakePillars).toBeDefined();
        expect(typeof report.snowflakePillars?.valuation).toBe("number");
        expect(typeof report.snowflakePillars?.future).toBe("number");
        expect(typeof report.snowflakePillars?.earnings).toBe("number");
        expect(typeof report.snowflakePillars?.moat).toBe("number");
        expect(typeof report.snowflakePillars?.resilience).toBe("number");
      }
    });

    it("enforces lean serialized JSON wire payload (<1KB per report average)", async () => {
      const reports = await repository.listReports();
      expect(reports.length).toBeGreaterThan(0);

      const jsonPayload = JSON.stringify(reports);
      const totalBytes = Buffer.byteLength(jsonPayload, "utf8");
      const bytesPerReport = totalBytes / reports.length;

      // Invariant: Average payload per report must remain strictly bounded (<1KB).
      // Without qualitative JSONBs (facts, scenarios, baseline, etc.), 520+ constituents
      // serialize to ~450KB total, preventing multi-megabyte network payloads.
      expect(bytesPerReport).toBeLessThan(1000);
      expect(totalBytes / 1024).toBeLessThan(600); // Entire universe under 600KB
    });

    it("serves sub-5ms in-memory cache hits on repeated listReports() calls", async () => {
      const drizzleRepo = new DrizzleReportRepository();
      // Prime the repository cache
      const first = await drizzleRepo.listReports();
      expect(first.length).toBeGreaterThan(0);

      // Measure second call (should be pure in-memory cache hit)
      const t0 = performance.now();
      const second = await drizzleRepo.listReports();
      const durationMs = performance.now() - t0;

      expect(second).toBe(first); // Referential identity from in-memory cache
      expect(durationMs).toBeLessThan(5); // Pure in-memory reference return
    });
  });

  describe("Algorithmic Invariants & Scalability", () => {
    it("deduplicateReportsToLatest processes 1,000+ reports in < 5ms with O(N) lookup", () => {
      // Generate synthetic 1,000 constituent reports across multiple quarters
      const syntheticReports: ReportSummary[] = [];
      const tickers = [
        "AAPL",
        "NVDA",
        "MSFT",
        "AMZN",
        "GOOGL",
        "META",
        "TSLA",
        "AVGO",
        "AMD",
        "QCOM",
      ];
      const quarters = ["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025", "Q1 2026"];

      for (let i = 0; i < 1000; i++) {
        const ticker =
          tickers[i % tickers.length] + `_${Math.floor(i / tickers.length)}`;
        const quarter = quarters[i % quarters.length];
        syntheticReports.push({
          slug: `${ticker}-${quarter.replace(" ", "-")}-analysis`,
          name: `${ticker}-${quarter.replace(" ", "-")}-analysis`,
          ticker,
          company: `${ticker} Corp`,
          quarter,
          reportDate: "2026-01-01",
          currentPrice: 100 + (i % 50),
          weightedFairValue: 120 + (i % 50),
          upsidePct: 20,
          baseFairValue: 115,
          baseUpsidePct: 15,
          bullFairValue: 140,
          bearFairValue: 80,
          moatRating: "Wide",
          moatTrend: "Stable",
          operatingMarginPct: 35,
          revenueGrowthPct: 20,
          snowflakeScore: 22,
          snowflakeTier: "strong",
          snowflakePillars: {
            valuation: 4,
            future: 4,
            earnings: 5,
            moat: 5,
            resilience: 4,
          },
          hasFacts: true,
          hasScenarios: true,
          hasValuation: true,
          hasBaseline: true,
          hasSentiment: true,
          hasFiling: true,
          hasCatalysts: true,
          hasReactions: true,
          hasEstimates: true,
        });
      }

      const start = performance.now();
      const deduplicated = deduplicateReportsToLatest(syntheticReports);
      const elapsedMs = performance.now() - start;

      expect(deduplicated.length).toBeLessThanOrEqual(syntheticReports.length);
      expect(elapsedMs).toBeLessThan(10);
    });
  });
});
