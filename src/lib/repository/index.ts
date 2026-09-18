import type { IReportRepository } from "./types";
import { FsReportRepository } from "./fs-report-repository";

export * from "./types";
export * from "./fs-report-repository";
export * from "./in-memory-report-repository";

let defaultRepository: IReportRepository | null = null;

/**
 * Returns the active ReportRepository singleton.
 * Defaults to FsReportRepository reading from `reports/` folder.
 */
export function getReportRepository(): IReportRepository {
  if (!defaultRepository) {
    defaultRepository = new FsReportRepository();
  }
  return defaultRepository;
}

/**
 * Allows swapping the active ReportRepository instance (e.g. for testing or future Supabase integration).
 */
export function setReportRepository(
  repository: IReportRepository | null
): void {
  defaultRepository = repository;
}
