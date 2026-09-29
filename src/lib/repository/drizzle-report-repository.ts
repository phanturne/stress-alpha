import { eq, desc, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { reportsTable, tickersTable } from "@/db/schema";
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
        estimates: reportsTable.estimates,
        facts: reportsTable.facts,
        scenarios: reportsTable.scenarios,
        baseline: reportsTable.baseline,
        moat: reportsTable.moat,
        catalysts: reportsTable.catalysts,
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

      const snowflakeCacheKey = `${row.slug}:${effectivePrice}`;
      const cachedSnowflake = this.snowflakeCache.get(snowflakeCacheKey);

      if (cachedSnowflake) {
        snowflakeScore = cachedSnowflake.score;
        snowflakeTier = cachedSnowflake.tier;
        snowflakePillars = cachedSnowflake.pillars;
      } else if (row.facts && row.scenarios) {
        try {
          const facts: Facts = {
            ...row.facts,
            currentPrice:
              effectivePrice > 0 ? effectivePrice : row.facts.currentPrice,
          };
          const scenarios: Scenarios = {
            ...row.scenarios,
            currentPrice:
              effectivePrice > 0 ? effectivePrice : row.scenarios.currentPrice,
          };
          const baseline = row.baseline ?? undefined;

          // Compute dynamic valuation matching model's default unperturbed state
          const dynamicValuation = computeValuation({
            facts,
            scenarios,
            baseline,
            moat: row.moat ?? undefined,
            estimates: row.estimates ?? undefined,
          });

          const stressResult =
            baseline && facts.currentPrice > 0
              ? computeStressedValuation(baseline, facts.currentPrice)
              : undefined;

          const reportPayload: ReportData = {
            folderSlug: row.slug,
            folderName: row.slug,
            facts,
            valuation: dynamicValuation,
            scenarios,
            baseline,
            moat: row.moat ?? undefined,
            catalysts: row.catalysts ?? undefined,
            estimates: row.estimates ?? undefined,
          };
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
        } catch {
          // ignore snowflake computation error in summary listing
        }
      }

      summaries.push({
        slug: row.slug,
        name: row.slug,
        ticker: row.ticker,
        company: row.tickerCompany ?? row.facts?.company,
        quarter: row.quarter,
        reportDate: row.reportDate,
        currentPrice: effectivePrice,
        weightedFairValue,
        upsidePct,
        baseFairValue,
        baseUpsidePct,
        bullFairValue,
        bearFairValue,
        moatRating: row.moatRating ?? row.moat?.overallMoatRating,
        moatTrend: row.moatTrend ?? row.moat?.moatTrend,
        operatingMarginPct: row.operatingMarginPct
          ? Number(row.operatingMarginPct)
          : row.facts?.operatingMarginPct,
        revenueGrowthPct: row.revenueGrowthPct
          ? Number(row.revenueGrowthPct)
          : row.facts?.revenueGrowthPct,
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
    };

    this.cachedReports.set(slug, {
      data: reportData,
      timestamp: Date.now(),
    });
    return reportData;
  }
}
