import { NextRequest, NextResponse } from "next/server";
import { getReportRepository } from "@/lib/repository";
import { formatSafeErrorDetails, normalizeTicker } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = normalizeTicker(searchParams.get("ticker"));

    if (!ticker) {
      return NextResponse.json(
        { error: "Valid query parameter 'ticker' is required" },
        { status: 400 }
      );
    }

    const limitStr = searchParams.get("limit");
    const parsedLimit = limitStr ? parseInt(limitStr, 10) : 50;
    const limit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(200, parsedLimit))
      : 50;

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
          "Cache-Control":
            "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Error in GET /api/news:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch market news and events",
        details: formatSafeErrorDetails(error),
      },
      { status: 500 }
    );
  }
}
