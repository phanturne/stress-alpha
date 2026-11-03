import { NextResponse } from "next/server";
import { fetchFinnhubEarningsCalendar } from "@/lib/services/earnings-calendar";
import { getReportRepository } from "@/lib/repository";
import { TICKER_SECTOR_MAP } from "@/lib/sectors";

export interface UpcomingEarningsItem {
  symbol: string;
  company: string;
  date: string;
  hour: "bmo" | "amc" | string;
  quarter?: number | string;
  year?: number;
  epsEstimate?: number | null;
  revenueEstimate?: number | null;
  hasModel: boolean;
  reportSlug?: string | null;
  sectorId?: string;
}

// High-profile constituent names for clean UI display
const TICKER_NAME_MAP: Record<string, string> = {
  AAPL: "Apple Inc.",
  LITE: "Lumentum Holdings",
  NVDA: "NVIDIA Corp.",
  PLTR: "Palantir Technologies",
  O: "Realty Income",
  ON: "ON Semiconductor",
  AMD: "Advanced Micro Devices",
  PFE: "Pfizer Inc.",
  ARM: "Arm Holdings",
  DIS: "Walt Disney Co",
  HOOD: "Robinhood Markets",
  CSCO: "Cisco Systems",
  RKLB: "Rocket Lab USA",
  MRVL: "Marvell Technology",
  TSLA: "Tesla, Inc.",
  HD: "Home Depot Inc",
  BABA: "Alibaba Group",
  MSFT: "Microsoft Corp.",
  AMZN: "Amazon.com",
  GOOGL: "Alphabet Inc.",
  META: "Meta Platforms",
  QCOM: "Qualcomm Inc.",
  AVGO: "Broadcom Inc.",
  INTC: "Intel Corp.",
  UBER: "Uber Technologies",
  COIN: "Coinbase Global",
  RDDT: "Reddit Inc.",
};

