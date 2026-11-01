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
import { eq, desc, sql } from "drizzle-orm";
import { getDb } from "../src/db";
import { tickersTable, reportsTable } from "../src/db/schema";
import { getReportRepository } from "../src/lib/repository";
import { fetchCompletePipelineBundle } from "../src/lib/services/financial-data";
import { isAiGatewayConfigured } from "../src/lib/services/ai-gateway";
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
  placeholdersOnly?: boolean;
  enrichWithAi?: boolean;
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

  // 2. Fetch Existing Populated Reports via SQL Scalar Projection (Zero JSONB Egress Bloat)
  const existingReports = await db
    .select({
      ticker: reportsTable.ticker,
      slug: reportsTable.slug,
      revenueBillions: sql<number>`COALESCE((${reportsTable.facts}->>'revenueBillions')::numeric, 0)`,
      firstPeerTicker: sql<
        string | null
      >`${reportsTable.moat}->'competitors'->0->>'ticker'`,
      firstSegmentName: sql<
        string | null
      >`${reportsTable.facts}->'segments'->0->>'name'`,
    })
    .from(reportsTable);

  const populatedTickers = new Set<string>();
  const placeholderSlugsByTicker = new Map<string, string>();
  const handCraftedTickers = new Set<string>();

  for (const r of existingReports) {
    const t = r.ticker.toUpperCase();
    const isPopulated = Number(r.revenueBillions ?? 0) > 0;
    const isPlaceholder =
      r.firstPeerTicker === "PEER" ||
      r.firstSegmentName === "Core Business & Solutions";

    if (isPopulated) {
      populatedTickers.add(t);
      if (isPlaceholder) {
        placeholderSlugsByTicker.set(t, r.slug);
      } else {
        handCraftedTickers.add(t);
      }
    }
  }

  const enrichWithAi = options.enrichWithAi ?? isAiGatewayConfigured();

  console.log("==============================================================");
  console.log("📊 [Bulk Scaffolding Execution Plan]");
  console.log(` • Universe Candidates:             ${candidates.length}`);
  console.log(` • Existing Populated Reports:      ${populatedTickers.size}`);
  console.log(
    ` • Placeholder Reports Detected:    ${placeholderSlugsByTicker.size}`
  );
  console.log(` • Hand-Crafted Reports Protected:  ${handCraftedTickers.size}`);
  console.log(
    ` • AI Gateway Enrichment Active:    ${enrichWithAi ? "YES (DeepSeek V4.1 Flash + GPT-6.1 Sol)" : "NO (Deterministic Heuristic Only)"}`
  );
  console.log(` • Delay Between Tickers:           ${delayMs}ms`);
  console.log(
    ` • Simulation Mode (Dry-Run):       ${options.dryRun ? "YES" : "NO"}`
  );
  console.log(
    ` • Placeholders-Only Backfill:      ${options.placeholdersOnly ? "YES" : "NO"}`
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

    // Skip hand-crafted reports when running --placeholders backfill
    if (options.placeholdersOnly && handCraftedTickers.has(ticker)) {
      console.log(
        `  🛡️ ${progressLabel.padEnd(16)} [${ticker.padEnd(5)}] Hand-crafted report protected. Skipping.`
      );
      result.skipped++;
      result.details.push({
        ticker,
        status: "skipped",
      });
      continue;
    }

    // Skip if already populated and neither --force nor --placeholders (on a placeholder) is set
    const isTargetPlaceholder =
      options.placeholdersOnly && placeholderSlugsByTicker.has(ticker);
    if (
      populatedTickers.has(ticker) &&
      !options.force &&
      !isTargetPlaceholder
    ) {
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
      // 1. Fetch Complete 8-Module Pipeline Bundle (with AI Gateway enrichment if configured)
      const bundle = await fetchCompletePipelineBundle(ticker, {
        enrichWithAi,
      });

      const quarterStr = bundle.factsDraft.quarter || "Q2 2026";
      const slug =
        placeholderSlugsByTicker.get(ticker) ||
        `${ticker}-${quarterStr.replace(/\s+/g, "-")}-analysis`;

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
        technicalLevels:
          bundle.technicalLevels ?? bundle.profile.technicalLevels,
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
  const placeholdersOnly = args.includes("--placeholders");
  const enrichWithAi = args.includes("--no-ai")
    ? false
    : args.includes("--enrich")
      ? true
      : undefined;

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
    placeholdersOnly,
    enrichWithAi,
    limit,
    ticker,
    delayMs,
  }).catch((err) => {
    console.error("Fatal error during bulk scaffolding:", err);
    process.exit(1);
  });
}
