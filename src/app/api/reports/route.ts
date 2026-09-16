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

      let ticker: string | undefined;
      let company: string | undefined;
      let quarter: string | undefined;
      let reportDate: string | undefined;
      let currentPrice: number | undefined;

      if (fs.existsSync(factsPath)) {
        try {
          const raw = fs.readFileSync(factsPath, "utf-8");
          const parsed = JSON.parse(raw);
          ticker = parsed.ticker;
          company = parsed.company;
          quarter = parsed.quarter;
          reportDate = parsed.reportDate;
          currentPrice = parsed.currentPrice;
        } catch {
          // ignore parsing error for summary
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
        hasFacts: fs.existsSync(factsPath),
        hasScenarios: fs.existsSync(scenariosPath),
        hasValuation: fs.existsSync(valuationPath),
        hasBaseline: fs.existsSync(baselinePath),
        hasSentiment: fs.existsSync(sentimentPath),
        hasFiling: fs.existsSync(filingPath),
        hasCatalysts: fs.existsSync(catalystsPath),
        hasReactions: fs.existsSync(reactionsPath),
        hasEstimates: fs.existsSync(path.join(folderPath, "analyst-estimates.json")),
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
