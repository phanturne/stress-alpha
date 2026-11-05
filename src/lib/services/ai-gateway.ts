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
        pricingPower: ["Superior", "Parity", "Inferior"].includes(
          c?.pricingPower
        )
          ? c.pricingPower
          : "Parity",
      }));
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
 * Executes lean, high-fidelity buy-side intelligence extraction via Vercel AI Gateway:
 * - Single-pass unified synthesis (`deepseek/deepseek-v4.1-flash-1017`, thinking disabled):
 *   Extracts sentiment, Item 1A risk factors, operating segments, real peer moats, and calibrated scenarios in 1 call.
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
      if (bundle.secExcerpts.commitmentsText) {
        secContext += `\n\n--- OFFICIAL 10-Q NOTE: COMMITMENTS AND CONTINGENCIES & GUARANTEES ---\n${bundle.secExcerpts.commitmentsText}`;
      }
      if (bundle.secExcerpts.customerConcentrationText) {
        secContext += `\n\n--- OFFICIAL 10-Q NOTE: CUSTOMER & SEGMENT CONCENTRATIONS ---\n${bundle.secExcerpts.customerConcentrationText}`;
      }
      if (bundle.secExcerpts.mdaAndRisksText) {
        secContext += `\n\n--- OFFICIAL 10-Q MD&A & RISK HIGHLIGHTS ---\n${bundle.secExcerpts.mdaAndRisksText}`;
      }
    }

    const { text: synthesisText } = await generateText({
      model: AI_GATEWAY_MODELS.EXTRACTOR,
      maxOutputTokens: 8192,
      system: `You are a Senior Buy-Side Equity Analyst & Forensic Auditor. Return ONLY a single valid JSON object matching the exact keys and types of the provided template (no markdown code fences, no commentary).
Rules:
1. In sentiment and filingEn, populate concrete, company-specific 10-Q/10-K risk disclosures, MD&A findings, and management tone metrics grounded in the financial context.
2. Break down total quarterly revenue ($${factsDraft.revenueBillions}B) into 3-4 of ${ticker}'s actual operating segments (never use "Core Business & Solutions").
3. In moatEn.competitors, list 3-4 real publicly traded competitors with actual stock tickers (never "PEER") and realistic metrics.
4. In moatEn.overallMoatRating, choose "Wide", "Narrow", or "None" based on durable ROIC > WACC and structural barriers.
5. Set governanceRisk to "none" and accountingFlags to [] unless the company has an active auditor resignation, SEC restatement, or DOJ accounting fraud probe.
6. In scenariosEn.scenarios, formulate 3 scenarios ("Bull", "Base", "Panic") whose probabilities sum to 1.0 (e.g. 0.25 Bull, 0.50 Base, 0.25 Panic), anchoring forwardEps and multiple to currentPrice ($${profile.currentPrice}) and consensusTarget ($${analystEstimatesEn.priceTargets.average || profile.currentPrice}).
7. When official SEC 10-Q / 8-K excerpts are provided:
   a. Populate sentiment.keyQuotes using exact quotes from the CEO and CFO in the 8-K press release / commentary.
   b. If off-balance-sheet commitments and credit guarantees are disclosed, populate them in filingEn.sections under "Note: Commitments and Contingencies" with exact dollar amounts (e.g. supply capacity, shell buildout guarantees) and set purchaseObligationsBillions, totalCommitmentsBillions, and guaranteeExposureBillions.
   c. If customer concentration is disclosed (e.g. one direct customer represented X%, or top 3 represented Y%), record it in customerConcentrationPct and include a section in filingEn.sections for "Note: Customer and Geographic Concentrations".
   d. Set revenueGrowthPct to the reported year-over-year revenue growth rate stated in the 8-K/10-Q.
   e. In catalystsEn and filingEn.newRiskFactors, capture product architecture ramps (e.g. next-gen architectures entering production) and supply chain / execution constraints mentioned in the disclosures.`,
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

    enrichedMoatEn = MoatCompetitorsSchema.parse({
      ...synth.moatEn,
      ticker,
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
        maxOutputTokens: 8192,
        system:
          "You are an institutional Mandarin Chinese equity research translator. Return ONLY a single valid JSON object matching the exact keys of the provided template (no markdown fences). Translate all English descriptive text fields into professional buy-side Simplified Chinese while keeping every number, percentage, ticker symbol, and enum key 100% identical to the English input.",
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
