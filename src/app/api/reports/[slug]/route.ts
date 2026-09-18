import { NextRequest, NextResponse } from "next/server";
import { getReportRepository } from "@/lib/repository";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const repo = getReportRepository();
    const report = await repo.getReport(slug);

    if (!report) {
      return NextResponse.json(
        {
          error: `Report not found or missing required artifacts: ${slug}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error loading report:", error);
    return NextResponse.json(
      { error: "Failed to load report", details: String(error) },
      { status: 500 }
    );
  }
}
