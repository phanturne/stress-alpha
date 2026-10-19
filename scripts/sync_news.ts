#!/usr/bin/env node
/**
 * Standalone script to sync company news, filter materiality, compute transmissions,
 * and persist market events and valuation revisions into Neon PostgreSQL.
 *
 * Usage:
 *   npx tsx scripts/sync_news.ts [TICKER]
 *
 * Examples:
 *   npx tsx scripts/sync_news.ts NVDA
 *   npx tsx scripts/sync_news.ts
 */

import * as dotenv from "dotenv";
import path from "node:path";
import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { tickersTable, type ValuationRevisionInsert } from "../src/db/schema";
import { getReportRepository } from "../src/lib/repository";
import {
  ingestNewsForTicker,
  ingestGlobalNewsFirehose,
} from "../src/lib/services/news-ingestion";
import { calculateEventTransmissionImpact } from "../src/lib/news-transmission";
import type { IReportRepository, ReportSummary } from "../src/lib/repository";
import type { MarketEventSelect } from "../src/db/schema";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function processValuationRevisionsForTicker(
  ticker: string,
  events: MarketEventSelect[],
  repo: IReportRepository,
  allReportSummaries: ReportSummary[]
): Promise<number> {
  const matchingSummary = allReportSummaries.find(
    (r) => r.ticker?.toUpperCase() === ticker
  );

  if (!matchingSummary) {
    return 0;
  }

  const reportData = await repo.getReport(matchingSummary.slug);
  if (!reportData || !reportData.facts || !reportData.scenarios) {
    return 0;
  }

  // Check existing revisions to avoid duplicate entries for the same trigger event
  const existingRevisions = await repo.getValuationRevisions(ticker, 50);
  const loggedTriggerEventIds = new Set(
    existingRevisions.map((r) => r.triggerEventId).filter(Boolean)
  );

  let revisionsLogged = 0;

  for (const event of events) {
    const payload = event.transmissionPayload as any;
    const wfvImpact =
      event.impliedWfvImpactPct != null
        ? Number(event.impliedWfvImpactPct)
        : 0;

    const hasNonZeroShock =
      event.transmissionType !== "none" &&
      (wfvImpact !== 0 ||
        (payload?.deltaShockPct != null && payload.deltaShockPct !== 0) ||
        payload?.newProbability != null ||
        payload?.analystAction != null ||
        payload?.segmentDeltaGrowthPct != null);

    if (!hasNonZeroShock) {
      continue;
    }

    if (loggedTriggerEventIds.has(event.id)) {
      continue; // Already recorded in the ledger
    }

    // Deterministically recalculate stressed valuation flow-through
    const impactResult = calculateEventTransmissionImpact({
      event: {
        id: event.id,
        ticker: event.ticker,
        title: event.title,
        summary: event.summary,
        sourceUrl: event.sourceUrl ?? undefined,
        publisher: event.publisher,
        publishedAt:
          event.publishedAt instanceof Date
            ? event.publishedAt.toISOString()
            : String(event.publishedAt),
        eventType: event.eventType as any,
        sources: event.sourceUrl
          ? [
              {
                url: event.sourceUrl,
                title: event.title,
                publisher: event.publisher,
              },
            ]
          : [],
        priceMovePct:
          event.priceMovePct != null
            ? Number(event.priceMovePct)
            : undefined,
        abnormalReturnSigma:
          event.abnormalReturnSigma != null
            ? Number(event.abnormalReturnSigma)
            : undefined,
        transmissionType: event.transmissionType as any,
        transmissionPayload: event.transmissionPayload ?? undefined,
        impliedWfvImpactPct:
          event.impliedWfvImpactPct != null
            ? Number(event.impliedWfvImpactPct)
            : undefined,
      },
      baseline: reportData.baseline,
      facts: reportData.facts,
      scenarios: reportData.scenarios,
      currentValuation: reportData.valuation,
    });

    const priorWfv =
      reportData.valuation?.weightedFairValue ??
      reportData.facts.currentPrice;
    const newWfv = impactResult.impliedWfv;
    const wfvDeltaPct = impactResult.impliedWfvDeltaPct;

    if (Math.abs(newWfv - priorWfv) >= 0.01 || wfvDeltaPct !== 0) {
      const bullScenario = reportData.valuation?.scenarioResults?.find(
        (s) => s.name.toLowerCase().includes("bull")
      );
      const baseScenario = reportData.valuation?.scenarioResults?.find(
        (s) => s.name.toLowerCase().includes("base")
      );
      const panicScenario = reportData.valuation?.scenarioResults?.find(
        (s) =>
          s.name.toLowerCase().includes("panic") ||
          s.name.toLowerCase().includes("bear")
      );

      const priorBull = bullScenario?.fairValue ?? 0;
      const priorBase = baseScenario?.fairValue ?? 0;
      const priorPanic = panicScenario?.fairValue ?? 0;

      const newBull = Number(
        (priorBull * (1 + wfvDeltaPct / 100)).toFixed(2)
      );
      const newBase = Number(
        (priorBase * (1 + wfvDeltaPct / 100)).toFixed(2)
      );
      const newPanic = Number(
        (priorPanic * (1 + wfvDeltaPct / 100)).toFixed(2)
      );

      const triggerType =
        event.eventType === "upstream_earnings"
          ? "peer_earnings_shock"
          : event.eventType === "sec_filing"
            ? "sec_8k"
            : event.eventType === "analyst_rating"
              ? "consensus_wave"
              : event.eventType === "product_release"
                ? "catalyst_activation"
                : "catalyst_activation";

      const revisionInsert: ValuationRevisionInsert = {
        id: `rev_${event.id}_${Date.now()}`,
        ticker,
        revisionDate:
          event.publishedAt instanceof Date
            ? event.publishedAt
            : new Date(event.publishedAt),
        triggerType,
        triggerEventId: event.id,
        headline: event.title,
        rationale: impactResult.transmissionSummary || event.summary,
        priorWfv: String(priorWfv.toFixed(2)),
        newWfv: String(newWfv.toFixed(2)),
        wfvDeltaPct: String(wfvDeltaPct.toFixed(2)),
        fullStateDiff: {
          priorRegimes: {
            bull: priorBull,
            base: priorBase,
            panic: priorPanic,
          },
          newRegimes: {
            bull: newBull,
            base: newBase,
            panic: newPanic,
          },
          driverShocksApplied: event.transmissionPayload?.driverId
            ? {
                [event.transmissionPayload.driverId]:
                  event.transmissionPayload.deltaShockPct ?? 0,
              }
            : undefined,
          grossMarginBpsDelta:
            event.transmissionPayload?.grossMarginBpsDelta,
        },
      };

      await repo.saveValuationRevision(revisionInsert);
      loggedTriggerEventIds.add(event.id);
      revisionsLogged++;

      console.log(
        `    ⚖️ [Fair Value Revision] WFV: $${priorWfv.toFixed(2)} ➔ $${newWfv.toFixed(2)} (${wfvDeltaPct > 0 ? "+" : ""}${wfvDeltaPct.toFixed(2)}%)`
      );
      console.log(`       Trigger: "${event.title.slice(0, 80)}"`);
    }
  }

  return revisionsLogged;
}

