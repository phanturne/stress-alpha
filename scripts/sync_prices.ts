#!/usr/bin/env node
/**
 * Standalone script to sync nightly stock market closing prices from Yahoo Finance into Neon Postgres.
 *
 * Usage:
 *   npx tsx scripts/sync_prices.ts
 */

import * as dotenv from "dotenv";
import YahooFinance from "yahoo-finance2";
import { eq, sql } from "drizzle-orm";
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
  trailingPE?: number;
  forwardPE?: number;
  epsTrailingTwelveMonths?: number;
  epsForward?: number;
  marketCap?: number;
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
    trailingPE: quote.trailingPE,
    forwardPE: quote.forwardPE,
    epsTrailingTwelveMonths: quote.epsTrailingTwelveMonths,
    epsForward: quote.epsForward,
    marketCap: quote.marketCap,
  };
}

function buildTickerUpdate(
  quote: any,
  ticker: string,
  company: string,
  newPrice: number,
  prevClose: number | undefined,
  technicalLevels: any,
  now: Date
): typeof tickersTable.$inferInsert {
  const trailingEps =
    typeof quote?.epsTrailingTwelveMonths === "number"
      ? String(quote.epsTrailingTwelveMonths.toFixed(4))
      : undefined;
  const forwardEps =
    typeof quote?.epsForward === "number"
      ? String(quote.epsForward.toFixed(4))
      : undefined;
  const trailingPe =
    typeof quote?.trailingPE === "number"
      ? String(quote.trailingPE.toFixed(2))
      : undefined;
  const forwardPe =
    typeof quote?.forwardPE === "number"
      ? String(quote.forwardPE.toFixed(2))
      : undefined;
  const marketCap =
    typeof quote?.marketCap === "number"
      ? String((quote.marketCap / 1e9).toFixed(2))
      : undefined;

  return {
    ticker,
    company,
    currentPrice: String(newPrice),
    previousClose: prevClose != null ? String(prevClose) : undefined,
    marketCap,
    trailingEps,
    forwardEps,
    trailingPe,
    forwardPe,
    technicalLevels,
    priceUpdatedAt: now,
  };
}

async function syncPrices() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set. Aborting nightly price sync.");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  let targetTicker: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--ticker=")) {
      targetTicker = args[i].split("=")[1].toUpperCase();
    } else if (args[i] === "--ticker" || args[i] === "-t") {
      targetTicker = args[++i]?.toUpperCase();
    }
  }

  const db = getDb();
  console.log(
    "\n📈 [StressAlpha Price Sync] Fetching universe of active tickers..."
  );

  let tickers = await db
    .select({
      ticker: tickersTable.ticker,
      company: tickersTable.company,
      currentPrice: tickersTable.currentPrice,
      technicalLevels: tickersTable.technicalLevels,
    })
    .from(tickersTable)
    .where(eq(tickersTable.active, true));

  if (targetTicker) {
    tickers = tickers.filter((t) => t.ticker.toUpperCase() === targetTicker);
  }

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
    const chunkUpdates: Array<typeof tickersTable.$inferInsert> = [];
    const now = new Date();

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

          chunkUpdates.push(
            buildTickerUpdate(
              quote,
              ticker,
              company,
              newPrice,
              prevClose,
              technicalLevels,
              now
            )
          );

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

            chunkUpdates.push(
              buildTickerUpdate(
                single,
                ticker,
                company,
                newPrice,
                prevClose,
                technicalLevels,
                now
              )
            );

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
          // Gentle 200ms throttle between individual fallbacks to prevent burst spamming
          await new Promise((r) => setTimeout(r, 200));
          const newPrice = Number(single.regularMarketPrice?.toFixed(2));
          const prevClose =
            typeof single.regularMarketPreviousClose === "number"
              ? Number(single.regularMarketPreviousClose.toFixed(2))
              : undefined;
          const technicalLevels = computeTechnicalLevels(single, newPrice, {
            existingLevels: (oldTechLevels as any) ?? undefined,
          });

          chunkUpdates.push(
            buildTickerUpdate(
              single,
              ticker,
              company,
              newPrice,
              prevClose,
              technicalLevels,
              now
            )
          );

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

    if (chunkUpdates.length > 0) {
      await db
        .insert(tickersTable)
        .values(chunkUpdates)
        .onConflictDoUpdate({
          target: tickersTable.ticker,
          set: {
            currentPrice: sql`excluded.current_price`,
            previousClose: sql`COALESCE(excluded.previous_close, ${tickersTable.previousClose})`,
            marketCap: sql`COALESCE(excluded.market_cap, ${tickersTable.marketCap})`,
            trailingEps: sql`COALESCE(excluded.trailing_eps, ${tickersTable.trailingEps})`,
            forwardEps: sql`COALESCE(excluded.forward_eps, ${tickersTable.forwardEps})`,
            trailingPe: sql`COALESCE(excluded.trailing_pe, ${tickersTable.trailingPe})`,
            forwardPe: sql`COALESCE(excluded.forward_pe, ${tickersTable.forwardPe})`,
            technicalLevels: sql`excluded.technical_levels`,
            priceUpdatedAt: sql`excluded.price_updated_at`,
          },
        });
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

  await triggerRevalidation();
}

async function triggerRevalidation(): Promise<void> {
  const appUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://stressalpha.vercel.app");
  const secret = process.env.REVALIDATION_SECRET || process.env.CRON_SECRET;

  if (!appUrl) return;

  try {
    const url = `${appUrl.replace(/\/$/, "")}/api/revalidate?tag=reports`;
    console.log(
      `🔄 [StressAlpha Revalidation] Purging CDN & Data Cache at ${url}...`
    );
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
    });
    if (res.ok) {
      console.log("  ✅ Cache revalidated successfully.");
    } else {
      console.warn(
        `  ⚠️ Revalidation returned HTTP ${res.status}: ${await res.text()}`
      );
    }
  } catch (err) {
    console.warn(
      "  ℹ️ Revalidation call skipped/failed:",
      err instanceof Error ? err.message : err
    );
  }
}

syncPrices().catch((err) => {
  console.error("Fatal error during price sync:", err);
  process.exit(1);
});
