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
  ["reports-list"],
  { revalidate: 3600, tags: ["reports"] }
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
            "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
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
