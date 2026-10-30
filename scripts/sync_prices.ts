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
import {
  computeTechnicalLevels,
  type YahooQuoteLike,
} from "../src/lib/technical";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

interface YahooQuoteResult extends YahooQuoteLike {
  regularMarketVolume?: number;
}

async function fetchQuoteFromYahoo(ticker: string): Promise<YahooQuoteResult> {
  const quote = await yf.quote(ticker);
  if (!quote || typeof quote.regularMarketPrice !== "number") {
    throw new Error(`Invalid quote returned for ${ticker}`);
  }
  return {
    regularMarketPrice: quote.regularMarketPrice,
    regularMarketPreviousClose: quote.regularMarketPreviousClose,
    regularMarketDayHigh: quote.regularMarketDayHigh,
    regularMarketDayLow: quote.regularMarketDayLow,
    fiftyDayAverage: quote.fiftyDayAverage,
    twoHundredDayAverage: quote.twoHundredDayAverage,
    fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
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
      technicalLevels: tickersTable.technicalLevels,
    })
    .from(tickersTable)
    .where(eq(tickersTable.active, true));

  if (tickers.length === 0) {
    console.log("  ℹ️ No active tickers found in database.");
    return;
  }

  console.log(
    `  Found ${tickers.length} active tickers across coverage universe.\n`
  );

  let successCount = 0;
  let errorCount = 0;
  const chunkSize = 50;

  for (let i = 0; i < tickers.length; i += chunkSize) {
    const chunk = tickers.slice(i, i + chunkSize);
    const symbols = chunk.map((c) => c.ticker);

    try {
      const rawQuotes = await yf.quote(symbols);
      const quotesList = Array.isArray(rawQuotes) ? rawQuotes : [rawQuotes];
      const quoteMap = new Map<string, any>();

      for (const q of quotesList) {
        if (q && q.symbol) {
          quoteMap.set(q.symbol.toUpperCase(), q);
        }
      }

      for (const {
        ticker,
        company,
        currentPrice: oldPrice,
        technicalLevels: oldTechLevels,
      } of chunk) {
        const quote = quoteMap.get(ticker.toUpperCase());
        if (quote && typeof quote.regularMarketPrice === "number") {
          const newPrice = Number(quote.regularMarketPrice.toFixed(2));
          const prevClose =
            typeof quote.regularMarketPreviousClose === "number"
              ? Number(quote.regularMarketPreviousClose.toFixed(2))
              : undefined;

          const delta = Number(oldPrice)
            ? Number(
                (
                  ((newPrice - Number(oldPrice)) / Number(oldPrice)) *
                  100
                ).toFixed(2)
              )
            : 0;
          const deltaSign = delta > 0 ? "+" : "";

          const technicalLevels = computeTechnicalLevels(quote, newPrice, {
            existingLevels: (oldTechLevels as any) ?? undefined,
          });

          await db
            .update(tickersTable)
            .set({
              currentPrice: String(newPrice),
              previousClose: prevClose != null ? String(prevClose) : undefined,
              technicalLevels,
              priceUpdatedAt: new Date(),
            })
            .where(eq(tickersTable.ticker, ticker));

          console.log(
            `  ✅ [${ticker.padEnd(5)}] $${newPrice.toFixed(2)} (${deltaSign}${delta}% vs prior $${Number(oldPrice).toFixed(2)}) — ${company}`
          );
          successCount++;
        } else {
          // Fallback to individual quote
          try {
            const single = await fetchQuoteFromYahoo(ticker);
            const newPrice = Number(single.regularMarketPrice?.toFixed(2));
            const prevClose =
              typeof single.regularMarketPreviousClose === "number"
                ? Number(single.regularMarketPreviousClose.toFixed(2))
                : undefined;
            const technicalLevels = computeTechnicalLevels(single, newPrice, {
              existingLevels: (oldTechLevels as any) ?? undefined,
            });

            await db
              .update(tickersTable)
              .set({
                currentPrice: String(newPrice),
                previousClose:
                  prevClose != null ? String(prevClose) : undefined,
                technicalLevels,
                priceUpdatedAt: new Date(),
              })
              .where(eq(tickersTable.ticker, ticker));

            console.log(
              `  ✅ [${ticker.padEnd(5)}] $${newPrice.toFixed(2)} — ${company}`
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
      }
    } catch {
      // If batch fails, fallback to individual fetches for this chunk
      for (const {
        ticker,
        company,
        currentPrice: oldPrice,
        technicalLevels: oldTechLevels,
      } of chunk) {
        try {
          const single = await fetchQuoteFromYahoo(ticker);
          const newPrice = Number(single.regularMarketPrice?.toFixed(2));
          const prevClose =
            typeof single.regularMarketPreviousClose === "number"
              ? Number(single.regularMarketPreviousClose.toFixed(2))
              : undefined;
          const technicalLevels = computeTechnicalLevels(single, newPrice, {
            existingLevels: (oldTechLevels as any) ?? undefined,
          });

          await db
            .update(tickersTable)
            .set({
              currentPrice: String(newPrice),
              previousClose: prevClose != null ? String(prevClose) : undefined,
              technicalLevels,
              priceUpdatedAt: new Date(),
            })
            .where(eq(tickersTable.ticker, ticker));

          console.log(
            `  ✅ [${ticker.padEnd(5)}] $${newPrice.toFixed(2)} — ${company}`
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
    }

    if (i + chunkSize < tickers.length) {
      await new Promise((r) => setTimeout(r, 100));
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
