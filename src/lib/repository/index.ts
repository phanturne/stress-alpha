import type { IReportRepository } from "./types";
import { FsReportRepository } from "./fs-report-repository";
import { DrizzleReportRepository } from "./drizzle-report-repository";

export * from "./types";
export * from "./fs-report-repository";
export * from "./in-memory-report-repository";
export * from "./drizzle-report-repository";

let defaultRepository: IReportRepository | null = null;

/**
 * Returns the active ReportRepository singleton.
 * Defaults to DrizzleReportRepository when DATABASE_URL is set;
 * otherwise falls back to FsReportRepository reading from `reports/`.
 */
export function getReportRepository(): IReportRepository {
  if (!defaultRepository) {
    if (process.env.DATABASE_URL) {
      defaultRepository = new DrizzleReportRepository();
    } else {
      defaultRepository = new FsReportRepository();
    }
  }
  return defaultRepository;
}

/**
 * Allows swapping the active ReportRepository instance (e.g. for testing or mocking).
 */
export function setReportRepository(
  repository: IReportRepository | null
): void {
  defaultRepository = repository;
}
