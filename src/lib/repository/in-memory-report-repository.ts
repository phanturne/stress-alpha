import type { IReportRepository, ReportSummary } from "./types";
import type { ReportData } from "@/lib/schemas";

export class InMemoryReportRepository implements IReportRepository {
  private reports: Map<string, ReportData> = new Map();
  private summaries: Map<string, ReportSummary> = new Map();

  constructor(
    initialData?: { report: ReportData; summary?: Partial<ReportSummary> }[]
  ) {
    if (initialData) {
      for (const item of initialData) {
        this.addReport(item.report, item.summary);
      }
    }
  }

  addReport(
    report: ReportData,
    summaryOverride?: Partial<ReportSummary>
  ): void {
    const slug = report.folderSlug;
    this.reports.set(slug, report);

    const currentPrice =
      report.facts.currentPrice ?? report.valuation?.currentPrice;
    const analystTarget =
      report.estimates?.priceTargets?.average ??
      (report.scenarios?.consensusTarget && report.scenarios.consensusTarget > 0
        ? report.scenarios.consensusTarget
        : undefined);
    const analystUpsidePct =
      analystTarget !== undefined && currentPrice && currentPrice > 0
        ? ((analystTarget - currentPrice) / currentPrice) * 100
        : undefined;
    const analystRating = report.estimates?.consensus?.consensus;
    const analystCount = report.estimates?.consensus?.totalAnalysts;

    const baseSummary: ReportSummary = {
      slug,
      name: report.folderName || slug,
      ticker: report.facts.ticker,
      company: report.facts.company,
      quarter: report.facts.quarter,
      reportDate: report.facts.reportDate,
      currentPrice,
      weightedFairValue: report.valuation?.weightedFairValue,
      upsidePct: report.valuation?.upsidePct,
      moatRating: report.moat?.overallMoatRating,
      moatTrend: report.moat?.moatTrend,
      operatingMarginPct: report.facts.operatingMarginPct,
      revenueGrowthPct: report.facts.revenueGrowthPct,
      analystTarget,
      analystUpsidePct,
      analystRating,
      analystCount,
      hasFacts: true,
      hasScenarios: true,
      hasValuation: !!report.valuation,
      hasBaseline: !!report.baseline,
      hasSentiment: !!report.sentiment,
      hasFiling: !!report.filing,
      hasCatalysts: !!report.catalysts,
      hasReactions: !!report.reactions,
      hasEstimates: !!report.estimates,
      ...summaryOverride,
    };

    this.summaries.set(slug, baseSummary);
  }

  removeReport(slug: string): boolean {
    const removedData = this.reports.delete(slug);
    const removedSummary = this.summaries.delete(slug);
    return removedData || removedSummary;
  }

  async hasReport(slug: string): Promise<boolean> {
    return this.reports.has(slug);
  }

  async listReports(): Promise<ReportSummary[]> {
    return Array.from(this.summaries.values()).sort((a, b) =>
      b.slug > a.slug ? 1 : -1
    );
  }

  async getReport(slug: string): Promise<ReportData | null> {
    return this.reports.get(slug) ?? null;
  }
}
