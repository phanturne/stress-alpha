import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getReportRepository } from "@/lib/repository";

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
      { error: "Failed to load report", details: String(error) },
      { status: 500 }
    );
  }
}
