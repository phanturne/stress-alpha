import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { formatSafeErrorDetails, normalizeTicker } from "@/lib/utils";
import {
  fetchCompletePipelineBundle,
  writePipelineArtifacts,
} from "@/lib/services/financial-data";

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

function isSafeStagingDir(dir: string): boolean {
  if (dir.includes("\0") || dir.split(/[/\\]/).includes("..")) {
    return false;
  }
  const resolved = path.resolve(dir);
  const reportsRoot = path.resolve(process.cwd(), "reports");
  const tmpRoot = path.resolve(os.tmpdir());
  return (
    resolved.startsWith(reportsRoot + path.sep) ||
    resolved === reportsRoot ||
    resolved.startsWith(tmpRoot + path.sep)
  );
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedPipelineRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticker = normalizeTicker(searchParams.get("ticker"));

    if (!ticker) {
      return NextResponse.json(
        { error: "Valid query parameter 'ticker' is required" },
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

    try {
      revalidateTag("reports", "max");
    } catch {
      // Ignore outside Next.js server runtime
    }

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
        details: formatSafeErrorDetails(error),
      },
      { status: 500 }
    );
  }
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
      if (!isSafeStagingDir(effectiveStagingDir)) {
        return NextResponse.json(
          {
            error:
              "Invalid stagingDir: path traversal detected or directory outside allowed reports/ workspace",
          },
          { status: 400 }
        );
      }
      artifactsWritten = await writePipelineArtifacts(
        effectiveStagingDir,
        bundle,
        {
          overwriteFacts,
          overwriteAll,
        }
      );
    }

    try {
      revalidateTag("reports", "max");
    } catch {
      // Ignore outside Next.js server runtime
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
        details: formatSafeErrorDetails(error),
      },
      { status: 500 }
    );
  }
}
