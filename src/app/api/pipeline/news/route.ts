import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { ingestNewsForTicker } from "@/lib/services/news-ingestion";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const ticker = body.ticker;

    if (!ticker || typeof ticker !== "string") {
      return NextResponse.json(
        { error: "Body field 'ticker' is required" },
        { status: 400 }
      );
    }

    const lookbackDays =
      typeof body.lookbackDays === "number" ? body.lookbackDays : undefined;

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
        details: String(error),
      },
      { status: 500 }
    );
  }
}
