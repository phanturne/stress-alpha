import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export interface MarketIndexItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  high?: number;
  low?: number;
  sparkline?: number[];
}

export interface MarketSectorItem {
  symbol: string;
  sectorId: string;
  name: string;
  price: number;
  changePct: number;
}

export interface MarketSummaryResponse {
  indices: MarketIndexItem[];
  sectors: Record<string, number>; // { XLK: -1.2, XLC: 0.5, ... }
  updatedAt: string;
}

const INDEX_CONFIG = [
  { symbol: "SPY", name: "S&P 500", fallbackPrice: 578.5, fallbackPct: 0.35 },
  {
    symbol: "QQQ",
    name: "Nasdaq 100",
    fallbackPrice: 495.2,
    fallbackPct: 0.82,
  },
  { symbol: "DIA", name: "Dow Jones", fallbackPrice: 422.4, fallbackPct: 0.15 },
  {
    symbol: "IWM",
    name: "Russell 2000",
    fallbackPrice: 222.1,
    fallbackPct: -0.25,
  },
  {
    symbol: "^TNX",
    name: "10Y Treasury",
    fallbackPrice: 4.28,
    fallbackPct: -0.65,
  },
  {
    symbol: "^VIX",
    name: "Volatility (VIX)",
    fallbackPrice: 15.8,
    fallbackPct: -3.2,
  },
];

const SECTOR_ETFS = [
  "XLK", // Technology
  "XLC", // Communication
  "XLY", // Consumer Discretionary
  "XLF", // Financials
  "XLV", // Health Care
  "XLI", // Industrials
  "XLP", // Consumer Staples
  "XLE", // Energy
  "XLU", // Utilities
  "XLRE", // Real Estate
  "XLB", // Materials
];

// Fallback ETF changes in case network/rate limit blocks Yahoo Finance
const DEFAULT_SECTOR_CHANGES: Record<string, number> = {
  XLK: 0.85,
  XLC: 0.42,
  XLY: -0.21,
  XLF: 0.31,
  XLV: -0.15,
  XLI: 0.28,
  XLP: -0.45,
  XLE: 1.12,
  XLU: -0.38,
  XLRE: -0.12,
  XLB: 0.19,
};

let cache: { data: MarketSummaryResponse; timestamp: number } | null = null;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes fresh cache
const ERROR_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes cooldown on error to protect upstream rate limits

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cache.data, {
      headers: {
        "Cache-Control":
          "public, max-age=60, s-maxage=180, stale-while-revalidate=600",
      },
    });
  }

  const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  const allSymbols = [...INDEX_CONFIG.map((i) => i.symbol), ...SECTOR_ETFS];

  try {
    const rawQuotes = await yf.quote(allSymbols);
    const quotesList = Array.isArray(rawQuotes) ? rawQuotes : [rawQuotes];
    const quoteMap = new Map<string, any>();
    for (const q of quotesList) {
      if (q && q.symbol) {
        quoteMap.set(q.symbol.toUpperCase(), q);
      }
    }

    const indices: MarketIndexItem[] = INDEX_CONFIG.map((cfg) => {
      const q = quoteMap.get(cfg.symbol.toUpperCase());
      if (q && typeof q.regularMarketPrice === "number") {
        const price = Number(q.regularMarketPrice.toFixed(2));
        const prev =
          typeof q.regularMarketPreviousClose === "number"
            ? q.regularMarketPreviousClose
            : price;
        const change = Number((price - prev).toFixed(2));
        const changePct = Number(
          (typeof q.regularMarketChangePercent === "number"
            ? q.regularMarketChangePercent
            : (change / prev) * 100
          ).toFixed(2)
        );
        const high =
          typeof q.regularMarketDayHigh === "number"
            ? Number(q.regularMarketDayHigh.toFixed(2))
            : undefined;
        const low =
          typeof q.regularMarketDayLow === "number"
            ? Number(q.regularMarketDayLow.toFixed(2))
            : undefined;

        // Generate synthetic intraday sparkline based on low, prev, high, price
        const sparkline =
          low != null && high != null
            ? [
                prev,
                low + (high - low) * 0.2,
                low + (high - low) * 0.6,
                low + (high - low) * 0.4,
                low + (high - low) * 0.8,
                price,
              ]
            : undefined;

        return {
          symbol: cfg.symbol,
          name: cfg.name,
          price,
          change,
          changePct,
          high,
          low,
          sparkline,
        };
      }

      // Fallback for this individual index
      return {
        symbol: cfg.symbol,
        name: cfg.name,
        price: cfg.fallbackPrice,
        change: Number(
          ((cfg.fallbackPrice * cfg.fallbackPct) / 100).toFixed(2)
        ),
        changePct: cfg.fallbackPct,
      };
    });

    const sectors: Record<string, number> = {};
    for (const etf of SECTOR_ETFS) {
      const q = quoteMap.get(etf);
      if (q && typeof q.regularMarketChangePercent === "number") {
        sectors[etf] = Number(q.regularMarketChangePercent.toFixed(2));
      } else {
        sectors[etf] = DEFAULT_SECTOR_CHANGES[etf] ?? 0;
      }
    }

    const payload: MarketSummaryResponse = {
      indices,
      sectors,
      updatedAt: new Date().toISOString(),
    };

    cache = { data: payload, timestamp: now };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control":
          "public, max-age=60, s-maxage=180, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.warn(
      "⚠️ [Market Summary API] Yahoo Finance fetch failed, using fallback or stale cache:",
      err
    );

    // If we have stale cache, serve it and extend cooldown to protect against 429 cascades
    if (cache) {
      cache.timestamp = now; // Give 2 min cooldown before retrying
      return NextResponse.json(cache.data, {
        headers: {
          "Cache-Control":
            "public, max-age=60, s-maxage=180, stale-while-revalidate=600",
        },
      });
    }

    // Provide robust fallback response and cache it to prevent repeated failed calls
    const fallbackIndices: MarketIndexItem[] = INDEX_CONFIG.map((cfg) => ({
      symbol: cfg.symbol,
      name: cfg.name,
      price: cfg.fallbackPrice,
      change: Number(((cfg.fallbackPrice * cfg.fallbackPct) / 100).toFixed(2)),
      changePct: cfg.fallbackPct,
    }));

    const payload: MarketSummaryResponse = {
      indices: fallbackIndices,
      sectors: DEFAULT_SECTOR_CHANGES,
      updatedAt: new Date().toISOString(),
    };

    cache = { data: payload, timestamp: now };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=180",
      },
    });
  }
}
