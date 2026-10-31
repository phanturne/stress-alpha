import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { formatSafeErrorDetails, normalizeTicker } from "@/lib/utils";
import { ingestNewsForTicker } from "@/lib/services/news-ingestion";

function isAuthorizedPipelineRequest(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const authHeader = request.headers.get("authorization") || "";
  const secret =
    process.env.PIPELINE_API_SECRET ||
    process.env.CRON_SECRET ||
    process.env.BETTER_AUTH_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(authHeader);
  return (
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual)
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedPipelineRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