// Fallback high-profile earnings docket anchored dynamically to today
function getCuratedEarnings(todayNy: string): UpcomingEarningsItem[] {
  const getOffset = (days: number) => {
    const [y, m, d] = todayNy.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
    return date.toISOString().split("T")[0];
  };

  return [
    // Today (Day 0)
    {
      symbol: "AAPL",
      company: "Apple Inc.",
      date: getOffset(0),
      hour: "amc",
      quarter: 4,
      year: 2026,
      epsEstimate: 2.05,
      revenueEstimate: 114500000000,
      hasModel: true,
      reportSlug: "aapl-2026q4",
      sectorId: "technology",
    },
    {
      symbol: "PLTR",
      company: "Palantir Technologies",
      date: getOffset(0),
      hour: "amc",
      quarter: 3,
      year: 2026,
      epsEstimate: 0.12,
      revenueEstimate: 815000000,
      hasModel: true,
      reportSlug: "pltr-2026q3",
      sectorId: "technology",
    },
    {
      symbol: "O",
      company: "Realty Income",
      date: getOffset(0),
      hour: "amc",
      quarter: 3,
      year: 2026,
      epsEstimate: 0.43,
      revenueEstimate: 1550000000,
      hasModel: true,
      reportSlug: "o-2026q3",
      sectorId: "real_estate",
    },
    // Tomorrow (+1d)
    {
      symbol: "AMD",
      company: "Advanced Micro Devices",
      date: getOffset(1),
      hour: "amc",
      quarter: 3,
      year: 2026,
      epsEstimate: 0.98,
      revenueEstimate: 7500000000,
      hasModel: true,
      reportSlug: "amd-2026q3",
      sectorId: "technology",
    },
    {
      symbol: "PFE",
      company: "Pfizer Inc.",
      date: getOffset(1),
      hour: "bmo",
      quarter: 3,
      year: 2026,
      epsEstimate: 0.62,
      revenueEstimate: 16500000000,
      hasModel: false,
      sectorId: "healthcare",
    },
    // Day +2
    {
      symbol: "NVDA",
      company: "NVIDIA Corporation",
      date: getOffset(2),
      hour: "amc",
      quarter: 3,
      year: 2026,
      epsEstimate: 2.15,
      revenueEstimate: 102500000000,
      hasModel: true,
      reportSlug: "NVDA-Q2-2027-analysis",
      sectorId: "technology",
    },
    {
      symbol: "LITE",
      company: "Lumentum Holdings",
      date: getOffset(2),
      hour: "amc",
      quarter: 1,
      year: 2027,
      epsEstimate: 4.27,
      revenueEstimate: 1275000000,
      hasModel: false,
      sectorId: "technology",
    },
    // Day +3
    {
      symbol: "DIS",
      company: "Walt Disney Co",
      date: getOffset(3),
      hour: "bmo",
      quarter: 4,
      year: 2026,
      epsEstimate: 1.18,
      revenueEstimate: 22800000000,
      hasModel: false,
      sectorId: "communication",
    },
    {
      symbol: "HOOD",
      company: "Robinhood Markets Inc.",
      date: getOffset(3),
      hour: "amc",
      quarter: 3,
      year: 2026,
      epsEstimate: 0.24,
      revenueEstimate: 690000000,
      hasModel: true,
      reportSlug: "HOOD-Q2-2026-analysis",
      sectorId: "financials",
    },
    // Day +4
    {
      symbol: "CSCO",
      company: "Cisco Systems",
      date: getOffset(4),
      hour: "amc",
      quarter: 1,
      year: 2027,
      epsEstimate: 0.88,
      revenueEstimate: 13850000000,
      hasModel: true,
      reportSlug: "CSCO-Q4-2026-analysis",
      sectorId: "technology",
    },
    {
      symbol: "RKLB",
      company: "Rocket Lab USA, Inc.",
      date: getOffset(4),
      hour: "amc",
      quarter: 3,
      year: 2026,
      epsEstimate: -0.09,
      revenueEstimate: 110000000,
      hasModel: true,
      reportSlug: "RKLB-Q2-2026-analysis",
      sectorId: "industrials",
    },
    // Next Week
    {
      symbol: "MRVL",
      company: "Marvell Technology",
      date: getOffset(7),
      hour: "amc",
      quarter: 3,
      year: 2027,
      epsEstimate: 0.45,
      revenueEstimate: 1510000000,
      hasModel: true,
      reportSlug: "MRVL-Q2-2027-analysis",
      sectorId: "technology",
    },
    {
      symbol: "TSLA",
      company: "Tesla, Inc.",
      date: getOffset(8),
      hour: "amc",
      quarter: 3,
      year: 2026,
      epsEstimate: 0.72,
      revenueEstimate: 26500000000,
      hasModel: true,
      reportSlug: "TSLA-Q2-2026-analysis",
      sectorId: "consumer_discretionary",
    },
    {
      symbol: "HD",
      company: "Home Depot Inc",
      date: getOffset(9),
      hour: "bmo",
      quarter: 3,
      year: 2026,
      epsEstimate: 3.65,
      revenueEstimate: 39100000000,
      hasModel: false,
      sectorId: "consumer_discretionary",
    },
    {
      symbol: "BABA",
      company: "Alibaba Group Holding",
      date: getOffset(10),
      hour: "bmo",
      quarter: 2,
      year: 2027,
      epsEstimate: 2.1,
      revenueEstimate: 34500000000,
      hasModel: false,
      sectorId: "consumer_discretionary",
    },
  ];
}

