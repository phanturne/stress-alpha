import type { IReportRepository, ReportSummary } from "./types";
import type { ReportData } from "@/lib/schemas";
import type {
  MarketEventSelect,
  MarketEventInsert,
  UpstreamDependencySelect,
  UpstreamDependencyInsert,
  ValuationRevisionSelect,
  ValuationRevisionInsert,
} from "@/db/schema";
import { computeSnowflakeScore } from "@/lib/snowflake";
import { computeStressedValuation, computeValuation } from "@/lib/valuation";

export class InMemoryReportRepository implements IReportRepository {
  private reports: Map<string, ReportData> = new Map();
  private summaries: Map<string, ReportSummary> = new Map();
  private marketEvents: MarketEventSelect[] = [];
  private upstreamDependencies: UpstreamDependencySelect[] = [];
  private valuationRevisions: ValuationRevisionSelect[] = [];

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

    let snowflakeScore: number | undefined;
    let snowflakeTier:
      "exceptional" | "strong" | "balanced" | "cautious" | undefined;
    let snowflakePillars:
      | {
          valuation: number;
          future: number;
          earnings: number;
          moat: number;
          resilience: number;
        }
      | undefined;
    try {
      const dynamicValuation =
        report.scenarios && report.facts
          ? computeValuation({
              facts: report.facts,
              scenarios: report.scenarios,
              baseline: report.baseline,
              moat: report.moat,
              estimates: report.estimates,
            })
          : report.valuation;
      const stressResult =
        report.baseline && currentPrice && currentPrice > 0
          ? computeStressedValuation(report.baseline, currentPrice)
          : undefined;
      const reportPayload: ReportData = {
        ...report,
        valuation: dynamicValuation,
      };
      const sRes = computeSnowflakeScore(reportPayload, stressResult);
      snowflakeScore = sRes.totalScore;
      snowflakeTier = sRes.ratingTier;
      snowflakePillars = {
        valuation: sRes.pillars.valuation.score,
        future: sRes.pillars.future.score,
        earnings: sRes.pillars.earnings.score,
        moat: sRes.pillars.moat.score,
        resilience: sRes.pillars.resilience.score,
      };
    } catch {
      // ignore
    }

    const wfv = report.valuation?.weightedFairValue;
    let consensusSpreadPct: number | undefined;
    let divergenceClassification:
      | "in_line"
      | "moderate_alpha"
      | "high_conviction_alpha"
      | "extreme_divergence"
      | undefined;
    if (analystTarget !== undefined && analystTarget > 0 && wfv !== undefined) {
      consensusSpreadPct = Number(
        (((wfv - analystTarget) / analystTarget) * 100).toFixed(2)
      );
      const absSpread = Math.abs(consensusSpreadPct);
      if (absSpread >= 30) {
        divergenceClassification = "extreme_divergence";
      } else if (absSpread >= 15) {
        divergenceClassification = "high_conviction_alpha";
      } else if (absSpread >= 5) {
        divergenceClassification = "moderate_alpha";
      } else {
        divergenceClassification = "in_line";
      }
    }

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
      consensusSpreadPct,
      divergenceClassification,
      snowflakeScore,
      snowflakeTier,
      snowflakePillars,
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

  async saveReport(report: ReportData): Promise<void> {
    this.addReport(report);
  }

  async deleteReport(slug: string): Promise<void> {
    this.reports.delete(slug);
    this.summaries.delete(slug);
  }

  async getMarketEvents(
    ticker: string,
    limit = 50
  ): Promise<MarketEventSelect[]> {
    const upper = ticker.toUpperCase();
    return this.marketEvents
      .filter((e) => e.ticker.toUpperCase() === upper)
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
      .slice(0, limit);
  }

