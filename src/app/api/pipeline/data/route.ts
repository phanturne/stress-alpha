import { NextRequest, NextResponse } from "next/server";
import {
  fetchCompletePipelineBundle,
  writePipelineArtifacts,
} from "@/lib/services/financial-data";

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

    const benchmarkPriceStr = searchParams.get("benchmarkPrice");
    const benchmarkPrice = benchmarkPriceStr
      ? parseFloat(benchmarkPriceStr)
      : undefined;
    const quarterStr = searchParams.get("quarter") || undefined;

    const bundle = await fetchCompletePipelineBundle(ticker, {
      benchmarkPrice,
      quarterStr,
    });

    return NextResponse.json({
      success: true,
      ticker: bundle.ticker,
      asOfDate: bundle.asOfDate,
      bundle,
    });
  } catch (error) {
    console.error("Error in GET /api/pipeline/data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch financial pipeline data",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

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

    const benchmarkPrice =
      typeof body.benchmarkPrice === "number" ? body.benchmarkPrice : undefined;
    const quarterStr =
      typeof body.quarter === "string" ? body.quarter : undefined;
    const stagingDir =
      typeof body.stagingDir === "string" ? body.stagingDir : undefined;
    const autoStage = Boolean(body.autoStage);
    const overwriteFacts = Boolean(body.overwriteFacts);
    const overwriteAll = Boolean(body.overwriteAll);

    const bundle = await fetchCompletePipelineBundle(ticker, {
      benchmarkPrice,
      quarterStr,
    });

    let effectiveStagingDir = stagingDir;
    if (!effectiveStagingDir && autoStage) {
      effectiveStagingDir = `reports/${bundle.ticker}-${bundle.factsDraft.quarter.replace(
        /\s+/g,
        "-"
      )}-analysis`;
    }

    let artifactsWritten: string[] | undefined;
    if (effectiveStagingDir) {
      artifactsWritten = await writePipelineArtifacts(
        effectiveStagingDir,
        bundle,
        {
          overwriteFacts,
          overwriteAll,
        }
      );
    }

    return NextResponse.json({
      success: true,
      ticker: bundle.ticker,
      asOfDate: bundle.asOfDate,
      stagingDir: effectiveStagingDir,
      artifactsWritten,
      bundle,
    });
  } catch (error) {
    console.error("Error in POST /api/pipeline/data:", error);
    return NextResponse.json(
      {
        error: "Failed to process financial pipeline data request",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
