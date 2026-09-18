#!/usr/bin/env node
/**
 * CLI database query helper for StressAlpha Neon PostgreSQL.
 *
 * Usage:
 *   npx tsx scripts/db_query.ts --list
 *   npx tsx scripts/db_query.ts --report NVDA-Q2-2027-analysis
 *   npx tsx scripts/db_query.ts --sql "SELECT ticker, current_price, price_updated_at FROM tickers"
 */

import * as dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { getDb } from "../src/db";
import { getReportRepository } from "../src/lib/repository";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
StressAlpha Database Query Tool

Usage:
  npx tsx scripts/db_query.ts --list
      Lists all covered tickers, latest market prices, and dynamic fair value upside.

  npx tsx scripts/db_query.ts --report <slug>
      Displays detailed fundamental artifacts and valuation for a specific report.

  npx tsx scripts/db_query.ts --sql "<query>"
      Executes a raw SQL query against Neon PostgreSQL and displays results as a table.
    `);
    process.exit(0);
  }

  const db = getDb();

  if (args.includes("--list")) {
    const repo = getReportRepository();
    const reports = await repo.listReports();

    console.log("\n📊 [Neon DB: Reports & Live Valuation Summary]\n");
    console.table(
      reports.map((r) => ({
        Ticker: r.ticker,
        Company: r.company?.slice(0, 22),
        Quarter: r.quarter,
        "Live Price": `$${r.currentPrice?.toFixed(2)}`,
        "Base Fair Value": `$${r.baseFairValue?.toFixed(2)}`,
        "Upside %": `${r.upsidePct && r.upsidePct > 0 ? "+" : ""}${r.upsidePct}%`,
        Moat: `${r.moatRating ?? "—"} (${r.moatTrend ?? "—"})`,
        "Operating Margin": `${r.operatingMarginPct ?? "—"}%`,
        "Analyst Target": r.analystTarget ? `$${r.analystTarget}` : "—",
      }))
    );
    console.log(`Total: ${reports.length} reports in Neon PostgreSQL\n`);
    return;
  }

  const reportIdx = args.indexOf("--report");
  if (reportIdx !== -1 && args[reportIdx + 1]) {
    const slug = args[reportIdx + 1];
    const repo = getReportRepository();
    const report = await repo.getReport(slug);

    if (!report) {
      console.error(`❌ Report not found: ${slug}`);
      process.exit(1);
    }

    console.log("\n" + "═".repeat(64));
    console.log(
      `  ${report.facts.ticker} (${report.facts.company}) — ${report.facts.quarter}`
    );
    console.log("═".repeat(64));
    console.log(`  Live Price:            $${report.facts.currentPrice}`);
    console.log(
      `  Operating EPS:         $${report.facts.epsOperating} (Reported: $${report.facts.epsReported})`
    );
    console.log(
      `  Revenue:               $${report.facts.revenueBillions}B (${report.facts.revenueGrowthPct}% YoY)`
    );
    console.log(
      `  Operating Income:      $${report.facts.operatingIncomeBillions}B (${report.facts.operatingMarginPct}% Margin)`
    );
    if (report.moat) {
      console.log(
        `  Economic Moat:         ${report.moat.overallMoatRating} (${report.moat.moatTrend})`
      );
    }
    if (report.valuation) {
      console.log(
        `  Weighted Fair Value:   $${report.valuation.weightedFairValue} (${report.valuation.upsidePct}% Upside)`
      );
      console.log(
        `  Consensus Target:      $${report.valuation.consensusTarget}`
      );
    }
    console.log(`  Has Chinese Facts:     ${!!report.factsZh}`);
    console.log(`  Has Chinese Scenarios: ${!!report.scenariosZh}`);
    console.log(`  Has Chinese Memo:      ${!!report.reportMarkdownZh}`);
    console.log("═".repeat(64) + "\n");
    return;
  }

  const sqlIdx = args.indexOf("--sql");
  if (sqlIdx !== -1 && args[sqlIdx + 1]) {
    const rawSql = args.slice(sqlIdx + 1).join(" ");
    console.log(`\n🔍 Executing SQL: ${rawSql}\n`);
    const result = await db.execute(sql.raw(rawSql));
    if (Array.isArray(result) && result.length > 0) {
      console.table(result);
    } else if (
      result &&
      typeof result === "object" &&
      "rows" in result &&
      Array.isArray((result as any).rows)
    ) {
      console.table((result as any).rows);
    } else {
      console.log("Result:", result);
    }
    console.log("");
    return;
  }

  console.error("Unknown arguments. Run with --help for options.");
}

main().catch((err) => {
  console.error("❌ Database query error:", err);
  process.exit(1);
});
