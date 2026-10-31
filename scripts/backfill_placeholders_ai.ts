#!/usr/bin/env node
/**
 * High-Concurrency Single-Shot AI Gateway Backfill Engine for Placeholder Reports
 *
 * Reads existing placeholder reports (`moat.competitors[0].ticker === "PEER"` or
 * `facts.segments[0].name === "Core Business & Solutions"`) directly from Neon PostgreSQL,
 * enriches both English and Chinese qualitative modules in a SINGLE `deepseek/deepseek-v4.1-flash-1017`
 * (`thinking: disabled`) request per report with 12x parallel concurrency, recomputes
 * deterministic valuation, sanity audit, Snowflake scores, and bilingual Markdown memos,
 * and updates Neon DB in place.
 *
 * Usage:
 *   npx tsx scripts/backfill_placeholders_ai.ts [--limit=50] [--concurrency=12]
 */

import * as dotenv from "dotenv";
import { eq, sql } from "drizzle-orm";
import { generateText } from "ai";
import { getDb } from "../src/db";
import { reportsTable, tickersTable } from "../src/db/schema";
import { AI_GATEWAY_MODELS } from "../src/lib/services/ai-gateway";
import {
  computeStressedValuation,
  computeValuation,
} from "../src/lib/valuation";
import { computeSanityAudit } from "../src/lib/sanity";
import { computeSnowflakeScore } from "../src/lib/snowflake";
import { renderReport } from "../src/lib/report";
import type { ReportData } from "../src/lib/schemas";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

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

