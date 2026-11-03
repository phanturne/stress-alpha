import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getReportRepository, type ReportSummary } from "@/lib/repository";
import { formatSafeErrorDetails } from "@/lib/utils";

export type { ReportSummary };

const getCachedReportsList = unstable_cache(
  async () => {
    const repo = getReportRepository();
    return repo.listReports();
  },
  ["reports-list-v2"],
  { revalidate: 300, tags: ["reports"] }
);

export async function GET() {
  try {
    let reports: ReportSummary[];
    try {
      reports = await getCachedReportsList();
    } catch {
      reports = await getReportRepository().listReports();
    }

    return NextResponse.json(
      { reports },
      {
        headers: {
          "Cache-Control":
            "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Error reading reports:", error);
    return NextResponse.json(
      {
        error: "Failed to list reports",
        details: formatSafeErrorDetails(error),
      },
      { status: 500 }
    );
  }
}
