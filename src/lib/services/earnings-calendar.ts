import path from "node:path";
import * as dotenv from "dotenv";
import type { IReportRepository } from "@/lib/repository";
import { getReportRepository } from "@/lib/repository";
import type { ReportData } from "@/lib/schemas";
import { computeStressedValuation } from "@/lib/valuation";
import { computeSanityAudit } from "@/lib/sanity";
import { fetchCompletePipelineBundle } from "./financial-data";
import { resilientFetch } from "./http-client";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export interface EarningsCalendarEntry {
  symbol: string;
  date: string; // "YYYY-MM-DD"
  hour: "bmo" | "amc" | string;
  year: number;
  quarter: number;
  epsActual?: number | null;
  epsEstimate?: number | null;
  revenueActual?: number | null;
  revenueEstimate?: number | null;
}

export interface FetchFinnhubEarningsCalendarOptions {
  date?: string;
  from?: string;
  to?: string;
  apiKey?: string;
}

export interface SyncEarningsCalendarOptions {
  date?: string;
  force?: boolean;
  dryRun?: boolean;
  session?: "bmo" | "amc";
  repository?: IReportRepository;
  apiKey?: string;
  massiveApiKey?: string;
  universe?: string[];
}

export interface SyncEarningsCalendarResult {
  totalOnCalendar: number;
  matchedUniverse: number;
  scaffolded: number;
  skipped: number;
  results: Array<{
    symbol: string;
    folderSlug: string;
    status: "scaffolded" | "skipped" | "error";
    error?: string;
  }>;
}

/**
 * Fetch reporting companies from Finnhub's earnings calendar endpoint:
 * GET https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${token}
 */
export async function fetchFinnhubEarningsCalendar(
  options?: FetchFinnhubEarningsCalendarOptions
): Promise<EarningsCalendarEntry[]> {
  const token =
    options?.apiKey ||
    process.env.FINNHUB_API_KEY ||
    process.env.FINNHUB_KEY ||
    process.env.FINNHUB_TOKEN;
  if (!token) {
    console.warn(
      "⚠️ [Finnhub Calendar] No FINNHUB_API_KEY provided or configured in environment."
    );
    return [];
  }

  const today = new Date().toISOString().split("T")[0];
  const from = options?.date || options?.from || today;
  const to = options?.date || options?.to || today;

  const url = `https://finnhub.io/api/v1/calendar/earnings?from=${encodeURIComponent(
    from
  )}&to=${encodeURIComponent(to)}&token=${encodeURIComponent(token)}`;

  try {
    const res = await resilientFetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.warn(
        `⚠️ [Finnhub Calendar] Finnhub returned HTTP ${res.status}: ${res.statusText}`
      );
      return [];
    }

    const data = await res.json();
    const rawList = Array.isArray(data?.earningsCalendar)
      ? data.earningsCalendar
      : [];

    const entries: EarningsCalendarEntry[] = [];

    for (const item of rawList) {
      if (!item || !item.symbol || typeof item.symbol !== "string") {
        continue;
      }

      const symbol = item.symbol.trim().toUpperCase();
      const date = item.date || from;
      const hour = (item.hour || "").trim().toLowerCase();
      const year = Number(item.year) || new Date(date).getFullYear();
      const quarter = Number(item.quarter) || 1;

      entries.push({
        symbol,
        date,
        hour,
        year,
        quarter,
        epsActual:
          item.epsActual !== undefined
            ? item.epsActual === null
              ? null
              : Number(item.epsActual)
            : null,
        epsEstimate:
          item.epsEstimate !== undefined
            ? item.epsEstimate === null
              ? null
              : Number(item.epsEstimate)
            : null,
        revenueActual:
          item.revenueActual !== undefined
            ? item.revenueActual === null
              ? null
              : Number(item.revenueActual)
            : null,
        revenueEstimate:
          item.revenueEstimate !== undefined
            ? item.revenueEstimate === null
              ? null
              : Number(item.revenueEstimate)
            : null,
      });
    }

    return entries;
  } catch (err) {
    console.warn(
      "⚠️ [Finnhub Calendar] Error fetching earnings calendar:",
      err
    );
    return [];
  }
}

/**
 * Syncs the daily earnings calendar against active coverage universe,
 * scaffolds missing 8-module report bundles, and persists initial valuations.
 */