async function enrichSingleReportRow(
  r: typeof reportsTable.$inferSelect,
  companyName: string,
  sector: string
): Promise<void> {
  const db = getDb();
  const ticker = r.ticker.toUpperCase();
  const facts = r.facts;
  const moat = r.moat;
  const catalysts = r.catalysts;
  const scenarios = r.scenarios;
  const baseline = r.baseline;
  const sentiment = r.sentiment;
  const filing = r.filing;

  if (!facts || !moat || !scenarios || !baseline) return;

  const promptPayload = {
    ticker,
    company: companyName || facts.company,
    sector,
    quarter: facts.quarter,
    revenueBillions: facts.revenueBillions,
    revenueGrowthPct: facts.revenueGrowthPct,
    grossMarginPct: facts.grossMarginPct,
    operatingIncomeBillions: facts.operatingIncomeBillions,
    operatingMarginPct: facts.operatingMarginPct,
    epsReported: facts.epsReported,
    marketCapBillions: facts.marketCapBillions,
    currentPrice: facts.currentPrice,
  };

  const { text } = await generateText({
    model: AI_GATEWAY_MODELS.EXTRACTOR,
    maxOutputTokens: 8192,
    system: `You are an institutional bilingual (English & Simplified Chinese) Buy-Side Equity Analyst.
Return ONLY a single valid JSON object (no markdown fences, no commentary, escape any internal quotes properly) with the following exact structure for the given public company:
{
  "overallMoatRating": "Wide" | "Narrow" | "None",
  "moatTrend": "Widening" | "Stable" | "Narrowing",
  "segments": [
    { "name": "Real Segment Name (EN)", "nameZh": "真实业务分部名称 (ZH)", "share": 0.55, "growthPct": 12.5, "operatingMarginPct": 24.0 }
  ],
  "competitors": [
    {
      "ticker": "REAL_PEER_TICKER",
      "name": "Peer Company Name (EN)",
      "nameZh": "同业竞争对手名称 (ZH)",
      "marketCapBillions": 150.0,
      "revenueBillions": 45.0,
      "grossMarginPct": 52.0,
      "operatingMarginPct": 22.0,
      "pricingPower": "Superior" | "Parity" | "Inferior",
      "productComparison": "Concrete product comparison (EN)",
      "productComparisonZh": "具体产品与市场对比 (ZH)",
      "keyAdvantageOrVulnerability": "Concrete advantage/vulnerability (EN)",
      "keyAdvantageOrVulnerabilityZh": "核心竞争优势或短板 (ZH)"
    }
  ],
  "moatSources": [
    {
      "source": "Intangible Assets" | "Switching Costs" | "Cost Advantage" | "Network Effects" | "Efficient Scale",
      "strength": "Strong" | "Moderate" | "Weak",
      "durabilityYears": 8,
      "description": "Company-specific moat analysis (EN)",
      "descriptionZh": "公司特定的护城河壁垒分析 (ZH)"
    }
  ],
  "competitiveDynamicsSummary": "Company-specific competitive landscape summary (EN)",
  "competitiveDynamicsSummaryZh": "公司特定的行业竞争格局总结 (ZH)",
  "catalysts": [
    {
      "id": "cat-1",
      "title": "Specific Catalyst Title (EN)",
      "titleZh": "具体催化剂标题 (ZH)",
      "direction": "growth" | "risk",
      "probability": 0.65,
      "horizon": "near-term" | "medium-term" | "long-term",
      "probabilityAnchor": "Specific anchor (EN)",
      "probabilityAnchorZh": "具体概率依据 (ZH)",
      "description": "Specific description (EN)",
      "descriptionZh": "具体催化剂描述 (ZH)",
      "fact": "Supporting metric or fact (EN)",
      "factZh": "支撑数据或事实 (ZH)"
    }
  ],
  "scenarioAssumptions": {
    "bull": { "assumptions": ["...", "..."], "assumptionsZh": ["...", "..."], "keyDrivers": ["...", "..."], "keyDriversZh": ["...", "..."] },
    "base": { "assumptions": ["...", "..."], "assumptionsZh": ["...", "..."], "keyDrivers": ["...", "..."], "keyDriversZh": ["...", "..."] },
    "panic": { "assumptions": ["...", "..."], "assumptionsZh": ["...", "..."], "keyDrivers": ["...", "..."], "keyDriversZh": ["...", "..."] }
  },
  "keyQuote": {
    "speaker": "CEO / CFO",
    "quote": "Company-specific executive commentary on quarterly execution and outlook (EN)",
    "context": "Quarterly earnings remarks"
  }
}
Rules:
1. Provide 3-4 real operating segments whose "share" values sum to 1.0 (never use "Core Business & Solutions").
2. Provide 3 real publicly traded competitors with real stock tickers (never use "PEER").
3. Provide 3 moatSources and 4 catalysts (2 growth, 2 risk) tailored specifically to ${ticker}.`,
    prompt: `Generate the bilingual buy-side qualitative modules for ${companyName} (${ticker}):\n${JSON.stringify(promptPayload)}`,
    providerOptions: {
      gateway: {
        sort: "cost",
        models: [AI_GATEWAY_MODELS.SYNTHESIZER],
      },
      deepseek: {
        thinking: { type: "disabled" },
      },
    },
  });

  const ai = parseJsonObject(text);

  // 1. Build Enriched Segments (EN & ZH)
  const rawSegs =
    Array.isArray(ai.segments) && ai.segments.length > 0 ? ai.segments : [];
  const totalShare =
    rawSegs.reduce((s: number, x: any) => s + (Number(x.share) || 0.33), 0) ||
    1;
  const segmentsEn =
    rawSegs.length > 0
      ? rawSegs.map((s: any) => {
          const share = (Number(s.share) || 0.33) / totalShare;
          const rev = Number((facts.revenueBillions * share).toFixed(2));
          const opM = Number(
            s.operatingMarginPct ?? facts.operatingMarginPct ?? 18
          );
          return {
            name: String(s.name || `${ticker} Segment`),
            revenueBillions: Math.max(rev, 0.01),
            growthPct: Number(s.growthPct ?? facts.revenueGrowthPct ?? 8),
            operatingIncomeBillions: Number((rev * (opM / 100)).toFixed(2)),
            operatingMarginPct: opM,
          };
        })
      : facts.segments;

  const segmentsZh =
    rawSegs.length > 0
      ? segmentsEn.map((seg: any, i: number) => ({
          ...seg,
          name: String(rawSegs[i]?.nameZh || seg.name),
        }))
      : (r.factsZh?.segments ?? facts.segments);

  const cleanedSources = Array.isArray(facts.sources)
    ? facts.sources.map((src) =>
        src.url?.includes("api.polygon.io")
          ? {
              ...src,
              title: `${ticker} SEC Form 10-Q / 10-K Financial Statements (${facts.quarter})`,
              publisher: "U.S. SEC EDGAR",
              url: `https://www.sec.gov/edgar/searchedgar/companysearch?cik=${encodeURIComponent(ticker)}`,
            }
          : src
      )
    : facts.sources;

  const newFactsEn = {
    ...facts,
    segments: segmentsEn,
    sources: cleanedSources,
  };
  const newFactsZh = {
    ...(r.factsZh || facts),
    ...newFactsEn,
    segments: segmentsZh,
    sources: cleanedSources,
  };

  // 2. Build Enriched Moat & Competitors (EN & ZH)
  const validMoatRating: "Wide" | "Narrow" | "None" = [
    "Wide",
    "Narrow",
    "None",
  ].includes(ai.overallMoatRating)
    ? ai.overallMoatRating
    : moat.overallMoatRating;
  const validMoatTrend: "Widening" | "Stable" | "Narrowing" = [
    "Widening",
    "Stable",
    "Narrowing",
  ].includes(ai.moatTrend)
    ? ai.moatTrend
    : moat.moatTrend;

  const validSources = [
    "Intangible Assets",
    "Switching Costs",
    "Cost Advantage",
    "Network Effects",
    "Efficient Scale",
  ];
  const rawMoatSources =
    Array.isArray(ai.moatSources) && ai.moatSources.length > 0
      ? ai.moatSources
      : [];
  const moatSourcesEn =
    rawMoatSources.length > 0
      ? rawMoatSources.map((ms: any, i: number) => ({
          source: (validSources.includes(ms?.source)
            ? ms.source
            : validSources[i % validSources.length]) as any,
          strength: (["Strong", "Moderate", "Weak", "None"].includes(
            ms?.strength
          )
            ? ms.strength
            : "Moderate") as any,
          description: String(
            ms?.description || moat.moatSources[0]?.description || ""
          ),
          durabilityYears: Number(ms?.durabilityYears || 6),
        }))
      : moat.moatSources;

  const moatSourcesZh =
    rawMoatSources.length > 0
      ? moatSourcesEn.map((ms: any, i: number) => ({
          ...ms,
          description: String(
            rawMoatSources[i]?.descriptionZh || ms.description
          ),
        }))
      : (r.moatZh?.moatSources ?? moatSourcesEn);

  const rawPeers =
    Array.isArray(ai.competitors) && ai.competitors.length > 0
      ? ai.competitors
      : [];
  const competitorsEn =
    rawPeers.length > 0
      ? rawPeers.map((c: any) => ({
          ticker: String(c?.ticker || "COMP")
            .toUpperCase()
            .slice(0, 10),
          name: String(c?.name || "Industry Peer"),
          marketCapBillions: Math.max(Number(c?.marketCapBillions) || 50, 0.5),
          revenueBillions: Math.max(Number(c?.revenueBillions) || 10, 0.1),
          grossMarginPct: Number(c?.grossMarginPct ?? 45),
          operatingMarginPct: Number(c?.operatingMarginPct ?? 18),
          productComparison: String(
            c?.productComparison || "Direct segment competitor"
          ),
          pricingPower: (["Superior", "Parity", "Inferior"].includes(
            c?.pricingPower
          )
            ? c.pricingPower
            : "Parity") as any,
          keyAdvantageOrVulnerability: String(
            c?.keyAdvantageOrVulnerability || "Established market presence"
          ),
        }))
      : moat.competitors;

  const competitorsZh =
    rawPeers.length > 0
      ? competitorsEn.map((c: any, i: number) => ({
          ...c,
          name: String(rawPeers[i]?.nameZh || c.name),
          productComparison: String(
            rawPeers[i]?.productComparisonZh || c.productComparison
          ),
          keyAdvantageOrVulnerability: String(
            rawPeers[i]?.keyAdvantageOrVulnerabilityZh ||
              c.keyAdvantageOrVulnerability
          ),
        }))
      : (r.moatZh?.competitors ?? competitorsEn);

  const newMoatEn = {
    ...moat,
    overallMoatRating: validMoatRating,
    moatTrend: validMoatTrend,
    moatSources: moatSourcesEn,
    competitors: competitorsEn,
    competitiveDynamicsSummary: String(
      ai.competitiveDynamicsSummary || moat.competitiveDynamicsSummary
    ),
  };

  const newMoatZh = {
    ...(r.moatZh || moat),
    ...newMoatEn,
    moatSources: moatSourcesZh,
    competitors: competitorsZh,
    competitiveDynamicsSummary: String(
      ai.competitiveDynamicsSummaryZh || newMoatEn.competitiveDynamicsSummary
    ),
  };

  // 3. Build Enriched Catalysts (EN & ZH)
  const rawCats =
    Array.isArray(ai.catalysts) && ai.catalysts.length > 0 ? ai.catalysts : [];
  const newCatalystsEn =
    rawCats.length > 0
      ? {
          ticker,
          catalysts: rawCats.map((c: any, i: number) => ({
            id: `${ticker.toLowerCase()}-cat-${i + 1}`,
            title: String(c?.title || "Strategic Execution Catalyst"),
            direction: (c?.direction === "risk" ? "risk" : "growth") as
              "growth" | "risk",
            probability: Math.max(
              0.1,
              Math.min(0.9, Number(c?.probability) || 0.6)
            ),
            probabilityAnchor: String(
              c?.probabilityAnchor || "Historical execution trajectory"
            ),
            horizon: (["near-term", "medium-term", "long-term"].includes(
              c?.horizon
            )
              ? c.horizon
              : "medium-term") as any,
            description: String(
              c?.description || "Material operational driver"
            ),
            evidence: [
              {
                fact: String(
                  c?.fact ||
                    `Reported $${facts.revenueBillions}B quarterly revenue.`
                ),
              },
            ],
          })),
        }
      : catalysts;

  const newCatalystsZh =
    rawCats.length > 0 && newCatalystsEn
      ? {
          ticker,
          catalysts: newCatalystsEn.catalysts.map((c: any, i: number) => ({
            ...c,
            title: String(rawCats[i]?.titleZh || c.title),
            probabilityAnchor: String(
              rawCats[i]?.probabilityAnchorZh || c.probabilityAnchor
            ),
            description: String(rawCats[i]?.descriptionZh || c.description),
            evidence: [
              { fact: String(rawCats[i]?.factZh || c.evidence[0]?.fact || "") },
            ],
          })),
        }
      : (r.catalystsZh ?? newCatalystsEn);

  // 4. Enrich Scenarios Assumptions (EN & ZH) while preserving deterministic EPS & multiples
  const sa = ai.scenarioAssumptions || {};
  const newScenariosEn = {
    ...scenarios,
    scenarios: scenarios.scenarios.map((s) => {
      const key = s.name.toLowerCase().includes("bull")
        ? "bull"
        : s.name.toLowerCase().includes("base")
          ? "base"
          : "panic";
      const match = sa[key];
      return {
        ...s,
        assumptions:
          Array.isArray(match?.assumptions) && match.assumptions.length > 0
            ? match.assumptions.map(String)
            : s.assumptions,
        keyDrivers:
          Array.isArray(match?.keyDrivers) && match.keyDrivers.length > 0
            ? match.keyDrivers.map(String)
            : s.keyDrivers,
      };
    }),
  };

  const newScenariosZh = {
    ...(r.scenariosZh || scenarios),
    ...newScenariosEn,
    scenarios: newScenariosEn.scenarios.map((s) => {
      const key = s.name.toLowerCase().includes("bull")
        ? "bull"
        : s.name.toLowerCase().includes("base")
          ? "base"
          : "panic";
      const match = sa[key];
      return {
        ...s,
        assumptions:
          Array.isArray(match?.assumptionsZh) && match.assumptionsZh.length > 0
            ? match.assumptionsZh.map(String)
            : s.assumptions,
        keyDrivers:
          Array.isArray(match?.keyDriversZh) && match.keyDriversZh.length > 0
            ? match.keyDriversZh.map(String)
            : s.keyDrivers,
      };
    }),
  };

  const newSentiment =
    ai.keyQuote?.quote && sentiment
      ? {
          ...sentiment,
          keyQuotes: [
            {
              speaker: String(ai.keyQuote.speaker || "Management"),
              quote: String(ai.keyQuote.quote),
              context: String(
                ai.keyQuote.context || "Quarterly earnings review"
              ),
              sentiment: "bullish" as const,
            },
          ],
        }
      : sentiment;

  // 5. Recompute Valuation, Sanity, Snowflake & Memos
  const valuation = computeValuation({
    facts: newFactsEn,
    scenarios: newScenariosEn,
    baseline,
    moat: newMoatEn,
    estimates: r.estimates ?? undefined,
  });

  const reportObj: ReportData = {
    folderSlug: r.slug,
    folderName: r.slug,
    facts: newFactsEn,
    factsZh: newFactsZh,
    scenarios: newScenariosEn,
    scenariosZh: newScenariosZh,
    baseline,
    moat: newMoatEn,
    moatZh: newMoatZh,
    estimates: r.estimates ?? undefined,
    estimatesZh: r.estimatesZh ?? undefined,
    catalysts: newCatalystsEn ?? undefined,
    catalystsZh: newCatalystsZh ?? undefined,
    sentiment: newSentiment ?? undefined,
    filing: filing ?? undefined,
    filingZh: r.filingZh ?? undefined,
    reactions: r.reactions ?? undefined,
    valuation,
  };

  valuation.sanityAudit = computeSanityAudit(reportObj, valuation);

  const stressResult =
    baseline && newFactsEn.currentPrice > 0
      ? computeStressedValuation(baseline, newFactsEn.currentPrice)
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
      moat: newMoatEn,
      estimates: r.estimates ?? undefined,
      catalysts: newCatalystsEn ?? undefined,
      reactions: r.reactions ?? undefined,
    },
    { language: "en" }
  );

  const reportMdZh = renderReport(
    {
      facts: newFactsZh,
      valuation,
      moat: newMoatZh,
      estimates: (r.estimatesZh || r.estimates) ?? undefined,
      catalysts: (newCatalystsZh || newCatalystsEn) ?? undefined,
      reactions: r.reactions ?? undefined,
    },
    { language: "zh" }
  );

  await db
    .update(reportsTable)
    .set({
      moatRating: validMoatRating,
      moatTrend: validMoatTrend,
      weightedFairValue: String(valuation.weightedFairValue),
      facts: newFactsEn,
      factsZh: newFactsZh,
      moat: newMoatEn,
      moatZh: newMoatZh,
      catalysts: newCatalystsEn,
      catalystsZh: newCatalystsZh,
      scenarios: newScenariosEn,
      scenariosZh: newScenariosZh,
      sentiment: newSentiment,
      valuation,
      snowflakeScore: sf.totalScore,
      snowflakeTier: sf.ratingTier,
      snowflakePillars: snowflakePillars as any,
      reportMd,
      reportMdZh,
      updatedAt: new Date(),
    })
    .where(eq(reportsTable.slug, r.slug));
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;
  const concArg = args.find((a) => a.startsWith("--concurrency="));
  const concurrency = concArg ? parseInt(concArg.split("=")[1], 10) : 15;

  const db = getDb();
  const tickers = await db.select().from(tickersTable);
  const tickerMeta = new Map(
    tickers.map((t) => [
      t.ticker.toUpperCase(),
      {
        company: t.company,
        sector: t.sector || "General",
        mcap: Number(t.marketCap || 0),
      },
    ])
  );

  const placeholders = await db
    .select()
    .from(reportsTable)
    .where(
      sql`${reportsTable.moat}->'competitors'->0->>'ticker' = 'PEER' OR ${reportsTable.facts}->'segments'->0->>'name' = 'Core Business & Solutions'`
    );

  // Order by largest market cap first
  placeholders.sort((a, b) => {
    const ma = tickerMeta.get(a.ticker.toUpperCase())?.mcap || 0;
    const mb = tickerMeta.get(b.ticker.toUpperCase())?.mcap || 0;
    return mb - ma;
  });

  const targetPlaceholders =
    limit && limit > 0 ? placeholders.slice(0, limit) : placeholders;

  console.log("==============================================================");
  console.log("🚀 [Single-Shot Parallel AI Backfill Engine]");
  console.log(` • Target Placeholder Reports: ${targetPlaceholders.length}`);
  console.log(` • Parallel Workers:           ${concurrency}`);
  console.log(
    ` • Model:                      ${AI_GATEWAY_MODELS.EXTRACTOR} (thinking: disabled)`
  );
  console.log(
    "==============================================================\n"
  );

  let completed = 0;
  let errors = 0;
  let idx = 0;
  const startTime = Date.now();

  async function worker() {
    while (true) {
      const currentIdx = idx++;
      if (currentIdx >= targetPlaceholders.length) break;
      const row = targetPlaceholders[currentIdx];
      const meta = tickerMeta.get(row.ticker.toUpperCase());
      try {
        await enrichSingleReportRow(
          row,
          meta?.company || row.facts?.company || row.ticker,
          meta?.sector || "General"
        );
        completed++;
        if (completed % 10 === 0 || completed === targetPlaceholders.length) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(
            `  ✅ [${completed}/${targetPlaceholders.length}] (${Math.round((completed / targetPlaceholders.length) * 100)}%) enriched in ${elapsed}s | Latest: ${row.slug}`
          );
        }
      } catch (err: any) {
        errors++;
        console.warn(`  ⚠️ [${row.slug}] Error:`, err?.message || String(err));
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    "\n=============================================================="
  );
  console.log(
    `🏁 Backfill Complete! Enriched: ${completed}/${targetPlaceholders.length} | Errors: ${errors} | Time: ${totalSec}s`
  );
  console.log(
    "==============================================================\n"
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
