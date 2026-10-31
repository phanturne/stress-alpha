import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getReportRepository } from "@/lib/repository";
import { formatSafeErrorDetails } from "@/lib/utils";

const getCachedReportBySlug = unstable_cache(
  async (slug: string) => {
    const repo = getReportRepository();
    return repo.getReport(slug);
  },
  ["report-by-slug"],
  { revalidate: 3600, tags: ["reports"] }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug || !/^[A-Za-z0-9._-]{1,80}$/.test(slug)) {
      return NextResponse.json(
        { error: "Invalid report slug" },
        { status: 400 }
      );
    }
    let report;
    try {
      report = await getCachedReportBySlug(slug);
    } catch {
      report = await getReportRepository().getReport(slug);
    }

    if (!report) {
      return NextResponse.json(
        {
          error: `Report not found or missing required artifacts: ${slug}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(report, {
      headers: {
        "Cache-Control":
          "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error loading report:", error);
    return NextResponse.json(
      {
        error: "Failed to load report",
        details: formatSafeErrorDetails(error),
      },
      { status: 500 }
    );
  }
}
