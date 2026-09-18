import fs from "node:fs";
import path from "node:path";
import type { IReportRepository, ReportSummary } from "./types";
import {
  FactsSchema,
  ScenariosSchema,
  CatalystsSchema,
  ReactionsSchema,
  EarningsSentimentSchema,
  FilingExtractsSchema,
  FinancialModelBaselineSchema,
  ValuationSchema,
  MoatCompetitorsSchema,
  AnalystEstimatesSchema,
  type ReportData,
} from "@/lib/schemas";
import { computeValuation, deriveEffectiveBaseline } from "@/lib/valuation";
import { renderReport } from "@/lib/report";

export class FsReportRepository implements IReportRepository {
  private readonly reportsDir: string;

  constructor(reportsDir?: string) {
    this.reportsDir = reportsDir ?? path.join(process.cwd(), "reports");
  }

  async hasReport(slug: string): Promise<boolean> {
    const sanitizedSlug = path.basename(slug);
    const folderPath = path.join(this.reportsDir, sanitizedSlug);
    return fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory();
  }

  async listReports(): Promise<ReportSummary[]> {
    if (!fs.existsSync(this.reportsDir)) {
      return [];
    }

    const entries = fs.readdirSync(this.reportsDir, { withFileTypes: true });
    const reportFolders = entries.filter((e) => e.isDirectory());
    const reports: ReportSummary[] = [];

    for (const folder of reportFolders) {
      const folderPath = path.join(this.reportsDir, folder.name);
      const factsPath = path.join(folderPath, "facts.json");
      const scenariosPath = path.join(folderPath, "scenarios.json");
      const valuationPath = path.join(folderPath, "valuation.json");
      const baselinePath = path.join(folderPath, "stress-baseline.json");
      const sentimentPath = path.join(folderPath, "earnings-sentiment.json");
      const filingPath = path.join(folderPath, "filing-extracts.json");
      const catalystsPath = path.join(folderPath, "catalysts.json");
      const reactionsPath = path.join(folderPath, "reactions.json");
      const moatPath = path.join(folderPath, "moat-competitors.json");
      const estimatesPath = path.join(folderPath, "analyst-estimates.json");

      let ticker: string | undefined;
      let company: string | undefined;
      let quarter: string | undefined;
      let reportDate: string | undefined;
      let currentPrice: number | undefined;
      let operatingMarginPct: number | undefined;
      let revenueGrowthPct: number | undefined;

      if (fs.existsSync(factsPath)) {
        try {
          const raw = fs.readFileSync(factsPath, "utf-8");
          const parsed = JSON.parse(raw);
          ticker = parsed.ticker;
          company = parsed.company;
          quarter = parsed.quarter;
          reportDate = parsed.reportDate;
          currentPrice = parsed.currentPrice;
          operatingMarginPct = parsed.operatingMarginPct;
          revenueGrowthPct = parsed.revenueGrowthPct;
        } catch {
          // ignore parsing error for summary
        }
      }

      let weightedFairValue: number | undefined;
      let upsidePct: number | undefined;
      let baseFairValue: number | undefined;
      let baseUpsidePct: number | undefined;
      let bullFairValue: number | undefined;
      let bearFairValue: number | undefined;

      if (fs.existsSync(valuationPath)) {
        try {
          const vRaw = fs.readFileSync(valuationPath, "utf-8");
          const vParsed = JSON.parse(vRaw);
          weightedFairValue = vParsed.weightedFairValue;
          upsidePct = vParsed.upsidePct;
          if (
            currentPrice === undefined &&
            vParsed.currentPrice !== undefined
          ) {
            currentPrice = vParsed.currentPrice;
          }
          if (Array.isArray(vParsed.scenarioResults)) {
            const baseScen = vParsed.scenarioResults.find(
              (s: { name?: string }) => s.name?.toLowerCase() === "base"
            );
            if (baseScen) {
              baseFairValue = baseScen.fairValue;
              baseUpsidePct = baseScen.upsideFromCurrent;
            }
            const bullScen = vParsed.scenarioResults.find(
              (s: { name?: string }) => s.name?.toLowerCase() === "bull"
            );
            if (bullScen) {
              bullFairValue = bullScen.fairValue;
            }
            const bearScen = vParsed.scenarioResults.find(
              (s: { name?: string }) => s.name?.toLowerCase() === "bear"
            );
            if (bearScen) {
              bearFairValue = bearScen.fairValue;
            }
          }
        } catch {
          // ignore parsing error
        }
      }

      let moatRating: string | undefined;
      let moatTrend: string | undefined;

      if (fs.existsSync(moatPath)) {
        try {
          const mRaw = fs.readFileSync(moatPath, "utf-8");
          const mParsed = JSON.parse(mRaw);
          moatRating = mParsed.overallMoatRating;
          moatTrend = mParsed.moatTrend;
        } catch {
          // ignore parsing error
        }
      }

      let analystTarget: number | undefined;
      let analystUpsidePct: number | undefined;
      let analystRating: string | undefined;
      let analystCount: number | undefined;

      if (fs.existsSync(estimatesPath)) {
        try {
          const eRaw = fs.readFileSync(estimatesPath, "utf-8");
          const eParsed = JSON.parse(eRaw);
          if (typeof eParsed.priceTargets?.average === "number") {
            const avg = eParsed.priceTargets.average;
            analystTarget = avg;
            if (currentPrice && currentPrice > 0) {
              analystUpsidePct = ((avg - currentPrice) / currentPrice) * 100;
            }
          }
          if (eParsed.consensus?.consensus) {
            analystRating = eParsed.consensus.consensus;
          }
          if (eParsed.consensus?.totalAnalysts !== undefined) {
            analystCount = eParsed.consensus.totalAnalysts;
          }
        } catch {
          // ignore parsing error
        }
      }

      // Fallback: check scenarios.json consensusTarget if analyst-estimates.json target was absent
      if (analystTarget === undefined && fs.existsSync(scenariosPath)) {
        try {
          const sRaw = fs.readFileSync(scenariosPath, "utf-8");
          const sParsed = JSON.parse(sRaw);
          if (
            typeof sParsed.consensusTarget === "number" &&
            sParsed.consensusTarget > 0
          ) {
            const cTarget = sParsed.consensusTarget;
            analystTarget = cTarget;
            if (currentPrice && currentPrice > 0) {
              analystUpsidePct = ((cTarget - currentPrice) / currentPrice) * 100;
            }
          }
        } catch {
          // ignore parsing error
        }
      }

      reports.push({
        slug: folder.name,
        name: folder.name,
        ticker,
        company,
        quarter,
        reportDate,
        currentPrice,
        weightedFairValue,
        upsidePct,
        baseFairValue,
        baseUpsidePct,
        bullFairValue,
        bearFairValue,
        moatRating,
        moatTrend,
        operatingMarginPct,
        revenueGrowthPct,
        analystTarget,
        analystUpsidePct,
        analystRating,
        analystCount,
        hasFacts: fs.existsSync(factsPath),
        hasScenarios: fs.existsSync(scenariosPath),
        hasValuation: fs.existsSync(valuationPath),
        hasBaseline: fs.existsSync(baselinePath),
        hasSentiment: fs.existsSync(sentimentPath),
        hasFiling: fs.existsSync(filingPath),
        hasCatalysts: fs.existsSync(catalystsPath),
        hasReactions: fs.existsSync(reactionsPath),
        hasEstimates: fs.existsSync(estimatesPath),
      });
    }

    // Sort: most recent or alphabetical
    reports.sort((a, b) => (b.slug > a.slug ? 1 : -1));
    return reports;
  }

