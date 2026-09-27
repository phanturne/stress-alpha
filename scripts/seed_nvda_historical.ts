#!/usr/bin/env node
/**
 * Seed 5 temporary historical reports for NVDA into Neon PostgreSQL.
 *
 * Usage:
 *   npx tsx scripts/seed_nvda_historical.ts           # Seed mock quarters
 *   npx tsx scripts/seed_nvda_historical.ts --clean   # Remove mock quarters
 */

import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { reportsTable } from "../src/db/schema";
import type { Facts, Valuation, Scenarios } from "../src/lib/schemas";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

interface HistoricalConfig {
  slug: string;
  quarter: string;
  year: number;
  reportDate: string;
  reportPrice: number;
  weightedFairValue: number;
  baseFairValue: number;
  bullFairValue: number;
  bearFairValue: number;
  panicFairValue: number;
  operatingMarginPct: number;
  revenueGrowthPct: number;
}

const HISTORICAL_QUARTERS: HistoricalConfig[] = [
  {
    slug: "NVDA-Q1-2027-analysis",
    quarter: "Q1 2027",
    year: 2027,
    reportDate: "2026-05-22",
    reportPrice: 195.5,
    weightedFairValue: 310.0,
    baseFairValue: 300.0,
    bullFairValue: 390.0,
    bearFairValue: 230.0,
    panicFairValue: 165.0,
    operatingMarginPct: 64.0,
    revenueGrowthPct: 120.0,
  },
  {
    slug: "NVDA-Q4-2026-analysis",
    quarter: "Q4 2026",
    year: 2026,
    reportDate: "2026-02-25",
    reportPrice: 168.2,
    weightedFairValue: 275.0,
    baseFairValue: 265.0,
    bullFairValue: 340.0,
    bearFairValue: 205.0,
    panicFairValue: 145.0,
    operatingMarginPct: 62.5,
    revenueGrowthPct: 135.0,
  },
  {
    slug: "NVDA-Q3-2026-analysis",
    quarter: "Q3 2026",
    year: 2026,
    reportDate: "2025-11-19",
    reportPrice: 145.8,
    weightedFairValue: 240.0,
    baseFairValue: 230.0,
    bullFairValue: 295.0,
    bearFairValue: 180.0,
    panicFairValue: 125.0,
    operatingMarginPct: 61.0,
    revenueGrowthPct: 150.0,
  },
  {
    slug: "NVDA-Q2-2026-analysis",
    quarter: "Q2 2026",
    year: 2026,
    reportDate: "2025-08-27",
    reportPrice: 128.3,
    weightedFairValue: 210.0,
    baseFairValue: 200.0,
    bullFairValue: 255.0,
    bearFairValue: 155.0,
    panicFairValue: 110.0,
    operatingMarginPct: 59.5,
    revenueGrowthPct: 180.0,
  },
  {
    slug: "NVDA-Q1-2026-analysis",
    quarter: "Q1 2026",
    year: 2026,
    reportDate: "2025-05-21",
    reportPrice: 105.1,
    weightedFairValue: 180.0,
    baseFairValue: 175.0,
    bullFairValue: 220.0,
    bearFairValue: 135.0,
    panicFairValue: 90.0,
    operatingMarginPct: 58.0,
    revenueGrowthPct: 210.0,
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set.");
    process.exit(1);
  }

  const isCleanup =
    process.argv.includes("--clean") || process.argv.includes("--cleanup");
  const db = getDb();

  if (isCleanup) {
    console.log(
      "Cleaning up mock historical quarters for NVDA from database..."
    );
    const slugsToDelete = HISTORICAL_QUARTERS.map((h) => h.slug);
    for (const slug of slugsToDelete) {
      await db.delete(reportsTable).where(eq(reportsTable.slug, slug));
      console.log(`  ✓ Deleted ${slug}`);
    }
    console.log("\n✅ Successfully cleaned up 5 historical quarters for NVDA!");
    return;
  }

  console.log("Fetching base report 'NVDA-Q2-2027-analysis' from database...");

  const baseRows = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.slug, "NVDA-Q2-2027-analysis"))
    .limit(1);

  if (baseRows.length === 0) {
    console.error("❌ Base report 'NVDA-Q2-2027-analysis' not found.");
    process.exit(1);
  }

  const base = baseRows[0];
  console.log(`Base report loaded: ${base.ticker} ${base.quarter}`);

  for (const h of HISTORICAL_QUARTERS) {
    console.log(`\nCreating historical quarter: ${h.quarter} (${h.slug})...`);

    const facts: Facts = {
      ...base.facts,
      quarter: h.quarter,
      reportDate: h.reportDate,
      currentPrice: h.reportPrice,
      operatingMarginPct: h.operatingMarginPct,
      revenueGrowthPct: h.revenueGrowthPct,
    };

    const scenarios: Scenarios = {
      ...base.scenarios,
      currentPrice: h.reportPrice,
    };

    const upsidePct = Number(
      (((h.weightedFairValue - h.reportPrice) / h.reportPrice) * 100).toFixed(2)
    );

    const scenarioResults = (base.valuation.scenarioResults || []).map((s) => {
      if (s.name.toLowerCase().includes("base")) {
        return {
          ...s,
          fairValue: h.baseFairValue,
          upsideFromCurrent: Number(
            (((h.baseFairValue - h.reportPrice) / h.reportPrice) * 100).toFixed(
              2
            )
          ),
        };
      }
      return s;
    });

    const valuation: Valuation = {
      ...base.valuation,
      currentPrice: h.reportPrice,
      weightedFairValue: h.weightedFairValue,
      upsidePct,
      scenarioResults,
    };

    let factsZh: Facts | null = null;
    if (base.factsZh) {
      factsZh = {
        ...base.factsZh,
        quarter: h.quarter,
        reportDate: h.reportDate,
        currentPrice: h.reportPrice,
        operatingMarginPct: h.operatingMarginPct,
        revenueGrowthPct: h.revenueGrowthPct,
      };
    }

    let scenariosZh: Scenarios | null = null;
    if (base.scenariosZh) {
      scenariosZh = {
        ...base.scenariosZh,
        currentPrice: h.reportPrice,
      };
    }

    await db
      .insert(reportsTable)
      .values({
        slug: h.slug,
        ticker: base.ticker,
        quarter: h.quarter,
        year: h.year,
        reportDate: h.reportDate,
        status: "published",
        reportPrice: String(h.reportPrice),
        weightedFairValue: String(h.weightedFairValue),
        baseFairValue: String(h.baseFairValue),
        bullFairValue: String(h.bullFairValue),
        bearFairValue: String(h.bearFairValue),
        panicFairValue: String(h.panicFairValue),
        moatRating: base.moatRating,
        moatTrend: base.moatTrend,
        operatingMarginPct: String(h.operatingMarginPct),
        revenueGrowthPct: String(h.revenueGrowthPct),
        facts,
        scenarios,
        valuation,
        baseline: base.baseline,
        moat: base.moat,
        estimates: base.estimates,
        catalysts: base.catalysts,
        sentiment: base.sentiment,
        filing: base.filing,
        reactions: base.reactions,
        factsZh: factsZh ?? undefined,
        scenariosZh: scenariosZh ?? undefined,
        moatZh: base.moatZh,
        estimatesZh: base.estimatesZh,
        catalystsZh: base.catalystsZh,
        sentimentZh: base.sentimentZh,
        filingZh: base.filingZh,
        reactionsZh: base.reactionsZh,
        reportMd: base.reportMd,
        reportMdZh: base.reportMdZh,
      })
      .onConflictDoUpdate({
        target: reportsTable.slug,
        set: {
          quarter: h.quarter,
          year: h.year,
          reportDate: h.reportDate,
          reportPrice: String(h.reportPrice),
          weightedFairValue: String(h.weightedFairValue),
          baseFairValue: String(h.baseFairValue),
          bullFairValue: String(h.bullFairValue),
          bearFairValue: String(h.bearFairValue),
          panicFairValue: String(h.panicFairValue),
          operatingMarginPct: String(h.operatingMarginPct),
          revenueGrowthPct: String(h.revenueGrowthPct),
          facts,
          scenarios,
          valuation,
        },
      });

    console.log(
      `  ✓ Inserted ${h.slug} (${h.quarter} — Price: $${h.reportPrice}, WFV: $${h.weightedFairValue})`
    );
  }

  console.log("\n✅ Successfully seeded 5 historical quarters for NVDA!");
}

main().catch((err) => {
  console.error("❌ Failed to seed historical NVDA reports:", err);
  process.exit(1);
});
