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
import type { PipelineDataBundle } from "./financial-data/types";

export const AI_GATEWAY_MODELS = {
  EXTRACTOR: "deepseek/deepseek-v4.1-flash-1017",
  SYNTHESIZER: "openai/gpt-6.1-sol",
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

const Stage1ExtractionSchema = z.object({
  sentiment: EarningsSentimentSchema,
  filingEn: FilingExtractsSchema,
});

const Stage2SynthesisSchema = z.object({
  segments: FactsSchema.shape.segments,
  oneTimeItems: FactsSchema.shape.oneTimeItems,
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

  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
}

function extractAndParseJson<T extends z.ZodType>(
  rawText: string,
  schema: T
): z.infer<T> {
  return schema.parse(parseJsonObject(rawText));
}

function sanitizeStage2Raw(raw: any, fallbackFacts: Facts): any {
  if (!raw || typeof raw !== "object") return raw;

  if (Array.isArray(raw.oneTimeItems)) {
    raw.oneTimeItems = raw.oneTimeItems.map((it: any) =>
      typeof it === "string"
        ? { item: it, amountBillions: 0, impactOnEps: 0 }
        : {
            item: String(it?.item || it?.description || "Restructuring item"),
            amountBillions: Number(
              it?.amountBillions ?? it?.impactBillions ?? 0
            ),
            impactOnEps: Number(it?.impactOnEps ?? it?.epsImpact ?? 0),
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
        pricingPower: ["Superior", "Parity", "Inferior"].includes(
          c?.pricingPower
        )
          ? c.pricingPower
          : "Parity",
      }));
    }
  }

  return raw;
}

/**
 * Executes the 2-Tier Mixed-Model Funnel via Vercel AI Gateway:
 * - Tier 1 (`deepseek/deepseek-v4.1-flash-1017`, thinking disabled): Filing/Sentiment extraction + EN->ZH localization
 * - Tier 2 (`openai/gpt-6.1-sol`): Buy-side segments, real peer moat matrix, upstream drivers, and Bull/Base/Panic scenarios
 */
