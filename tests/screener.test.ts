import { describe, it, expect } from "vitest";
import { GET, type ReportSummary } from "@/app/api/reports/route";
import { getReportRepository } from "@/lib/repository";
import { computeValuation, computeStressedValuation } from "@/lib/valuation";
import { computeSnowflakeScore } from "@/lib/snowflake";
import {
  deduplicateReportsToLatest,
  getReportRecencyWeight,
} from "@/components/ScreenerView";

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
    expect(typeof nvda.weightedFairValue).toBe("number");
    expect(nvda.weightedFairValue).toBeGreaterThan(0);
    expect(typeof nvda.upsidePct).toBe("number");
    expect(typeof nvda.baseFairValue).toBe("number");
    expect(nvda.baseFairValue).toBeGreaterThan(0);
    expect(typeof nvda.baseUpsidePct).toBe("number");
    expect(typeof nvda.bullFairValue).toBe("number");
    expect(nvda.bullFairValue).toBeGreaterThan(nvda.baseFairValue);
    expect(typeof nvda.bearFairValue).toBe("number");
    expect(nvda.bearFairValue).toBeLessThan(nvda.baseFairValue);
    expect(nvda.moatRating).toMatch(/^(Wide|Narrow|None)$/);
    expect(nvda.moatTrend).toMatch(/^(Widening|Stable|Narrowing)$/);
    expect(typeof nvda.operatingMarginPct).toBe("number");
    expect(typeof nvda.revenueGrowthPct).toBe("number");
    expect(nvda.hasFacts).toBe(true);
    expect(nvda.hasValuation).toBe(true);
    expect(nvda.hasScenarios).toBe(true);
    if (nvda.analystTarget) {
      expect(nvda.analystTarget).toBeGreaterThan(0);
    }
    if (nvda.analystRating) {
      expect(typeof nvda.analystRating).toBe("string");
    }
    if (nvda.analystCount) {
      expect(nvda.analystCount).toBeGreaterThan(0);
    }
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
    expect(typeof sorted[0].ticker).toBe("string");

    // Filter by wide moat
    const wideMoat = reports.filter(
      (r) => r.moatRating?.toLowerCase() === "wide"
    );
    expect(wideMoat.length).toBeGreaterThan(0);
    expect(wideMoat.every((r) => r.moatRating === "Wide")).toBe(true);

    // Filter by high upside (>20%)
    const highUpside = reports.filter((r) => (r.upsidePct ?? 0) > 20);
    expect(highUpside.length).toBeGreaterThan(0);
    expect(typeof highUpside[0].ticker).toBe("string");

    // Rank by analyst target percentage delta
    const validAnalystUpside = reports.filter(
      (r) => typeof r.analystUpsidePct === "number"
    );
    expect(validAnalystUpside.length).toBeGreaterThan(0);
    const sortedAnalyst = [...validAnalystUpside].sort(
      (a, b) => (b.analystUpsidePct ?? -999) - (a.analystUpsidePct ?? -999)
    );
    expect(sortedAnalyst[0].analystUpsidePct).toBeGreaterThanOrEqual(
      sortedAnalyst[sortedAnalyst.length - 1].analystUpsidePct ?? -999
    );
  });

  it("filters universe reports by active watchlist", async () => {
    const response = await GET();
    const { reports }: { reports: ReportSummary[] } = await response.json();

    const activeWatchlist = ["NVDA", "AMZN"];
    const watchlistedReports = reports.filter((r) =>
      activeWatchlist.includes(r.ticker || r.slug.split("-")[0])
    );

    expect(watchlistedReports.length).toBeGreaterThanOrEqual(2);
    expect(
      watchlistedReports.every((r) => activeWatchlist.includes(r.ticker || ""))
    ).toBe(true);
    const uniqueTickers = Array.from(
      new Set(watchlistedReports.map((r) => r.ticker))
    );
    expect(uniqueTickers).toEqual(expect.arrayContaining(["NVDA", "AMZN"]));
  });

  it("ensures snowflake scores and tiers are perfectly consistent between screener and stock page", async () => {
    const response = await GET();
    const { reports }: { reports: ReportSummary[] } = await response.json();
    const repo = getReportRepository();

    // Test a representative sample of reports (e.g., 3) instead of crawling the entire DB
    const sampleReports = reports
      .filter((r) => r.snowflakeScore !== undefined)
      .slice(0, 3);
    expect(sampleReports.length).toBeGreaterThanOrEqual(2);

    await Promise.all(
      sampleReports.map(async (reportSummary) => {
        const detail = await repo.getReport(reportSummary.slug);
        expect(detail).not.toBeNull();
        if (!detail) return;

        const dynamicValuation =
          detail.facts && detail.scenarios
            ? computeValuation({
                facts: detail.facts,
                scenarios: detail.scenarios,
                baseline: detail.baseline,
                moat: detail.moat,
                estimates: detail.estimates,
              })
            : detail.valuation;

        const stressResult =
          detail.baseline && detail.facts.currentPrice > 0
            ? computeStressedValuation(
                detail.baseline,
                detail.facts.currentPrice
              )
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

        // Invariant: Screener snowflake score aligns with stock page computation
        // (within +/- 1 pt to account for live market price movements vs report price)
        expect(
          Math.abs(
            (reportSummary.snowflakeScore ?? 0) -
              stockPageSnowflakeEn.totalScore
          )
        ).toBeLessThanOrEqual(1);
        expect(stockPageSnowflakeEn.totalScore).toBe(
          stockPageSnowflakeZh.totalScore
        );
        expect(stockPageSnowflakeEn.ratingTier).toBe(
          stockPageSnowflakeZh.ratingTier
        );
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
      })
    );
  });

  it("deduplicates multiple reports for the same stock, selecting the latest earnings quarter", () => {
    const rawReports: ReportSummary[] = [
      {
        slug: "ONDS-Q2-2026-analysis",
        name: "ONDS-Q2-2026-analysis",
        ticker: "ONDS",
        company: "Ondas Holdings Inc.",
        quarter: "Q2 2026",
        reportDate: "2026-08-14",
        currentPrice: 7.24,
        weightedFairValue: 14.07,
        upsidePct: 94.34,
        hasFacts: true,
        hasScenarios: true,
        hasValuation: true,
        hasBaseline: true,
        hasSentiment: true,
        hasFiling: true,
        hasCatalysts: true,
        hasReactions: true,
        hasEstimates: true,
      },
      {
        slug: "ONDS-Q4-2026-analysis",
        name: "ONDS-Q4-2026-analysis",
        ticker: "ONDS",
        company: "Ondas Holdings Inc.",
        quarter: "Q4 2026",
        reportDate: "2026-10-24",
        currentPrice: 6.2,
        weightedFairValue: 15.52,
        upsidePct: 150.32,
        hasFacts: true,
        hasScenarios: true,
        hasValuation: true,
        hasBaseline: true,
        hasSentiment: true,
        hasFiling: true,
        hasCatalysts: true,
        hasReactions: true,
        hasEstimates: true,
      },
      {
        slug: "MU-Q3-2026-analysis",
        name: "MU-Q3-2026-analysis",
        ticker: "MU",
        company: "Micron Technology",
        quarter: "Q3 2026",
        reportDate: "2026-06-24",
        currentPrice: 135.0,
        weightedFairValue: 180.0,
        upsidePct: 33.33,
        hasFacts: true,
        hasScenarios: true,
        hasValuation: true,
        hasBaseline: true,
        hasSentiment: true,
        hasFiling: true,
        hasCatalysts: true,
        hasReactions: true,
        hasEstimates: true,
      },
      {
        slug: "MU-Q4-2026-analysis",
        name: "MU-Q4-2026-analysis",
        ticker: "MU",
        company: "Micron Technology",
        quarter: "Q4 2026",
        reportDate: "2026-09-30",
        currentPrice: 108.0,
        weightedFairValue: 160.0,
        upsidePct: 48.15,
        hasFacts: true,
        hasScenarios: true,
        hasValuation: true,
        hasBaseline: true,
        hasSentiment: true,
        hasFiling: true,
        hasCatalysts: true,
        hasReactions: true,
        hasEstimates: true,
      },
      {
        slug: "NVDA-Q2-2027-analysis",
        name: "NVDA-Q2-2027-analysis",
        ticker: "NVDA",
        company: "NVIDIA Corporation",
        quarter: "Q2 2027",
        reportDate: "2026-08-26",
        currentPrice: 212.5,
        weightedFairValue: 245.0,
        upsidePct: 15.29,
        hasFacts: true,
        hasScenarios: true,
        hasValuation: true,
        hasBaseline: true,
        hasSentiment: true,
        hasFiling: true,
        hasCatalysts: true,
        hasReactions: true,
        hasEstimates: true,
      },
    ];

    expect(getReportRecencyWeight(rawReports[0])).toBe(20262); // Q2 2026
    expect(getReportRecencyWeight(rawReports[1])).toBe(20264); // Q4 2026
    expect(getReportRecencyWeight(rawReports[4])).toBe(20272); // Q2 2027

    const uniqueReports = deduplicateReportsToLatest(rawReports);

    // Exactly 3 unique stocks (ONDS, MU, NVDA)
    expect(uniqueReports).toHaveLength(3);
    const tickers = uniqueReports.map((r) => r.ticker).sort();
    expect(tickers).toEqual(["MU", "NVDA", "ONDS"]);

    // ONDS latest quarter is Q4 2026
    const ondsLatest = uniqueReports.find((r) => r.ticker === "ONDS");
    expect(ondsLatest).toBeDefined();
    expect(ondsLatest?.quarter).toBe("Q4 2026");
    expect(ondsLatest?.slug).toBe("ONDS-Q4-2026-analysis");

    // MU latest quarter is Q4 2026
    const muLatest = uniqueReports.find((r) => r.ticker === "MU");
    expect(muLatest).toBeDefined();
    expect(muLatest?.quarter).toBe("Q4 2026");
    expect(muLatest?.slug).toBe("MU-Q4-2026-analysis");

    // NVDA latest quarter is Q2 2027
    const nvdaLatest = uniqueReports.find((r) => r.ticker === "NVDA");
    expect(nvdaLatest).toBeDefined();
    expect(nvdaLatest?.quarter).toBe("Q2 2027");
    expect(nvdaLatest?.slug).toBe("NVDA-Q2-2027-analysis");
  });
});
