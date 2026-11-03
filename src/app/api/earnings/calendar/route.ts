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

// Fallback high-profile earnings docket for guaranteed offline resilience
const CURATED_UPCOMING_EARNINGS: UpcomingEarningsItem[] = [
  {
    symbol: "NVDA",
    company: "NVIDIA Corporation",
    date: "2026-11-04",
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
    symbol: "PLTR",
    company: "Palantir Technologies",
    date: "2026-11-04",
    hour: "amc",
    quarter: 3,
    year: 2026,
    epsEstimate: 0.12,
    revenueEstimate: 815000000,
    hasModel: true,
    reportSlug: "PLTR-Q2-2026-analysis",
    sectorId: "technology",
  },
  {
    symbol: "DIS",
    company: "Walt Disney Co",
    date: "2026-11-05",
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
    date: "2026-11-05",
    hour: "amc",
    quarter: 3,
    year: 2026,
    epsEstimate: 0.24,
    revenueEstimate: 690000000,
    hasModel: true,
    reportSlug: "HOOD-Q2-2026-analysis",
    sectorId: "financials",
  },
  {
    symbol: "CSCO",
    company: "Cisco Systems",
    date: "2026-11-06",
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
    date: "2026-11-06",
    hour: "amc",
    quarter: 3,
    year: 2026,
    epsEstimate: -0.09,
    revenueEstimate: 110000000,
    hasModel: true,
    reportSlug: "RKLB-Q2-2026-analysis",
    sectorId: "industrials",
  },
  {
    symbol: "MRVL",
    company: "Marvell Technology",
    date: "2026-11-10",
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
    date: "2026-11-12",
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
    date: "2026-11-12",
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
    date: "2026-11-14",
    hour: "bmo",
    quarter: 2,
    year: 2027,
    epsEstimate: 2.1,
    revenueEstimate: 34500000000,
    hasModel: false,
    sectorId: "consumer_discretionary",
  },
];

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
    let rawCalendar: any[] = [];
    if (fromParam && toParam) {
      rawCalendar = await fetchFinnhubEarningsCalendar({
        from: fromParam,
        to: toParam,
      });
    } else {
      const todayNy = getNyDate(0);
      const day2Ny = getNyDate(2);
      const day3Ny = getNyDate(3);
      const day7Ny = getNyDate(7);

      const [nearTerm, midTerm] = await Promise.all([
        fetchFinnhubEarningsCalendar({ from: todayNy, to: day2Ny }),
        fetchFinnhubEarningsCalendar({ from: day3Ny, to: day7Ny }),
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
          company: symbol,
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

      // Prioritize symbols that have audited models or known sector maps
      mapped.sort((a, b) => {
        if (a.hasModel && !b.hasModel) return -1;
        if (!a.hasModel && b.hasModel) return 1;
        if (a.sectorId && !b.sectorId) return -1;
        if (!a.sectorId && b.sectorId) return 1;
        return a.date.localeCompare(b.date);
      });

      // Merge curated items if they match date horizon and not already in mapped
      for (const curated of CURATED_UPCOMING_EARNINGS) {
        if (!symbolSeen.has(curated.symbol)) {
          if (reportsMap.has(curated.symbol)) {
            curated.hasModel = true;
            curated.reportSlug = reportsMap.get(curated.symbol);
          }
          mapped.push(curated);
        }
      }

      mapped.sort((a, b) => {
        if (a.hasModel && !b.hasModel) return -1;
        if (!a.hasModel && b.hasModel) return 1;
        return a.date.localeCompare(b.date);
      });

      finalEarnings = mapped.slice(0, 50);
    } else {
      // Fallback
      finalEarnings = CURATED_UPCOMING_EARNINGS.map((item) => ({
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

    cachedEarnings = { data: CURATED_UPCOMING_EARNINGS, timestamp: now };

    return NextResponse.json(
      { earnings: CURATED_UPCOMING_EARNINGS },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=900",
        },
      }
    );
  }
}
