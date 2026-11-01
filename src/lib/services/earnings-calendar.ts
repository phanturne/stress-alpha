import path from "node:path";
import * as dotenv from "dotenv";
import type { IReportRepository } from "@/lib/repository";
import { getReportRepository } from "@/lib/repository";
import type { ReportData } from "@/lib/schemas";
import { computeStressedValuation } from "@/lib/valuation";
import { computeSanityAudit } from "@/lib/sanity";
import { renderReport } from "@/lib/report";
import { fetchCompletePipelineBundle } from "./financial-data";
import { isAiGatewayConfigured } from "./ai-gateway";
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
  ticker?: string;
  enrichWithAi?: boolean;
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
  const reportSummaries = await repo.listReports();

  if (options?.ticker) {
    universeSet = new Set([options.ticker.toUpperCase()]);
  } else if (options?.universe && options.universe.length > 0) {
    universeSet = new Set(options.universe.map((t) => t.toUpperCase()));
  } else {
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
  let candidates = sessionFiltered.filter((e) =>
    universeSet.has(e.symbol.toUpperCase())
  );

  // If a single ticker was explicitly requested and not in the day's calendar, synthesize a test candidate
  if (options?.ticker && candidates.length === 0) {
    const targetSymbol = options.ticker.toUpperCase();
    const refDate = new Date(targetDate);
    const month = refDate.getUTCMonth() + 1; // 1-12
    // Earnings reported in Jan-Feb are Q4 prior year; Apr-May are Q1; Jul-Aug are Q2; Oct-Nov are Q3
    const reportedQuarter =
      month <= 2 ? 4 : Math.max(1, Math.ceil(month / 3) - 1);
    const reportedYear =
      month <= 2 ? refDate.getUTCFullYear() - 1 : refDate.getUTCFullYear();
    candidates = [
      {
        symbol: targetSymbol,
        date: targetDate,
        hour: "bmo",
        year: reportedYear,
        quarter: reportedQuarter,
      },
    ];
  }

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

    // Resolve existing report slug (handles cases like RJF-Q4-2026-analysis vs rjf-2026q4)
    const matchingSummary = reportSummaries.find((s) => {
      const summarySlug = s.slug || (s as any).folderSlug || "";
      const matchesQuarterYear =
        Boolean(s.quarter?.toLowerCase().includes(`q${quarter}`)) &&
        Boolean(s.quarter?.includes(String(year)));
      return (
        s.ticker?.toUpperCase() === symbol &&
        (summarySlug.toLowerCase() === folderSlug.toLowerCase() ||
          matchesQuarterYear)
      );
    });
    const resolvedSlug =
      matchingSummary?.slug ||
      (matchingSummary as any)?.folderSlug ||
      folderSlug;

    // Deduplication check
    const existingReport = await repo.getReport(resolvedSlug);
    const isPopulated =
      existingReport &&
      existingReport.facts &&
      (existingReport.facts.revenueBillions ?? 0) > 0;

    if (isPopulated && !options?.force) {
      console.log(
        `[SKIP] Report for ${symbol} (${resolvedSlug}) already exists and is populated.`
      );
      results.push({
        symbol,
        folderSlug: resolvedSlug,
        status: "skipped",
      });
      skipped++;
      continue;
    }

    if (options?.dryRun) {
      console.log(
        `[DRY RUN] Would scaffold earnings report for ${symbol} (${resolvedSlug})`
      );
      results.push({
        symbol,
        folderSlug: resolvedSlug,
        status: "scaffolded",
      });
      scaffolded++;
      continue;
    }

    try {
      console.log(
        `📡 [Scaffolding] Ingesting feeds for ${symbol} (${resolvedSlug})...`
      );

      // Look up prior reports for this ticker to compute accurate WFV deltas and preserve hand-crafted segments/peers
      const tickerSummaries = reportSummaries.filter(
        (s) => s.ticker?.toUpperCase() === symbol && s.slug !== resolvedSlug
      );
      let priorReport: ReportData | null = null;
      let handCraftedDonor: ReportData | null = null;

      for (const s of tickerSummaries) {
        if (!s.slug) continue;
        const r = await repo.getReport(s.slug);
        if (!r) continue;
        if (!priorReport) priorReport = r;
        if (
          r.moat?.competitors?.[0]?.ticker &&
          r.moat.competitors[0].ticker !== "PEER"
        ) {
          handCraftedDonor = r;
        }
      }
      if (!priorReport) {
        priorReport = existingReport;
      }

      const quarterStr = `Q${quarter} ${year}`;
      const bundle = await fetchCompletePipelineBundle(symbol, resolvedSlug, {
        quarterStr,
        apiKey: options?.apiKey,
        massiveApiKey: options?.massiveApiKey,
        enrichWithAi: options?.enrichWithAi ?? isAiGatewayConfigured(),
        calendarActuals: {
          epsActual: entry.epsActual,
          epsEstimate: entry.epsEstimate,
          revenueActual: entry.revenueActual,
          revenueEstimate: entry.revenueEstimate,
          date: entry.date,
        },
      });

      // Preserve prior quarter's non-placeholder competitors & segments if AI enrichment did not replace them
      const donor = handCraftedDonor || priorReport;
      const isBundlePlaceholderPeers =
        bundle.moatEn.competitors?.[0]?.ticker === "PEER";
      const hasDonorRealPeers =
        donor?.moat?.competitors &&
        donor.moat.competitors.length > 0 &&
        donor.moat.competitors[0].ticker !== "PEER";

      if (isBundlePlaceholderPeers && hasDonorRealPeers && donor?.moat) {
        bundle.moatEn = {
          ...bundle.moatEn,
          competitors: donor.moat.competitors,
          moatSources: donor.moat.moatSources,
          competitiveDynamicsSummary: donor.moat.competitiveDynamicsSummary,
        };
        if (donor.moatZh) {
          bundle.moatZh = {
            ...bundle.moatZh,
            competitors: donor.moatZh.competitors,
            moatSources: donor.moatZh.moatSources,
            competitiveDynamicsSummary: donor.moatZh.competitiveDynamicsSummary,
          };
        }
      }

      const isBundlePlaceholderSegments =
        bundle.factsDraft.segments?.[0]?.name === "Core Business & Solutions";
      const hasDonorRealSegments =
        donor?.facts?.segments &&
        donor.facts.segments.length > 0 &&
        donor.facts.segments[0].name !== "Core Business & Solutions";

      if (isBundlePlaceholderSegments && hasDonorRealSegments && donor?.facts) {
        bundle.factsDraft = {
          ...bundle.factsDraft,
          segments: donor.facts.segments,
        };
        if (donor.factsZh?.segments) {
          bundle.factsZh = {
            ...bundle.factsZh,
            segments: donor.factsZh.segments,
          };
        }
      }

      const report: ReportData = {
        folderSlug: resolvedSlug,
        folderName: resolvedSlug,
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
        technicalLevels:
          bundle.technicalLevels ?? bundle.profile.technicalLevels,
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

      // Render bilingual markdown memos so Memo View has report.md and report_zh.md
      try {
        report.reportMarkdown = renderReport(
          {
            facts: report.facts,
            valuation: report.valuation,
            moat: report.moat,
            estimates: report.estimates,
            catalysts: report.catalysts,
            reactions: report.reactions,
          },
          { language: "en" }
        );
        report.reportMarkdownZh = renderReport(
          {
            facts: report.factsZh || report.facts,
            valuation: report.valuation,
            moat: report.moatZh || report.moat,
            estimates: report.estimatesZh || report.estimates,
            catalysts: report.catalystsZh || report.catalysts,
            reactions: report.reactionsZh || report.reactions,
          },
          { language: "zh" }
        );
      } catch (memoErr) {
        console.warn(
          `⚠️ [EarningsCalendar] Memo rendering skipped for ${symbol}:`,
          memoErr
        );
      }

      // Persist bilingual report via repository
      await repo.saveReport(report);

      // Record valuation revision ledger point with true prior-vs-new delta
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

        const priorWfvNum =
          priorReport?.valuation?.weightedFairValue &&
          priorReport.valuation.weightedFairValue > 0
            ? priorReport.valuation.weightedFairValue
            : valuation.weightedFairValue;

        let priorBullVal = priorWfvNum;
        let priorBaseVal = priorWfvNum;
        let priorPanicVal = priorWfvNum * 0.7;
        if (priorReport?.scenarios?.scenarios) {
          for (const s of priorReport.scenarios.scenarios) {
            const fv = s.forwardEps * s.multiple;
            const lower = s.name.toLowerCase();
            if (lower.includes("bull")) priorBullVal = fv;
            else if (lower.includes("base")) priorBaseVal = fv;
            else if (lower.includes("panic") || lower.includes("bear"))
              priorPanicVal = fv;
          }
        }

        const wfvDeltaPct =
          priorWfvNum > 0
            ? (
                ((valuation.weightedFairValue - priorWfvNum) / priorWfvNum) *
                100
              ).toFixed(2)
            : "0.00";

        try {
          await repo.saveValuationRevision({
            ticker: symbol,
            revisionDate: new Date(),
            triggerType: "quarterly_filing",
            headline: `${symbol} Q${quarter} ${year} Earnings Scaffolding`,
            rationale: `Automated scaffolding from Finnhub & SEC filings for ${symbol} Q${quarter} ${year}.`,
            priorWfv: String(priorWfvNum),
            newWfv: String(valuation.weightedFairValue),
            wfvDeltaPct,
            fullStateDiff: {
              priorRegimes: {
                bull: priorBullVal,
                base: priorBaseVal,
                panic: priorPanicVal,
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
