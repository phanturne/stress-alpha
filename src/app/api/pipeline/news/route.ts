import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { formatSafeErrorDetails, normalizeTicker } from "@/lib/utils";
import { ingestNewsForTicker } from "@/lib/services/news-ingestion";

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production") {
      const authHeader = request.headers.get("authorization");
      const expectedSecret =
        process.env.PIPELINE_API_SECRET || process.env.BETTER_AUTH_SECRET;
      const hasToken =
        Boolean(expectedSecret) && authHeader === `Bearer ${expectedSecret}`;
      if (!hasToken) {
        const session = await auth.api
          .getSession({ headers: request.headers })
          .catch(() => null);
        if (!session?.user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
      }
    }

    const body = await request.json().catch(() => ({}));
    const ticker =
      typeof body.ticker === "string" ? normalizeTicker(body.ticker) : "";

    if (!ticker) {
      return NextResponse.json(
        { error: "Valid body field 'ticker' is required" },
        { status: 400 }
      );
    }

    const rawLookback =
      typeof body.lookbackDays === "number" ? body.lookbackDays : undefined;
    const lookbackDays =
      rawLookback !== undefined && Number.isFinite(rawLookback)
        ? Math.max(1, Math.min(30, Math.floor(rawLookback)))
        : undefined;

    const result = await ingestNewsForTicker(ticker, { lookbackDays });

    try {
      revalidateTag("reports", "max");
    } catch {
      // Ignore outside Next.js server runtime
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in POST /api/pipeline/news:", error);
    return NextResponse.json(
      {
        error: "Failed to ingest news and catalysts",
        details: formatSafeErrorDetails(error),
      },
      { status: 500 }
    );
  }
}
