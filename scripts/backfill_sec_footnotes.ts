#!/usr/bin/env node
/**
 * Delta Footnotes & Off-Balance-Sheet Commitments Backfill Engine
 *
 * Reads existing reports from Neon PostgreSQL, resolves filing links via Finnhub,
 * extracts targeted SEC EDGAR footnote disclosures (Note Commitments & Contingencies,
 * Customer Concentrations, 8-K Executive Commentary), updates qualitative artifacts
 * in place, recomputes valuation & snowflake scores, and persists updates to Neon DB.
 *
 * Usage:
 *   npx tsx scripts/backfill_sec_footnotes.ts [--limit=10] [--ticker=MSFT] [--concurrency=3] [--dry-run]
 */

import path from "node:path";
import * as dotenv from "dotenv";
import { eq, sql, desc } from "drizzle-orm";
import { generateText } from "ai";
import { getDb } from "../src/db";
import { reportsTable, tickersTable } from "../src/db/schema";
import { AI_GATEWAY_MODELS } from "../src/lib/services/ai-gateway";
import {
  fetchFinnhubFilings,
  extractSecFilingExcerpts,
} from "../src/lib/services/financial-data";
import {
  computeStressedValuation,
  computeValuation,
} from "../src/lib/valuation";
import { computeSanityAudit } from "../src/lib/sanity";
import { computeSnowflakeScore } from "../src/lib/snowflake";
import { renderReport } from "../src/lib/report";
import type { ReportData } from "../src/lib/schemas";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function parseJsonObject(rawText: string): any {
  const cleaned = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error(`No JSON object found (len=${rawText.length})`);
  }
  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processSingleReport(
  r: typeof reportsTable.$inferSelect,
  companyName: string,
  dryRun: boolean
): Promise<{
  success: boolean;
  ticker: string;
  commitments?: number;
  concentration?: number;
  note?: string;
}> {
  const ticker = r.ticker.toUpperCase();
  const facts = r.facts;
  const filing = r.filing;
  const sentiment = r.sentiment;

  if (!facts) {
    return { success: false, ticker, note: "Missing facts object" };
  }

  // 1. Resolve SEC Filings
  const filings = await fetchFinnhubFilings(ticker);
  if (!filings || filings.length === 0) {
    return { success: false, ticker, note: "No SEC filings found via Finnhub" };
  }

  // 2. Extract Targeted SEC EDGAR Disclosures
  const excerpts = await extractSecFilingExcerpts(filings);
  const hasExcerpts = Boolean(
    excerpts.commitmentsText ||
    excerpts.customerConcentrationText ||
    excerpts.pressReleaseText
  );

  if (!hasExcerpts) {
    return {
      success: true,
      ticker,
      note: "No footnote disclosures found in filing (standard primary statements only)",
    };
  }

  // 3. AI Targeted Footnote Synthesis
  let secContext = "";
  if (excerpts.pressReleaseText) {
    secContext += `\n\n--- 8-K PRESS RELEASE & EXECUTIVE COMMENTARY ---\n${excerpts.pressReleaseText}`;
  }
  if (excerpts.commitmentsText) {
    secContext += `\n\n--- 10-Q NOTE: COMMITMENTS AND CONTINGENCIES & GUARANTEES ---\n${excerpts.commitmentsText}`;
  }
  if (excerpts.customerConcentrationText) {
    secContext += `\n\n--- 10-Q NOTE: CUSTOMER & SEGMENT CONCENTRATIONS ---\n${excerpts.customerConcentrationText}`;
  }

  const promptPayload = {
    ticker,
    company: companyName || facts.company,
    quarter: facts.quarter,
    revenueBillions: facts.revenueBillions,
    grossMarginPct: facts.grossMarginPct,
    operatingMarginPct: facts.operatingMarginPct,
    epsReported: facts.epsReported,
  };

  const { text } = await generateText({
    model: AI_GATEWAY_MODELS.EXTRACTOR,
    maxOutputTokens: 4096,
    system: `You are a Senior Buy-Side Equity Analyst & Forensic Auditor.
Extract targeted disclosures from the provided official SEC 10-Q/8-K text.
Return ONLY a single valid JSON object (no markdown code fences, no commentary):
{
  "purchaseObligationsBillions": number or 0, // e.g. supply capacity, purchase commitments
  "totalCommitmentsBillions": number or 0,    // e.g. total future commitments table sum
  "guaranteeExposureBillions": number or 0,   // e.g. credit/power/lease guarantees
  "customerConcentrationPct": number or 0,    // e.g. single customer revenue share % (0-100)
  "revenueGrowthPct": number or 0,            // reported YoY revenue growth % (e.g. 106)
  "commitmentsFindings": [
    { "finding": "Specific commitment/guarantee fact with dollar amounts", "implication": "Growth or risk implication", "novelty": "High" }
  ],
  "concentrationFindings": [
    { "finding": "Customer concentration fact with percentages", "implication": "Dependency/diversification implication", "novelty": "High" }
  ],
  "keyQuotes": [
    { "speaker": "CEO or CFO name", "quote": "Verbatim quote from the 8-K press release / commentary", "context": "Quarterly earnings commentary", "sentiment": "bullish" }
  ]
}
Rules:
1. Extract exact numerical amounts stated in the SEC footnotes. If not disclosed, return 0.
2. In keyQuotes, quote executive remarks verbatim from the 8-K press release.`,
    prompt: `Analyze SEC filing disclosures for ${companyName} (${ticker}, ${facts.quarter}):\n${JSON.stringify(promptPayload)}\n${secContext}`,
    providerOptions: {
      deepseek: {
        thinking: { type: "disabled" },
      },
    },
  });

  const ai = parseJsonObject(text);

  // 4. Update Facts
  const newFactsEn = {
    ...facts,
    customerConcentrationPct:
      Number(ai.customerConcentrationPct) > 0
        ? Number(ai.customerConcentrationPct)
        : facts.customerConcentrationPct,
    purchaseObligationsBillions:
      Number(ai.purchaseObligationsBillions) > 0
        ? Number(ai.purchaseObligationsBillions)
        : facts.purchaseObligationsBillions,
    totalCommitmentsBillions:
      Number(ai.totalCommitmentsBillions) > 0
        ? Number(ai.totalCommitmentsBillions)
        : facts.totalCommitmentsBillions,
    guaranteeExposureBillions:
      Number(ai.guaranteeExposureBillions) > 0
        ? Number(ai.guaranteeExposureBillions)
        : facts.guaranteeExposureBillions,
    revenueGrowthPct:
      Number(ai.revenueGrowthPct) > 0
        ? Number(ai.revenueGrowthPct)
        : facts.revenueGrowthPct,
  };

  const newFactsZh = r.factsZh ? { ...r.factsZh, ...newFactsEn } : newFactsEn;

  // 5. Update Filing Sections
  const existingSections = Array.isArray(filing?.sections)
    ? filing.sections.filter(
        (s) =>
          !s.section.includes("Commitments and Contingencies") &&
          !s.section.includes("Customer and Geographic Concentrations")
      )
    : [];

  const newSections = [...existingSections];
  if (
    Array.isArray(ai.commitmentsFindings) &&
    ai.commitmentsFindings.length > 0
  ) {
    newSections.push({
      section: "Note: Commitments and Contingencies",
      keyFindings: ai.commitmentsFindings,
    });
  }
  if (
    Array.isArray(ai.concentrationFindings) &&
    ai.concentrationFindings.length > 0
  ) {
    newSections.push({
      section: "Note: Customer and Geographic Concentrations",
      keyFindings: ai.concentrationFindings,
    });
  }

  const newFilingEn = {
    ticker,
    quarter: facts.quarter,
    newRiskFactors: filing?.newRiskFactors || [],
    sections: newSections,
  };

  const newFilingZh = r.filingZh
    ? {
        ...r.filingZh,
        sections: newSections,
      }
    : newFilingEn;

  // 6. Update Sentiment Quotes
  const newSentiment = sentiment
    ? {
        ...sentiment,
        ticker,
        quarter: facts.quarter,
        keyQuotes:
          Array.isArray(ai.keyQuotes) && ai.keyQuotes.length > 0
            ? ai.keyQuotes
            : sentiment.keyQuotes,
      }
    : undefined;

  // 7. Deterministically Recompute Valuation, Sanity, Snowflake & Memos
  const valuation = computeValuation({
    facts: newFactsEn,
    scenarios: r.scenarios,
    baseline: r.baseline ?? undefined,
    moat: r.moat ?? undefined,
    estimates: r.estimates ?? undefined,
  });

  const reportObj: ReportData = {
    folderSlug: r.slug,
    folderName: r.slug,
    facts: newFactsEn,
    factsZh: newFactsZh,
    scenarios: r.scenarios,
    scenariosZh: r.scenariosZh ?? undefined,
    baseline: r.baseline ?? undefined,
    moat: r.moat ?? undefined,
    moatZh: r.moatZh ?? undefined,
    estimates: r.estimates ?? undefined,
    estimatesZh: r.estimatesZh ?? undefined,
    catalysts: r.catalysts ?? undefined,
    catalystsZh: r.catalystsZh ?? undefined,
    sentiment: newSentiment,
    filing: newFilingEn,
    filingZh: newFilingZh,
    reactions: r.reactions ?? undefined,
    valuation,
  };

  valuation.sanityAudit = computeSanityAudit(reportObj, valuation);

  const stressResult =
    r.baseline && newFactsEn.currentPrice > 0
      ? computeStressedValuation(r.baseline, newFactsEn.currentPrice)
      : undefined;

  const sf = computeSnowflakeScore(reportObj, stressResult);
  const snowflakePillars = {
    valuation: sf.pillars.valuation.score,
    future: sf.pillars.future.score,
    earnings: sf.pillars.earnings.score,
    moat: sf.pillars.moat.score,
    resilience: sf.pillars.resilience.score,
  };

  const reportMd = renderReport(
    {
      facts: newFactsEn,
      valuation,
      moat: r.moat ?? undefined,
      estimates: r.estimates ?? undefined,
      catalysts: r.catalysts ?? undefined,
      reactions: r.reactions ?? undefined,
    },
    { language: "en" }
  );

  const reportMdZh = renderReport(
    {
      facts: newFactsZh,
      valuation,
      moat: r.moatZh ?? r.moat ?? undefined,
      estimates: (r.estimatesZh || r.estimates) ?? undefined,
      catalysts: (r.catalystsZh || r.catalysts) ?? undefined,
      reactions: r.reactions ?? undefined,
    },
    { language: "zh" }
  );

  // 8. Persist to Neon DB
  if (!dryRun) {
    const db = getDb();
    await db
      .update(reportsTable)
      .set({
        facts: newFactsEn,
        factsZh: newFactsZh,
        filing: newFilingEn,
        filingZh: newFilingZh,
        sentiment: newSentiment,
        valuation,
        snowflakePillars,
        snowflakeScore: sf.totalScore,
        reportMd,
        reportMdZh,
        updatedAt: new Date(),
      })
      .where(eq(reportsTable.slug, r.slug));
  }

  return {
    success: true,
    ticker,
    commitments: newFactsEn.purchaseObligationsBillions,
    concentration: newFactsEn.customerConcentrationPct,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  let limit = 25;
  const limitArg = args.find((a) => a.startsWith("--limit="));
  if (limitArg) {
    limit = parseInt(limitArg.split("=")[1], 10) || 25;
  }

  let concurrency = 3;
  const concArg = args.find((a) => a.startsWith("--concurrency="));
  if (concArg) {
    concurrency = parseInt(concArg.split("=")[1], 10) || 3;
  }

  let targetTicker: string | undefined;
  const tickerArg = args.find((a) => a.startsWith("--ticker="));
  if (tickerArg) {
    targetTicker = tickerArg.split("=")[1]?.toUpperCase();
  }

  console.log(`\n🚀 [Delta Backfill] Starting SEC EDGAR Footnote Ingestion...`);
  console.log(
    `   Settings: Limit=${limit} | Concurrency=${concurrency} | DryRun=${dryRun} | TargetTicker=${targetTicker || "All"}`
  );

  const db = getDb();

  // Query reports missing commitments or targeting single ticker
  let query = db
    .select({
      report: reportsTable,
      companyName: tickersTable.company,
      marketCap: tickersTable.marketCap,
    })
    .from(reportsTable)
    .innerJoin(tickersTable, eq(reportsTable.ticker, tickersTable.ticker))
    .$dynamic();

  if (targetTicker) {
    query = query.where(eq(reportsTable.ticker, targetTicker));
  } else {
    // Only backfill records that do not have purchaseObligationsBillions populated yet
    query = query.where(
      sql`${reportsTable.facts}->>'purchaseObligationsBillions' IS NULL`
    );
  }

  const rows = await query.orderBy(desc(tickersTable.marketCap)).limit(limit);

  console.log(`\n📋 Found ${rows.length} candidate reports to backfill.\n`);

  if (rows.length === 0) {
    console.log(
      "✅ All reports are already populated with SEC footnote disclosures!"
    );
    return;
  }

  let completed = 0;
  let succeeded = 0;

  // Process with concurrency rate-limiting
  for (let i = 0; i < rows.length; i += concurrency) {
    const chunk = rows.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async ({ report, companyName }) => {
        try {
          console.log(
            `⏳ [${++completed}/${rows.length}] Extracting SEC footnotes for ${report.ticker}...`
          );
          const res = await processSingleReport(
            report,
            companyName || report.facts.company,
            dryRun
          );
          if (res.success) {
            succeeded++;
            console.log(
              `  ✅ ${report.ticker}: Commitments: $${res.commitments ?? 0}B | Concentration: ${res.concentration ?? 0}%`
            );
          } else {
            console.warn(`  ⚠️ ${report.ticker} skipped: ${res.note}`);
          }
        } catch (err) {
          console.error(`  ❌ Error processing ${report.ticker}:`, err);
        }
      })
    );

    // Rate-limiting delay to strictly protect SEC EDGAR (10 req/s) & Finnhub (60 req/min)
    if (i + concurrency < rows.length) {
      await sleep(1200);
    }
  }

  console.log(
    `\n🎉 Backfill complete! Processed: ${completed} | Succeeded: ${succeeded}\n`
  );
}

main().catch(console.error);
