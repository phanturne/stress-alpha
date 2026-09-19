import { getReportRepository, type ReportSummary } from "@/lib/repository";
import { ScreenerClientPage } from "./ScreenerClientPage";

export const dynamic = "force-dynamic";

export default async function ScreenerPage() {
  let initialReports: ReportSummary[] = [];
  try {
    const repo = getReportRepository();
    initialReports = await repo.listReports();
  } catch (err) {
    console.error(
      "Failed to load initial reports for screener on server:",
      err
    );
  }

  return <ScreenerClientPage initialReports={initialReports} />;
}
