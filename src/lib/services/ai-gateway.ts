import { generateText, Output } from "ai";
import { z } from "zod";
import {
  FactsSchema,
  MoatCompetitorsSchema,
  ScenariosSchema,
  CatalystsSchema,
  EarningsSentimentSchema,
  FilingExtractsSchema,
  FinancialModelBaselineSchema,
  type Facts,
  type MoatCompetitors,
  type Scenarios,
  type Catalysts,
  type EarningsSentiment,
  type FilingExtracts,
  type FinancialModelBaseline,
} from "@/lib/schemas";
import type {
  PipelineDataBundle,
  FinancialProfile,
  PeerBenchmarkMetrics,
} from "./financial-data/types";
import { fetchPeerBenchmarks } from "./financial-data/fetchers";
import { round2 } from "./financial-data/utils";

export const AI_GATEWAY_MODELS = {
  EXTRACTOR: "deepseek/deepseek-v4.1-flash-1017",
} as const;

export function isAiGatewayConfigured(): boolean {
  const key =
    process.env.AI_GATEWAY_API_KEY?.trim() ||
    process.env.VERCEL_OIDC_TOKEN?.trim();
  return Boolean(
    key &&
    key !== "your-vercel-ai-gateway-api-key" &&
    key !== "your_api_key_here"
  );
}

const UnifiedSynthesisSchema = z.object({
  sentiment: EarningsSentimentSchema,
  filingEn: FilingExtractsSchema,
  segments: FactsSchema.shape.segments,
  oneTimeItems: FactsSchema.shape.oneTimeItems,
  epsOperating: z.number().optional(),
  grossMarginPct: z.number().optional(),
  operatingMarginPct: z.number().optional(),
  guidanceRevenueLowBillions: z.number().nonnegative(),
  guidanceRevenueHighBillions: z.number().nonnegative(),
  guidanceOperatingIncomeLowBillions: z.number(),
  guidanceOperatingIncomeHighBillions: z.number(),
  governanceRisk: z.enum(["none", "low", "moderate", "severe"]),
  accountingFlags: z.array(z.string()),
  materialLitigationOrDoj: z.boolean(),
  valuationArchetype: z.enum([
    "compounder",
    "operating_scaler",
    "venture_hypergrowth",
  ]),
  customerConcentrationPct: z.number().min(0).max(100).optional(),
  purchaseObligationsBillions: z.number().optional(),
  totalCommitmentsBillions: z.number().optional(),
  guaranteeExposureBillions: z.number().optional(),
  revenueGrowthPct: z.number().optional(),
  moatEn: MoatCompetitorsSchema,
  catalystsEn: CatalystsSchema,
  upstreamDrivers: FinancialModelBaselineSchema.shape.upstreamDrivers,
  scenariosEn: ScenariosSchema,
});

const Stage3LocalizationSchema = z.object({
  segmentsZh: FactsSchema.shape.segments,
  moatZh: MoatCompetitorsSchema,
  catalystsZh: CatalystsSchema,
  scenariosZh: ScenariosSchema,
  filingZh: FilingExtractsSchema,
});

function parseJsonObject(rawText: string): any {
  const cleaned = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error(
      `No JSON object found in model output (length=${rawText.length})`
    );
  }

  const candidate = cleaned
    .slice(firstBrace, lastBrace + 1)
    .replace(/,\s*([}\]])/g, "$1");

  return JSON.parse(candidate);
}

function extractAndParseJson<T extends z.ZodType>(
  rawText: string,
  schema: T
): z.infer<T> {
  return schema.parse(parseJsonObject(rawText));
}

