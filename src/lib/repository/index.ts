import type { IReportRepository } from "./types";
import { DrizzleReportRepository } from "./drizzle-report-repository";

export * from "./types";
export * from "./in-memory-report-repository";
export * from "./drizzle-report-repository";

let defaultRepository: IReportRepository | null = null;

/**
 * Returns the active ReportRepository singleton.
 * Uses DrizzleReportRepository connected directly to Neon PostgreSQL.
 */
export function getReportRepository(): IReportRepository {
  if (!defaultRepository) {
    defaultRepository = new DrizzleReportRepository();
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
