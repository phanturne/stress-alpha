#!/usr/bin/env node
/**
 * Standalone bulk scaffolding script to ingest complete 8-module institutional
 * fundamental reports, valuations, and memos for active universe tickers in Neon PostgreSQL.
 *
 * Usage:
 *   npx tsx scripts/bulk_scaffold.ts --limit=25
 *   npx tsx scripts/bulk_scaffold.ts --limit=50
 *   npx tsx scripts/bulk_scaffold.ts --ticker=JPM
 *   npx tsx scripts/bulk_scaffold.ts --all
 *   npx tsx scripts/bulk_scaffold.ts --dry-run
 */

import * as dotenv from "dotenv";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../src/db";
import { tickersTable, reportsTable } from "../src/db/schema";
import { getReportRepository } from "../src/lib/repository";
import { fetchCompletePipelineBundle } from "../src/lib/services/financial-data";
import { computeStressedValuation } from "../src/lib/valuation";
import { computeSanityAudit } from "../src/lib/sanity";
import { renderReport } from "../src/lib/report";
import type { ReportData } from "../src/lib/schemas";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export interface BulkScaffoldOptions {
  limit?: number;
  all?: boolean;
  ticker?: string;
  force?: boolean;
  dryRun?: boolean;
  delayMs?: number;
}

export interface BulkScaffoldResult {
  totalScanned: number;
  scaffolded: number;
  skipped: number;
  errors: number;
  details: Array<{
    ticker: string;
    slug?: string;
    status: "scaffolded" | "skipped" | "error";
    price?: number;
    wfv?: number;
    upsidePct?: number;
    error?: string;
  }>;
}