function sanitizeStage2Raw(raw: any, fallbackFacts: Facts): any {
  if (!raw || typeof raw !== "object") return raw;

  if (Array.isArray(raw.segments)) {
    raw.segments = raw.segments.map((seg: any) => {
      if (!seg || typeof seg !== "object") return seg;
      const opInc = seg.operatingIncomeBillions;
      const opMarg = seg.operatingMarginPct;
      // When 10-Q disaggregates revenue by product line without separate segment operating income,
      // omit 0 placeholder margins so Snowflake does not falsely flag unprofitable segments
      const isUndisclosedSegmentMargin =
        (opInc === 0 || opInc == null) && (opMarg === 0 || opMarg == null);
      return {
        ...seg,
        revenueBillions: Number(seg.revenueBillions || 0),
        growthPct: Number(seg.growthPct || 0),
        operatingIncomeBillions: isUndisclosedSegmentMargin
          ? undefined
          : Number(opInc),
        operatingMarginPct: isUndisclosedSegmentMargin
          ? undefined
          : Number(opMarg),
      };
    });
  }

  if (Array.isArray(raw.oneTimeItems)) {
    raw.oneTimeItems = raw.oneTimeItems.map((it: any) =>
      typeof it === "string"
        ? { description: it, amountBillions: 0, isOperating: false }
        : {
            description: String(
              it?.description || it?.item || "Non-operating item"
            ),
            amountBillions: Number(
              it?.amountBillions ?? it?.impactBillions ?? 0
            ),
            isOperating: Boolean(it?.isOperating ?? false),
            note: it?.note ? String(it.note) : undefined,
          }
    );
  }

  if (
    !["compounder", "operating_scaler", "venture_hypergrowth"].includes(
      raw.valuationArchetype
    )
  ) {
    raw.valuationArchetype = fallbackFacts.valuationArchetype || "compounder";
  }

  if (!["none", "low", "moderate", "severe"].includes(raw.governanceRisk)) {
    raw.governanceRisk = "none";
  }

  // Filter out modeling disclaimers mistaken for SEC accounting fraud flags
  if (Array.isArray(raw.accountingFlags)) {
    raw.accountingFlags = raw.accountingFlags.filter(
      (flag: any) =>
        typeof flag === "string" &&
        /restatement|auditor resign|item 4\.01|item 4\.02|material weakness|sec subpoena|doj fraud/i.test(
          flag
        ) &&
        !/unverified|supplied|illustrative|modeling|allocated|assumption/i.test(
          flag
        )
    );
  } else {
    raw.accountingFlags = [];
  }
  if (raw.accountingFlags.length === 0 && raw.governanceRisk !== "severe") {
    raw.governanceRisk = "none";
  }

  if (raw.moatEn && typeof raw.moatEn === "object") {
    if (!["Wide", "Narrow", "None"].includes(raw.moatEn.overallMoatRating)) {
      raw.moatEn.overallMoatRating = "Narrow";
    }
    const trend = String(raw.moatEn.moatTrend || "");
    if (/deteriorat|erod|narrow|declin/i.test(trend)) {
      raw.moatEn.moatTrend = "Narrowing";
    } else if (/widen|expand|improv/i.test(trend)) {
      raw.moatEn.moatTrend = "Widening";
    } else if (!["Widening", "Stable", "Narrowing"].includes(trend)) {
      raw.moatEn.moatTrend = "Stable";
    }
    if (Array.isArray(raw.moatEn.moatSources)) {
      const validSources = [
        "Intangible Assets",
        "Switching Costs",
        "Cost Advantage",
        "Network Effects",
        "Efficient Scale",
      ];
      raw.moatEn.moatSources = raw.moatEn.moatSources.map(
        (ms: any, idx: number) => ({
          ...ms,
          source: validSources.includes(ms?.source)
            ? ms.source
            : validSources[idx % validSources.length],
          strength: ["Strong", "Moderate", "Weak", "None"].includes(
            ms?.strength
          )
            ? ms.strength
            : "Moderate",
        })
      );
    }
    if (Array.isArray(raw.moatEn.competitors)) {
      raw.moatEn.competitors = raw.moatEn.competitors.map((c: any) => ({
        ...c,
        marketCapBillions: Number(c?.marketCapBillions || 0),
        revenueBillions: Number(c?.revenueBillions || 0),
        revenueGrowthPct:
          c?.revenueGrowthPct != null ? Number(c.revenueGrowthPct) : undefined,
        grossMarginPct: Number(c?.grossMarginPct || 0),
        operatingMarginPct: Number(c?.operatingMarginPct || 0),
        forwardPe: c?.forwardPe != null ? Number(c.forwardPe) : undefined,
        marketSharePct:
          c?.marketSharePct != null ? Number(c.marketSharePct) : undefined,
        pricingPower: ["Superior", "Parity", "Inferior"].includes(
          c?.pricingPower
        )
          ? c.pricingPower
          : "Parity",
      }));
    }
  }

  for (const numKey of [
    "epsOperating",
    "grossMarginPct",
    "operatingMarginPct",
    "customerConcentrationPct",
    "purchaseObligationsBillions",
    "totalCommitmentsBillions",
    "guaranteeExposureBillions",
    "revenueGrowthPct",
  ]) {
    if (raw[numKey] === null) {
      raw[numKey] = undefined;
    } else if (typeof raw[numKey] === "string") {
      const parsed = Number(raw[numKey]);
      raw[numKey] = Number.isFinite(parsed) ? parsed : undefined;
    }
  }
  for (const reqNumKey of [
    "guidanceRevenueLowBillions",
    "guidanceRevenueHighBillions",
    "guidanceOperatingIncomeLowBillions",
    "guidanceOperatingIncomeHighBillions",
  ]) {
    if (raw[reqNumKey] == null || Number.isNaN(Number(raw[reqNumKey]))) {
      raw[reqNumKey] = 0;
    } else {
      raw[reqNumKey] = Number(raw[reqNumKey]);
    }
  }

  if (raw.catalystsEn && typeof raw.catalystsEn === "object") {
    if (Array.isArray(raw.catalystsEn.catalysts)) {
      raw.catalystsEn.catalysts = raw.catalystsEn.catalysts.map((cat: any) => {
        if (!cat || typeof cat !== "object") return cat;
        if (Array.isArray(cat.evidence)) {
          cat.evidence = cat.evidence.map((ev: any) => {
            if (typeof ev === "string") return { fact: ev };
            if (ev && typeof ev === "object" && typeof ev.source === "string") {
              return { ...ev, source: { title: ev.source } };
            }
            return ev;
          });
        }
        return cat;
      });
    }
  }

  return raw;
}

