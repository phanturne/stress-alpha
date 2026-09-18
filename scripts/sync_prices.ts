#!/usr/bin/env node
/**
 * Standalone script to sync nightly stock market closing prices from Yahoo Finance into Neon Postgres.
 *
 * Usage:
 *   npx tsx scripts/sync_prices.ts
 */

import * as dotenv from "dotenv";
import YahooFinance from "yahoo-finance2";
import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { tickersTable } from "../src/db/schema";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

interface YahooQuoteResult {
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  regularMarketVolume?: number;
}

async function fetchQuoteFromYahoo(ticker: string): Promise<YahooQuoteResult> {
  const quote = await yf.quote(ticker);
  if (!quote || typeof quote.regularMarketPrice !== "number") {
    throw new Error(`Invalid quote returned for ${ticker}`);
  }
  return {
    regularMarketPrice: quote.regularMarketPrice,
    chartPreviousClose: quote.regularMarketPreviousClose,
    regularMarketVolume: quote.regularMarketVolume,
  };
}

async function syncPrices() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set. Aborting nightly price sync.");
    process.exit(1);
  }

  const db = getDb();
  console.log(
    "\n📈 [StressAlpha Price Sync] Fetching universe of active tickers..."
  );

  const tickers = await db
    .select({
      ticker: tickersTable.ticker,
      company: tickersTable.company,
      currentPrice: tickersTable.currentPrice,
    })
    .from(tickersTable)
    .where(eq(tickersTable.active, true));

  if (tickers.length === 0) {
    console.log("  ℹ️ No active tickers found in database.");
    return;
  }

  console.log(
    `  Found ${tickers.length} active tickers: ${tickers.map((t) => t.ticker).join(", ")}\n`
  );

  let successCount = 0;
  let errorCount = 0;

  for (const { ticker, company, currentPrice: oldPrice } of tickers) {
    try {
      const quote = await fetchQuoteFromYahoo(ticker);
      const newPrice = Number(quote.regularMarketPrice?.toFixed(2));
      const prevClose = quote.chartPreviousClose
        ? Number(quote.chartPreviousClose.toFixed(2))
        : undefined;

      const delta = Number(oldPrice)
        ? Number(
            (((newPrice - Number(oldPrice)) / Number(oldPrice)) * 100).toFixed(
              2
            )
          )
        : 0;
      const deltaSign = delta > 0 ? "+" : "";

      // 1. Update tickers table
      await db
        .update(tickersTable)
        .set({
          currentPrice: String(newPrice),
          previousClose: prevClose != null ? String(prevClose) : undefined,
          priceUpdatedAt: new Date(),
        })
        .where(eq(tickersTable.ticker, ticker));

      console.log(
        `  ✅ [${ticker.padEnd(5)}] $${newPrice.toFixed(2)} (${deltaSign}${delta}% vs prior $${Number(oldPrice).toFixed(2)}) — ${company}`
      );
      successCount++;
    } catch (err) {
      console.error(
        `  ❌ [${ticker.padEnd(5)}] Failed to fetch price:`,
        err instanceof Error ? err.message : err
      );
      errorCount++;
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log(
    `📊 Price Sync Complete: ${successCount} updated, ${errorCount} errors`
  );
  console.log("═".repeat(60) + "\n");
}

syncPrices().catch((err) => {
  console.error("Fatal error during price sync:", err);
  process.exit(1);
});
