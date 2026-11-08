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

export interface MarketSummaryStory {
  id: string;
  headline: string;
  summary: string;
  publisher?: string;
  url?: string;
  publishedAt?: string;
  sources: number;
  tickers: string[];
  tag?: string;
}

export interface MarketSummaryResponse {
  indices: MarketIndexItem[];
  sectors: Record<string, number>; // { XLK: -1.2, XLC: 0.5, ... }
  stories?: MarketSummaryStory[];
  updatedAt: string;
  pipelineUpdatedAt?: string;
}

const INDEX_CONFIG = [
  { symbol: "SPY", name: "S&P 500" },
  { symbol: "QQQ", name: "Nasdaq 100" },
  { symbol: "DIA", name: "Dow Jones" },
  { symbol: "IWM", name: "Russell 2000" },
  { symbol: "^TNX", name: "10Y Treasury" },
  { symbol: "^VIX", name: "Volatility (VIX)" },
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

// Default sector returns: neutral 0.00% if live quote fails (no synthetic moves)
const DEFAULT_SECTOR_CHANGES: Record<string, number> = Object.fromEntries(
  SECTOR_ETFS.map((s) => [s, 0.0])
);

let cache: { data: MarketSummaryResponse; timestamp: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes fresh cache (aligned with institutional caching tier)
const ERROR_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown on error to protect upstream rate limits

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cache.data, {
      headers: {
        "Cache-Control":
          "public, max-age=300, s-maxage=900, stale-while-revalidate=1800",
      },
    });
  }

  const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  const allSymbols = [...INDEX_CONFIG.map((i) => i.symbol), ...SECTOR_ETFS];

  try {
    const [rawQuotes, searchRes] = await Promise.all([
      yf.quote(allSymbols),
      yf
        .search("^GSPC", { quotesCount: 0, newsCount: 8 })
        .catch(() => ({ news: [] })),
    ]);
    const quotesList = Array.isArray(rawQuotes) ? rawQuotes : [rawQuotes];
    const quoteMap = new Map<string, any>();
    for (const q of quotesList) {
      if (q && q.symbol) {
        quoteMap.set(q.symbol.toUpperCase(), q);
      }
    }

    const rawNews = Array.isArray(searchRes?.news) ? searchRes.news : [];
    const stories: MarketSummaryStory[] = rawNews
      .filter((n: any) => n && n.title)
      .slice(0, 6)
      .map((n: any, idx: number) => {
        const cleanTickers: string[] = Array.from(
          new Set<string>(
            (Array.isArray(n.relatedTickers) ? n.relatedTickers : [])
              .map((t: any) => String(t).toUpperCase().trim())
              .filter(
                (t: string) =>
                  t.length > 0 && !t.startsWith("^") && !t.includes("=")
              )
          )
        ).slice(0, 6);
        const pubTime = n.providerPublishTime
          ? new Date(n.providerPublishTime).toISOString()
          : undefined;
        return {
          id: n.uuid || `story-${idx + 1}`,
          headline: String(n.title),
          summary: n.publisher
            ? `${n.publisher} — ${n.title}`
            : String(n.title),
          publisher: n.publisher ? String(n.publisher) : "Yahoo Finance",
          url: n.link ? String(n.link) : undefined,
          publishedAt: pubTime,
          sources: 1,
          tickers: cleanTickers,
          tag: n.publisher ? String(n.publisher) : "Market Wire",
        };
      });

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

      // Fallback for this individual index if quote is unavailable
      return {
        symbol: cfg.symbol,
        name: cfg.name,
        price: 0,
        change: 0,
        changePct: 0,
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
      stories: stories.length > 0 ? stories : undefined,
      updatedAt: new Date().toISOString(),
    };

    cache = { data: payload, timestamp: now };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control":
          "public, max-age=300, s-maxage=900, stale-while-revalidate=1800",
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
            "public, max-age=300, s-maxage=900, stale-while-revalidate=1800",
        },
      });
    }

    // Provide neutral fallback response without fake prices
    const fallbackIndices: MarketIndexItem[] = INDEX_CONFIG.map((cfg) => ({
      symbol: cfg.symbol,
      name: cfg.name,
      price: 0,
      change: 0,
      changePct: 0,
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