/**
 * Overwrites LLM-generated competitor financial metrics with live, deterministic
 * Yahoo Finance telemetry so peer comparisons never contain hallucinated numbers.
 */
async function hydrateCompetitorsWithLiveMetrics(
  aiCompetitors: MoatCompetitors["competitors"],
  profile: FinancialProfile,
  facts: Facts
): Promise<MoatCompetitors["competitors"]> {
  if (!aiCompetitors || aiCompetitors.length === 0) {
    return [];
  }

  const knownMap = new Map<string, PeerBenchmarkMetrics>();
  for (const p of profile.peerBenchmarks || []) {
    knownMap.set(p.ticker.toUpperCase(), p);
  }

  const missingTickers = aiCompetitors
    .map((c) =>
      String(c.ticker || "")
        .toUpperCase()
        .trim()
    )
    .filter((sym) => sym && !knownMap.has(sym) && sym !== profile.ticker);

  if (missingTickers.length > 0) {
    const fetched = await fetchPeerBenchmarks(missingTickers, profile.ticker);
    for (const p of fetched) {
      knownMap.set(p.ticker.toUpperCase(), p);
    }
  }

  const annualizedTargetRev = round2(
    profile.quarterlyStatements.length >= 4
      ? profile.quarterlyStatements
          .slice(0, 4)
          .reduce((s, q) => s + q.revenueBillions, 0)
      : facts.revenueBillions * 4
  );

  const hydrated = aiCompetitors.map((comp) => {
    const sym = String(comp.ticker || "")
      .toUpperCase()
      .trim();
    const live = knownMap.get(sym);
    if (!live) return comp;

    return {
      ...comp,
      ticker: live.ticker,
      name: live.name || comp.name,
      marketCapBillions:
        live.marketCapBillions > 0
          ? live.marketCapBillions
          : comp.marketCapBillions,
      revenueBillions:
        live.revenueBillions > 0 ? live.revenueBillions : comp.revenueBillions,
      revenueGrowthPct:
        live.revenueGrowthPct !== undefined
          ? live.revenueGrowthPct
          : comp.revenueGrowthPct,
      grossMarginPct:
        live.grossMarginPct !== 0 ? live.grossMarginPct : comp.grossMarginPct,
      operatingMarginPct:
        live.operatingMarginPct !== 0
          ? live.operatingMarginPct
          : comp.operatingMarginPct,
      forwardPe: live.forwardPe !== undefined ? live.forwardPe : comp.forwardPe,
    };
  });

  const totalPoolRev =
    annualizedTargetRev +
    hydrated.reduce((s, c) => s + (c.revenueBillions || 0), 0);

  return hydrated.map((c) => ({
    ...c,
    marketSharePct:
      totalPoolRev > 0 && c.revenueBillions > 0
        ? round2((c.revenueBillions / totalPoolRev) * 100)
        : c.marketSharePct,
  }));
}

/**
 * Executes lean, high-fidelity buy-side intelligence extraction via Vercel AI Gateway:
 * - Single-pass unified synthesis (`deepseek/deepseek-v4.1-flash-1017`, thinking disabled):
 *   Extracts sentiment, Item 1A risk factors, operating segments, real peer moats, and calibrated scenarios in 1 call.
 * - Hydrates competitor financial metrics deterministically from Yahoo Finance.
 * - Optional on-demand localization (`options?.translateZh`): Generates Chinese artifacts only when explicitly requested.
 */
