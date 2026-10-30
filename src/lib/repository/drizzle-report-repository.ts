import { eq, desc, sql, and } from "drizzle-orm";
import { getDb } from "@/db";
import {
  reportsTable,
  tickersTable,
  marketEventsTable,
  upstreamDependenciesTable,
  valuationRevisionsTable,
  financialMetricsTable,
  type MarketEventSelect,
  type MarketEventInsert,
  type UpstreamDependencySelect,
  type UpstreamDependencyInsert,
  type ValuationRevisionSelect,
  type ValuationRevisionInsert,
  type FinancialMetric,
  type FinancialMetricsInsert,
} from "@/db/schema";
import type { IReportRepository, ReportSummary } from "./types";
import type { ReportData, Valuation, Facts, Scenarios } from "@/lib/schemas";
import { computeSnowflakeScore } from "@/lib/snowflake";
import { computeStressedValuation, computeValuation } from "@/lib/valuation";

export class DrizzleReportRepository implements IReportRepository {
  private cachedSummaries: ReportSummary[] | null = null;
  private lastSummariesTime = 0;
  private readonly CACHE_TTL_MS = 60_000;
  private cachedReports = new Map<
    string,
    { data: ReportData; timestamp: number }
  >();
  private snowflakeCache = new Map<
    string,
    {
      score: number;
      tier: "exceptional" | "strong" | "balanced" | "cautious";
      pillars: {
        valuation: number;
        future: number;
        earnings: number;
        moat: number;
        resilience: number;
      };
    }
  >();

  async hasReport(slug: string): Promise<boolean> {
    const db = getDb();
    const rows = await db
      .select({ slug: reportsTable.slug })
      .from(reportsTable)
      .where(eq(reportsTable.slug, slug))
      .limit(1);

    return rows.length > 0;
  }

