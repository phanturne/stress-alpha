import type { Metadata } from "next";
import { getReportRepository, type ReportSummary } from "@/lib/repository";
import { SettingsClientPage } from "./SettingsClientPage";

export const metadata: Metadata = {
  title: "Settings & Preferences — StressAlpha",
  description:
    "Manage account security, privacy settings, theme, language, and quantitative valuation model parameters.",
};

export const revalidate = 60;

export default async function SettingsPage() {
  let initialReports: ReportSummary[] = [];
  try {
    const repo = getReportRepository();
    initialReports = await repo.listReports();
  } catch (err) {
    console.error(
      "Failed to load initial reports for settings on server:",
      err
    );
  }

  return <SettingsClientPage initialReports={initialReports} />;
}