export async function enrichPipelineBundleWithAi(
  bundle: PipelineDataBundle
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
      recentSecFilings: filings.slice(0, 5),
      baselineMultipleRegimes: baseline.multipleRegimes,
    },
    null,
    2
  );

  console.log(
    `🤖 [AI Gateway Tier 1] Extracting filing & sentiment context for ${ticker} via ${AI_GATEWAY_MODELS.EXTRACTOR}...`
  );

  // Stage 1: Tier 1 Extractor (DeepSeek V4.1 Flash)
  let sentiment: EarningsSentiment = bundle.sentiment;
  let filingEn: FilingExtracts = bundle.filingEn;

  try {
    const stage1Template = {
      sentiment: bundle.sentiment,
      filingEn: bundle.filingEn,
    };

    const { text: stage1Text } = await generateText({
      model: AI_GATEWAY_MODELS.EXTRACTOR,
      maxOutputTokens: 8192,
      system:
        "You are an institutional SEC filing and earnings call auditor. Return ONLY a single valid JSON object matching the exact structure and field types of the provided template. Replace all generic placeholder strings with concrete, company-specific 10-Q/10-K risk disclosures, MD&A findings, and management tone metrics grounded in the financial profile. Do not wrap in markdown code fences.",
      prompt: `Populate this exact JSON template with real, company-specific filing extracts and earnings call sentiment for ${profile.companyName} (${ticker}, ${factsDraft.quarter}).\n\nJSON Template to match:\n${JSON.stringify(stage1Template, null, 2)}\n\nFinancial & Filing Context:\n${compactContext}`,
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

    const stage1 = extractAndParseJson(stage1Text, Stage1ExtractionSchema);
    sentiment = EarningsSentimentSchema.parse({
      ...stage1.sentiment,
      ticker,
      quarter: factsDraft.quarter,
    });
    filingEn = FilingExtractsSchema.parse({
      ...stage1.filingEn,
      ticker,
      quarter: factsDraft.quarter,
    });
  } catch (err) {
    console.warn(
      `⚠️ [AI Gateway Tier 1] Extraction fallback for ${ticker}:`,
      err instanceof Error ? err.message : err
    );
  }

  console.log(
    `🧠 [AI Gateway Stage 2] Synthesizing buy-side moat, real segments & scenarios for ${ticker} via ${AI_GATEWAY_MODELS.EXTRACTOR}...`
  );

  // Stage 2: Buy-Side Synthesizer (DeepSeek V4.1 Flash with thinking disabled -> Fallback GPT-6.1 Sol)
  let enrichedFacts: Facts = factsDraft;
  let enrichedMoatEn: MoatCompetitors = bundle.moatEn;
  let enrichedCatalystsEn: Catalysts = bundle.catalystsEn;
  let enrichedBaseline: FinancialModelBaseline = baseline;
  let enrichedScenariosEn: Scenarios = bundle.scenariosEn;

  try {
    const stage2Template = {
      segments: factsDraft.segments,
      oneTimeItems: factsDraft.oneTimeItems,
      guidanceRevenueLowBillions: factsDraft.guidanceRevenueLowBillions,
      guidanceRevenueHighBillions: factsDraft.guidanceRevenueHighBillions,
      guidanceOperatingIncomeLowBillions:
        factsDraft.guidanceOperatingIncomeLowBillions,
      guidanceOperatingIncomeHighBillions:
        factsDraft.guidanceOperatingIncomeHighBillions,
      governanceRisk: factsDraft.governanceRisk,
      accountingFlags: factsDraft.accountingFlags,
      materialLitigationOrDoj: factsDraft.materialLitigationOrDoj,
      valuationArchetype: factsDraft.valuationArchetype,
      moatEn: bundle.moatEn,
      catalystsEn: bundle.catalystsEn,
      upstreamDrivers: baseline.upstreamDrivers,
      scenariosEn: bundle.scenariosEn,
    };

    const { text: stage2Text } = await generateText({
      model: AI_GATEWAY_MODELS.EXTRACTOR,
      maxOutputTokens: 8192,
      system: `You are a Senior Buy-Side Equity Analyst. Return ONLY a single valid JSON object matching the exact keys and types of the provided template (no markdown fences, no commentary).
Rules:
1. Break down total quarterly revenue ($${factsDraft.revenueBillions}B) into 3-4 of ${ticker}'s actual operating segments (never use "Core Business & Solutions").
2. In moatEn.competitors, list 3-4 real publicly traded competitors with their actual stock tickers (never use "PEER") and realistic metrics.
3. In moatEn.overallMoatRating, choose "Wide", "Narrow", or "None": assign "None" if operating margins are <8% and company lacks strategic scale; assign "Narrow" for moderate competitive advantages, switching costs, or sovereign/strategic foundry scale; reserve "Wide" strictly for durable high-ROIC compounders.
4. Set governanceRisk to "none" and accountingFlags to [] (empty array) unless the company has an active auditor resignation, SEC restatement, or DOJ accounting fraud probe. NEVER put modeling disclaimers or data caveats into accountingFlags.
5. In scenariosEn.scenarios, formulate 3 scenarios ("Bull", "Base", "Panic") whose probabilities sum to 1.0 (e.g. 0.25 Bull, 0.50 Base, 0.25 Panic):
   - Anchor forwardEps and multiple to the provided currentPrice ($${profile.currentPrice}), consensusTarget ($${analystEstimatesEn.priceTargets.average || profile.currentPrice * 1.15}), and baselineMultipleRegimes (${JSON.stringify(baseline.multipleRegimes)}).
   - Explicitly account for sovereign/government backing (such as US CHIPS Act subsidies, defense/national-security strategic floor), sum-of-the-parts tangible asset value, and cyclical mid-cycle earnings recovery so the Base target (forwardEps * multiple) sits within a realistic fundamental band relative to currentPrice ($${profile.currentPrice}) and consensusTarget ($${analystEstimatesEn.priceTargets.average || profile.currentPrice * 1.15}), and the Panic target reflects a realistic downside support floor rather than an artificial collapse.`,
      prompt: `Synthesize the buy-side analysis JSON for ${profile.companyName} (${ticker}, ${factsDraft.quarter}).\n\nJSON Template (preserve exact keys & enum types):\n${JSON.stringify(stage2Template, null, 2)}\n\nQuantitative Context:\n${compactContext}\n\nExtracted Filing & Sentiment Context:\n${JSON.stringify({ sentiment, filingEn }, null, 2)}`,
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

    const stage2Raw = sanitizeStage2Raw(
      parseJsonObject(stage2Text),
      factsDraft
    );
    const stage2 = Stage2SynthesisSchema.parse(stage2Raw);
    enrichedFacts = FactsSchema.parse({
      ...factsDraft,
      segments:
        stage2.segments.length > 0 ? stage2.segments : factsDraft.segments,
      oneTimeItems: stage2.oneTimeItems,
      guidanceRevenueLowBillions:
        stage2.guidanceRevenueLowBillions > 0
          ? stage2.guidanceRevenueLowBillions
          : factsDraft.guidanceRevenueLowBillions,
      guidanceRevenueHighBillions:
        stage2.guidanceRevenueHighBillions > 0
          ? stage2.guidanceRevenueHighBillions
          : factsDraft.guidanceRevenueHighBillions,
      guidanceOperatingIncomeLowBillions:
        stage2.guidanceOperatingIncomeLowBillions,
      guidanceOperatingIncomeHighBillions:
        stage2.guidanceOperatingIncomeHighBillions,
      governanceRisk: stage2.governanceRisk,
      accountingFlags: stage2.accountingFlags,
      materialLitigationOrDoj: stage2.materialLitigationOrDoj,
      valuationArchetype: stage2.valuationArchetype,
    });

    enrichedMoatEn = MoatCompetitorsSchema.parse({
      ...stage2.moatEn,
      ticker,
      sources: enrichedFacts.sources,
    });

    enrichedCatalystsEn = CatalystsSchema.parse({
      ...stage2.catalystsEn,
      ticker,
    });

    if (stage2.upstreamDrivers.length >= 2) {
      enrichedBaseline = FinancialModelBaselineSchema.parse({
        ...baseline,
        upstreamDrivers: stage2.upstreamDrivers,
      });
    }

    // Normalize scenario probabilities to sum to 1.0 & anchor forwardEps/multiples to deterministic baseline
    const rawScenarios = stage2.scenariosEn.scenarios;
    const probSum = rawScenarios.reduce((s, c) => s + c.probability, 0) || 1;
    const normalizedScenarios = rawScenarios.map((s, idx) => {
      const detScenario =
        bundle.scenariosEn.scenarios.find(
          (ds) => ds.name.toLowerCase() === s.name.toLowerCase()
        ) || bundle.scenariosEn.scenarios[idx];

      const p = Number((s.probability / probSum).toFixed(2));
      // Cardinal Rule: Keep deterministic EPS & multiple anchors within +/- 15% of deterministic baseline
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
    // Fix rounding residual on Base scenario
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
      ...stage2.scenariosEn,
      ticker,
      currentPrice: profile.currentPrice,
      consensusTarget:
        analystEstimatesEn.priceTargets.average ||
        stage2.scenariosEn.consensusTarget,
      scenarios: normalizedScenarios,
    });
  } catch (err) {
    console.warn(
      `⚠️ [AI Gateway Tier 2] Synthesis fallback for ${ticker}:`,
      err instanceof Error ? err.message : err
    );
  }

  console.log(
    `🌏 [AI Gateway Tier 1] Localizing institutional Chinese artifacts for ${ticker} via ${AI_GATEWAY_MODELS.EXTRACTOR}...`
  );

  // Stage 3: Tier 1 Localizer (DeepSeek V4.1 Flash - thinking disabled)
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
      maxOutputTokens: 8192,
      system:
        "You are an institutional Mandarin Chinese equity research translator. Return ONLY a single valid JSON object matching the exact keys of the provided template (no markdown fences). Translate all English descriptive text fields into professional buy-side Simplified Chinese while keeping every number, percentage, ticker symbol, and enum key (such as 'Wide', 'Narrow', 'None', 'Strong', 'Moderate', 'Weak', 'Bull', 'Base', 'Panic', 'growth', 'risk', 'near-term', 'medium-term', 'long-term', 'Superior', 'Parity', 'Inferior', 'Widening', 'Stable', 'Narrowing', 'High', 'Low') 100% identical to the English input.",
      prompt: `Translate the following equity research modules for ${ticker} into institutional Simplified Chinese matching the exact JSON structure:\n\n${JSON.stringify(
        stage3Template,
        null,
        2
      )}`,
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
      `⚠️ [AI Gateway Tier 1] Localization fallback for ${ticker}:`,
      err instanceof Error ? err.message : err
    );
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