  async listReports(): Promise<ReportSummary[]> {
    if (
      this.cachedSummaries &&
      Date.now() - this.lastSummariesTime < this.CACHE_TTL_MS
    ) {
      return this.cachedSummaries;
    }

    const db = getDb();

    // Select ONLY columns needed for ReportSummary and Snowflake computation.
    // Avoid transferring megabytes of raw 10-Q filing text, transcripts, and markdown reports.
    const rows = await db
      .select({
        slug: reportsTable.slug,
        ticker: reportsTable.ticker,
        quarter: reportsTable.quarter,
        reportDate: reportsTable.reportDate,
        reportPrice: reportsTable.reportPrice,
        weightedFairValue: reportsTable.weightedFairValue,
        baseFairValue: reportsTable.baseFairValue,
        bullFairValue: reportsTable.bullFairValue,
        bearFairValue: reportsTable.bearFairValue,
        moatRating: reportsTable.moatRating,
        moatTrend: reportsTable.moatTrend,
        operatingMarginPct: reportsTable.operatingMarginPct,
        revenueGrowthPct: reportsTable.revenueGrowthPct,
        publishedAt: reportsTable.publishedAt,
        snowflakeScore: reportsTable.snowflakeScore,
        snowflakeTier: reportsTable.snowflakeTier,
        snowflakePillars: reportsTable.snowflakePillars,
        estimates: reportsTable.estimates,
        hasFacts: sql<boolean>`(${reportsTable.facts} IS NOT NULL)`,
        hasScenarios: sql<boolean>`(${reportsTable.scenarios} IS NOT NULL)`,
        hasValuation: sql<boolean>`(${reportsTable.valuation} IS NOT NULL)`,
        hasBaseline: sql<boolean>`(${reportsTable.baseline} IS NOT NULL)`,
        hasSentiment: sql<boolean>`(${reportsTable.sentiment} IS NOT NULL)`,
        hasFiling: sql<boolean>`(${reportsTable.filing} IS NOT NULL)`,
        hasCatalysts: sql<boolean>`(${reportsTable.catalysts} IS NOT NULL)`,
        hasReactions: sql<boolean>`(${reportsTable.reactions} IS NOT NULL)`,
        hasEstimates: sql<boolean>`(${reportsTable.estimates} IS NOT NULL)`,
        tickerPrice: tickersTable.currentPrice,
        tickerCompany: tickersTable.company,
      })
      .from(reportsTable)
      .leftJoin(tickersTable, eq(reportsTable.ticker, tickersTable.ticker))
      .orderBy(desc(reportsTable.publishedAt));

    const summaries: ReportSummary[] = [];

    for (const row of rows) {
      const effectivePrice = Number(row.tickerPrice ?? row.reportPrice);
      const weightedFairValue = Number(row.weightedFairValue);
      const baseFairValue = Number(row.baseFairValue);
      const bullFairValue = Number(row.bullFairValue);
      const bearFairValue = Number(row.bearFairValue);

      const upsidePct =
        effectivePrice > 0
          ? Number(
              (
                ((weightedFairValue - effectivePrice) / effectivePrice) *
                100
              ).toFixed(2)
            )
          : undefined;

      const baseUpsidePct =
        effectivePrice > 0
          ? Number(
              (
                ((baseFairValue - effectivePrice) / effectivePrice) *
                100
              ).toFixed(2)
            )
          : undefined;

      // Extract analyst metrics if present in estimates JSONB
      let analystTarget: number | undefined;
      let analystUpsidePct: number | undefined;
      let analystRating: string | undefined;
      let analystCount: number | undefined;

      if (row.estimates?.priceTargets?.average) {
        analystTarget = row.estimates.priceTargets.average;
        if (effectivePrice > 0) {
          analystUpsidePct = Number(
            (((analystTarget - effectivePrice) / effectivePrice) * 100).toFixed(
              2
            )
          );
        }
      }
      if (row.estimates?.consensus) {
        analystRating = row.estimates.consensus.consensus;
        analystCount = row.estimates.consensus.totalAnalysts;
      }

      let consensusSpreadPct: number | undefined;
      let divergenceClassification:
        | "in_line"
        | "moderate_alpha"
        | "high_conviction_alpha"
        | "extreme_divergence"
        | undefined;

      if (analystTarget && analystTarget > 0 && weightedFairValue) {
        consensusSpreadPct = Number(
          (((weightedFairValue - analystTarget) / analystTarget) * 100).toFixed(
            2
          )
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

      if (row.snowflakeScore != null) {
        snowflakeScore = row.snowflakeScore;
        snowflakeTier = row.snowflakeTier as
          "exceptional" | "strong" | "balanced" | "cautious" | undefined;
        snowflakePillars = row.snowflakePillars ?? undefined;
      } else {
        const snowflakeCacheKey = `${row.slug}:${effectivePrice}`;
        const cachedSnowflake = this.snowflakeCache.get(snowflakeCacheKey);

        if (cachedSnowflake) {
          snowflakeScore = cachedSnowflake.score;
          snowflakeTier = cachedSnowflake.tier;
          snowflakePillars = cachedSnowflake.pillars;
        } else {
          try {
            const reportPayload = await this.getReport(row.slug);
            if (
              reportPayload &&
              reportPayload.facts &&
              reportPayload.scenarios
            ) {
              const stressResult =
                reportPayload.baseline && effectivePrice > 0
                  ? computeStressedValuation(
                      reportPayload.baseline,
                      effectivePrice
                    )
                  : undefined;

              const res = computeSnowflakeScore(reportPayload, stressResult);
              snowflakeScore = res.totalScore;
              snowflakeTier = res.ratingTier;
              snowflakePillars = {
                valuation: res.pillars.valuation.score,
                future: res.pillars.future.score,
                earnings: res.pillars.earnings.score,
                moat: res.pillars.moat.score,
                resilience: res.pillars.resilience.score,
              };

              this.snowflakeCache.set(snowflakeCacheKey, {
                score: snowflakeScore,
                tier: snowflakeTier,
                pillars: snowflakePillars,
              });
            }
          } catch {
            // ignore snowflake computation error in summary listing
          }
        }
      }

      summaries.push({
        slug: row.slug,
        name: row.slug,
        ticker: row.ticker,
        company: row.tickerCompany ?? undefined,
        quarter: row.quarter,
        reportDate: row.reportDate,
        currentPrice: effectivePrice,
        weightedFairValue,
        upsidePct,
        baseFairValue,
        baseUpsidePct,
        bullFairValue,
        bearFairValue,
        moatRating: row.moatRating ?? undefined,
        moatTrend: row.moatTrend ?? undefined,
        operatingMarginPct: row.operatingMarginPct
          ? Number(row.operatingMarginPct)
          : undefined,
        revenueGrowthPct: row.revenueGrowthPct
          ? Number(row.revenueGrowthPct)
          : undefined,
        analystTarget,
        analystUpsidePct,
        analystRating,
        analystCount,
        consensusSpreadPct,
        divergenceClassification,
        snowflakeScore,
        snowflakeTier,
        snowflakePillars,
        hasFacts: Boolean(row.hasFacts),
        hasScenarios: Boolean(row.hasScenarios),
        hasValuation: Boolean(row.hasValuation),
        hasBaseline: Boolean(row.hasBaseline),
        hasSentiment: Boolean(row.hasSentiment),
        hasFiling: Boolean(row.hasFiling),
        hasCatalysts: Boolean(row.hasCatalysts),
        hasReactions: Boolean(row.hasReactions),
        hasEstimates: Boolean(row.hasEstimates),
      });
    }

    this.cachedSummaries = summaries;
    this.lastSummariesTime = Date.now();
    return summaries;
  }

  async getReport(slug: string): Promise<ReportData | null> {
    const cached = this.cachedReports.get(slug);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    const db = getDb();

    const rows = await db
      .select({
        report: reportsTable,
        tickerInfo: tickersTable,
      })
      .from(reportsTable)
      .leftJoin(tickersTable, eq(reportsTable.ticker, tickersTable.ticker))
      .where(eq(reportsTable.slug, slug))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    const { report, tickerInfo } = rows[0];
    const effectivePrice = Number(
      tickerInfo?.currentPrice ?? report.reportPrice
    );

    // Decorate facts, scenarios and valuation in-memory with live price if different
    const facts = { ...report.facts };
    const factsZh = report.factsZh ? { ...report.factsZh } : undefined;
    const scenarios = report.scenarios ? { ...report.scenarios } : undefined;
    const scenariosZh = report.scenariosZh
      ? { ...report.scenariosZh }
      : undefined;
    let valuation: Valuation | undefined = report.valuation
      ? { ...report.valuation }
      : undefined;

    if (effectivePrice > 0 && effectivePrice !== Number(report.reportPrice)) {
      facts.currentPrice = effectivePrice;
      if (factsZh) {
        factsZh.currentPrice = effectivePrice;
      }
      if (scenarios) {
        scenarios.currentPrice = effectivePrice;
      }
      if (scenariosZh) {
        scenariosZh.currentPrice = effectivePrice;
      }
      if (valuation) {
        valuation = {
          ...valuation,
          currentPrice: effectivePrice,
          upsidePct: Number(
            (
              ((valuation.weightedFairValue - effectivePrice) /
                effectivePrice) *
              100
            ).toFixed(2)
          ),
        };
      }
    }

    const reportData: ReportData = {
      folderSlug: report.slug,
      folderName: report.slug,
      facts,
      scenarios: (scenarios ?? report.scenarios)!,
      valuation,
      baseline: report.baseline ?? undefined,
      moat: report.moat ?? undefined,
      moatZh: report.moatZh ?? undefined,
      estimates: report.estimates ?? undefined,
      estimatesZh: report.estimatesZh ?? undefined,
      catalysts: report.catalysts ?? undefined,
      catalystsZh: report.catalystsZh ?? undefined,
      sentiment: report.sentiment ?? undefined,
      sentimentZh: report.sentimentZh ?? undefined,
      filing: report.filing ?? undefined,
      filingZh: report.filingZh ?? undefined,
      reactions: report.reactions ?? undefined,
      reactionsZh: report.reactionsZh ?? undefined,
      factsZh,
      scenariosZh,
      reportMarkdown: report.reportMd ?? undefined,
      reportMarkdownZh: report.reportMdZh ?? undefined,
      technicalLevels: tickerInfo?.technicalLevels ?? undefined,
    };

    this.cachedReports.set(slug, {
      data: reportData,
      timestamp: Date.now(),
    });
    return reportData;
  }

  async saveReport(report: ReportData): Promise<void> {
    const db = getDb();
    const slug = report.folderSlug;
    const ticker = report.facts.ticker.toUpperCase();
    const quarter = report.facts.quarter || "Q1 2026";

    const match = quarter.match(/\b(20\d{2})\b/) || slug.match(/\b(20\d{2})\b/);
    const year = match ? parseInt(match[1], 10) : new Date().getFullYear();

    const currentPrice =
      report.facts.currentPrice ?? report.valuation?.currentPrice ?? 0;
    const weightedFairValue = report.valuation?.weightedFairValue ?? 0;

    let baseFairValue = 0;
    let bullFairValue = 0;
    let bearFairValue = 0;
    if (report.scenarios?.scenarios) {
      for (const s of report.scenarios.scenarios) {
        const fv = s.forwardEps * s.multiple;
        const lower = s.name.toLowerCase();
        if (lower.includes("base")) baseFairValue = fv;
        else if (lower.includes("bull")) bullFairValue = fv;
        else if (lower.includes("bear") || lower.includes("panic"))
          bearFairValue = fv;
      }
    }

    const panicFairValue =
      report.valuation?.stressTest?.valuationBands?.panic?.targetPrice;

    // Calculate deterministic Snowflake metrics for persistence
    let snowflakeScore: number | null = null;
    let snowflakeTier: string | null = null;
    let snowflakePillars: {
      valuation: number;
      future: number;
      earnings: number;
      moat: number;
      resilience: number;
    } | null = null;

    try {
      const stressResult =
        report.baseline && currentPrice > 0
          ? computeStressedValuation(report.baseline, currentPrice)
          : undefined;
      const res = computeSnowflakeScore(report, stressResult);
      snowflakeScore = res.totalScore;
      snowflakeTier = res.ratingTier;
      snowflakePillars = {
        valuation: res.pillars.valuation.score,
        future: res.pillars.future.score,
        earnings: res.pillars.earnings.score,
        moat: res.pillars.moat.score,
        resilience: res.pillars.resilience.score,
      };
    } catch {
      // ignore calculation errors on partial mock reports
    }

    // Ensure ticker exists in tickersTable
    await db
      .insert(tickersTable)
      .values({
        ticker,
        company: report.facts.company || `${ticker} Corporation`,
        currentPrice: String(currentPrice),
        technicalLevels: report.technicalLevels,
        priceUpdatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: tickersTable.ticker,
        set: {
          currentPrice: String(currentPrice),
          ...(report.technicalLevels
            ? { technicalLevels: report.technicalLevels }
            : {}),
          priceUpdatedAt: new Date(),
        },
      });

    // Resolve slug: if a row with matching (ticker, quarter, year) already exists under another slug format,
    // target that slug so onConflictDoUpdate updates it without violating idx_reports_ticker_quarter.
    let targetSlug = slug;
    try {
      const existing = await db
        .select({ slug: reportsTable.slug })
        .from(reportsTable)
        .where(
          and(
            eq(reportsTable.ticker, ticker),
            eq(reportsTable.quarter, quarter),
            eq(reportsTable.year, year)
          )
        )
        .limit(1);

      if (existing[0]?.slug) {
        targetSlug = existing[0].slug;
      }
    } catch {
      // Fallback to original slug
    }

    // Save report in reportsTable
    await db
      .insert(reportsTable)
      .values({
        slug: targetSlug,
        ticker,
        quarter,
        year,
        reportDate:
          report.facts.reportDate || new Date().toISOString().split("T")[0],
        status: "published",
        reportPrice: String(currentPrice),
        weightedFairValue: String(weightedFairValue),
        baseFairValue: String(baseFairValue),
        bullFairValue: String(bullFairValue),
        bearFairValue: String(bearFairValue),
        panicFairValue: panicFairValue ? String(panicFairValue) : null,
        moatRating: report.moat?.overallMoatRating ?? null,
        moatTrend: report.moat?.moatTrend ?? null,
        operatingMarginPct:
          report.facts.operatingMarginPct != null
            ? String(report.facts.operatingMarginPct)
            : null,
        revenueGrowthPct:
          report.facts.revenueGrowthPct != null
            ? String(report.facts.revenueGrowthPct)
            : null,
        snowflakeScore,
        snowflakeTier,
        snowflakePillars,
        facts: report.facts,
        scenarios: report.scenarios,
        valuation: (report.valuation ?? {}) as any,
        baseline: report.baseline,
        moat: report.moat,
        moatZh: report.moatZh,
        estimates: report.estimates,
        estimatesZh: report.estimatesZh,
        catalysts: report.catalysts,
        sentiment: report.sentiment,
        filing: report.filing,
        reactions: report.reactions,
        factsZh: report.factsZh,
        scenariosZh: report.scenariosZh,
        catalystsZh: report.catalystsZh,
        sentimentZh: report.sentimentZh,
        filingZh: report.filingZh,
        reactionsZh: report.reactionsZh,
        reportMd: report.reportMarkdown,
        reportMdZh: report.reportMarkdownZh,
        publishedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: reportsTable.slug,
        set: {
          reportPrice: String(currentPrice),
          weightedFairValue: String(weightedFairValue),
          baseFairValue: String(baseFairValue),
          bullFairValue: String(bullFairValue),
          bearFairValue: String(bearFairValue),
          panicFairValue: panicFairValue ? String(panicFairValue) : null,
          moatRating: report.moat?.overallMoatRating ?? null,
          moatTrend: report.moat?.moatTrend ?? null,
          operatingMarginPct:
            report.facts.operatingMarginPct != null
              ? String(report.facts.operatingMarginPct)
              : null,
          revenueGrowthPct:
            report.facts.revenueGrowthPct != null
              ? String(report.facts.revenueGrowthPct)
              : null,
          snowflakeScore,
          snowflakeTier,
          snowflakePillars,
          facts: report.facts,
          scenarios: report.scenarios,
          valuation: (report.valuation ?? {}) as any,
          baseline: report.baseline,
          moat: report.moat,
          moatZh: report.moatZh,
          estimates: report.estimates,
          estimatesZh: report.estimatesZh,
          catalysts: report.catalysts,
          sentiment: report.sentiment,
          filing: report.filing,
          reactions: report.reactions,
          factsZh: report.factsZh,
          scenariosZh: report.scenariosZh,
          catalystsZh: report.catalystsZh,
          sentimentZh: report.sentimentZh,
          filingZh: report.filingZh,
          reactionsZh: report.reactionsZh,
          reportMd: report.reportMarkdown,
          reportMdZh: report.reportMarkdownZh,
          updatedAt: new Date(),
        },
      });

    // Invalidate caches
    this.cachedSummaries = null;
    this.cachedReports.delete(slug);
    this.snowflakeCache.delete(slug);
  }

  async deleteReport(slug: string): Promise<void> {
    const db = getDb();
    await db.delete(reportsTable).where(eq(reportsTable.slug, slug));
    this.cachedSummaries = null;
    this.cachedReports.delete(slug);
    this.snowflakeCache.delete(slug);
  }

  async getMarketEvents(
    ticker: string,
    limit = 50
  ): Promise<MarketEventSelect[]> {
    const db = getDb();
    return db
      .select()
      .from(marketEventsTable)
      .where(eq(marketEventsTable.ticker, ticker.toUpperCase()))
      .orderBy(desc(marketEventsTable.publishedAt))
      .limit(limit);
  }

  async saveMarketEvent(event: MarketEventInsert): Promise<void> {
    const db = getDb();
    const id =
      event.id ||
      `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const ticker = event.ticker.toUpperCase();
    const publishedAt =
      event.publishedAt instanceof Date
        ? event.publishedAt
        : new Date(event.publishedAt);

    await db
      .insert(tickersTable)
      .values({
        ticker,
        company: `${ticker} Corporation`,
        currentPrice: "100.00",
      })
      .onConflictDoNothing();

    await db
      .insert(marketEventsTable)
      .values({
        ...event,
        id,
        ticker,
        publishedAt,
        priceMovePct:
          event.priceMovePct != null ? String(event.priceMovePct) : undefined,
        abnormalReturnSigma:
          event.abnormalReturnSigma != null
            ? String(event.abnormalReturnSigma)
            : undefined,
        impliedWfvImpactPct:
          event.impliedWfvImpactPct != null
            ? String(event.impliedWfvImpactPct)
            : undefined,
      })
      .onConflictDoUpdate({
        target: marketEventsTable.id,
        set: {
          title: event.title,
          summary: event.summary,
          sourceUrl: event.sourceUrl,
          publisher: event.publisher,
          publishedAt,
          eventType: event.eventType,
          priceMovePct:
            event.priceMovePct != null ? String(event.priceMovePct) : undefined,
          abnormalReturnSigma:
            event.abnormalReturnSigma != null
              ? String(event.abnormalReturnSigma)
              : undefined,
          transmissionType: event.transmissionType,
          transmissionPayload: event.transmissionPayload,
          impliedWfvImpactPct:
            event.impliedWfvImpactPct != null
              ? String(event.impliedWfvImpactPct)
              : undefined,
        },
      });
  }

  async getUpstreamDependencies(
    targetTicker: string
  ): Promise<UpstreamDependencySelect[]> {
    const db = getDb();
    return db
      .select()
      .from(upstreamDependenciesTable)
      .where(
        eq(upstreamDependenciesTable.targetTicker, targetTicker.toUpperCase())
      );
  }

  async saveUpstreamDependency(dep: UpstreamDependencyInsert): Promise<void> {
    const db = getDb();
    const sourceTicker = dep.sourceTicker.toUpperCase();
    const targetTicker = dep.targetTicker.toUpperCase();
    const id =
      dep.id || `updep-${sourceTicker}-${targetTicker}-${dep.driverId}`;

    await db
      .insert(tickersTable)
      .values([
        {
          ticker: sourceTicker,
          company: `${sourceTicker} Corporation`,
          currentPrice: "100.00",
        },
        {
          ticker: targetTicker,
          company: `${targetTicker} Corporation`,
          currentPrice: "100.00",
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(upstreamDependenciesTable)
      .values({
        ...dep,
        id,
        sourceTicker,
        targetTicker,
        exposureShare: String(dep.exposureShare),
        elasticity: String(dep.elasticity),
      })
      .onConflictDoUpdate({
        target: [
          upstreamDependenciesTable.sourceTicker,
          upstreamDependenciesTable.targetTicker,
          upstreamDependenciesTable.driverId,
        ],
        set: {
          driverName: dep.driverName,
          exposureShare: String(dep.exposureShare),
          elasticity: String(dep.elasticity),
          notes: dep.notes,
        },
      });
  }

  async getValuationRevisions(
    ticker: string,
    limit = 50
  ): Promise<ValuationRevisionSelect[]> {
    const db = getDb();
    return db
      .select()
      .from(valuationRevisionsTable)
      .where(eq(valuationRevisionsTable.ticker, ticker.toUpperCase()))
      .orderBy(desc(valuationRevisionsTable.revisionDate))
      .limit(limit);
  }

  async saveValuationRevision(rev: ValuationRevisionInsert): Promise<void> {
    const db = getDb();
    const ticker = rev.ticker.toUpperCase();
    const id =
      rev.id ||
      `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const revisionDate =
      rev.revisionDate instanceof Date
        ? rev.revisionDate
        : new Date(rev.revisionDate);

    await db
      .insert(tickersTable)
      .values({
        ticker,
        company: `${ticker} Corporation`,
        currentPrice: "100.00",
      })
      .onConflictDoNothing();

    await db
      .insert(valuationRevisionsTable)
      .values({
        ...rev,
        id,
        ticker,
        revisionDate,
        priorWfv: String(rev.priorWfv),
        newWfv: String(rev.newWfv),
        wfvDeltaPct: String(rev.wfvDeltaPct),
      })
      .onConflictDoUpdate({
        target: valuationRevisionsTable.id,
        set: {
          revisionDate,
          triggerType: rev.triggerType,
          triggerEventId: rev.triggerEventId,
          headline: rev.headline,
          rationale: rev.rationale,
          priorWfv: String(rev.priorWfv),
          newWfv: String(rev.newWfv),
          wfvDeltaPct: String(rev.wfvDeltaPct),
          fullStateDiff: rev.fullStateDiff,
        },
      });
  }

  async getFinancialMetrics(ticker: string): Promise<FinancialMetric[]> {
    const db = getDb();
    return db
      .select()
      .from(financialMetricsTable)
      .where(eq(financialMetricsTable.ticker, ticker.toUpperCase()))
      .orderBy(desc(financialMetricsTable.periodEndDate));
  }

  async saveFinancialMetrics(metrics: FinancialMetricsInsert[]): Promise<void> {
    if (!metrics || metrics.length === 0) return;
    const db = getDb();

    // 1. Ensure all referenced tickers exist in tickersTable
    const uniqueTickers = Array.from(
      new Set(metrics.map((m) => m.ticker.toUpperCase()))
    );
    for (const t of uniqueTickers) {
      await db
        .insert(tickersTable)
        .values({
          ticker: t,
          company: `${t} Corporation`,
          currentPrice: "100.00",
        })
        .onConflictDoNothing();
    }

    // 2. Upsert each quarterly metric with type normalization
    for (const m of metrics) {
      const ticker = m.ticker.toUpperCase();
      const revenue = String(m.revenue);
      const grossProfit = String(m.grossProfit);
      const operatingIncome = String(m.operatingIncome);
      const netIncome = String(m.netIncome);
      const dilutedEps = String(m.dilutedEps);
      const grossMarginPct = String(m.grossMarginPct);
      const operatingMarginPct = String(m.operatingMarginPct);

      const operatingCashFlow =
        m.operatingCashFlow != null ? String(m.operatingCashFlow) : null;
      const freeCashFlow =
        m.freeCashFlow != null ? String(m.freeCashFlow) : null;
      const capex = m.capex != null ? String(m.capex) : null;
      const dilutedShares =
        m.dilutedShares != null ? String(m.dilutedShares) : null;

      await db
        .insert(financialMetricsTable)
        .values({
          ...m,
          ticker,
          revenue,
          grossProfit,
          operatingIncome,
          netIncome,
          operatingCashFlow,
          freeCashFlow,
          capex,
          dilutedEps,
          dilutedShares,
          grossMarginPct,
          operatingMarginPct,
        })
        .onConflictDoUpdate({
          target: [
            financialMetricsTable.ticker,
            financialMetricsTable.fiscalYear,
            financialMetricsTable.fiscalQuarter,
          ],
          set: {
            periodEndDate: m.periodEndDate,
            revenue,
            grossProfit,
            operatingIncome,
            netIncome,
            operatingCashFlow,
            freeCashFlow,
            capex,
            dilutedEps,
            dilutedShares,
            grossMarginPct,
            operatingMarginPct,
          },
        });
    }
  }
}
