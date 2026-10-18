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
import { ingestNewsForTicker } from "../src/lib/services/news-ingestion";
import { calculateEventTransmissionImpact } from "../src/lib/news-transmission";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

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

  // 1. Determine target tickers from CLI arguments or database
  const args = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
  let targetTickers: { ticker: string; company?: string }[] = [];

  if (args.length > 0 && args[0]) {
    const singleTicker = args[0].toUpperCase();
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

  // Pre-load available reports once for efficiency
  const allReportSummaries = await repo.listReports();

  let totalTickersProcessed = 0;
  let totalEventsIngested = 0;
  let totalRevisionsLogged = 0;

  for (const item of targetTickers) {
    const ticker = item.ticker.toUpperCase();
    console.log(`📡 Ingesting news for ${ticker}...`);

    try {
      const ingestResult = await ingestNewsForTicker(ticker, {
        lookbackDays: 7,
      });

      const ingestedCount = ingestResult.ingestedCount;
      totalEventsIngested += ingestedCount;
      totalTickersProcessed++;

      console.log(
        `  ✅ [${ticker}] Ingested ${ingestedCount} vetted events (Total active pool: ${ingestResult.events.length})`
      );

      // Check for non-zero transmission shocks
      const matchingSummary = allReportSummaries.find(
        (r) => r.ticker?.toUpperCase() === ticker
      );

      if (!matchingSummary) {
        continue;
      }

      const reportData = await repo.getReport(matchingSummary.slug);
      if (!reportData || !reportData.facts || !reportData.scenarios) {
        continue;
      }

      // Check existing revisions to avoid duplicate entries for the same trigger event
      const existingRevisions = await repo.getValuationRevisions(ticker, 50);
      const loggedTriggerEventIds = new Set(
        existingRevisions.map((r) => r.triggerEventId).filter(Boolean)
      );

      for (const event of ingestResult.events) {
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
          totalRevisionsLogged++;

          console.log(
            `    ⚖️ [Fair Value Revision] WFV: $${priorWfv.toFixed(2)} ➔ $${newWfv.toFixed(2)} (${wfvDeltaPct > 0 ? "+" : ""}${wfvDeltaPct.toFixed(2)}%)`
          );
          console.log(`       Trigger: "${event.title.slice(0, 80)}"`);
        }
      }
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
