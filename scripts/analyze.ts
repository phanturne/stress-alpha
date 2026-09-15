#!/usr/bin/env node
/**
 * CLI runner for the deterministic StressAlpha valuation pipeline.
 *
 * Usage:
 *   npx ts-node scripts/analyze.ts reports/AMZN-Q2-2026-analysis
 *   npm run analyze -- reports/LITE-Q4-2026-analysis
 */

import fs from "node:fs";
import path from "node:path";
import {
  FactsSchema,
  CatalystsSchema,
  ScenariosSchema,
  ReactionsSchema,
  FinancialModelBaselineSchema,
  ValuationSchema,
  type Reactions,
  type FinancialModelBaseline,
} from "../src/lib/schemas.js";
import { computeValuation, deriveEffectiveBaseline } from "../src/lib/valuation.js";
import { renderReport } from "../src/lib/report.js";

function main() {
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

  console.log(`\n📂 [StressAlpha Engine] Loading artifacts from: ${absRunDir}\n`);

  const facts = loadAndValidate(absRunDir, "facts.json", FactsSchema);
  const scenarios = loadAndValidate(absRunDir, "scenarios.json", ScenariosSchema);

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

  let baseline: FinancialModelBaseline | undefined = scenarios.baseline;
  const baselinePath = path.join(absRunDir, "stress-baseline.json");
  if (fs.existsSync(baselinePath)) {
    baseline = loadAndValidate(absRunDir, "stress-baseline.json", FinancialModelBaselineSchema);
    console.log("  ✅ stress-baseline.json validated");
  } else if (!baseline) {
    baseline = deriveEffectiveBaseline(facts);
    console.log("  ℹ️  Derived baseline from facts");
  }

  console.log("\n🧮 Running deterministic StressAlpha calculation...\n");
  const valuation = computeValuation({ facts, scenarios, baseline });
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
    },
    { language: "en" }
  );
  const reportPath = path.join(absRunDir, "report.md");
  fs.writeFileSync(reportPath, reportMd);
  console.log(`  📄 Output written (EN): ${reportPath}`);

  const reportZhMd = renderReport(
    {
      facts,
      catalysts,
      valuation: validatedValuation,
      reactions,
    },
    { language: "zh" }
  );
  const reportZhPath = path.join(absRunDir, "report_zh.md");
  fs.writeFileSync(reportZhPath, reportZhMd);
  console.log(`  📄 Output written (ZH): ${reportZhPath}`);

  console.log("\n" + "═".repeat(64));
  console.log(`  ${facts.ticker} (${facts.company}) — ${facts.quarter} STRESS REPORT`);
  console.log("═".repeat(64));
  console.log(`  Stock Price:          $${validatedValuation.currentPrice}`);
  console.log(`  Weighted Fair Value:  $${validatedValuation.weightedFairValue} (${validatedValuation.upsidePct > 0 ? "+" : ""}${validatedValuation.upsidePct}%)`);
  console.log(`  Clean Operating EPS:  $${facts.epsOperating}`);
  console.log(`  Consensus PT:         $${validatedValuation.consensusTarget}`);
  console.log(`  Verdict:              ${validatedValuation.verdictVsConsensus}`);

  if (validatedValuation.stressTest) {
    const st = validatedValuation.stressTest;
    console.log("\n" + "─".repeat(64));
    console.log("  ⚡ StressAlpha Dynamic Regimes:");
    console.log("─".repeat(64));
    console.log(`    🐂 Bull Regime  (${st.valuationBands.bull.multiple}x):  $${st.valuationBands.bull.targetPrice} (${st.valuationBands.bull.deltaFromCurrentPct > 0 ? "+" : ""}${st.valuationBands.bull.deltaFromCurrentPct}%)`);
    console.log(`    ⚖️ Base Regime  (${st.valuationBands.base.multiple}x):  $${st.valuationBands.base.targetPrice} (${st.valuationBands.base.deltaFromCurrentPct > 0 ? "+" : ""}${st.valuationBands.base.deltaFromCurrentPct}%)`);
    console.log(`    🚨 Panic Floor  (${st.valuationBands.panic.multiple}x):  $${st.valuationBands.panic.targetPrice} (${st.valuationBands.panic.deltaFromCurrentPct > 0 ? "+" : ""}${st.valuationBands.panic.deltaFromCurrentPct}%)`);
    console.log(`    Downside to Panic:  ${st.asymmetry.downsideToPanicPct}%`);
    console.log(`    Risk/Reward Ratio:  ${st.asymmetry.riskRewardRatio}x`);
  }

  const slug = path.basename(absRunDir);
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

main();
