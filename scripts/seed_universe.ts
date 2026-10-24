#!/usr/bin/env node
/**
 * Standalone seed script to populate and synchronize the complete S&P 500
 * and NASDAQ-100 equity universe into Neon PostgreSQL.
 *
 * Usage:
 *   npx tsx scripts/seed_universe.ts
 *   npx tsx scripts/seed_universe.ts --dry-run
 *   npx tsx scripts/seed_universe.ts --skip-prices
 *   npx tsx scripts/seed_universe.ts --sp500-only
 *   npx tsx scripts/seed_universe.ts --nasdaq100-only
 */

import * as dotenv from "dotenv";
import YahooFinance from "yahoo-finance2";
import { sql } from "drizzle-orm";
import { getDb } from "../src/db";
import { tickersTable } from "../src/db/schema";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export interface UniverseConstituent {
  ticker: string;
  company: string;
  sector: string;
  indices: string[];
  currentPrice?: number;
  previousClose?: number;
  marketCapBillions?: number;
  currency?: string;
}

/**
 * Normalizes ticker symbols (e.g., BRK.B -> BRK-B, BF.B -> BF-B)
 * conforming to Yahoo Finance and institutional conventions.
 */
export function normalizeTicker(rawSymbol: string): string {
  return rawSymbol.trim().replace(/\./g, "-").toUpperCase();
}

/**
 * Strips HTML tags and unescapes standard HTML entities.
 */
function cleanText(rawHtml: string): string {
  return rawHtml
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * Fetches all official S&P 500 constituents from Wikipedia.
 */
export async function fetchSp500Constituents(): Promise<UniverseConstituent[]> {
  const url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies";
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) StressAlphaUniverse/1.0",
      Accept: "text/html",
    },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch S&P 500 constituents: HTTP ${res.status} ${res.statusText}`
    );
  }

  const html = await res.text();
  const tablePart = html.split(/id="constituents"/i)[1]?.split(/<\/table>/i)[0];
  if (!tablePart) {
    throw new Error(
      "Unable to locate S&P 500 constituents table in Wikipedia HTML."
    );
  }

  const rows = tablePart.split("<tr").slice(2); // Skip table header
  const constituents: UniverseConstituent[] = [];

  for (const row of rows) {
    const symbolMatch = row.match(
      /class="external text"[^>]*>([A-Z0-9\.\-]+)<\/a>/i
    );
    const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      cleanText(m[1])
    );

    if (symbolMatch && tds.length >= 3) {
      const ticker = normalizeTicker(symbolMatch[1]);
      const company = tds[1];
      const sector = tds[2];
      constituents.push({
        ticker,
        company,
        sector,
        indices: ["S&P 500"],
      });
    }
  }

  return constituents;
}

/**
 * Fetches all official NASDAQ-100 constituents from Wikipedia.
 */
export async function fetchNasdaq100Constituents(): Promise<
  UniverseConstituent[]
> {
  const url = "https://en.wikipedia.org/wiki/List_of_NASDAQ-100_companies";
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) StressAlphaUniverse/1.0",
      Accept: "text/html",
    },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch NASDAQ-100 constituents: HTTP ${res.status} ${res.statusText}`
    );
  }

  const html = await res.text();
  const tablePart = html.split(/id="constituents"/i)[1]?.split(/<\/table>/i)[0];
  if (!tablePart) {
    throw new Error(
      "Unable to locate NASDAQ-100 constituents table in Wikipedia HTML."
    );
  }

  const rows = tablePart.split("<tr").slice(2); // Skip table header
  const constituents: UniverseConstituent[] = [];

  for (const row of rows) {
    const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      cleanText(m[1])
    );

    if (tds.length >= 3) {
      const ticker = normalizeTicker(tds[0]);
      const company = tds[1];
      const sector = tds[2];
      constituents.push({
        ticker,
        company,
        sector,
        indices: ["NASDAQ-100"],
      });
    }
  }

  return constituents;
}

/**
 * Combines and deduplicates constituents from multiple index feeds.
 */
