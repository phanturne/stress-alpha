import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { reportsTable, tickersTable } from "@/db/schema";
import type { IReportRepository, ReportSummary } from "./types";
import type { ReportData, Valuation } from "@/lib/schemas";
import { computeSnowflakeScore } from "@/lib/snowflake";

export class DrizzleReportRepository implements IReportRepository {
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
    const db = getDb();

    const rows = await db
      .select({
        report: reportsTable,
        tickerInfo: tickersTable,
      })
      .from(reportsTable)
      .leftJoin(tickersTable, eq(reportsTable.ticker, tickersTable.ticker))
      .orderBy(desc(reportsTable.publishedAt));

    const summaries: ReportSummary[] = [];

    for (const { report, tickerInfo } of rows) {
      const effectivePrice = Number(
        tickerInfo?.currentPrice ?? report.reportPrice
      );
      const weightedFairValue = Number(report.weightedFairValue);
      const baseFairValue = Number(report.baseFairValue);
      const bullFairValue = Number(report.bullFairValue);
      const bearFairValue = Number(report.bearFairValue);

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

      if (report.estimates?.priceTargets?.average) {
        analystTarget = report.estimates.priceTargets.average;
        if (effectivePrice > 0) {
          analystUpsidePct = Number(
            (((analystTarget - effectivePrice) / effectivePrice) * 100).toFixed(
              2
            )
          );
        }
      }
      if (report.estimates?.consensus) {
        analystRating = report.estimates.consensus.consensus;
        analystCount = report.estimates.consensus.totalAnalysts;
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
      if (report.facts && report.scenarios) {
        try {
          const reportPayload: ReportData = {
            folderSlug: report.slug,
            folderName: report.slug,
            facts: report.facts,
            valuation: (report.valuation as Valuation) ?? undefined,
            scenarios: report.scenarios,
            baseline: report.baseline ?? undefined,
            moat: report.moat ?? undefined,
            catalysts: report.catalysts ?? undefined,
            estimates: report.estimates ?? undefined,
            filing: report.filing ?? undefined,
          };
          const res = computeSnowflakeScore(reportPayload);
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
          // ignore snowflake computation error in summary listing
        }
      }

      summaries.push({
        slug: report.slug,
        name: report.slug,
        ticker: report.ticker,
        company: tickerInfo?.company ?? report.facts?.company,
        quarter: report.quarter,
        reportDate: report.reportDate,
        currentPrice: effectivePrice,
        weightedFairValue,
        upsidePct,
        baseFairValue,
        baseUpsidePct,
        bullFairValue,
        bearFairValue,
        moatRating: report.moatRating ?? report.moat?.overallMoatRating,
        moatTrend: report.moatTrend ?? report.moat?.moatTrend,
        operatingMarginPct: report.operatingMarginPct
          ? Number(report.operatingMarginPct)
          : report.facts?.operatingMarginPct,
        revenueGrowthPct: report.revenueGrowthPct
          ? Number(report.revenueGrowthPct)
          : report.facts?.revenueGrowthPct,
        analystTarget,
        analystUpsidePct,
        analystRating,
        analystCount,
        snowflakeScore,
        snowflakeTier,
        snowflakePillars,
        hasFacts: !!report.facts,
        hasScenarios: !!report.scenarios,
        hasValuation: !!report.valuation,
        hasBaseline: !!report.baseline,
        hasSentiment: !!report.sentiment,
        hasFiling: !!report.filing,
        hasCatalysts: !!report.catalysts,
        hasReactions: !!report.reactions,
        hasEstimates: !!report.estimates,
      });
    }

    return summaries;
  }

  async getReport(slug: string): Promise<ReportData | null> {
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

    // Decorate facts and valuation in-memory with live price if different
    const facts = { ...report.facts };
    let valuation: Valuation | undefined = report.valuation
      ? { ...report.valuation }
      : undefined;

    if (effectivePrice > 0 && effectivePrice !== Number(report.reportPrice)) {
      facts.currentPrice = effectivePrice;
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

    return {
      folderSlug: report.slug,
      folderName: report.slug,
      facts,
      scenarios: report.scenarios,
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
      factsZh: report.factsZh ?? undefined,
      scenariosZh: report.scenariosZh ?? undefined,
      reportMarkdown: report.reportMd ?? undefined,
      reportMarkdownZh: report.reportMdZh ?? undefined,
    };
  }
}