  async saveMarketEvent(event: MarketEventInsert): Promise<void> {
    const id =
      event.id ||
      `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const publishedAt =
      event.publishedAt instanceof Date
        ? event.publishedAt
        : new Date(event.publishedAt);
    const createdAt =
      event.createdAt instanceof Date
        ? event.createdAt
        : event.createdAt
          ? new Date(event.createdAt)
          : new Date();

    const selectItem: MarketEventSelect = {
      id,
      ticker: event.ticker.toUpperCase(),
      title: event.title,
      summary: event.summary,
      sourceUrl: event.sourceUrl ?? null,
      publisher: event.publisher,
      publishedAt,
      eventType: event.eventType,
      priceMovePct:
        event.priceMovePct != null ? String(event.priceMovePct) : null,
      abnormalReturnSigma:
        event.abnormalReturnSigma != null
          ? String(event.abnormalReturnSigma)
          : null,
      transmissionType: event.transmissionType ?? "none",
      transmissionPayload: event.transmissionPayload ?? null,
      impliedWfvImpactPct:
        event.impliedWfvImpactPct != null
          ? String(event.impliedWfvImpactPct)
          : null,
      createdAt,
    };

    const existingIndex = this.marketEvents.findIndex((e) => e.id === id);
    if (existingIndex >= 0) {
      this.marketEvents[existingIndex] = selectItem;
    } else {
      this.marketEvents.push(selectItem);
    }
  }

  async getUpstreamDependencies(
    targetTicker: string
  ): Promise<UpstreamDependencySelect[]> {
    const upper = targetTicker.toUpperCase();
    return this.upstreamDependencies.filter(
      (d) => d.targetTicker.toUpperCase() === upper
    );
  }

  async saveUpstreamDependency(dep: UpstreamDependencyInsert): Promise<void> {
    const sourceTicker = dep.sourceTicker.toUpperCase();
    const targetTicker = dep.targetTicker.toUpperCase();
    const id =
      dep.id || `updep-${sourceTicker}-${targetTicker}-${dep.driverId}`;
    const createdAt =
      dep.createdAt instanceof Date
        ? dep.createdAt
        : dep.createdAt
          ? new Date(dep.createdAt)
          : new Date();

    const selectItem: UpstreamDependencySelect = {
      id,
      sourceTicker,
      targetTicker,
      driverId: dep.driverId,
      driverName: dep.driverName ?? null,
      exposureShare: String(dep.exposureShare),
      elasticity: String(dep.elasticity),
      notes: dep.notes ?? null,
      createdAt,
    };

    const existingIndex = this.upstreamDependencies.findIndex(
      (d) =>
        d.id === id ||
        (d.sourceTicker === sourceTicker &&
          d.targetTicker === targetTicker &&
          d.driverId === dep.driverId)
    );
    if (existingIndex >= 0) {
      this.upstreamDependencies[existingIndex] = selectItem;
    } else {
      this.upstreamDependencies.push(selectItem);
    }
  }

  async getValuationRevisions(
    ticker: string,
    limit = 50
  ): Promise<ValuationRevisionSelect[]> {
    const upper = ticker.toUpperCase();
    return this.valuationRevisions
      .filter((r) => r.ticker.toUpperCase() === upper)
      .sort(
        (a, b) =>
          new Date(b.revisionDate).getTime() -
          new Date(a.revisionDate).getTime()
      )
      .slice(0, limit);
  }

  async saveValuationRevision(rev: ValuationRevisionInsert): Promise<void> {
    const id =
      rev.id ||
      `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const revisionDate =
      rev.revisionDate instanceof Date
        ? rev.revisionDate
        : new Date(rev.revisionDate);
    const createdAt =
      rev.createdAt instanceof Date
        ? rev.createdAt
        : rev.createdAt
          ? new Date(rev.createdAt)
          : new Date();

    const selectItem: ValuationRevisionSelect = {
      id,
      ticker: rev.ticker.toUpperCase(),
      revisionDate,
      triggerType: rev.triggerType,
      triggerEventId: rev.triggerEventId ?? null,
      headline: rev.headline,
      rationale: rev.rationale,
      priorWfv: String(rev.priorWfv),
      newWfv: String(rev.newWfv),
      wfvDeltaPct: String(rev.wfvDeltaPct),
      fullStateDiff: rev.fullStateDiff,
      createdAt,
    };

    const existingIndex = this.valuationRevisions.findIndex((r) => r.id === id);
    if (existingIndex >= 0) {
      this.valuationRevisions[existingIndex] = selectItem;
    } else {
      this.valuationRevisions.push(selectItem);
    }
  }
}