export function combineConstituents(
  sp500: UniverseConstituent[],
  nasdaq100: UniverseConstituent[]
): Map<string, UniverseConstituent> {
  const map = new Map<string, UniverseConstituent>();

  for (const item of sp500) {
    map.set(item.ticker, { ...item });
  }

  for (const item of nasdaq100) {
    if (map.has(item.ticker)) {
      const existing = map.get(item.ticker)!;
      if (!existing.indices.includes("NASDAQ-100")) {
        existing.indices.push("NASDAQ-100");
      }
    } else {
      map.set(item.ticker, { ...item });
    }
  }

  return map;
}

/**
 * Batch-fetches current market prices and metrics from Yahoo Finance.
 */
export async function populateBatchQuotes(
  constituents: UniverseConstituent[],
  chunkSize = 50
): Promise<void> {
  const total = constituents.length;
  console.log(
    `📡 Fetching live market quotes for ${total} tickers in batches of ${chunkSize}...`
  );

  for (let i = 0; i < total; i += chunkSize) {
    const chunk = constituents.slice(i, i + chunkSize);
    const symbols = chunk.map((c) => c.ticker);

    try {
      const rawQuotes = await yf.quote(symbols);
      const quotesList = Array.isArray(rawQuotes) ? rawQuotes : [rawQuotes];

      const quoteMap = new Map<string, any>();
      for (const q of quotesList) {
        if (q && q.symbol) {
          quoteMap.set(normalizeTicker(q.symbol), q);
        }
      }

      for (const item of chunk) {
        const q = quoteMap.get(item.ticker);
        if (q && typeof q.regularMarketPrice === "number") {
          item.currentPrice = Number(q.regularMarketPrice.toFixed(2));
          if (typeof q.regularMarketPreviousClose === "number") {
            item.previousClose = Number(
              q.regularMarketPreviousClose.toFixed(2)
            );
          }
          if (typeof q.marketCap === "number" && q.marketCap > 0) {
            item.marketCapBillions = Number((q.marketCap / 1e9).toFixed(2));
          }
          if (typeof q.currency === "string") {
            item.currency = q.currency;
          }
        }
      }

      const progress = Math.min(i + chunkSize, total);
      process.stdout.write(`  [${progress}/${total}] batches processed...\r`);
    } catch (err) {
      console.warn(
        `  ⚠️ Batch fetch warning for chunk starting at ${chunk[0]?.ticker}:`,
        err instanceof Error ? err.message : err
      );
    }

    // Gentle 100ms pause between chunks to respect Yahoo Finance
    if (i + chunkSize < total) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  console.log(
    `\n  ✅ Live quotes synchronized across all ${total} constituents.`
  );
}

export interface SeedUniverseOptions {
  dryRun?: boolean;
  skipPrices?: boolean;
  sp500Only?: boolean;
  nasdaq100Only?: boolean;
  batchSize?: number;
}

export async function seedUniverse(options: SeedUniverseOptions = {}) {
  console.log(
    "\n🌐 [StressAlpha Universe Seeder] Initializing Index Ingestion..."
  );

  let sp500List: UniverseConstituent[] = [];
  let nasdaq100List: UniverseConstituent[] = [];

  if (!options.nasdaq100Only) {
    console.log(
      "  📥 Fetching S&P 500 constituents from S&P Global / Wikipedia..."
    );
    sp500List = await fetchSp500Constituents();
    console.log(`    Found ${sp500List.length} S&P 500 constituents.`);
  }

  if (!options.sp500Only) {
    console.log(
      "  📥 Fetching NASDAQ-100 constituents from NASDAQ / Wikipedia..."
    );
    nasdaq100List = await fetchNasdaq100Constituents();
    console.log(`    Found ${nasdaq100List.length} NASDAQ-100 constituents.`);
  }

  const combinedMap = combineConstituents(sp500List, nasdaq100List);
  const allConstituents = Array.from(combinedMap.values()).sort((a, b) =>
    a.ticker.localeCompare(b.ticker)
  );

  let overlapCount = 0;
  let spOnlyCount = 0;
  let ndxOnlyCount = 0;

  for (const c of allConstituents) {
    if (c.indices.length > 1) overlapCount++;
    else if (c.indices[0] === "S&P 500") spOnlyCount++;
    else ndxOnlyCount++;
  }

  console.log("\n" + "=".repeat(62));
  console.log("📊 [Universe Composition Summary]");
  console.log(` • S&P 500 Total:           ${sp500List.length}`);
  console.log(` • NASDAQ-100 Total:        ${nasdaq100List.length}`);
  console.log(` • Overlapping (Both):      ${overlapCount}`);
  console.log(` • S&P 500 Exclusive:       ${spOnlyCount}`);
  console.log(` • NASDAQ-100 Exclusive:    ${ndxOnlyCount}`);
  console.log(` • Total Unique Universe:   ${allConstituents.length}`);
  console.log("=".repeat(62) + "\n");

  if (!options.skipPrices) {
    await populateBatchQuotes(allConstituents, options.batchSize || 50);
  }

  if (options.dryRun) {
    console.log(
      "\n🔍 [DRY RUN] Simulation mode active. Skipping database writes."
    );
    console.log("  Sample constituents preview:");
    console.table(
      allConstituents.slice(0, 10).map((c) => ({
        Ticker: c.ticker,
        Company:
          c.company.length > 24 ? c.company.slice(0, 22) + "..." : c.company,
        Sector: c.sector,
        Indices: c.indices.join(", "),
        Price: c.currentPrice != null ? `$${c.currentPrice.toFixed(2)}` : "N/A",
        MarketCap:
          c.marketCapBillions != null ? `$${c.marketCapBillions}B` : "N/A",
      }))
    );
    return {
      total: allConstituents.length,
      sp500Count: sp500List.length,
      nasdaq100Count: nasdaq100List.length,
      overlapCount,
      inserted: 0,
      updated: 0,
    };
  }

  if (!process.env.DATABASE_URL) {
    console.error(
      "❌ DATABASE_URL is not configured. Aborting database persistence."
    );
    process.exit(1);
  }

  const db = getDb();
  console.log(
    `💾 Persisting ${allConstituents.length} constituents into Neon PostgreSQL (tickers table)...`
  );

  const dbBatchSize = options.batchSize || 50;
  let insertedOrUpdated = 0;

  for (let i = 0; i < allConstituents.length; i += dbBatchSize) {
    const chunk = allConstituents.slice(i, i + dbBatchSize);

    for (const item of chunk) {
      const priceVal =
        item.currentPrice != null && item.currentPrice > 0
          ? String(item.currentPrice)
          : "0.00";
      const prevCloseVal =
        item.previousClose != null ? String(item.previousClose) : undefined;
      const mktCapVal =
        item.marketCapBillions != null
          ? String(item.marketCapBillions)
          : undefined;

      await db
        .insert(tickersTable)
        .values({
          ticker: item.ticker,
          company: item.company,
          sector: item.sector || "General",
          currency: item.currency || "USD",
          currentPrice: priceVal,
          previousClose: prevCloseVal,
          marketCap: mktCapVal,
          active: true,
          priceUpdatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: tickersTable.ticker,
          set: {
            company: item.company,
            sector: item.sector || sql`${tickersTable.sector}`,
            // If new price was fetched and valid, update price; otherwise preserve existing price
            currentPrice:
              item.currentPrice != null && item.currentPrice > 0
                ? priceVal
                : sql`${tickersTable.currentPrice}`,
            previousClose:
              prevCloseVal != null
                ? prevCloseVal
                : sql`${tickersTable.previousClose}`,
            marketCap:
              mktCapVal != null ? mktCapVal : sql`${tickersTable.marketCap}`,
            active: true,
            priceUpdatedAt: new Date(),
          },
        });

      insertedOrUpdated++;
    }

    const progress = Math.min(i + dbBatchSize, allConstituents.length);
    process.stdout.write(
      `  [${progress}/${allConstituents.length}] stored to Neon DB...\r`
    );
  }

  console.log(
    `\n🎉 Successfully synchronized ${insertedOrUpdated} tickers in Neon PostgreSQL!`
  );
  console.log(
    "   Nightly price sync and earnings calendar monitoring now active across entire universe.\n"
  );

  return {
    total: allConstituents.length,
    sp500Count: sp500List.length,
    nasdaq100Count: nasdaq100List.length,
    overlapCount,
    insertedOrUpdated,
  };
}

// Execute standalone CLI if invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const skipPrices = args.includes("--skip-prices");
  const sp500Only = args.includes("--sp500-only");
  const nasdaq100Only = args.includes("--nasdaq100-only");

  seedUniverse({
    dryRun,
    skipPrices,
    sp500Only,
    nasdaq100Only,
  }).catch((err) => {
    console.error("Fatal error during universe seeding:", err);
    process.exit(1);
  });
}
