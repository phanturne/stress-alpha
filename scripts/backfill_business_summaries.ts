#!/usr/bin/env node
/**
 * Backfill Structured 4-Pillar Item 1 Business Model Overviews
 *
 * Synthesizes institutional 4-pillar business overviews (Executive Abstract,
 * Revenue Architecture & Segmentation, Three-Layer Economic Moat, and Value Chain & Critical Downside Risks)
 * for covered stocks using deepseek/deepseek-v4.1-flash-1017 via Vercel AI Gateway,
 * persists both English and Chinese versions to Neon PostgreSQL, and syncs local JSON files.
 *
 * Usage:
 *   npx tsx scripts/backfill_business_summaries.ts [--ticker=AAPL,MSFT] [--limit=25] [--local] [--force] [--dry-run]
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { eq, inArray } from "drizzle-orm";
import { generateText } from "ai";
import YahooFinance from "yahoo-finance2";
import { getDb } from "../src/db";
import { reportsTable, tickersTable } from "../src/db/schema";
import { AI_GATEWAY_MODELS } from "../src/lib/services/ai-gateway";
import { FactsSchema, type Facts } from "../src/lib/schemas";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

interface CliArgs {
  tickers: string[];
  localOnly: boolean;
  all: boolean;
  limit: number;
  concurrency: number;
  force: boolean;
  dryRun: boolean;
}

function parseCliArgs(): CliArgs {
  const args = process.argv.slice(2);
  let tickers: string[] = [];
  let localOnly = false;
  let all = false;
  let limit = 25;
  let concurrency = 3;
  let force = false;
  let dryRun = false;

  for (const arg of args) {
    if (arg.startsWith("--ticker=")) {
      tickers = arg
        .slice("--ticker=".length)
        .split(",")
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean);
    } else if (arg === "--local") {
      localOnly = true;
    } else if (arg === "--all") {
      all = true;
    } else if (arg.startsWith("--limit=")) {
      limit = parseInt(arg.slice("--limit=".length), 10) || 25;
    } else if (arg.startsWith("--concurrency=")) {
      concurrency = parseInt(arg.slice("--concurrency=".length), 10) || 3;
    } else if (arg === "--force") {
      force = true;
    } else if (arg === "--dry-run") {
      dryRun = true;
    }
  }

  return { tickers, localOnly, all, limit, concurrency, force, dryRun };
}

function parseJsonObject(rawText: string): any {
  const cleaned = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error(`No JSON object found in output (len=${rawText.length})`);
  }
  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
}

function isAlreadyStructured(summary?: string): boolean {
  if (!summary || summary.trim().length < 50) return false;
  const hasRevenueArch =
    summary.includes("• Revenue Architecture") ||
    summary.includes("• 业务架构") ||
    summary.includes("• 收入架构");
  const hasMoat =
    summary.includes("• Three-Layer Economic Moat") ||
    summary.includes("• 三层护城河") ||
    summary.includes("• 护城河壁垒");
  return hasRevenueArch && hasMoat;
}

async function fetchRawAssetProfile(ticker: string): Promise<{
  longBusinessSummary?: string;
  sector?: string;
  industry?: string;
}> {
  try {
    const summary = (await yf.quoteSummary(ticker, {
      modules: ["assetProfile"],
    })) as any;
    return {
      longBusinessSummary: summary?.assetProfile?.longBusinessSummary,
      sector: summary?.assetProfile?.sector,
      industry: summary?.assetProfile?.industry,
    };
  } catch (err: any) {
    console.warn(
      `  ⚠️ Could not fetch Yahoo Finance profile for ${ticker}: ${err?.message || err}`
    );
    return {};
  }
}

async function synthesizeStructuredOverview(
  ticker: string,
  companyName: string,
  sector: string,
  industry: string,
  rawSummary: string,
  segments: {
    name: string;
    revenueBillions?: number;
    growthPct?: number;
  }[] = [],
  totalRevenueBillions?: number
): Promise<{ businessSummary: string; businessSummaryZh: string }> {
  const segmentContext =
    segments.length > 0
      ? segments
          .map((s) => {
            const rev = s.revenueBillions
              ? `$${s.revenueBillions.toFixed(2)}B`
              : "N/A";
            const share =
              totalRevenueBillions && s.revenueBillions
                ? ` (~${((s.revenueBillions / totalRevenueBillions) * 100).toFixed(0)}%)`
                : "";
            return `  - ${s.name}: ${rev}${share}${s.growthPct != null ? ` (YoY: ${s.growthPct > 0 ? "+" : ""}${s.growthPct}%)` : ""}`;
          })
          .join("\n")
      : "  - Standard disclosed business lines";

  const prompt = `Synthesize the institutional 4-pillar Item 1 Business Model profile for ${companyName} (${ticker}).
Sector: ${sector || "N/A"}
Industry: ${industry || "N/A"}
Latest Total Revenue: ${totalRevenueBillions ? `$${totalRevenueBillions.toFixed(2)}B` : "N/A"}
Disclosed Operating Segments:\n${segmentContext}

Raw Description:\n${rawSummary || companyName}`;

  const system = `You are a Senior Buy-Side Equity Analyst & Institutional Auditor.
Return ONLY a single valid JSON object with keys "businessSummary" (English) and "businessSummaryZh" (Simplified Chinese). No markdown fences, no conversational text.

Structure for "businessSummary":
Start immediately with a 1-2 sentence executive abstract (do NOT include the bracketed label '[Executive Abstract:]') detailing primary corporate identity, core operating segments, and target end-markets.

Followed by these exact bullet sections:

• Revenue Architecture & Segmentation:
  - [Disaggregate disclosed operating segments with approximate % share of total revenue and key platforms/products driving each segment.]

• Three-Layer Economic Moat:
  - (1) Proprietary IP / technological barrier: [Core patents, proprietary architecture, or proprietary data/algorithms]
  - (2) Ecosystem switching costs & locked-in RPO: [High switching friction, multi-year customer commitments, software lock-in, or contracted backlogs]
  - (3) Network effects or manufacturing cost / scale advantage: [Scale efficiencies, developer ecosystem density, or unit-cost dominance]

• Value Chain & Critical Downside Risks:
  - [Key upstream supply/foundry/vendor dependencies, top direct customer concentration, and critical regulatory, competitive, or technological transition risks.]

Structure for "businessSummaryZh":
Same 4-pillar structure translated into crisp, institutional buy-side Simplified Chinese:
Start immediately with 1-2 sentence executive abstract in Simplified Chinese (do NOT include '[执行摘要：]'):

• 业务架构与分部营收拆解：
  - [分部营收占比与核心产品线/技术平台]

• 三层护城河壁垒：
  - (1) 专有技术与 IP 壁垒：[...]
  - (2) 生态转换成本与在手订单锁定期 (RPO)：[...]
  - (3) 网络效应或规模制造成本优势：[...]

• 产业链卡位与核心下行风险：
  - [上游关键供应链/代工依赖、下游头部客户集中度及核心反垄断/竞争/技术迭代风险]`;

  const { text } = await generateText({
    model: AI_GATEWAY_MODELS.EXTRACTOR,
    maxOutputTokens: 3000,
    system,
    prompt,
    providerOptions: {
      deepseek: {
        thinking: { type: "disabled" },
      },
    },
  });

  const parsed = parseJsonObject(text);
  if (!parsed.businessSummary || typeof parsed.businessSummary !== "string") {
    throw new Error(`Invalid businessSummary in output for ${ticker}`);
  }
  if (
    !parsed.businessSummaryZh ||
    typeof parsed.businessSummaryZh !== "string"
  ) {
    throw new Error(`Invalid businessSummaryZh in output for ${ticker}`);
  }

  return {
    businessSummary: parsed.businessSummary.trim(),
    businessSummaryZh: parsed.businessSummaryZh.trim(),
  };
}

async function triggerRevalidate(slug: string): Promise<void> {
  try {
    const res = await fetch(
      `http://localhost:3000/api/revalidate?slug=${encodeURIComponent(slug)}`
    );
    if (res.ok) {
      console.log(`  🔄 Revalidated Next.js cache for ${slug}`);
    }
  } catch {
    // Dev server may not be running, safe to ignore
  }
}

async function main() {
  const cli = parseCliArgs();
  console.log("🚀 Starting Item 1 Business Overview Backfill...");
  console.log("Config:", {
    tickers: cli.tickers.length > 0 ? cli.tickers : "auto",
    localOnly: cli.localOnly,
    all: cli.all,
    limit: cli.limit,
    concurrency: cli.concurrency,
    force: cli.force,
    dryRun: cli.dryRun,
  });

  const db = getDb();

  // 1. Determine target reports
  let targetReports: Array<{
    slug: string;
    ticker: string;
    facts: Facts;
    factsZh?: Facts | null;
  }> = [];

  if (cli.tickers.length > 0) {
    const rows = await db
      .select({
        slug: reportsTable.slug,
        ticker: reportsTable.ticker,
        facts: reportsTable.facts,
        factsZh: reportsTable.factsZh,
      })
      .from(reportsTable)
      .where(inArray(reportsTable.ticker, cli.tickers));
    targetReports = rows;
  } else if (cli.localOnly) {
    const reportsDir = path.resolve(process.cwd(), "reports");
    const localSlugs = fs.existsSync(reportsDir)
      ? fs
          .readdirSync(reportsDir)
          .filter((f) => fs.statSync(path.join(reportsDir, f)).isDirectory())
      : [];
    console.log(
      `Found ${localSlugs.length} local report directories in reports/`
    );
    if (localSlugs.length > 0) {
      const rows = await db
        .select({
          slug: reportsTable.slug,
          ticker: reportsTable.ticker,
          facts: reportsTable.facts,
          factsZh: reportsTable.factsZh,
        })
        .from(reportsTable)
        .where(inArray(reportsTable.slug, localSlugs));
      targetReports = rows;
    }
  } else {
    // Universe backfill prioritized by populated reports
    const rows = await db
      .select({
        slug: reportsTable.slug,
        ticker: reportsTable.ticker,
        facts: reportsTable.facts,
        factsZh: reportsTable.factsZh,
      })
      .from(reportsTable)
      .limit(cli.all ? 1000 : cli.limit);
    targetReports = rows;
  }

  console.log(`Targeting ${targetReports.length} reports.`);

  // 2. Fetch ticker metadata (companyName, sector, industry)
  const allTickers = Array.from(new Set(targetReports.map((r) => r.ticker)));
  const tickerRows =
    allTickers.length > 0
      ? await db
          .select({
            ticker: tickersTable.ticker,
            companyName: tickersTable.company,
            sector: tickersTable.sector,
          })
          .from(tickersTable)
          .where(inArray(tickersTable.ticker, allTickers))
      : [];
  const tickerMap = new Map(tickerRows.map((t) => [t.ticker, t]));

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // 3. Process with concurrency limit
  const queue = [...targetReports];
  const workers = Array.from(
    { length: cli.concurrency },
    async (_, workerId) => {
      while (queue.length > 0) {
        const report = queue.shift();
        if (!report) break;

        const { slug, ticker, facts, factsZh } = report;
        const meta = tickerMap.get(ticker);
        const companyName = meta?.companyName || ticker;
        const sector = meta?.sector || facts?.sector || "";
        const industry = facts?.industry || "";

        const existingEn = facts?.businessSummary || "";
        const existingZh = factsZh?.businessSummary || "";

        if (
          !cli.force &&
          isAlreadyStructured(existingEn) &&
          isAlreadyStructured(existingZh)
        ) {
          console.log(
            `⏩ [${ticker}] Already has structured 4-pillar overview. Skipping.`
          );
          skippedCount++;
          continue;
        }

        console.log(
          `\n🔍 [${ticker}] Processing ${slug} (worker ${workerId + 1})...`
        );

        try {
          let rawSummary = existingEn;
          if (!rawSummary || rawSummary.length < 50) {
            const profile = await fetchRawAssetProfile(ticker);
            rawSummary = profile.longBusinessSummary || "";
          }

          const segments = facts?.segments || [];
          const totalRev = facts?.revenueBillions || 0;

          const startTime = Date.now();
          const synthesized = await synthesizeStructuredOverview(
            ticker,
            companyName,
            sector,
            industry,
            rawSummary,
            segments,
            totalRev
          );
          const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

          console.log(
            `  ✅ [${ticker}] Synthesized structured profile in ${elapsedSec}s`
          );
          console.log(
            `  Preview EN:\n${synthesized.businessSummary.slice(0, 200)}...\n`
          );

          if (cli.dryRun) {
            console.log(
              `  [Dry Run] Would update DB and local files for ${ticker}.`
            );
            updatedCount++;
            continue;
          }

          // Update database
          const updatedFacts: Facts = FactsSchema.parse({
            ...facts,
            businessSummary: synthesized.businessSummary,
            sector: sector || facts.sector,
            industry: industry || facts.industry,
          });

          const updatedFactsZh: Facts = FactsSchema.parse({
            ...(factsZh || facts),
            businessSummary: synthesized.businessSummaryZh,
            sector: sector || factsZh?.sector || facts.sector,
            industry: industry || factsZh?.industry || facts.industry,
          });

          await db
            .update(reportsTable)
            .set({
              facts: updatedFacts,
              factsZh: updatedFactsZh,
            })
            .where(eq(reportsTable.slug, slug));

          // Sync local report folder if present
          const localDir = path.resolve(process.cwd(), "reports", slug);
          if (fs.existsSync(localDir)) {
            const enFactsPath = path.join(localDir, "facts.json");
            const zhFactsPath = path.join(localDir, "facts_zh.json");
            if (fs.existsSync(enFactsPath)) {
              fs.writeFileSync(
                enFactsPath,
                JSON.stringify(updatedFacts, null, 2),
                "utf8"
              );
            }
            if (fs.existsSync(zhFactsPath)) {
              fs.writeFileSync(
                zhFactsPath,
                JSON.stringify(updatedFactsZh, null, 2),
                "utf8"
              );
            }
            console.log(`  💾 Updated local JSON files in reports/${slug}`);
          }

          await triggerRevalidate(slug);
          updatedCount++;
        } catch (err: any) {
          console.error(`  ❌ [${ticker}] Error:`, err?.message || err);
          errorCount++;
        }
      }
    }
  );

  await Promise.all(workers);

  console.log("\n=================================");
  console.log("🎉 Backfill Completed!");
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Errors:  ${errorCount}`);
  console.log("=================================\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
