#!/usr/bin/env node
/**
 * Backfill & Migration Script: Denormalized Snowflake Radar Columns
 *
 * Computes 30-point Snowflake Radar metrics (score, tier, pillars) for all
 * covered reports in Neon PostgreSQL and persists them directly into `reportsTable`
 * columns (snowflake_score, snowflake_tier, snowflake_pillars).
 *
 * Usage:
 *   npx tsx scripts/backfill_snowflake_columns.ts
 *   npx tsx scripts/backfill_snowflake_columns.ts --force
 *   npx tsx scripts/backfill_snowflake_columns.ts --ticker=NVDA
 */

import * as dotenv from "dotenv";
import { sql, eq, isNull } from "drizzle-orm";
import { getDb } from "../src/db";
import { reportsTable, tickersTable } from "../src/db/schema";
import { computeSnowflakeScore } from "../src/lib/snowflake";
import {
  computeStressedValuation,
  computeValuation,
} from "../src/lib/valuation";
import type { ReportData, Facts, Scenarios } from "../src/lib/schemas";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const tickerArg = args
    .find((a) => a.startsWith("--ticker="))
    ?.split("=")[1]
    ?.toUpperCase();

  console.log(
    "================================================================================"
  );
  console.log(
    "🚀 [StressAlpha] Universe-Wide Snowflake Radar DB Column Backfill Engine"
  );
  console.log(
    "================================================================================\n"
  );

  const db = getDb();

  // 1. Ensure columns exist in Neon DB
  console.log("🔧 Ensuring columns exist in Neon DB reports table...");
  await db.execute(
    sql`ALTER TABLE reports ADD COLUMN IF NOT EXISTS snowflake_score integer`
  );
  await db.execute(
    sql`ALTER TABLE reports ADD COLUMN IF NOT EXISTS snowflake_tier varchar(32)`
  );
  await db.execute(
    sql`ALTER TABLE reports ADD COLUMN IF NOT EXISTS snowflake_pillars jsonb`
  );
  console.log("✅ Columns verified.\n");

  // 2. Query target reports
  console.log("🔍 Querying reports needing Snowflake column population...");
  const baseQuery = db
    .select({
      slug: reportsTable.slug,
      ticker: reportsTable.ticker,
      reportPrice: reportsTable.reportPrice,
      tickerPrice: tickersTable.currentPrice,
      facts: reportsTable.facts,
      scenarios: reportsTable.scenarios,
      baseline: reportsTable.baseline,
      moat: reportsTable.moat,
      catalysts: reportsTable.catalysts,
      estimates: reportsTable.estimates,
      snowflakeScore: reportsTable.snowflakeScore,
    })
    .from(reportsTable)
    .leftJoin(tickersTable, eq(reportsTable.ticker, tickersTable.ticker));

  const allReports = await baseQuery;
  console.log(`📊 Found ${allReports.length} total reports in Neon DB.`);

  const targets = allReports.filter((r) => {
    if (tickerArg && r.ticker.toUpperCase() !== tickerArg) return false;
    if (force) return true;
    return r.snowflakeScore == null;
  });

  console.log(
    `🎯 Identified ${targets.length} reports for Snowflake backfill.\n`
  );

  if (targets.length === 0) {
    console.log(
      "✨ All reports already have snowflake columns populated! Use --force to recompute."
    );
    process.exit(0);
  }

  const startTime = Date.now();
  let updatedCount = 0;
  let errorCount = 0;

  // Process in batches of 20 concurrent database updates
  const BATCH_SIZE = 20;
  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (row) => {
        try {
          const effectivePrice = Number(row.tickerPrice ?? row.reportPrice);
          const facts: Facts = {
            ...row.facts,
            currentPrice:
              effectivePrice > 0
                ? effectivePrice
                : (row.facts?.currentPrice ?? 0),
          };
          const scenarios: Scenarios = {
            ...row.scenarios,
            currentPrice:
              effectivePrice > 0
                ? effectivePrice
                : (row.scenarios?.currentPrice ?? 0),
          };
          const baseline = row.baseline ?? undefined;

          const dynamicValuation = computeValuation({
            facts,
            scenarios,
            baseline,
            moat: row.moat ?? undefined,
            estimates: row.estimates ?? undefined,
          });

          const stressResult =
            baseline && facts.currentPrice > 0
              ? computeStressedValuation(baseline, facts.currentPrice)
              : undefined;

          const reportPayload: ReportData = {
            folderSlug: row.slug,
            folderName: row.slug,
            facts,
            valuation: dynamicValuation,
            scenarios,
            baseline,
            moat: row.moat ?? undefined,
            catalysts: row.catalysts ?? undefined,
            estimates: row.estimates ?? undefined,
          };

          const res = computeSnowflakeScore(reportPayload, stressResult);
          const snowflakeScore = res.totalScore;
          const snowflakeTier = res.ratingTier;
          const snowflakePillars = {
            valuation: res.pillars.valuation.score,
            future: res.pillars.future.score,
            earnings: res.pillars.earnings.score,
            moat: res.pillars.moat.score,
            resilience: res.pillars.resilience.score,
          };

          await db
            .update(reportsTable)
            .set({
              snowflakeScore,
              snowflakeTier,
              snowflakePillars,
            })
            .where(eq(reportsTable.slug, row.slug));

          updatedCount++;
        } catch (err: any) {
          console.error(
            `  ❌ Failed to update ${row.slug}:`,
            err?.message || err
          );
          errorCount++;
        }
      })
    );

    const progressPct = (((i + batch.length) / targets.length) * 100).toFixed(
      1
    );
    console.log(
      `  ⏳ Processed ${i + batch.length}/${targets.length} reports (${progressPct}%)`
    );
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    "\n================================================================================"
  );
  console.log("🏁 [Snowflake Backfill Completed]");
  console.log(` • Total Processed: ${updatedCount}`);
  console.log(` • Errors:          ${errorCount}`);
  console.log(` • Elapsed Time:    ${elapsed}s`);
  console.log(
    "================================================================================\n"
  );
}

main().catch((err) => {
  console.error("❌ Fatal backfill error:", err);
  process.exit(1);
});