export async function bulkScaffold(
  options: BulkScaffoldOptions = {}
): Promise<BulkScaffoldResult> {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set. Aborting bulk scaffolding.");
    process.exit(1);
  }

  const db = getDb();
  const repo = getReportRepository();
  const delayMs = options.delayMs ?? 1000;

  console.log("\n⚡ [StressAlpha Bulk Scaffolding Engine] Initializing...");

  // 1. Identify Target Tickers
  let candidates: Array<{
    ticker: string;
    company: string;
    sector: string | null;
    marketCap: string | null;
    currentPrice: string;
  }> = [];

  if (options.ticker) {
    const single = options.ticker.trim().toUpperCase();
    const rows = await db
      .select({
        ticker: tickersTable.ticker,
        company: tickersTable.company,
        sector: tickersTable.sector,
        marketCap: tickersTable.marketCap,
        currentPrice: tickersTable.currentPrice,
      })
      .from(tickersTable)
      .where(eq(tickersTable.ticker, single))
      .limit(1);

    if (rows.length === 0) {
      candidates = [
        {
          ticker: single,
          company: `${single} Corporation`,
          sector: "General",
          marketCap: null,
          currentPrice: "0.00",
        },
      ];
    } else {
      candidates = rows;
    }
  } else {
    // Select active universe ordered by largest market capitalization first
    const rows = await db
      .select({
        ticker: tickersTable.ticker,
        company: tickersTable.company,
        sector: tickersTable.sector,
        marketCap: tickersTable.marketCap,
        currentPrice: tickersTable.currentPrice,
      })
      .from(tickersTable)
      .where(eq(tickersTable.active, true))
      .orderBy(desc(tickersTable.marketCap));

    candidates = rows;

    if (!options.all && options.limit && options.limit > 0) {
      candidates = candidates.slice(0, options.limit);
    }
  }

  // 2. Fetch Existing Populated Reports to Skip Redundant Work
  const existingReports = await db
    .select({
      ticker: reportsTable.ticker,
      slug: reportsTable.slug,
      facts: reportsTable.facts,
    })
    .from(reportsTable);

  const populatedTickers = new Set<string>();
  for (const r of existingReports) {
    if (r.facts && (r.facts.revenueBillions ?? 0) > 0) {
      populatedTickers.add(r.ticker.toUpperCase());
    }
  }

  console.log("==============================================================");
  console.log("📊 [Bulk Scaffolding Execution Plan]");
  console.log(` • Universe Candidates:             ${candidates.length}`);
  console.log(` • Existing Populated Reports:      ${populatedTickers.size}`);
  console.log(` • Delay Between Tickers:           ${delayMs}ms`);
  console.log(
    ` • Simulation Mode (Dry-Run):       ${options.dryRun ? "YES" : "NO"}`
  );
  console.log(
    ` • Force Overwrite Existing:        ${options.force ? "YES" : "NO"}`
  );
  console.log(
    "==============================================================\n"
  );

  const result: BulkScaffoldResult = {
    totalScanned: candidates.length,
    scaffolded: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };

  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i];
    const ticker = item.ticker.toUpperCase();
    const progressLabel = `[${i + 1}/${candidates.length}] (${Math.round(((i + 1) / candidates.length) * 100)}%)`;

    // Skip if already populated and not force
    if (populatedTickers.has(ticker) && !options.force) {
      console.log(
        `  ⏩ ${progressLabel.padEnd(16)} [${ticker.padEnd(5)}] Already populated. Skipping.`
      );
      result.skipped++;
      result.details.push({
        ticker,
        status: "skipped",
      });
      continue;
    }

    if (options.dryRun) {
      console.log(
        `  🔍 ${progressLabel.padEnd(16)} [${ticker.padEnd(5)}] [DRY RUN] Would scaffold 8-module report.`
      );
      result.scaffolded++;
      result.details.push({
        ticker,
        status: "scaffolded",
      });
      continue;
    }

    console.log(
      `  📥 ${progressLabel.padEnd(16)} [${ticker.padEnd(5)}] Ingesting SEC filings, consensus & scaffolding modules...`
    );

    try {
      // 1. Fetch Complete 8-Module Pipeline Bundle
      const bundle = await fetchCompletePipelineBundle(ticker);

      const quarterStr = bundle.factsDraft.quarter || "Q2 2026";
      const slug = `${ticker}-${quarterStr.replace(/\s+/g, "-")}-analysis`;

      // 2. Assemble Report Data
      const report: ReportData = {
        folderSlug: slug,
        folderName: slug,
        facts: bundle.factsDraft,
        factsZh: bundle.factsZh,
        scenarios: bundle.scenariosEn,
        scenariosZh: bundle.scenariosZh,
        baseline: bundle.baseline,
        moat: bundle.moatEn,
        moatZh: bundle.moatZh,
        estimates: bundle.analystEstimatesEn,
        estimatesZh: bundle.analystEstimatesZh,
        catalysts: bundle.catalystsEn,
        catalystsZh: bundle.catalystsZh,
        sentiment: bundle.sentiment,
        filing: bundle.filingEn,
        filingZh: bundle.filingZh,
        reactions: bundle.reactions,
      };

      // 3. Compute Deterministic Valuation
      const valuation = computeStressedValuation(
        report.baseline,
        report.scenarios,
        report.facts
      );

      // 4. Compute Sanity & Variant Perception Audit
      const sanityAudit = computeSanityAudit(report, valuation);
      valuation.sanityAudit = sanityAudit;
      report.valuation = valuation;

      // 5. Render Bilingual Markdown Memos
      try {
        const reportMarkdown = renderReport(
          {
            facts: report.facts,
            valuation: report.valuation,
            moat: report.moat,
            estimates: report.estimates,
            catalysts: report.catalysts,
            reactions: report.reactions,
          },
          { language: "en" }
        );

        const reportMarkdownZh = renderReport(
          {
            facts: report.factsZh || report.facts,
            valuation: report.valuation,
            moat: report.moatZh || report.moat,
            estimates: report.estimatesZh || report.estimates,
            catalysts: report.catalystsZh || report.catalysts,
            reactions: report.reactionsZh || report.reactions,
          },
          { language: "zh" }
        );

        report.reportMarkdown = reportMarkdown;
        report.reportMarkdownZh = reportMarkdownZh;
      } catch (memoErr) {
        console.warn(`    ⚠️ Memo rendering skipped for ${ticker}:`, memoErr);
      }

      // 6. Save to Neon PostgreSQL
      await repo.saveReport(report);

      const curPrice = bundle.profile.currentPrice;
      const wfv = valuation.weightedFairValue;
      const upsidePct =
        curPrice > 0
          ? Number((((wfv - curPrice) / curPrice) * 100).toFixed(1))
          : 0;
      const upsideSign = upsidePct > 0 ? "+" : "";

      console.log(
        `  ✅ [${ticker.padEnd(5)}] $${curPrice.toFixed(2)} | WFV: $${wfv.toFixed(2)} (${upsideSign}${upsidePct}%) | Moat: ${report.moat?.overallMoatRating ?? "None"} | Saved to Neon DB!`
      );

      result.scaffolded++;
      result.details.push({
        ticker,
        slug,
        status: "scaffolded",
        price: curPrice,
        wfv,
        upsidePct,
      });

      // Pause between tickers to respect external APIs
      if (i < candidates.length - 1 && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (err: any) {
      console.error(
        `  ❌ [${ticker.padEnd(5)}] Failed to scaffold:`,
        err?.message || err
      );
      result.errors++;
      result.details.push({
        ticker,
        status: "error",
        error: err?.message || String(err),
      });
    }
  }

  console.log("\n" + "=".repeat(62));
  console.log("🏁 [Bulk Scaffolding Completed]");
  console.log(` • Total Evaluated:     ${result.totalScanned}`);
  console.log(` • Newly Scaffolded:    ${result.scaffolded}`);
  console.log(` • Skipped (Existing):  ${result.skipped}`);
  console.log(` • Errors Encountered:  ${result.errors}`);
  console.log("=".repeat(62) + "\n");

  return result;
}

// Standalone CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");
  const all = args.includes("--all");

  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg
    ? parseInt(limitArg.split("=")[1], 10)
    : all
      ? undefined
      : 25;

  const tickerArg = args.find((a) => a.startsWith("--ticker="));
  const ticker = tickerArg ? tickerArg.split("=")[1] : undefined;

  const delayArg = args.find((a) => a.startsWith("--delay="));
  const delayMs = delayArg ? parseInt(delayArg.split("=")[1], 10) : 1000;

  bulkScaffold({
    dryRun,
    force,
    all,
    limit,
    ticker,
    delayMs,
  }).catch((err) => {
    console.error("Fatal error during bulk scaffolding:", err);
    process.exit(1);
  });
}
