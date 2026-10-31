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
    const revisions = await repo.getValuationRevisions(ticker, limit);

    const normalizedRevisions = revisions.map((r) => ({
      ...r,
      revisionDate:
        r.revisionDate instanceof Date
          ? r.revisionDate.toISOString()
          : String(r.revisionDate),
      priorWfv: Number(r.priorWfv),
      newWfv: Number(r.newWfv),
      wfvDeltaPct: Number(r.wfvDeltaPct),
    }));

    return NextResponse.json(
      {
        revisions: normalizedRevisions,
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Error in GET /api/revisions:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch valuation revisions",
        details: formatSafeErrorDetails(error),
      },
      { status: 500 }
    );
  }
}
