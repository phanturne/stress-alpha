#!/usr/bin/env node
/**
 * CLI runner for StressAlpha institutional financial data ingestion.
 * Fetches point-in-time SEC statements, consensus targets, broker estimates,
 * SEC filings, and generates staging JSON artifacts.
 *
 * Usage:
 *   npx tsx scripts/fetch_data.ts NVDA reports/NVDA-Q2-2027-analysis
 *   npm run fetch:data -- MSFT reports/MSFT-Q4-2026-analysis --price 516.17
 */

import path from "node:path";
import * as dotenv from "dotenv";
import {
  fetchCompletePipelineBundle,
  writePipelineArtifacts,
} from "../src/lib/services/financial-data.js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  const args = process.argv.slice(2);
  const positionalArgs = args.filter((a) => !a.startsWith("-"));
  const tickerArg = positionalArgs[0];
  let stagingDirArg = positionalArgs[1];

  const autoStage = args.includes("--stage");
  const overwriteAll = args.includes("--overwrite-all");
  const overwriteFacts = args.includes("--overwrite-facts");

  let benchmarkPrice: number | undefined;
  const priceIdx = args.indexOf("--price");
  if (priceIdx !== -1 && args[priceIdx + 1]) {
    benchmarkPrice = parseFloat(args[priceIdx + 1]);
  }

  let quarterStr: string | undefined;
  const quarterIdx = args.indexOf("--quarter");
  if (quarterIdx !== -1 && args[quarterIdx + 1]) {
    quarterStr = args[quarterIdx + 1];
  }

  if (!tickerArg) {
    console.error(
      "Usage: npm run fetch:data -- <TICKER> [staging-directory] [--stage] [--price <price>] [--quarter <quarter>] [--overwrite-all] [--overwrite-facts]"
    );
    console.error("Example 1 (Auto-stage): npm run fetch:data -- TSLA --stage");
    console.error(
      "Example 2 (Explicit path): npm run fetch:data -- NVDA reports/NVDA-Q2-2027-analysis"
    );
    process.exit(1);
  }

  const ticker = tickerArg.toUpperCase();
  console.log(
    `\n📡 [StressAlpha Data Ingestion] Fetching institutional feeds for ${ticker}...`
  );

  try {
    const bundle = await fetchCompletePipelineBundle(ticker, {
      benchmarkPrice,
      quarterStr,
    });

    console.log(`  ✅ Company: ${bundle.profile.companyName}`);
    console.log(
      `  ✅ Price: $${bundle.profile.currentPrice.toFixed(2)} | Market Cap: $${bundle.profile.marketCapBillions.toFixed(2)}B`
    );
    console.log(
      `  ✅ Consensus: ${bundle.analystEstimatesEn.consensus.consensus} (${bundle.analystEstimatesEn.consensus.totalAnalysts} analysts, ${bundle.analystEstimatesEn.consensus.bullishPct}% bullish)`
    );
    console.log(
      `  ✅ Price Targets: Low $${bundle.analystEstimatesEn.priceTargets.low} | Avg $${bundle.analystEstimatesEn.priceTargets.average} | High $${bundle.analystEstimatesEn.priceTargets.high}`
    );
    console.log(
      `  ✅ Broker Actions Extracted: ${bundle.analystEstimatesEn.estimates.length}`
    );
    console.log(
      `  ✅ Quarterly Statements: ${bundle.profile.quarterlyStatements.length} statements`
    );
    console.log(
      `  ✅ SEC Filings Found: ${bundle.filings.length} periodic filings`
    );
    console.log(
      `  ✅ Historical Reactions: ${bundle.reactions.events.length} earnings events`
    );

    if (!stagingDirArg && autoStage) {
      stagingDirArg = `reports/${ticker}-${bundle.factsDraft.quarter.replace(
        /\s+/g,
        "-"
      )}-analysis`;
    }

    if (stagingDirArg) {
      const targetDir = path.resolve(stagingDirArg);
      console.log(`\n💾 Staging 8-module artifacts to: ${targetDir}`);
      const written = await writePipelineArtifacts(targetDir, bundle, {
        overwriteFacts,
        overwriteAll,
      });
      for (const f of written) {
        console.log(`  📄 Written: ${path.basename(f)}`);
      }
      console.log(
        `\n🎉 Artifact ingestion complete! ${written.length} files prepared in ${targetDir}.`
      );
      console.log(`💡 Next step: Run analysis cockpit or dry-run:`);
      console.log(`   npm run analyze -- ${stagingDirArg} --dry-run\n`);
    } else {
      console.log(
        `\n💡 To write artifacts directly to disk, pass --stage or a target directory:`
      );
      console.log(`   npm run fetch:data -- ${ticker} --stage`);
      console.log(
        `   npm run fetch:data -- ${ticker} reports/${ticker}-${bundle.factsDraft.quarter.replace(
          /\s+/g,
          "-"
        )}-analysis\n`
      );
    }
  } catch (error) {
    console.error(`\n❌ Error fetching pipeline data for ${ticker}:`, error);
    process.exit(1);
  }
}

main();
