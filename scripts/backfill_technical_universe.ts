#!/usr/bin/env node
/**
 * Standalone script to backfill 1-year historical Volume Profile POC, Anchored VWAP,
 * Fractal Swing Shelves, Classical S1-S3 / R1-R3 Pivots, and 3-Tier Price Corridors
 * across the entire active coverage universe in Neon PostgreSQL.
 *
 * Usage:
 *   npx tsx scripts/backfill_technical_universe.ts
 *   npx tsx scripts/backfill_technical_universe.ts --ticker=NVDA
 *   npx tsx scripts/backfill_technical_universe.ts --limit=50
 *   npx tsx scripts/backfill_technical_universe.ts --concurrency=5
 */

import * as dotenv from "dotenv";
import YahooFinance from "yahoo-finance2";
import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { tickersTable } from "../src/db/schema";
import { computeTechnicalLevels } from "../src/lib/technical";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// Parse command line arguments
const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;
const tickerArg = args.find((a) => a.startsWith("--ticker="));
const singleTicker = tickerArg
  ? tickerArg.split("=")[1].toUpperCase()
  : undefined;
const concurrencyArg = args.find((a) => a.startsWith("--concurrency="));
const concurrency = concurrencyArg
  ? parseInt(concurrencyArg.split("=")[1], 10)
  : 5;

async function backfillUniverse() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set. Aborting backfill.");
    process.exit(1);
  }

  const db = getDb();
  console.log("\n🚀 [StressAlpha Technical Universe Backfill] Starting...");

  let tickersQuery = db
    .select({
      ticker: tickersTable.ticker,
      company: tickersTable.company,
      currentPrice: tickersTable.currentPrice,
    })
    .from(tickersTable)
    .where(eq(tickersTable.active, true));

  let tickers = await tickersQuery;

  if (singleTicker) {
    tickers = tickers.filter((t) => t.ticker === singleTicker);
    console.log(`  🎯 Filtered to single ticker: ${singleTicker}`);
  }

  if (limit && limit > 0) {
    tickers = tickers.slice(0, limit);
    console.log(`  ⚠️ Limited to first ${limit} tickers.`);
  }

  const total = tickers.length;
  if (total === 0) {
    console.log("  ℹ️ No matching active tickers found.");
    return;
  }

  console.log(
    `  Found ${total} active tickers. Concurrency: ${concurrency} workers.\n`
  );

  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  let successCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  // Process in chunks of 50 for quote batching
  const batchChunkSize = 50;
  for (let i = 0; i < total; i += batchChunkSize) {
    const chunk = tickers.slice(i, i + batchChunkSize);
    const symbols = chunk.map((c) => c.ticker);

    // 1. Batch quote for all 50 tickers in 1 HTTP call
    let quoteMap = new Map<string, any>();
    try {
      const rawQuotes = await yf.quote(symbols);
      const quotesList = Array.isArray(rawQuotes) ? rawQuotes : [rawQuotes];
      for (const q of quotesList) {
        if (q && q.symbol) {
          quoteMap.set(q.symbol.toUpperCase(), q);
        }
      }
    } catch (err) {
      console.warn(
        `  ⚠️ Batch quote warning for chunk ${i / batchChunkSize + 1}:`,
        err instanceof Error ? err.message : err
      );
    }

    // 2. Fetch 1-year daily chart concurrently for the chunk
    for (let j = 0; j < chunk.length; j += concurrency) {
      const workerSlice = chunk.slice(j, j + concurrency);

      await Promise.all(
        workerSlice.map(async ({ ticker, company, currentPrice }) => {
          const idx =
            i +
            j +
            workerSlice.indexOf(workerSlice.find((w) => w.ticker === ticker)!) +
            1;
          const quote = quoteMap.get(ticker.toUpperCase());

          try {
            // Fetch 252-day daily bars
            const chart = await yf.chart(ticker, {
              period1: oneYearAgo,
              interval: "1d",
            });

            const effectivePrice =
              typeof quote?.regularMarketPrice === "number"
                ? Number(quote.regularMarketPrice.toFixed(2))
                : typeof chart?.meta?.regularMarketPrice === "number"
                  ? Number(chart.meta.regularMarketPrice.toFixed(2))
                  : Number(currentPrice);

            const quoteObj = quote || {
              regularMarketPrice: effectivePrice,
              regularMarketPreviousClose: chart?.meta?.previousClose,
              regularMarketDayHigh: chart?.meta?.regularMarketDayHigh,
              regularMarketDayLow: chart?.meta?.regularMarketDayLow,
              fiftyTwoWeekHigh: chart?.meta?.fiftyTwoWeekHigh,
              fiftyTwoWeekLow: chart?.meta?.fiftyTwoWeekLow,
            };

            const levels = computeTechnicalLevels(quoteObj, effectivePrice, {
              historicalBars: chart?.quotes || [],
            });

            await db
              .update(tickersTable)
              .set({
                currentPrice: String(effectivePrice),
                previousClose:
                  quote?.regularMarketPreviousClose != null
                    ? String(
                        Number(quote.regularMarketPreviousClose.toFixed(2))
                      )
                    : undefined,
                technicalLevels: levels,
                priceUpdatedAt: new Date(),
              })
              .where(eq(tickersTable.ticker, ticker));

            const pocStr = levels.volumePoc
              ? `$${levels.volumePoc.toFixed(2)}`
              : "n/a";
            const avwapStr = levels.avwap52High
              ? `$${levels.avwap52High.toFixed(2)}`
              : "n/a";

            console.log(
              `  ✅ [${idx.toString().padStart(3, " ")}/${total}] [${ticker.padEnd(5)}] $${effectivePrice.toFixed(2)} | POC=${pocStr} | AVWAP=${avwapStr} | ${levels.levels.length} levels — ${company}`
            );
            successCount++;
          } catch (err) {
            console.error(
              `  ❌ [${idx.toString().padStart(3, " ")}/${total}] [${ticker.padEnd(5)}] Failed:`,
              err instanceof Error ? err.message : err
            );
            errorCount++;
          }
        })
      );

      // Polite 60ms pause between concurrent chart requests
      await new Promise((r) => setTimeout(r, 60));
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n" + "═".repeat(60));
  console.log(
    `📊 Technical Universe Backfill Complete: ${successCount} updated, ${errorCount} errors (${durationSec}s)`
  );
  console.log("═".repeat(60) + "\n");
}

backfillUniverse().catch((err) => {
  console.error("Fatal error during backfill:", err);
  process.exit(1);
});
