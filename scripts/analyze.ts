#!/usr/bin/env node
/**
 * CLI runner for the deterministic StressAlpha valuation pipeline.
 *
 * Usage:
 *   npx tsx scripts/analyze.ts reports/AMZN-Q2-2026-analysis
 *   npm run analyze -- reports/LITE-Q4-2026-analysis
 */

import fs from "node:fs";
import path from "node:path";
import * as dotenv from "dotenv";
import {
  FactsSchema,
  CatalystsSchema,
  ScenariosSchema,
  ReactionsSchema,
  FinancialModelBaselineSchema,
  ValuationSchema,
  MoatCompetitorsSchema,
  AnalystEstimatesSchema,
  EarningsSentimentSchema,
  FilingExtractsSchema,
  type Reactions,
  type FinancialModelBaseline,
  type MoatCompetitors,
  type AnalystEstimates,
  type EarningsSentiment,
  type FilingExtracts,
} from "../src/lib/schemas.js";
import {
  computeValuation,
  deriveEffectiveBaseline,
} from "../src/lib/valuation.js";
import { renderReport } from "../src/lib/report.js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

function parseYear(quarterStr: string, slug: string): number {
  const match =
    quarterStr.match(/\b(20\d{2})\b/) ?? slug.match(/\b(20\d{2})\b/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return new Date().getFullYear();
}

async function main() {
  const targetArg = process.argv[2];

  if (!targetArg) {
    console.error("Usage: npm run analyze -- <report-directory-or-slug>");
    console.error("Example: npm run analyze -- reports/AMZN-Q2-2026-analysis");
    process.exit(1);
  }

  let absRunDir = path.resolve(targetArg);
  if (!fs.existsSync(absRunDir)) {
    const inReportsDir = path.resolve(process.cwd(), "reports", targetArg);
    if (fs.existsSync(inReportsDir)) {
      absRunDir = inReportsDir;
    } else {
      console.error(`❌ Report directory not found: ${absRunDir}`);
      process.exit(1);
    }
  }

  console.log(
    `\n📂 [StressAlpha Engine] Loading artifacts from: ${absRunDir}\n`
  );

  const facts = loadAndValidate(absRunDir, "facts.json", FactsSchema);
  const scenarios = loadAndValidate(
    absRunDir,
    "scenarios.json",
    ScenariosSchema
  );

  let catalysts;
  const catalystsPath = path.join(absRunDir, "catalysts.json");
  if (fs.existsSync(catalystsPath)) {
    catalysts = loadAndValidate(absRunDir, "catalysts.json", CatalystsSchema);
  }

  let reactions: Reactions | undefined;
  const reactionsPath = path.join(absRunDir, "reactions.json");
  if (fs.existsSync(reactionsPath)) {
    reactions = loadAndValidate(absRunDir, "reactions.json", ReactionsSchema);
  }

  let moat: MoatCompetitors | undefined;
  const moatPath = path.join(absRunDir, "moat-competitors.json");
  if (fs.existsSync(moatPath)) {
    moat = loadAndValidate(
      absRunDir,
      "moat-competitors.json",
      MoatCompetitorsSchema
    );
  }

  let moatZh: MoatCompetitors | undefined;
  const moatZhPath = path.join(absRunDir, "moat-competitors_zh.json");
  if (fs.existsSync(moatZhPath)) {
    moatZh = loadAndValidate(
      absRunDir,
      "moat-competitors_zh.json",
      MoatCompetitorsSchema
    );
  }

  let estimates: AnalystEstimates | undefined;
  const estimatesPath = path.join(absRunDir, "analyst-estimates.json");
  if (fs.existsSync(estimatesPath)) {
    estimates = loadAndValidate(
      absRunDir,
      "analyst-estimates.json",
      AnalystEstimatesSchema
    );
  }

  let estimatesZh: AnalystEstimates | undefined;
  const estimatesZhPath = path.join(absRunDir, "analyst-estimates_zh.json");
  if (fs.existsSync(estimatesZhPath)) {
    estimatesZh = loadAndValidate(
      absRunDir,
      "analyst-estimates_zh.json",
      AnalystEstimatesSchema
    );
  }

  let sentiment: EarningsSentiment | undefined;
  const sentimentPath = path.join(absRunDir, "earnings-sentiment.json");
  if (fs.existsSync(sentimentPath)) {
    sentiment = loadAndValidate(
      absRunDir,
      "earnings-sentiment.json",
      EarningsSentimentSchema
    );
  }

  let filing: FilingExtracts | undefined;
  const filingPath = path.join(absRunDir, "filing-extracts.json");
  if (fs.existsSync(filingPath)) {
    filing = loadAndValidate(
      absRunDir,
      "filing-extracts.json",
      FilingExtractsSchema
    );
  }

  let factsZh: any;
  const factsZhPath = path.join(absRunDir, "facts_zh.json");
  if (fs.existsSync(factsZhPath)) {
    factsZh = loadAndValidate(absRunDir, "facts_zh.json", FactsSchema);
  }

  let scenariosZh: any;
  const scenariosZhPath = path.join(absRunDir, "scenarios_zh.json");
  if (fs.existsSync(scenariosZhPath)) {
    scenariosZh = loadAndValidate(
      absRunDir,
      "scenarios_zh.json",
      ScenariosSchema
    );
  }

  let catalystsZh: any;
  const catalystsZhPath = path.join(absRunDir, "catalysts_zh.json");
  if (fs.existsSync(catalystsZhPath)) {
    catalystsZh = loadAndValidate(
      absRunDir,
      "catalysts_zh.json",
      CatalystsSchema
    );
  }

  let sentimentZh: EarningsSentiment | undefined;
  const sentimentZhPath = path.join(absRunDir, "earnings-sentiment_zh.json");
  if (fs.existsSync(sentimentZhPath)) {
    sentimentZh = loadAndValidate(
      absRunDir,
      "earnings-sentiment_zh.json",
      EarningsSentimentSchema
    );
  }

  let filingZh: FilingExtracts | undefined;
  const filingZhPath = path.join(absRunDir, "filing-extracts_zh.json");
  if (fs.existsSync(filingZhPath)) {
    filingZh = loadAndValidate(
      absRunDir,
      "filing-extracts_zh.json",
      FilingExtractsSchema
    );
  }

  let reactionsZh: Reactions | undefined;
  const reactionsZhPath = path.join(absRunDir, "reactions_zh.json");
  if (fs.existsSync(reactionsZhPath)) {
    reactionsZh = loadAndValidate(
      absRunDir,
      "reactions_zh.json",
      ReactionsSchema
    );
  }

  let baseline: FinancialModelBaseline | undefined = scenarios.baseline;
  const baselinePath = path.join(absRunDir, "stress-baseline.json");
  if (fs.existsSync(baselinePath)) {
    baseline = loadAndValidate(
      absRunDir,
      "stress-baseline.json",
      FinancialModelBaselineSchema
    );
  } else if (!baseline) {
    baseline = deriveEffectiveBaseline(facts);
    console.log("  ℹ️  Derived baseline from facts");
  }

  console.log("\n🧮 Running deterministic StressAlpha calculation...\n");
  const valuation = computeValuation({
    facts,
    scenarios,
    baseline,
    moat,
    estimates,
  });
  const validatedValuation = ValuationSchema.parse(valuation);

  const valuationPath = path.join(absRunDir, "valuation.json");
  fs.writeFileSync(valuationPath, JSON.stringify(validatedValuation, null, 2));
  console.log(`  📄 Output written: ${valuationPath}`);

  const reportMd = renderReport(
    {
      facts,
      catalysts,
      valuation: validatedValuation,
      reactions,
      moat,
      estimates,
    },
    { language: "en" }
  );
  const reportPath = path.join(absRunDir, "report.md");
  fs.writeFileSync(reportPath, reportMd);
  console.log(`  📄 Output written (EN): ${reportPath}`);

  const reportZhMd = renderReport(
    {
      facts: factsZh ?? facts,
      catalysts: catalystsZh ?? catalysts,
      valuation: validatedValuation,
      reactions: reactionsZh ?? reactions,
      moat: moatZh ?? moat,
      estimates: estimatesZh ?? estimates,
    },
    { language: "zh" }
  );
  const reportZhPath = path.join(absRunDir, "report_zh.md");
  fs.writeFileSync(reportZhPath, reportZhMd);
  console.log(`  📄 Output written (ZH): ${reportZhPath}`);

  console.log("\n" + "═".repeat(64));
  console.log(
    `  ${facts.ticker} (${facts.company}) — ${facts.quarter} STRESS REPORT`
  );
  console.log("═".repeat(64));
  console.log(`  Stock Price:          $${validatedValuation.currentPrice}`);
  console.log(
    `  Weighted Fair Value:  $${validatedValuation.weightedFairValue} (${validatedValuation.upsidePct > 0 ? "+" : ""}${validatedValuation.upsidePct}%)`
  );
  if (moat) {
    console.log(
      `  Economic Moat:        ${moat.overallMoatRating} Moat (Trend: ${moat.moatTrend})`
    );
  }
  if (estimates) {
    console.log(
      `  Analyst Consensus:    ${estimates.consensus.consensus} (${estimates.consensus.totalAnalysts} analysts, Target: $${estimates.priceTargets.average})`
    );
  }
  console.log(`  Clean Operating EPS:  $${facts.epsOperating}`);
  console.log(`  Consensus PT:         $${validatedValuation.consensusTarget}`);
  console.log(
    `  Verdict:              ${validatedValuation.verdictVsConsensus}`
  );

  if (validatedValuation.calibrationAudit) {
    const ca = validatedValuation.calibrationAudit;
    console.log(
      `  QPCE Calibration:     ${ca.skewDirection} (Veto: ${
        ca.governanceVetoTriggered ? "🚨 ACTIVE" : "None"
      })`
    );
    const probStr = Object.entries(ca.calibratedProbabilities)
      .map(([name, p]) => `${name}: ${Math.round(p * 100)}%`)
      .join(" | ");
    console.log(`  Calibrated Probs:     ${probStr}`);
  }

  if (validatedValuation.stressTest) {
    const st = validatedValuation.stressTest;
    console.log("\n" + "─".repeat(64));
    console.log("  ⚡ StressAlpha Dynamic Regimes:");
    console.log("─".repeat(64));
    console.log(
      `    🐂 Bull Regime  (${st.valuationBands.bull.multiple}x):  $${st.valuationBands.bull.targetPrice} (${st.valuationBands.bull.deltaFromCurrentPct > 0 ? "+" : ""}${st.valuationBands.bull.deltaFromCurrentPct}%)`
    );
    console.log(
      `    ⚖️ Base Regime  (${st.valuationBands.base.multiple}x):  $${st.valuationBands.base.targetPrice} (${st.valuationBands.base.deltaFromCurrentPct > 0 ? "+" : ""}${st.valuationBands.base.deltaFromCurrentPct}%)`
    );
    console.log(
      `    🚨 Panic Floor  (${st.valuationBands.panic.multiple}x):  $${st.valuationBands.panic.targetPrice} (${st.valuationBands.panic.deltaFromCurrentPct > 0 ? "+" : ""}${st.valuationBands.panic.deltaFromCurrentPct}%)`
    );
    console.log(`    Downside to Panic:  ${st.asymmetry.downsideToPanicPct}%`);
    console.log(`    Risk/Reward Ratio:  ${st.asymmetry.riskRewardRatio}x`);
  }

  const slug = path.basename(absRunDir);

  // Database Persistence: Save directly to Neon if configured
  if (process.env.DATABASE_URL) {
    try {
      const { getDb } = await import("../src/db/index.js");
      const { tickersTable, reportsTable } =
        await import("../src/db/schema.js");
      const db = getDb();

      console.log(
        "\n💾 [Neon Database] Persisting report and ticker to database..."
      );

      // 1. Ensure ticker exists in tickersTable
      await db
        .insert(tickersTable)
        .values({
          ticker: facts.ticker,
          company: facts.company,
          currentPrice: String(validatedValuation.currentPrice),
          marketCap: facts.marketCapBillions
            ? String(facts.marketCapBillions)
            : null,
          currency: "USD",
          priceUpdatedAt: new Date(),
          active: true,
        })
        .onConflictDoUpdate({
          target: tickersTable.ticker,
          set: {
            company: facts.company,
            marketCap: facts.marketCapBillions
              ? String(facts.marketCapBillions)
              : null,
          },
        });

      // 2. Extract base/bull/bear fair values
      let baseFairValue = validatedValuation.weightedFairValue;
      let bullFairValue = validatedValuation.weightedFairValue;
      let bearFairValue = validatedValuation.weightedFairValue;

      if (validatedValuation.scenarioResults) {
        const baseScen = validatedValuation.scenarioResults.find(
          (s) =>
            s.name.toLowerCase() === "base" ||
            s.name.toLowerCase() === "base case"
        );
        const bullScen = validatedValuation.scenarioResults.find(
          (s) =>
            s.name.toLowerCase() === "bull" ||
            s.name.toLowerCase() === "bull case"
        );
        const bearScen = validatedValuation.scenarioResults.find(
          (s) =>
            s.name.toLowerCase() === "bear" ||
            s.name.toLowerCase() === "bear case" ||
            s.name.toLowerCase() === "panic" ||
            s.name.toLowerCase() === "panic case" ||
            s.name.toLowerCase() === "panic floor"
        );
        if (baseScen) baseFairValue = baseScen.fairValue;
        if (bullScen) bullFairValue = bullScen.fairValue;
        if (bearScen) bearFairValue = bearScen.fairValue;
      }

      const panicFairValue =
        validatedValuation.stressTest?.valuationBands?.panic?.targetPrice;
      const year = parseYear(facts.quarter, slug);

      await db
        .insert(reportsTable)
        .values({
          slug,
          ticker: facts.ticker,
          quarter: facts.quarter,
          year,
          reportDate: facts.reportDate,
          status: "published",
          reportPrice: String(validatedValuation.currentPrice),
          weightedFairValue: String(validatedValuation.weightedFairValue),
          baseFairValue: String(baseFairValue),
          bullFairValue: String(bullFairValue),
          bearFairValue: String(bearFairValue),
          panicFairValue: panicFairValue ? String(panicFairValue) : null,
          moatRating: moat?.overallMoatRating ?? null,
          moatTrend: moat?.moatTrend ?? null,
          operatingMarginPct:
            facts.operatingMarginPct != null
              ? String(facts.operatingMarginPct)
              : null,
          revenueGrowthPct:
            facts.revenueGrowthPct != null
              ? String(facts.revenueGrowthPct)
              : null,
          facts,
          scenarios,
          valuation: validatedValuation,
          baseline,
          moat,
          moatZh,
          estimates,
          estimatesZh,
          catalysts,
          sentiment,
          filing,
          reactions,
          factsZh,
          scenariosZh,
          catalystsZh,
          sentimentZh,
          filingZh,
          reactionsZh,
          reportMd,
          reportMdZh: reportZhMd,
          publishedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: reportsTable.slug,
          set: {
            reportPrice: String(validatedValuation.currentPrice),
            weightedFairValue: String(validatedValuation.weightedFairValue),
            baseFairValue: String(baseFairValue),
            bullFairValue: String(bullFairValue),
            bearFairValue: String(bearFairValue),
            panicFairValue: panicFairValue ? String(panicFairValue) : null,
            moatRating: moat?.overallMoatRating ?? null,
            moatTrend: moat?.moatTrend ?? null,
            operatingMarginPct:
              facts.operatingMarginPct != null
                ? String(facts.operatingMarginPct)
                : null,
            revenueGrowthPct:
              facts.revenueGrowthPct != null
                ? String(facts.revenueGrowthPct)
                : null,
            facts,
            scenarios,
            valuation: validatedValuation,
            baseline,
            moat,
            moatZh,
            estimates,
            estimatesZh,
            catalysts,
            sentiment,
            filing,
            reactions,
            factsZh,
            scenariosZh,
            catalystsZh,
            sentimentZh,
            filingZh,
            reactionsZh,
            reportMd,
            reportMdZh: reportZhMd,
            updatedAt: new Date(),
          },
        });

      console.log(`  ✅ Successfully persisted ${slug} to Neon PostgreSQL!`);
    } catch (dbErr) {
      console.warn(
        "  ⚠️ Failed to save to database (local files intact):",
        dbErr
      );
    }
  } else {
    console.log(
      "  ℹ️  DATABASE_URL not set — skipped database persistence (local files written)."
    );
  }

  console.log("\n" + "═".repeat(64));
  console.log(`  🌐 View in StressAlpha Web Application:`);
  console.log(`     http://localhost:3000/?report=${encodeURIComponent(slug)}`);
  console.log("═".repeat(64) + "\n");
}

function loadAndValidate<T>(
  dir: string,
  filename: string,
  schema: { parse: (data: unknown) => T }
): T {
  const filepath = path.join(dir, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`Missing required file: ${filepath}`);
  }
  const content = fs.readFileSync(filepath, "utf-8");
  const parsed = JSON.parse(content);
  const validated = schema.parse(parsed);
  console.log(`  ✅ ${filename} validated`);
  return validated;
}

main().catch((err) => {
  console.error("❌ Fatal execution error:", err);
  process.exit(1);
});
