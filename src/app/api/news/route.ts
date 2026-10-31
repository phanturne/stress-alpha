import { NextRequest, NextResponse } from "next/server";
import { getReportRepository } from "@/lib/repository";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");

    if (!ticker) {
      return NextResponse.json(
        { error: "Query parameter 'ticker' is required" },
        { status: 400 }
      );
    }

    const limitStr = searchParams.get("limit");
    const limit = limitStr ? parseInt(limitStr, 10) : 50;

    const repo = getReportRepository();
    const [events, upstreamDependencies] = await Promise.all([
      repo.getMarketEvents(ticker, limit),
      repo.getUpstreamDependencies(ticker),
    ]);

    const normalizedEvents = events.map((e) => ({
      ...e,
      publishedAt:
        e.publishedAt instanceof Date
          ? e.publishedAt.toISOString()
          : String(e.publishedAt),
      priceMovePct: e.priceMovePct != null ? Number(e.priceMovePct) : undefined,
      abnormalReturnSigma:
        e.abnormalReturnSigma != null
          ? Number(e.abnormalReturnSigma)
          : undefined,
      impliedWfvImpactPct:
        e.impliedWfvImpactPct != null
          ? Number(e.impliedWfvImpactPct)
          : undefined,
      sources: (e as any).sources ?? [],
    }));

    const normalizedDeps = upstreamDependencies.map((d) => ({
      ...d,
      exposureShare: Number(d.exposureShare),
      elasticity: Number(d.elasticity),
    }));

    return NextResponse.json(
      {
        events: normalizedEvents,
        upstreamDependencies: normalizedDeps,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Error in GET /api/news:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch market news and events",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
