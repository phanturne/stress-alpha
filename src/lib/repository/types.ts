import type { ReportData } from "@/lib/schemas";

export interface ReportSummary {
  slug: string;
  name: string;
  ticker?: string;
  company?: string;
  quarter?: string;
  reportDate?: string;
  currentPrice?: number;
  weightedFairValue?: number;
  upsidePct?: number;
  baseFairValue?: number;
  baseUpsidePct?: number;
  bullFairValue?: number;
  bearFairValue?: number;
  moatRating?: string;
  moatTrend?: string;
  operatingMarginPct?: number;
  revenueGrowthPct?: number;
  hasFacts: boolean;
  hasScenarios: boolean;
  hasValuation: boolean;
  hasBaseline: boolean;
  hasSentiment: boolean;
  hasFiling: boolean;
  hasCatalysts: boolean;
  hasReactions: boolean;
  hasEstimates: boolean;
}

/**
 * Common Data Access Layer interface for StressAlpha earnings reports.
 * Decouples Next.js UI and API routes from the storage medium (filesystem, Supabase, etc.)
 */
export interface IReportRepository {
  /**
   * List all report summaries, enriched with valuation, moat, and fundamentals.
   */
  listReports(): Promise<ReportSummary[]>;

  /**
   * Fetch full report artifacts, parsed schemas, and markdown for a specific slug.
   * Returns null if the report does not exist or lacks mandatory artifacts.
   */
  getReport(slug: string): Promise<ReportData | null>;

  /**
   * Check if a report exists for the given slug.
   */
  hasReport(slug: string): Promise<boolean>;
}
