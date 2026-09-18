#!/usr/bin/env node
/**
 * Migration script to seed Neon PostgreSQL database from local `reports/` folder.
 *
 * Usage:
 *   npx tsx scripts/migrate_to_neon.ts
 */

import fs from "node:fs";
import path from "node:path";
import * as dotenv from "dotenv";
import { getDb } from "../src/db";
import { tickersTable, reportsTable } from "../src/db/schema";
import {
  FactsSchema,
  ScenariosSchema,
  ValuationSchema,
  MoatCompetitorsSchema,
  AnalystEstimatesSchema,
  CatalystsSchema,
  EarningsSentimentSchema,
  FilingExtractsSchema,
  ReactionsSchema,
  FinancialModelBaselineSchema,
} from "../src/lib/schemas";

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

function readJsonSafe<T>(
  filePath: string,
  schema?: { parse: (val: unknown) => T }
): T | undefined {
  if (!fs.existsSync(filePath)) return undefined;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(raw);
    return schema ? schema.parse(json) : (json as T);
  } catch (err) {
    console.warn(`  ⚠️ Failed to parse ${path.basename(filePath)}:`, err);
    return undefined;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set.");
    console.error(
      "   Please set DATABASE_URL in your .env.local file or environment."
    );
    console.error(
      '   Example: DATABASE_URL="postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"\n'
    );
    process.exit(1);
  }

  const db = getDb();
  const reportsDir = path.join(process.cwd(), "reports");

  if (!fs.existsSync(reportsDir)) {
    console.error(`❌ Reports directory not found at: ${reportsDir}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(reportsDir, { withFileTypes: true });
  const reportFolders = entries.filter((e) => e.isDirectory());

  console.log(
    `\n🚀 [StressAlpha Migration] Discovered ${reportFolders.length} report directories under reports/\n`
  );

  let migratedCount = 0;

  for (const folder of reportFolders) {
    const slug = folder.name;
    const folderPath = path.join(reportsDir, slug);

    console.log(`📦 Processing ${slug}...`);

    const facts = readJsonSafe(
      path.join(folderPath, "facts.json"),
      FactsSchema
    );
    const scenarios = readJsonSafe(
      path.join(folderPath, "scenarios.json"),
      ScenariosSchema
    );

    if (!facts || !scenarios) {
      console.warn(
        `  ⚠️ Skipping ${slug}: missing mandatory facts.json or scenarios.json`
      );
      continue;
    }

    const valuation = readJsonSafe(
      path.join(folderPath, "valuation.json"),
      ValuationSchema
    );
    const baseline = readJsonSafe(
      path.join(folderPath, "stress-baseline.json"),
      FinancialModelBaselineSchema
    );
    const moat = readJsonSafe(
      path.join(folderPath, "moat-competitors.json"),
      MoatCompetitorsSchema
    );
    const moatZh = readJsonSafe(
      path.join(folderPath, "moat-competitors_zh.json"),
      MoatCompetitorsSchema
    );
    const estimates = readJsonSafe(
      path.join(folderPath, "analyst-estimates.json"),
      AnalystEstimatesSchema
    );
    const estimatesZh = readJsonSafe(
      path.join(folderPath, "analyst-estimates_zh.json"),
      AnalystEstimatesSchema
    );
    const catalysts = readJsonSafe(
      path.join(folderPath, "catalysts.json"),
      CatalystsSchema
    );
    const sentiment = readJsonSafe(
      path.join(folderPath, "earnings-sentiment.json"),
      EarningsSentimentSchema
    );
    const filing = readJsonSafe(
      path.join(folderPath, "filing-extracts.json"),
      FilingExtractsSchema
    );
    const reactions = readJsonSafe(
      path.join(folderPath, "reactions.json"),
      ReactionsSchema
    );

    // Chinese Localized Artifacts
    const factsZh = readJsonSafe(
      path.join(folderPath, "facts_zh.json"),
      FactsSchema
    );
    const scenariosZh = readJsonSafe(
      path.join(folderPath, "scenarios_zh.json"),
      ScenariosSchema
    );
    const catalystsZh = readJsonSafe(
      path.join(folderPath, "catalysts_zh.json"),
      CatalystsSchema
    );
    const sentimentZh = readJsonSafe(
      path.join(folderPath, "earnings-sentiment_zh.json"),
      EarningsSentimentSchema
    );
    const filingZh = readJsonSafe(
      path.join(folderPath, "filing-extracts_zh.json"),
      FilingExtractsSchema
    );
    const reactionsZh = readJsonSafe(
      path.join(folderPath, "reactions_zh.json"),
      ReactionsSchema
    );

    let reportMd: string | undefined;
    const reportMdPath = path.join(folderPath, "report.md");
    if (fs.existsSync(reportMdPath)) {
      reportMd = fs.readFileSync(reportMdPath, "utf-8");
    }

    let reportMdZh: string | undefined;
    const reportMdZhPath = path.join(folderPath, "report_zh.md");
    if (fs.existsSync(reportMdZhPath)) {
      reportMdZh = fs.readFileSync(reportMdZhPath, "utf-8");
    }

    const currentPrice = valuation?.currentPrice ?? facts.currentPrice;
    const weightedFairValue = valuation?.weightedFairValue ?? 0;

    let baseFairValue = 0;
    let bullFairValue = 0;
    let bearFairValue = 0;

    if (valuation?.scenarioResults) {
      const baseScen = valuation.scenarioResults.find(
        (s) =>
          s.name.toLowerCase() === "base" ||
          s.name.toLowerCase() === "base case"
      );
      const bullScen = valuation.scenarioResults.find(
        (s) =>
          s.name.toLowerCase() === "bull" ||
          s.name.toLowerCase() === "bull case"
      );
      const bearScen = valuation.scenarioResults.find(
        (s) =>
          s.name.toLowerCase() === "bear" ||
          s.name.toLowerCase() === "bear case"
      );

      baseFairValue = baseScen?.fairValue ?? weightedFairValue;
      bullFairValue = bullScen?.fairValue ?? weightedFairValue;
      bearFairValue = bearScen?.fairValue ?? weightedFairValue;
    }

    const panicFairValue =
      valuation?.stressTest?.valuationBands?.panic?.targetPrice;
    const year = parseYear(facts.quarter, slug);

    // 1. Upsert into tickers table
    await db
      .insert(tickersTable)
      .values({
        ticker: facts.ticker,
        company: facts.company,
        currentPrice: String(currentPrice),
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

    // 2. Upsert into reports table
    await db
      .insert(reportsTable)
      .values({
        slug,
        ticker: facts.ticker,
        quarter: facts.quarter,
        year,
        reportDate: facts.reportDate,
        status: "published",
        reportPrice: String(currentPrice),
        weightedFairValue: String(weightedFairValue),
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
        valuation: valuation ?? ({} as any),
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
        reportMdZh,
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
          valuation: valuation ?? ({} as any),
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
          reportMdZh,
          updatedAt: new Date(),
        },
      });

    console.log(`  ✅ Migrated ${slug} (${facts.ticker} - ${facts.company})`);
    migratedCount++;
  }

  console.log("\n" + "═".repeat(60));
  console.log(
    `🎉 Successfully migrated ${migratedCount} reports to Neon Postgres!`
  );
  console.log("═".repeat(60) + "\n");
}

main().catch((err) => {
  console.error("❌ Migration failed with error:", err);
  process.exit(1);
});