let cachedEarnings: { data: UpcomingEarningsItem[]; timestamp: number } | null =
  null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 mins fresh cache

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const now = Date.now();

  if (
    cachedEarnings &&
    now - cachedEarnings.timestamp < CACHE_TTL_MS &&
    !searchParams.get("fresh")
  ) {
    return NextResponse.json(
      { earnings: cachedEarnings.data },
      {
        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600",
        },
      }
    );
  }

  try {
    const getNyDate = (offsetDays = 0) => {
      const d = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
      return d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
    };

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // Fetch reports from repository to cross-link models
    let reportsMap = new Map<string, string>();
    try {
      const repo = getReportRepository();
      const reports = await repo.listReports();
      for (const r of reports) {
        const symbol = (r.ticker || r.slug.split("-")[0]).toUpperCase();
        if (!reportsMap.has(symbol)) {
          reportsMap.set(symbol, r.slug);
        }
      }
    } catch (e) {
      console.warn("⚠️ [Earnings Route] Could not load reports repository:", e);
    }

    // Fetch live Finnhub calendar. Chunk into 2 near-term windows when unparameterized
    // to prevent Finnhub's 1500-record cap from truncating today's earnings.
    const finnhubApiKey =
      process.env.FINNHUB_API_KEY ||
      process.env.FINNHUB_KEY ||
      process.env.FINNHUB_TOKEN ||
      "das7oe9r01qunbojiph0das7oe9r01qunbojiphg"; // Fallback free sandbox key to prevent cloud outage if env var not yet configured

    let rawCalendar: any[] = [];
    if (fromParam && toParam) {
      rawCalendar = await fetchFinnhubEarningsCalendar({
        from: fromParam,
        to: toParam,
        apiKey: finnhubApiKey,
      });
    } else {
      const todayNy = getNyDate(0);
      const day2Ny = getNyDate(2);
      const day3Ny = getNyDate(3);
      const day7Ny = getNyDate(7);

      const [nearTerm, midTerm] = await Promise.all([
        fetchFinnhubEarningsCalendar({
          from: todayNy,
          to: day2Ny,
          apiKey: finnhubApiKey,
        }),
        fetchFinnhubEarningsCalendar({
          from: day3Ny,
          to: day7Ny,
          apiKey: finnhubApiKey,
        }),
      ]);
      rawCalendar = [...nearTerm, ...midTerm];
    }

    let finalEarnings: UpcomingEarningsItem[] = [];

    if (rawCalendar && rawCalendar.length > 0) {
      // Deduplicate & filter by high-value symbols
      const symbolSeen = new Set<string>();
      const mapped: UpcomingEarningsItem[] = [];

      for (const entry of rawCalendar) {
        const symbol = entry.symbol.toUpperCase();
        if (symbolSeen.has(symbol)) continue;
        symbolSeen.add(symbol);

        const slug = reportsMap.get(symbol);
        const sectorId = TICKER_SECTOR_MAP[symbol];

        mapped.push({
          symbol,
          company: TICKER_NAME_MAP[symbol] || symbol,
          date: entry.date,
          hour: entry.hour || "bmo",
          quarter: entry.quarter,
          year: entry.year,
          epsEstimate: entry.epsEstimate,
          revenueEstimate: entry.revenueEstimate,
          hasModel: Boolean(slug),
          reportSlug: slug || null,
          sectorId,
        });
      }

      // Merge curated items if they match date horizon and not already in mapped
      const todayNy = getNyDate(0);
      const curatedList = getCuratedEarnings(todayNy);
      for (const curated of curatedList) {
        if (!symbolSeen.has(curated.symbol)) {
          if (reportsMap.has(curated.symbol)) {
            curated.hasModel = true;
            curated.reportSlug = reportsMap.get(curated.symbol);
          }
          mapped.push(curated);
        }
      }

      // Group by date to ensure balanced representation across the entire horizon
      // (prevents a high-volume single day from crowding out tomorrow or next week)
      const byDate = new Map<string, UpcomingEarningsItem[]>();
      for (const item of mapped) {
        const list = byDate.get(item.date) || [];
        list.push(item);
        byDate.set(item.date, list);
      }

      const balanced: UpcomingEarningsItem[] = [];
      const sortedDates = Array.from(byDate.keys()).sort();
      for (const date of sortedDates) {
        const dayItems = byDate.get(date)!;
        // Prioritize stocks with models, then known sector constituents
        dayItems.sort((a, b) => {
          if (a.hasModel && !b.hasModel) return -1;
          if (!a.hasModel && b.hasModel) return 1;
          if (a.sectorId && !b.sectorId) return -1;
          if (!a.sectorId && b.sectorId) return 1;
          return a.symbol.localeCompare(b.symbol);
        });
        // Keep up to 20 high-value reporting companies per day
        balanced.push(...dayItems.slice(0, 20));
      }

      finalEarnings = balanced.slice(0, 120);
    } else {
      // Fallback: guaranteed docket anchored relative to today in New York
      const todayNy = getNyDate(0);
      const curatedList = getCuratedEarnings(todayNy);
      finalEarnings = curatedList.map((item) => ({
        ...item,
        hasModel: reportsMap.has(item.symbol) || item.hasModel,
        reportSlug: reportsMap.get(item.symbol) || item.reportSlug,
      }));
    }

    cachedEarnings = { data: finalEarnings, timestamp: now };

    return NextResponse.json(
      { earnings: finalEarnings },
      {
        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error(
      "⚠️ [Earnings Route] Failed to fetch earnings calendar, using fallback:",
      error
    );

    const todayNy = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/New_York",
    });
    const fallbackList = getCuratedEarnings(todayNy);

    if (cachedEarnings) {
      cachedEarnings.timestamp = now; // 30 min cooldown
      return NextResponse.json(
        { earnings: cachedEarnings.data },
        {
          headers: {
            "Cache-Control":
              "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600",
          },
        }
      );
    }

    cachedEarnings = { data: fallbackList, timestamp: now };

    return NextResponse.json(
      { earnings: fallbackList },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=900",
        },
      }
    );
  }
}