export async function syncEarningsCalendar(
  options?: SyncEarningsCalendarOptions
): Promise<SyncEarningsCalendarResult> {
  const repo = options?.repository || getReportRepository();
  const targetDate = options?.date || new Date().toISOString().split("T")[0];

  // 1. Fetch Calendar Entries from Finnhub
  const allEntries = await fetchFinnhubEarningsCalendar({
    date: targetDate,
    apiKey: options?.apiKey,
  });

  const totalOnCalendar = allEntries.length;

  // 2. Filter by Session (bmo vs amc) if requested
  const sessionFiltered = options?.session
    ? allEntries.filter(
        (e) => e.hour.toLowerCase() === options.session!.toLowerCase()
      )
    : allEntries;

  // 3. Determine Active Universe
  let universeSet: Set<string>;
  if (options?.universe && options.universe.length > 0) {
    universeSet = new Set(options.universe.map((t) => t.toUpperCase()));
  } else {
    const reportSummaries = await repo.listReports();
    const fromReports = reportSummaries
      .map((r) => r.ticker?.toUpperCase())
      .filter((t): t is string => Boolean(t));
    universeSet = new Set<string>(fromReports);

    try {
      const { getDb } = await import("@/db");
      const { tickersTable } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");
      const db = getDb();
      const dbTickers = await db
        .select({ ticker: tickersTable.ticker })
        .from(tickersTable)
        .where(eq(tickersTable.active, true));
      for (const t of dbTickers) {
        if (t.ticker) universeSet.add(t.ticker.toUpperCase());
      }
    } catch {
      // In-memory or database offline
    }
  }

  // 4. Filter Candidates matching Universe
  const candidates = sessionFiltered.filter((e) =>
    universeSet.has(e.symbol.toUpperCase())
  );
  const matchedUniverse = candidates.length;

  let scaffolded = 0;
  let skipped = 0;
  const results: SyncEarningsCalendarResult["results"] = [];

  for (let i = 0; i < candidates.length; i++) {
    const entry = candidates[i];
    const symbol = entry.symbol.toUpperCase();
    const year = entry.year;
    const quarter = entry.quarter;
    const folderSlug = `${symbol.toLowerCase()}-${year}q${quarter}`;

    // Deduplication check
    const existingReport = await repo.getReport(folderSlug);
    const isPopulated =
      existingReport &&
      existingReport.facts &&
      (existingReport.facts.revenueBillions ?? 0) > 0;

    if (isPopulated && !options?.force) {
      console.log(
        `[SKIP] Report for ${folderSlug} already exists and is populated.`
      );
      results.push({
        symbol,
        folderSlug,
        status: "skipped",
      });
      skipped++;
      continue;
    }

    if (options?.dryRun) {
      console.log(
        `[DRY RUN] Would scaffold earnings report for ${symbol} (${folderSlug})`
      );
      results.push({
        symbol,
        folderSlug,
        status: "scaffolded",
      });
      scaffolded++;
      continue;
    }

    try {
      console.log(
        `📡 [Scaffolding] Ingesting feeds for ${symbol} (${folderSlug})...`
      );

      const quarterStr = `Q${quarter} ${year}`;
      const bundle = await fetchCompletePipelineBundle(symbol, folderSlug, {
        quarterStr,
        apiKey: options?.apiKey,
        massiveApiKey: options?.massiveApiKey,
      });

      const report: ReportData = {
        folderSlug,
        folderName: folderSlug,
        facts: bundle.factsDraft,
        factsZh: bundle.factsZh,
        scenarios: bundle.scenariosEn,
        scenariosZh: bundle.scenariosZh,
        baseline: bundle.baseline,
        moat: bundle.moatEn,
        moatZh: bundle.moatZh,
        estimates: bundle.analystEstimatesEn,
        estimatesZh: bundle.analystEstimatesZh,
        catalysts: bundle.catalystsEn,
        catalystsZh: bundle.catalystsZh,
        sentiment: bundle.sentiment,
        filing: bundle.filingEn,
        filingZh: bundle.filingZh,
        reactions: bundle.reactions,
      };

      // Deterministic valuation calculation
      const valuation = computeStressedValuation(
        report.baseline,
        report.scenarios,
        report.facts
      );

      // Deterministic sanity & variant perception audit
      const sanityAudit = computeSanityAudit(report, valuation);

      valuation.sanityAudit = sanityAudit;
      report.valuation = valuation;

      // Persist bilingual report via repository
      await repo.saveReport(report);

      // Record initial valuation revision ledger point if valid
      if (valuation && valuation.weightedFairValue > 0) {
        let bullVal = valuation.weightedFairValue;
        let baseVal = valuation.weightedFairValue;
        let panicVal =
          valuation.stressTest?.valuationBands?.panic?.targetPrice ??
          valuation.weightedFairValue * 0.7;

        if (report.scenarios?.scenarios) {
          for (const s of report.scenarios.scenarios) {
            const fv = s.forwardEps * s.multiple;
            const lower = s.name.toLowerCase();
            if (lower.includes("bull")) bullVal = fv;
            else if (lower.includes("base")) baseVal = fv;
            else if (lower.includes("panic") || lower.includes("bear"))
              panicVal = fv;
          }
        }

        try {
          await repo.saveValuationRevision({
            ticker: symbol,
            revisionDate: new Date(),
            triggerType: "quarterly_filing",
            headline: `${symbol} Q${quarter} ${year} Earnings Scaffolding`,
            rationale: `Automated scaffolding from Finnhub & SEC filings for ${symbol} Q${quarter} ${year}.`,
            priorWfv: String(valuation.weightedFairValue),
            newWfv: String(valuation.weightedFairValue),
            wfvDeltaPct: "0.00",
            fullStateDiff: {
              priorRegimes: {
                bull: bullVal,
                base: baseVal,
                panic: panicVal,
              },
              newRegimes: {
                bull: bullVal,
                base: baseVal,
                panic: panicVal,
              },
            },
          });
        } catch (revErr) {
          console.warn(
            `⚠️ [ValuationRevision] Failed to save revision point for ${symbol}:`,
            revErr
          );
        }
      }

      scaffolded++;
      results.push({
        symbol,
        folderSlug,
        status: "scaffolded",
      });

      // Sequential delay between external API calls to avoid rate limit spikes
      if (i < candidates.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (err: any) {
      console.error(
        `❌ [Error] Failed to scaffold ${symbol} (${folderSlug}):`,
        err
      );
      results.push({
        symbol,
        folderSlug,
        status: "error",
        error: err?.message || String(err),
      });
    }
  }

  return {
    totalOnCalendar,
    matchedUniverse,
    scaffolded,
    skipped,
    results,
  };
}
