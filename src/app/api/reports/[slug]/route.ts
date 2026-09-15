import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import {
  FactsSchema,
  ScenariosSchema,
  CatalystsSchema,
  ReactionsSchema,
  EarningsSentimentSchema,
  FilingExtractsSchema,
  FinancialModelBaselineSchema,
  ValuationSchema,
} from "@/lib/schemas";
import { computeValuation, deriveEffectiveBaseline } from "@/lib/valuation";
import { renderReport } from "@/lib/report";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const sanitizedSlug = path.basename(slug);
    const reportDir = path.join(process.cwd(), "reports", sanitizedSlug);

    if (!fs.existsSync(reportDir)) {
      return NextResponse.json(
        { error: `Report folder not found: ${sanitizedSlug}` },
        { status: 404 }
      );
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
      return NextResponse.json(
        { error: "Minimum required artifacts (facts.json and scenarios.json) are missing in folder." },
        { status: 400 }
      );
    }

    const facts = FactsSchema.parse(factsRaw);
    const scenarios = ScenariosSchema.parse(scenariosRaw);

    // Optional files
    const catalystsRaw = readFileJson("catalysts.json");
    const reactionsRaw = readFileJson("reactions.json");
    const sentimentRaw = readFileJson("earnings-sentiment.json");
    const filingRaw = readFileJson("filing-extracts.json");
    const baselineRaw = readFileJson("stress-baseline.json");
    const valuationRaw = readFileJson("valuation.json");
    const catalysts = catalystsRaw ? CatalystsSchema.safeParse(catalystsRaw).data : undefined;
    const reactions = reactionsRaw ? ReactionsSchema.safeParse(reactionsRaw).data : undefined;
    const sentiment = sentimentRaw ? EarningsSentimentSchema.safeParse(sentimentRaw).data : undefined;
    const filing = filingRaw ? FilingExtractsSchema.safeParse(filingRaw).data : undefined;

    let baseline = baselineRaw
      ? FinancialModelBaselineSchema.safeParse(baselineRaw).data
      : (scenarios.baseline ?? undefined);

    if (!baseline) {
      baseline = deriveEffectiveBaseline(facts);
    }

    let valuation = valuationRaw ? ValuationSchema.safeParse(valuationRaw).data : undefined;

    if (!valuation) {
      valuation = computeValuation({ facts, scenarios, baseline });
    }

    let reportMarkdown = readFileText("report.md");
    let reportMarkdownZh = readFileText("report_zh.md");

    if (!reportMarkdown && valuation) {
      reportMarkdown = renderReport(
        { facts, catalysts, valuation, reactions },
        { language: "en" }
      );
    }
    if (!reportMarkdownZh && valuation) {
      reportMarkdownZh = renderReport(
        { facts, catalysts, valuation, reactions },
        { language: "zh" }
      );
    }

    const factsZhRaw = readFileJson("facts_zh.json");
    const catalystsZhRaw = readFileJson("catalysts_zh.json");
    const scenariosZhRaw = readFileJson("scenarios_zh.json");
    const sentimentZhRaw = readFileJson("earnings-sentiment_zh.json");
    const filingZhRaw = readFileJson("filing-extracts_zh.json");
    const reactionsZhRaw = readFileJson("reactions_zh.json");

    const factsZh = factsZhRaw ? FactsSchema.safeParse(factsZhRaw).data : undefined;
    const catalystsZh = catalystsZhRaw ? CatalystsSchema.safeParse(catalystsZhRaw).data : undefined;
    const scenariosZh = scenariosZhRaw ? ScenariosSchema.safeParse(scenariosZhRaw).data : undefined;
    const sentimentZh = sentimentZhRaw ? EarningsSentimentSchema.safeParse(sentimentZhRaw).data : undefined;
    const filingZh = filingZhRaw ? FilingExtractsSchema.safeParse(filingZhRaw).data : undefined;
    const reactionsZh = reactionsZhRaw ? ReactionsSchema.safeParse(reactionsZhRaw).data : undefined;

    return NextResponse.json({
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
      factsZh,
      catalystsZh,
      scenariosZh,
      sentimentZh,
      filingZh,
      reactionsZh,
      reportMarkdown,
      reportMarkdownZh,
    });
  } catch (error) {
    console.error("Error loading report:", error);
    return NextResponse.json(
      { error: "Failed to load report", details: String(error) },
      { status: 500 }
    );
  }
}