export async function enrichPipelineBundleWithAi(
  bundle: PipelineDataBundle,
  options?: { translateZh?: boolean }
): Promise<PipelineDataBundle> {
  if (!isAiGatewayConfigured()) {
    return bundle;
  }

  const { ticker, profile, factsDraft, baseline, analystEstimatesEn, filings } =
    bundle;

  const compactContext = JSON.stringify(
    {
      ticker,
      companyName: profile.companyName,
      sector: profile.sector,
      industry: profile.industry,
      businessSummary: profile.businessSummary,
      quarter: factsDraft.quarter,
      reportDate: factsDraft.reportDate,
      currentPrice: profile.currentPrice,
      marketCapBillions: profile.marketCapBillions,
      revenueBillions: factsDraft.revenueBillions,
      revenueGrowthPct: factsDraft.revenueGrowthPct,
      grossMarginPct: factsDraft.grossMarginPct,
      operatingIncomeBillions: factsDraft.operatingIncomeBillions,
      operatingMarginPct: factsDraft.operatingMarginPct,
      epsReported: factsDraft.epsReported,
      epsConsensus: factsDraft.epsConsensus,
      forwardEpsConsensus: factsDraft.forwardEpsConsensus,
      trailingPE: profile.trailingPE,
      forwardPE: profile.forwardPE,
      balanceSheet: profile.balanceSheet,
      cashFlow: profile.cashFlow,
      quarterlyHistory: profile.quarterlyStatements.slice(0, 5),
      consensusTargets: analystEstimatesEn.priceTargets,
      consensusBreakdown: analystEstimatesEn.consensus,
      recentSecFilings: filings.slice(0, 6),
      baselineMultipleRegimes: baseline.multipleRegimes,
      livePeerBenchmarks: profile.peerBenchmarks || [],
    },
    null,
    2
  );

  console.log(
    `🤖 [AI Gateway] Synthesizing unified buy-side intelligence for ${ticker} via ${AI_GATEWAY_MODELS.EXTRACTOR}...`
  );

  let sentiment: EarningsSentiment = bundle.sentiment;
  let filingEn: FilingExtracts = bundle.filingEn;
  let enrichedFacts: Facts = factsDraft;
  let enrichedMoatEn: MoatCompetitors = bundle.moatEn;
  let enrichedCatalystsEn: Catalysts = bundle.catalystsEn;
  let enrichedBaseline: FinancialModelBaseline = baseline;
  let enrichedScenariosEn: Scenarios = bundle.scenariosEn;

  try {
    const synthesisTemplate = {
      sentiment: bundle.sentiment,
      filingEn: bundle.filingEn,
      segments: factsDraft.segments,
      oneTimeItems: factsDraft.oneTimeItems,
      epsOperating: factsDraft.epsOperating,
      grossMarginPct: factsDraft.grossMarginPct ?? 50,
      operatingMarginPct: factsDraft.operatingMarginPct,
      guidanceRevenueLowBillions: factsDraft.guidanceRevenueLowBillions ?? 0,
      guidanceRevenueHighBillions: factsDraft.guidanceRevenueHighBillions ?? 0,
      guidanceOperatingIncomeLowBillions:
        factsDraft.guidanceOperatingIncomeLowBillions ?? 0,
      guidanceOperatingIncomeHighBillions:
        factsDraft.guidanceOperatingIncomeHighBillions ?? 0,
      governanceRisk: factsDraft.governanceRisk,
      accountingFlags: factsDraft.accountingFlags,
      materialLitigationOrDoj: factsDraft.materialLitigationOrDoj,
      valuationArchetype: factsDraft.valuationArchetype,
      customerConcentrationPct: factsDraft.customerConcentrationPct ?? 0,
      purchaseObligationsBillions: factsDraft.purchaseObligationsBillions ?? 0,
      totalCommitmentsBillions: factsDraft.totalCommitmentsBillions ?? 0,
      guaranteeExposureBillions: factsDraft.guaranteeExposureBillions ?? 0,
      revenueGrowthPct: factsDraft.revenueGrowthPct ?? 0,
      moatEn: bundle.moatEn,
      catalystsEn: bundle.catalystsEn,
      upstreamDrivers: baseline.upstreamDrivers,
      scenariosEn: bundle.scenariosEn,
    };

    let secContext = "";
    if (bundle.secExcerpts) {
      if (bundle.secExcerpts.pressReleaseText) {
        secContext += `\n\n--- OFFICIAL FORM 8-K PRESS RELEASE & EXECUTIVE COMMENTARY ---\n${bundle.secExcerpts.pressReleaseText}`;
      }
      if (bundle.secExcerpts.segmentFootnoteText) {
        secContext += `\n\n--- OFFICIAL 10-Q/10-K NOTE: OPERATING SEGMENTS, DISAGGREGATION OF REVENUE & CONTRACT BALANCES (RPO) ---\n${bundle.secExcerpts.segmentFootnoteText}`;
      }
      if (bundle.secExcerpts.commitmentsText) {
        secContext += `\n\n--- OFFICIAL 10-Q/10-K NOTE: COMMITMENTS AND CONTINGENCIES & PURCHASE OBLIGATIONS ---\n${bundle.secExcerpts.commitmentsText}`;
      }
      if (bundle.secExcerpts.customerConcentrationText) {
        secContext += `\n\n--- OFFICIAL 10-Q/10-K NOTE: CUSTOMER & GEOGRAPHIC CONCENTRATIONS ---\n${bundle.secExcerpts.customerConcentrationText}`;
      }
      if (bundle.secExcerpts.competitionAndMoatText) {
        secContext += `\n\n--- OFFICIAL 10-K ITEM 1 BUSINESS: STRATEGY, COMPETITION, CUSTOMERS & R&D MOAT ---\n${bundle.secExcerpts.competitionAndMoatText}`;
      }
      if (bundle.secExcerpts.mdaAndRisksText) {
        secContext += `\n\n--- OFFICIAL 10-Q/10-K MD&A & RISK HIGHLIGHTS ---\n${bundle.secExcerpts.mdaAndRisksText}`;
      }
    }

    const { text: synthesisText } = await generateText({
      model: AI_GATEWAY_MODELS.EXTRACTOR,
      maxOutputTokens: 16384,
      system: `You are a Senior Buy-Side Equity Analyst & Forensic Auditor. Return ONLY a single valid JSON object matching the exact keys and types of the provided template (no markdown code fences, no commentary).
Rules:
1. Ground all findings strictly in the provided SEC 8-K, 10-Q, and 10-K disclosures and quantitative context. Keep the JSON concise and high-signal: max 3 keyQuotes, max 4 newRiskFactors, max 4 filingEn.sections (with 2-3 keyFindings each), max 4 moatSources, max 4 competitors, and max 4 catalysts. Keep each descriptive string to 1-2 crisp institutional sentences and escape any internal double quotes.
2. In segments, extract ${ticker}'s actual disclosed product/operating segments from the 10-Q "Disaggregation of Revenue / Operating Segments" table or 8-K release (e.g. Components vs. Systems, Data Center vs. Gaming), converting millions to billions (e.g. $754.2M -> 0.75B) and computing exact YoY growthPct. Never output the generic "Core Business & Solutions" placeholder.
3. If the 8-K earnings release discloses Non-GAAP diluted EPS (e.g. $4.57 Non-GAAP vs $3.54 GAAP) or next-quarter revenue/operating margin guidance, set epsOperating to the Non-GAAP diluted EPS and populate guidanceRevenueLowBillions, guidanceRevenueHighBillions, guidanceOperatingIncomeLowBillions, and guidanceOperatingIncomeHighBillions (in billions).
4. In moatEn.competitors, select 3-4 direct publicly traded competitors of ${ticker} based on the 10-K Competition disclosure and industry overlap (using livePeerBenchmarks when relevant, or closer pure-play public peers with real US stock tickers). Compare each peer's product stack, switching costs, and pricingPower ("Superior", "Parity", or "Inferior" from the peer's perspective relative to ${ticker}) citing concrete technological or margin evidence from the 10-K/10-Q.
5. In moatEn.overallMoatRating ("Wide", "Narrow", or "None") and moatEn.moatSources, evaluate structural barriers (Intangible Assets/IP, Switching Costs/RPO & multi-billion purchase commitments, Cost Advantage/vertical fab integration, Network Effects, Efficient Scale) grounded in 10-K/10-Q evidence and peer margin differentials.
6. Set governanceRisk to "none" and accountingFlags to [] unless the company has an active auditor resignation, SEC restatement, or DOJ accounting fraud probe.
7. In scenariosEn.scenarios, formulate 3 scenarios ("Bull", "Base", "Panic") whose probabilities sum to 1.0 (e.g. 0.25 Bull, 0.50 Base, 0.25 Panic), anchoring forwardEps and multiple to currentPrice ($${profile.currentPrice}) and consensusTarget ($${analystEstimatesEn.priceTargets.average || profile.currentPrice}).
8. When official SEC 10-Q / 8-K excerpts are provided:
   a. Populate sentiment.keyQuotes using verbatim quotes from the CEO and CFO in the 8-K press release.
   b. Extract purchase obligations, supply commitments, and customer prepayments/deferred revenue into filingEn.sections under "Note: Commitments and Contingencies" (convert millions to billions for purchaseObligationsBillions, e.g. $2,948.9 million -> 2.95).
   c. If customer concentration is disclosed (e.g. two end customers accounted for 37% and 11% of revenue), record the top single-customer share in customerConcentrationPct (e.g. 37) and include "Note: Customer and Geographic Concentrations" in filingEn.sections.
   d. In catalystsEn and filingEn.newRiskFactors, capture specific product ramps, multi-billion purchase commitments (e.g. NPO/CPO, OCS), M&A combinations, and supply/customer concentration risks disclosed in the 8-K and 10-Q.`,
      prompt: `Synthesize the complete equity research bundle for ${profile.companyName} (${ticker}, ${factsDraft.quarter}).\n\nJSON Template to match:\n${JSON.stringify(synthesisTemplate, null, 2)}\n\nQuantitative Context:\n${compactContext}${secContext}`,
      providerOptions: {
        deepseek: {
          thinking: { type: "disabled" },
        },
      },
    });

    const synthesisRaw = sanitizeStage2Raw(
      parseJsonObject(synthesisText),
      factsDraft
    );
    const synth = UnifiedSynthesisSchema.parse(synthesisRaw);

    sentiment = EarningsSentimentSchema.parse({
      ...synth.sentiment,
      ticker,
      quarter: factsDraft.quarter,
    });
    filingEn = FilingExtractsSchema.parse({
      ...synth.filingEn,
      ticker,
      quarter: factsDraft.quarter,
    });

    enrichedFacts = FactsSchema.parse({
      ...factsDraft,
      segments:
        synth.segments.length > 0 ? synth.segments : factsDraft.segments,
      oneTimeItems: synth.oneTimeItems,
      epsOperating:
        synth.epsOperating && synth.epsOperating > 0
          ? synth.epsOperating
          : factsDraft.epsOperating,
      guidanceRevenueLowBillions:
        synth.guidanceRevenueLowBillions > 0
          ? synth.guidanceRevenueLowBillions
          : factsDraft.guidanceRevenueLowBillions,
      guidanceRevenueHighBillions:
        synth.guidanceRevenueHighBillions > 0
          ? synth.guidanceRevenueHighBillions
          : factsDraft.guidanceRevenueHighBillions,
      guidanceOperatingIncomeLowBillions:
        synth.guidanceOperatingIncomeLowBillions,
      guidanceOperatingIncomeHighBillions:
        synth.guidanceOperatingIncomeHighBillions,
      governanceRisk: synth.governanceRisk,
      accountingFlags: synth.accountingFlags,
      materialLitigationOrDoj: synth.materialLitigationOrDoj,
      valuationArchetype: synth.valuationArchetype,
      customerConcentrationPct:
        synth.customerConcentrationPct ?? factsDraft.customerConcentrationPct,
      purchaseObligationsBillions:
        synth.purchaseObligationsBillions ??
        factsDraft.purchaseObligationsBillions,
      totalCommitmentsBillions:
        synth.totalCommitmentsBillions ?? factsDraft.totalCommitmentsBillions,
      guaranteeExposureBillions:
        synth.guaranteeExposureBillions ?? factsDraft.guaranteeExposureBillions,
      revenueGrowthPct: synth.revenueGrowthPct ?? factsDraft.revenueGrowthPct,
    });

    const hydratedCompetitors = await hydrateCompetitorsWithLiveMetrics(
      synth.moatEn.competitors,
      profile,
      enrichedFacts
    );

    enrichedMoatEn = MoatCompetitorsSchema.parse({
      ...synth.moatEn,
      ticker,
      competitors: hydratedCompetitors,
      sources: enrichedFacts.sources,
    });

    enrichedCatalystsEn = CatalystsSchema.parse({
      ...synth.catalystsEn,
      ticker,
    });

    if (synth.upstreamDrivers.length >= 2) {
      enrichedBaseline = FinancialModelBaselineSchema.parse({
        ...baseline,
        upstreamDrivers: synth.upstreamDrivers,
      });
    }

    // Normalize scenario probabilities & anchor
    const rawScenarios = synth.scenariosEn.scenarios;
    const probSum = rawScenarios.reduce((s, c) => s + c.probability, 0) || 1;
    const normalizedScenarios = rawScenarios.map((s, idx) => {
      const detScenario =
        bundle.scenariosEn.scenarios.find(
          (ds) => ds.name.toLowerCase() === s.name.toLowerCase()
        ) || bundle.scenariosEn.scenarios[idx];

      const p = Number((s.probability / probSum).toFixed(2));
      const detEps = detScenario?.forwardEps ?? s.forwardEps;
      const detMult = detScenario?.multiple ?? s.multiple;
      const boundedEps = Number(
        Math.max(
          detEps * 0.85,
          Math.min(detEps * 1.15, s.forwardEps || detEps)
        ).toFixed(2)
      );
      const boundedMult = Number(
        Math.max(
          detMult * 0.85,
          Math.min(detMult * 1.15, s.multiple || detMult)
        ).toFixed(2)
      );

      return {
        ...s,
        probability: p,
        rawProbability: p,
        forwardEps: Math.max(boundedEps, 0.1),
        multiple: Math.max(boundedMult, 2.0),
      };
    });

    const currentSum = normalizedScenarios.reduce(
      (s, c) => s + c.probability,
      0
    );
    if (normalizedScenarios.length > 0 && Math.abs(currentSum - 1) > 0.001) {
      const idx =
        normalizedScenarios.findIndex((s) =>
          s.name.toLowerCase().includes("base")
        ) >= 0
          ? normalizedScenarios.findIndex((s) =>
              s.name.toLowerCase().includes("base")
            )
          : 0;
      normalizedScenarios[idx].probability = Number(
        (normalizedScenarios[idx].probability + (1 - currentSum)).toFixed(2)
      );
      normalizedScenarios[idx].rawProbability =
        normalizedScenarios[idx].probability;
    }

    enrichedScenariosEn = ScenariosSchema.parse({
      ...synth.scenariosEn,
      ticker,
      currentPrice: profile.currentPrice,
      consensusTarget:
        analystEstimatesEn.priceTargets.average ||
        synth.scenariosEn.consensusTarget,
      scenarios: normalizedScenarios,
    });
  } catch (err) {
    console.warn(
      `⚠️ [AI Gateway] Synthesis fallback for ${ticker}:`,
      err instanceof Error ? err.message : err
    );
  }

  // Optional on-demand Chinese localization
  let factsZh: Facts = {
    ...enrichedFacts,
    sources: bundle.factsZh.sources,
  };
  let moatZh: MoatCompetitors = {
    ...enrichedMoatEn,
  };
  let catalystsZh: Catalysts = {
    ...enrichedCatalystsEn,
  };
  let scenariosZh: Scenarios = {
    ...enrichedScenariosEn,
  };
  let filingZh: FilingExtracts = {
    ...filingEn,
  };

  if (options?.translateZh) {
    console.log(
      `🌏 [AI Gateway] Translating Chinese artifacts on-demand for ${ticker} via ${AI_GATEWAY_MODELS.EXTRACTOR}...`
    );
    try {
      const stage3Template = {
        segmentsZh: enrichedFacts.segments,
        moatZh: enrichedMoatEn,
        catalystsZh: enrichedCatalystsEn,
        scenariosZh: enrichedScenariosEn,
        filingZh: filingEn,
      };

      const { text: stage3Text } = await generateText({
        model: AI_GATEWAY_MODELS.EXTRACTOR,
        maxOutputTokens: 16384,
        system:
          "You are an institutional Mandarin Chinese equity research translator. Return ONLY a single valid JSON object matching the exact keys of the provided template (no markdown fences). Translate all English descriptive text fields into concise, professional buy-side Simplified Chinese while keeping every number, percentage, ticker symbol, and enum key 100% identical to the English input.",
        prompt: `Translate the following equity research modules for ${ticker} into institutional Simplified Chinese matching the exact JSON structure:\n\n${JSON.stringify(
          stage3Template,
          null,
          2
        )}`,
        providerOptions: {
          deepseek: {
            thinking: { type: "disabled" },
          },
        },
      });

      const rawZh = parseJsonObject(stage3Text);
      if (rawZh?.moatZh) {
        if (Array.isArray(rawZh.moatZh.moatSources)) {
          rawZh.moatZh.moatSources = rawZh.moatZh.moatSources.map(
            (ms: any, i: number) => ({
              ...ms,
              source:
                enrichedMoatEn.moatSources[i]?.source || "Intangible Assets",
              strength: enrichedMoatEn.moatSources[i]?.strength || "Moderate",
              durabilityYears:
                enrichedMoatEn.moatSources[i]?.durabilityYears ??
                ms.durabilityYears,
            })
          );
        }
        if (Array.isArray(rawZh.moatZh.competitors)) {
          rawZh.moatZh.competitors = rawZh.moatZh.competitors.map(
            (c: any, i: number) => ({
              ...c,
              ticker: enrichedMoatEn.competitors[i]?.ticker || c.ticker,
              pricingPower:
                enrichedMoatEn.competitors[i]?.pricingPower || "Parity",
            })
          );
        }
        rawZh.moatZh.overallMoatRating = enrichedMoatEn.overallMoatRating;
        rawZh.moatZh.moatTrend = enrichedMoatEn.moatTrend;
      }
      if (Array.isArray(rawZh?.catalystsZh?.catalysts)) {
        rawZh.catalystsZh.catalysts = rawZh.catalystsZh.catalysts.map(
          (cat: any, i: number) => ({
            ...cat,
            id: enrichedCatalystsEn.catalysts[i]?.id || cat.id,
            direction: enrichedCatalystsEn.catalysts[i]?.direction || "growth",
            horizon: enrichedCatalystsEn.catalysts[i]?.horizon || "medium-term",
            probability:
              enrichedCatalystsEn.catalysts[i]?.probability ?? cat.probability,
          })
        );
      }
      if (rawZh?.filingZh) {
        if (Array.isArray(rawZh.filingZh.newRiskFactors)) {
          rawZh.filingZh.newRiskFactors = rawZh.filingZh.newRiskFactors.map(
            (rf: any, i: number) => ({
              ...rf,
              severity: filingEn.newRiskFactors?.[i]?.severity || "Moderate",
            })
          );
        }
        if (Array.isArray(rawZh.filingZh.sections)) {
          rawZh.filingZh.sections = rawZh.filingZh.sections.map(
            (sec: any, i: number) => ({
              ...sec,
              keyFindings: Array.isArray(sec?.keyFindings)
                ? sec.keyFindings.map((kf: any, j: number) => ({
                    ...kf,
                    novelty:
                      filingEn.sections?.[i]?.keyFindings?.[j]?.novelty ||
                      "Moderate",
                  }))
                : [],
            })
          );
        }
      }

      const stage3 = Stage3LocalizationSchema.parse(rawZh);
      factsZh = FactsSchema.parse({
        ...enrichedFacts,
        segments:
          stage3.segmentsZh.length === enrichedFacts.segments.length
            ? stage3.segmentsZh
            : enrichedFacts.segments,
        sources: bundle.factsZh.sources,
      });
      moatZh = MoatCompetitorsSchema.parse({
        ...stage3.moatZh,
        ticker,
        overallMoatRating: enrichedMoatEn.overallMoatRating,
        moatTrend: enrichedMoatEn.moatTrend,
        sources: bundle.factsZh.sources,
      });
      catalystsZh = CatalystsSchema.parse({
        ...stage3.catalystsZh,
        ticker,
      });
      scenariosZh = ScenariosSchema.parse({
        ...enrichedScenariosEn,
        scenarios: enrichedScenariosEn.scenarios.map((enScen, i) => ({
          ...enScen,
          assumptions:
            stage3.scenariosZh.scenarios[i]?.assumptions ?? enScen.assumptions,
          keyDrivers:
            stage3.scenariosZh.scenarios[i]?.keyDrivers ?? enScen.keyDrivers,
        })),
      });
      filingZh = FilingExtractsSchema.parse({
        ...stage3.filingZh,
        ticker,
        quarter: factsDraft.quarter,
      });
    } catch (err) {
      console.warn(
        `⚠️ [AI Gateway] Localization fallback for ${ticker}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  return {
    ...bundle,
    factsDraft: enrichedFacts,
    factsZh,
    baseline: enrichedBaseline,
    scenariosEn: enrichedScenariosEn,
    scenariosZh,
    moatEn: enrichedMoatEn,
    moatZh,
    catalystsEn: enrichedCatalystsEn,
    catalystsZh,
    sentiment,
    filingEn,
    filingZh,
  };
}
