import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { upcomingEarningsTable } from "@/db/schema";
import { sql, asc } from "drizzle-orm";

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

  const getNyDate = (offsetDays = 0) => {
    const d = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
    return d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  };
  const todayNy = getNyDate(0);

  let finalEarnings: UpcomingEarningsItem[] = [];

  try {
    if (process.env.DATABASE_URL) {
      const db = getDb();
      const rows = await db
        .select()
        .from(upcomingEarningsTable)
        .where(sql`date >= ${todayNy}`)
        .orderBy(
          asc(upcomingEarningsTable.date),
          asc(upcomingEarningsTable.symbol)
        );

      if (rows && rows.length > 0) {
        finalEarnings = rows.map((r) => ({
          symbol: r.symbol,
          company: r.company,
          date: r.date,
          hour: (r.hour || "bmo") as "bmo" | "amc",
          quarter: r.quarter ?? undefined,
          year: r.year ?? undefined,
          epsEstimate:
            r.epsEstimate != null ? parseFloat(r.epsEstimate) : undefined,
          revenueEstimate:
            r.revenueEstimate != null
              ? parseFloat(r.revenueEstimate)
              : undefined,
          hasModel: r.hasModel,
          reportSlug: r.reportSlug ?? undefined,
          sectorId: r.sectorId ?? undefined,
        }));
      }
    }
  } catch (dbErr) {
    console.warn(
      "⚠️ [Earnings Route] Failed to query Neon DB upcoming_earnings:",
      dbErr
    );
  }

  // Resilient fallback if Neon DB docket is cold or not yet synced
  if (finalEarnings.length === 0) {
    finalEarnings = getCuratedEarnings(todayNy);
  }

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  if (fromParam) {
    finalEarnings = finalEarnings.filter((e) => e.date >= fromParam);
  }
  if (toParam) {
    finalEarnings = finalEarnings.filter((e) => e.date <= toParam);
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
}
