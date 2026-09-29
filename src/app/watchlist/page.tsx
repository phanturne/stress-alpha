import { getReportRepository, type ReportSummary } from "@/lib/repository";
import { WatchlistClientPage } from "./WatchlistClientPage";

export const revalidate = 60;

export default async function WatchlistPage() {
  let initialReports: ReportSummary[] = [];
  try {
    const repo = getReportRepository();
    initialReports = await repo.listReports();
  } catch (err) {
    console.error(
      "Failed to load initial reports for watchlist on server:",
      err
    );
  }

  return <WatchlistClientPage initialReports={initialReports} />;
}