  async getReport(slug: string): Promise<ReportData | null> {
    const sanitizedSlug = path.basename(slug);
    const reportDir = path.join(this.reportsDir, sanitizedSlug);

    if (!fs.existsSync(reportDir)) {
      return null;
    }

    const readFileJson = (filename: string) => {
      const p = path.join(reportDir, filename);
      if (!fs.existsSync(p)) return null;
      try {
        const content = fs.readFileSync(p, "utf-8");
        return JSON.parse(content);
      } catch (err) {
        console.warn(`Failed to parse JSON for ${filename}:`, err);
        return null;
      }
    };

    const readFileText = (filename: string) => {
      const p = path.join(reportDir, filename);
      if (!fs.existsSync(p)) return null;
      try {
        return fs.readFileSync(p, "utf-8");
      } catch {
        return null;
      }
    };

    const factsRaw = readFileJson("facts.json");
    const scenariosRaw = readFileJson("scenarios.json");

    if (!factsRaw || !scenariosRaw) {
      return null;
    }

    const facts = FactsSchema.parse(factsRaw);
    const scenarios = ScenariosSchema.parse(scenariosRaw);

    const catalystsRaw = readFileJson("catalysts.json");
    const reactionsRaw = readFileJson("reactions.json");
    const sentimentRaw = readFileJson("earnings-sentiment.json");
    const filingRaw = readFileJson("filing-extracts.json");
    const baselineRaw = readFileJson("stress-baseline.json");
    const valuationRaw = readFileJson("valuation.json");
    const moatRaw = readFileJson("moat-competitors.json");
    const estimatesRaw = readFileJson("analyst-estimates.json");

    const catalysts = catalystsRaw
      ? CatalystsSchema.safeParse(catalystsRaw).data
      : undefined;
    const reactions = reactionsRaw
      ? ReactionsSchema.safeParse(reactionsRaw).data
      : undefined;
    const sentiment = sentimentRaw
      ? EarningsSentimentSchema.safeParse(sentimentRaw).data
      : undefined;
    const filing = filingRaw
      ? FilingExtractsSchema.safeParse(filingRaw).data
      : undefined;
    const moat = moatRaw
      ? MoatCompetitorsSchema.safeParse(moatRaw).data
      : undefined;
    const estimates = estimatesRaw
      ? AnalystEstimatesSchema.safeParse(estimatesRaw).data
      : undefined;

    let baseline = baselineRaw
      ? FinancialModelBaselineSchema.safeParse(baselineRaw).data
      : (scenarios.baseline ?? undefined);

    if (!baseline) {
      baseline = deriveEffectiveBaseline(facts);
    }

    let valuation = valuationRaw
      ? ValuationSchema.safeParse(valuationRaw).data
      : undefined;

    if (!valuation) {
      valuation = computeValuation({ facts, scenarios, baseline });
    }

    const factsZhRaw = readFileJson("facts_zh.json");
    const catalystsZhRaw = readFileJson("catalysts_zh.json");
    const scenariosZhRaw = readFileJson("scenarios_zh.json");
    const sentimentZhRaw = readFileJson("earnings-sentiment_zh.json");
    const filingZhRaw = readFileJson("filing-extracts_zh.json");
    const reactionsZhRaw = readFileJson("reactions_zh.json");
    const moatZhRaw = readFileJson("moat-competitors_zh.json");
    const estimatesZhRaw = readFileJson("analyst-estimates_zh.json");

    const factsZh = factsZhRaw
      ? FactsSchema.safeParse(factsZhRaw).data
      : undefined;
    const catalystsZh = catalystsZhRaw
      ? CatalystsSchema.safeParse(catalystsZhRaw).data
      : undefined;
    const scenariosZh = scenariosZhRaw
      ? ScenariosSchema.safeParse(scenariosZhRaw).data
      : undefined;
    const sentimentZh = sentimentZhRaw
      ? EarningsSentimentSchema.safeParse(sentimentZhRaw).data
      : undefined;
    const filingZh = filingZhRaw
      ? FilingExtractsSchema.safeParse(filingZhRaw).data
      : undefined;
    const reactionsZh = reactionsZhRaw
      ? ReactionsSchema.safeParse(reactionsZhRaw).data
      : undefined;
    const moatZh = moatZhRaw
      ? MoatCompetitorsSchema.safeParse(moatZhRaw).data
      : undefined;
    const estimatesZh = estimatesZhRaw
      ? AnalystEstimatesSchema.safeParse(estimatesZhRaw).data
      : undefined;

    let reportMarkdown = readFileText("report.md") ?? undefined;
    let reportMarkdownZh = readFileText("report_zh.md") ?? undefined;

    if (!reportMarkdown && valuation) {
      reportMarkdown = renderReport(
        { facts, catalysts, valuation, reactions, moat, estimates },
        { language: "en" }
      );
    }
    if (!reportMarkdownZh && valuation) {
      reportMarkdownZh = renderReport(
        {
          facts: factsZh ?? facts,
          catalysts: catalystsZh ?? catalysts,
          valuation,
          reactions: reactionsZh ?? reactions,
          moat: moatZh ?? moat,
          estimates: estimatesZh ?? estimates,
        },
        { language: "zh" }
      );
    }

    return {
      folderSlug: sanitizedSlug,
      folderName: sanitizedSlug,
      facts,
      catalysts,
      scenarios,
      valuation,
      reactions,
      sentiment,
      filing,
      baseline,
      moat,
      estimates,
      factsZh,
      catalystsZh,
      scenariosZh,
      sentimentZh,
      filingZh,
      reactionsZh,
      moatZh,
      estimatesZh,
      reportMarkdown,
      reportMarkdownZh,
    };
  }
}
