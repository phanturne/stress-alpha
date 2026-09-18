import { NextResponse } from "next/server";
import { getReportRepository, type ReportSummary } from "@/lib/repository";

export type { ReportSummary };

export async function GET() {
  try {
    const repo = getReportRepository();
    const reports = await repo.listReports();
    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error reading reports:", error);
    return NextResponse.json(
      { error: "Failed to list reports", details: String(error) },
      { status: 500 }
    );
  }
}
