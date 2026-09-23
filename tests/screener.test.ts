import { describe, it, expect } from "vitest";
import { GET, type ReportSummary } from "@/app/api/reports/route";
import { getReportRepository } from "@/lib/repository";
import { computeValuation, computeStressedValuation } from "@/lib/valuation";
import { computeSnowflakeScore } from "@/lib/snowflake";

describe("Screener & Reports API", () => {
  it("GET /api/reports returns enriched report summaries", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty("reports");
    expect(Array.isArray(json.reports)).toBe(true);
    expect(json.reports.length).toBeGreaterThanOrEqual(8);

    // Find NVDA report
    const nvda = json.reports.find(
      (r: ReportSummary) => r.ticker === "NVDA" || r.slug.startsWith("NVDA")
    );
    expect(nvda).toBeDefined();
    expect(nvda.ticker).toBe("NVDA");
    expect(typeof nvda.currentPrice).toBe("number");
    expect(nvda.currentPrice).toBeGreaterThan(0);
    expect(nvda.weightedFairValue).toBe(342.83);
    expect(typeof nvda.upsidePct).toBe("number");
    expect(nvda.baseFairValue).toBe(330);
    expect(typeof nvda.baseUpsidePct).toBe("number");
    expect(nvda.bullFairValue).toBe(472.5);
    expect(nvda.bearFairValue).toBe(180.4);
    expect(nvda.moatRating).toBe("Wide");
    expect(nvda.moatTrend).toBe("Widening");
    expect(nvda.operatingMarginPct).toBe(65);
    expect(nvda.revenueGrowthPct).toBe(106);
    expect(nvda.hasFacts).toBe(true);
    expect(nvda.hasValuation).toBe(true);
    expect(nvda.hasScenarios).toBe(true);
    expect(nvda.analystTarget).toBe(328.66);
    expect(nvda.analystRating).toBe("Strong Buy");
    expect(nvda.analystCount).toBe(61);
    expect(typeof nvda.analystUpsidePct).toBe("number");
    expect(typeof nvda.snowflakeScore).toBe("number");
    expect(nvda.snowflakeScore).toBeGreaterThanOrEqual(0);
    expect(nvda.snowflakeScore).toBeLessThanOrEqual(30);
    expect(nvda.snowflakeTier).toBeDefined();
    expect(nvda.snowflakePillars).toBeDefined();
    expect(typeof nvda.snowflakePillars?.valuation).toBe("number");
    expect(typeof nvda.snowflakePillars?.future).toBe("number");
    expect(typeof nvda.snowflakePillars?.earnings).toBe("number");
    expect(typeof nvda.snowflakePillars?.moat).toBe("number");
    expect(typeof nvda.snowflakePillars?.resilience).toBe("number");
  });

  it("verifies all covered reports contain valid pricing and valuation metrics", async () => {
    const response = await GET();
    const { reports }: { reports: ReportSummary[] } = await response.json();

    for (const r of reports) {
      expect(r.slug).toBeTruthy();
      expect(typeof r.hasFacts).toBe("boolean");
      expect(typeof r.hasValuation).toBe("boolean");

      if (r.hasValuation) {
        expect(typeof r.currentPrice).toBe("number");
        expect(r.currentPrice).toBeGreaterThan(0);
        expect(typeof r.weightedFairValue).toBe("number");
        expect(typeof r.upsidePct).toBe("number");
      }
    }
  });

  it("filters and ranks reports by valuation upside", async () => {
    const response = await GET();
    const { reports }: { reports: ReportSummary[] } = await response.json();

    // Sort by upside descending
    const sorted = [...reports].sort(
      (a, b) => (b.upsidePct ?? -999) - (a.upsidePct ?? -999)
    );

    expect(sorted[0].upsidePct).toBeGreaterThan(
      sorted[sorted.length - 1].upsidePct ?? -999
    );
    expect(["NVDA", "ONDS"]).toContain(sorted[0].ticker);

    // Filter by wide moat
    const wideMoat = reports.filter(
      (r) => r.moatRating?.toLowerCase() === "wide"
    );
    expect(wideMoat.length).toBeGreaterThanOrEqual(6);
    expect(wideMoat.every((r) => r.moatRating === "Wide")).toBe(true);

    // Filter by high upside (>20%)
    const highUpside = reports.filter((r) => (r.upsidePct ?? 0) > 20);
    expect(highUpside.length).toBeGreaterThan(0);
    expect(highUpside.some((r) => r.ticker === "NVDA")).toBe(true);
    expect(highUpside.some((r) => r.ticker === "BABA")).toBe(true);
  });

  it("filters universe reports by active watchlist", async () => {
    const response = await GET();
    const { reports }: { reports: ReportSummary[] } = await response.json();

    const activeWatchlist = ["NVDA", "AMZN"];
    const watchlistedReports = reports.filter((r) =>
      activeWatchlist.includes(r.ticker || r.slug.split("-")[0])
    );

    expect(watchlistedReports.length).toBe(2);
    expect(watchlistedReports.map((r) => r.ticker)).toEqual(
      expect.arrayContaining(["NVDA", "AMZN"])
    );
  });

  it("ensures snowflake scores and tiers are perfectly consistent between screener and stock page", async () => {
    const response = await GET();
    const { reports }: { reports: ReportSummary[] } = await response.json();
    const repo = getReportRepository();

    for (const reportSummary of reports) {
      if (reportSummary.snowflakeScore === undefined) continue;
      const detail = await repo.getReport(reportSummary.slug);
      expect(detail).not.toBeNull();
      if (!detail) continue;

      const dynamicValuation =
        detail.facts && detail.scenarios
          ? computeValuation({
              facts: detail.facts,
              scenarios: detail.scenarios,
              baseline: detail.baseline,
            })
          : detail.valuation;

      const stressResult =
        detail.baseline && detail.facts.currentPrice > 0
          ? computeStressedValuation(detail.baseline, detail.facts.currentPrice)
          : undefined;

      const stockPageReportData = {
        ...detail,
        valuation: dynamicValuation ?? detail.valuation,
      };

      const stockPageSnowflakeEn = computeSnowflakeScore(
        stockPageReportData,
        stressResult,
        "en"
      );
      const stockPageSnowflakeZh = computeSnowflakeScore(
        {
          ...detail,
          facts: detail.factsZh ?? detail.facts,
          catalysts: detail.catalystsZh ?? detail.catalysts,
          scenarios: detail.scenariosZh ?? detail.scenarios,
          moat: detail.moatZh ?? detail.moat,
          estimates: detail.estimatesZh ?? detail.estimates,
          valuation: dynamicValuation ?? detail.valuation,
        },
        stressResult,
        "zh"
      );

      expect(reportSummary.snowflakeScore).toBe(
        stockPageSnowflakeEn.totalScore
      );
      expect(reportSummary.snowflakeScore).toBe(
        stockPageSnowflakeZh.totalScore
      );
      expect(reportSummary.snowflakeTier).toBe(stockPageSnowflakeEn.ratingTier);
      expect(reportSummary.snowflakeTier).toBe(stockPageSnowflakeZh.ratingTier);
      if (reportSummary.snowflakePillars) {
        expect(reportSummary.snowflakePillars.valuation).toBe(
          stockPageSnowflakeEn.pillars.valuation.score
        );
        expect(reportSummary.snowflakePillars.future).toBe(
          stockPageSnowflakeEn.pillars.future.score
        );
        expect(reportSummary.snowflakePillars.earnings).toBe(
          stockPageSnowflakeEn.pillars.earnings.score
        );
        expect(reportSummary.snowflakePillars.moat).toBe(
          stockPageSnowflakeEn.pillars.moat.score
        );
        expect(reportSummary.snowflakePillars.resilience).toBe(
          stockPageSnowflakeEn.pillars.resilience.score
        );
      }
    }
  });
});
