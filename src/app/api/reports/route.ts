import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export interface ReportSummary {
  slug: string;
  name: string;
  ticker?: string;
  company?: string;
  quarter?: string;
  reportDate?: string;
  currentPrice?: number;
  weightedFairValue?: number;
  upsidePct?: number;
  baseFairValue?: number;
  baseUpsidePct?: number;
  bullFairValue?: number;
  bearFairValue?: number;
  moatRating?: string;
  moatTrend?: string;
  operatingMarginPct?: number;
  revenueGrowthPct?: number;
  hasFacts: boolean;
  hasScenarios: boolean;
  hasValuation: boolean;
  hasBaseline: boolean;
  hasSentiment: boolean;
  hasFiling: boolean;
  hasCatalysts: boolean;
  hasReactions: boolean;
  hasEstimates: boolean;
}

export async function GET() {
  try {
    const reportsDir = path.join(process.cwd(), "reports");
    
    if (!fs.existsSync(reportsDir)) {
      return NextResponse.json({ reports: [] });
    }

    const entries = fs.readdirSync(reportsDir, { withFileTypes: true });
    const reportFolders = entries.filter((e) => e.isDirectory());

    const reports: ReportSummary[] = [];

    for (const folder of reportFolders) {
      const folderPath = path.join(reportsDir, folder.name);
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
          if (currentPrice === undefined && vParsed.currentPrice !== undefined) {
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

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error reading reports directory:", error);
    return NextResponse.json(
      { error: "Failed to list reports", details: String(error) },
      { status: 500 }
    );
  }
}