async function syncNews() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set. Aborting news & catalyst sync.");
    process.exit(1);
  }

  const db = getDb();
  const repo = getReportRepository();

  console.log(
    "\n📰 [StressAlpha News & Catalyst Sync] Initializing event intelligence pipeline...\n"
  );

  // 1. Parse CLI flags
  const rawArgs = process.argv.slice(2);
  const isFirehose = rawArgs.includes("--firehose");
  const daysIndex = rawArgs.indexOf("--days");

  // For daily runs: 1 day lookback (Tuesday-Friday) or 3 days on Monday to bridge Friday AMC/weekend
  const dayOfWeek = new Date().getUTCDay(); // 0 = Sun, 1 = Mon
  const defaultFirehoseLookback = dayOfWeek === 1 ? 3 : 1;
  let lookbackDays = isFirehose ? defaultFirehoseLookback : 7;

  if (daysIndex !== -1 && rawArgs[daysIndex + 1]) {
    const parsed = parseInt(rawArgs[daysIndex + 1], 10);
    if (!isNaN(parsed) && parsed > 0) {
      lookbackDays = parsed;
    }
  }

  const positionalArgs: string[] = [];
  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg.startsWith("-")) {
      if (arg === "--days" || arg === "-d") {
        i++;
      }
      continue;
    }
    positionalArgs.push(arg);
  }

  // Pre-load available reports once for efficiency
  const allReportSummaries = await repo.listReports();

  // 2. Global Firehose Ingestion Mode
  if (isFirehose) {
    console.log(
      `  🔥 Ingestion Mode: Global Marketplace News Firehose (Lookback: ${lookbackDays}d)`
    );
    console.log(
      `  📡 Querying Polygon.io / Massive Reference News API stream...\n`
    );

    const firehoseResult = await ingestGlobalNewsFirehose({
      lookbackDays,
      repository: repo,
    });

    console.log(
      `  ✅ Firehose Stream Complete: ${firehoseResult.totalFetched} raw articles streamed, ${firehoseResult.totalIngested} high-signal fundamental events vetted & ingested.`
    );

    let totalRevisionsLogged = 0;
    const updatedTickers = Object.keys(firehoseResult.eventsByTicker);

    for (const ticker of updatedTickers) {
      const events = firehoseResult.eventsByTicker[ticker];
      console.log(
        `\n📡 Evaluating valuation flow-through for ${ticker} (${events.length} active events)...`
      );
      const revs = await processValuationRevisionsForTicker(
        ticker,
        events,
        repo,
        allReportSummaries
      );
      totalRevisionsLogged += revs;
    }

    console.log("\n" + "=".repeat(62));
    console.log("📊 [StressAlpha News Firehose & Valuation Revision Summary]");
    console.log(` • Ingestion Architecture:          Global Firehose (Polygon.io)`);
    console.log(` • Lookback Window:                  ${lookbackDays} days`);
    console.log(` • Raw Articles Streamed:            ${firehoseResult.totalFetched}`);
    console.log(` • High-Signal Events Ingested:      ${firehoseResult.totalIngested}`);
    console.log(` • Tickers Updated:                  ${updatedTickers.length}`);
    console.log(` • Fair Value Revisions Recorded:    ${totalRevisionsLogged}`);
    console.log("=".repeat(62) + "\n");
    return;
  }

  // 3. Per-Ticker Ingestion Mode (Single ticker or active universe)
  let targetTickers: { ticker: string; company?: string }[] = [];

  if (positionalArgs.length > 0 && positionalArgs[0]) {
    const singleTicker = positionalArgs[0].toUpperCase();
    targetTickers = [{ ticker: singleTicker }];
    console.log(`  🎯 Target: Specific ticker [${singleTicker}]\n`);
  } else {
    const activeTickers = await db
      .select({
        ticker: tickersTable.ticker,
        company: tickersTable.company,
      })
      .from(tickersTable)
      .where(eq(tickersTable.active, true));

    if (activeTickers.length === 0) {
      console.log("  ℹ️ No active tickers found in database.");
      return;
    }

    targetTickers = activeTickers;
    console.log(
      `  🎯 Universe: ${activeTickers.length} active tickers: ${activeTickers.map((t) => t.ticker).join(", ")}\n`
    );
  }

  let totalTickersProcessed = 0;
  let totalEventsIngested = 0;
  let totalRevisionsLogged = 0;

  for (const item of targetTickers) {
    const ticker = item.ticker.toUpperCase();
    console.log(`📡 Ingesting news for ${ticker}...`);

    try {
      const ingestResult = await ingestNewsForTicker(ticker, {
        lookbackDays,
      });

      const ingestedCount = ingestResult.ingestedCount;
      totalEventsIngested += ingestedCount;
      totalTickersProcessed++;

      console.log(
        `  ✅ [${ticker}] Ingested ${ingestedCount} vetted events (Total active pool: ${ingestResult.events.length})`
      );

      const revs = await processValuationRevisionsForTicker(
        ticker,
        ingestResult.events,
        repo,
        allReportSummaries
      );
      totalRevisionsLogged += revs;
    } catch (err) {
      console.warn(`  ⚠️ Error processing news sync for ${ticker}:`, err);
    }
  }

  // Institutional telemetry summary
  console.log("\n" + "=".repeat(62));
  console.log("📊 [StressAlpha News & Valuation Revision Summary]");
  console.log(` • Tickers Processed:               ${totalTickersProcessed}`);
  console.log(` • Raw Headlines Vetted & Ingested: ${totalEventsIngested}`);
  console.log(` • Fair Value Revisions Recorded:   ${totalRevisionsLogged}`);
  console.log("=".repeat(62) + "\n");
}

syncNews().catch((err) => {
  console.error("❌ Fatal error in sync_news:", err);
  process.exit(1);
});
