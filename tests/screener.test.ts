import { describe, it, expect } from "vitest";
import { GET, type ReportSummary } from "@/app/api/reports/route";

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
    expect(nvda.currentPrice).toBe(212.5);
    expect(nvda.weightedFairValue).toBe(342.83);
    expect(nvda.upsidePct).toBe(61.33);
    expect(nvda.baseFairValue).toBe(330);
    expect(nvda.baseUpsidePct).toBe(55.29);
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
    expect(nvda.analystUpsidePct).toBeCloseTo(54.66, 1);
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
    expect(sorted[0].ticker).toBe("NVDA");

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
});
