import { z } from "zod";

// --- Shared ---
export const SourceSchema = z.object({
  url: z.string().optional(),
  title: z.string().optional(),
  date: z.string().describe("ISO date or YYYY-MM-DD").optional(),
  publisher: z.string().optional(),
});
export type Source = z.infer<typeof SourceSchema>;

// --- Stage 1: Facts ---
export const OneTimeItemSchema = z.object({
  description: z.string(),
  amountBillions: z.number(),
  isOperating: z.boolean(),
  note: z.string().optional(),
});
export type OneTimeItem = z.infer<typeof OneTimeItemSchema>;

export const SegmentSchema = z.object({
  name: z.string(),
  revenueBillions: z.number(),
  growthPct: z.number().describe("YoY growth as a percentage, e.g. 36.7"),
  operatingIncomeBillions: z.number().optional(),
  operatingMarginPct: z.number().optional(),
});
export type Segment = z.infer<typeof SegmentSchema>;

export const FactsSchema = z.object({
  ticker: z.string(),
  company: z.string(),
  quarter: z.string().describe("e.g. Q2 2026"),
  reportDate: z.string(),

  // Top-line
  revenueBillions: z.number(),
  revenueGrowthPct: z.number(),
  revenueEstimateBillions: z.number().optional(),

  // Operating
  operatingIncomeBillions: z.number(),
  operatingMarginPct: z.number(),
  operatingIncomeGrowthPct: z.number().optional(),

  // Per-share
  epsReported: z.number(),
  epsConsensus: z.number().optional().default(0),
  epsOperating: z.number().describe("EPS excluding one-time items"),

  // Segments
  segments: z.array(SegmentSchema).min(1),

  // One-time items (the income-quality guard)
  oneTimeItems: z.array(OneTimeItemSchema).default([]),

  // Forward
  guidanceOperatingIncomeLowBillions: z.number().optional(),
  guidanceOperatingIncomeHighBillions: z.number().optional(),
  guidanceRevenueLowBillions: z.number().optional(),
  guidanceRevenueHighBillions: z.number().optional(),

  // Market context
  currentPrice: z.number(),
  marketCapBillions: z.number().optional().default(0),
  trailingEps: z.number().optional().default(0),
  forwardEpsConsensus: z
    .number()
    .describe("Next FY consensus EPS")
    .optional()
    .default(0),

  // Metadata
  sources: z.array(SourceSchema).optional().default([]),
  analysisDate: z.string().optional(),
});
export type Facts = z.infer<typeof FactsSchema>;

// --- Stage 2: Catalysts ---
export const CatalystEvidenceSchema = z.object({
  fact: z.string(),
  source: SourceSchema.optional(),
});
export type CatalystEvidence = z.infer<typeof CatalystEvidenceSchema>;

export const CatalystSchema = z.object({
  id: z.string().describe("Short slug, e.g. aws-growth-sustains"),
  title: z.string(),
  direction: z.enum(["growth", "risk"]),
  probability: z.number().min(0).max(1),
  probabilityAnchor: z.string().describe("Evidence justifying the probability"),
  horizon: z.enum(["near-term", "medium-term", "long-term"]).or(z.string()),
  description: z.string(),
  evidence: z.array(CatalystEvidenceSchema).optional().default([]),
});
export type Catalyst = z.infer<typeof CatalystSchema>;

export const CatalystsSchema = z.object({
  ticker: z.string(),
  catalysts: z.array(CatalystSchema),
});
export type Catalysts = z.infer<typeof CatalystsSchema>;

// --- StressAlpha Flow-Through & Stress-Testing Models ---
export const UpstreamDriverSchema = z.object({
  id: z.string().describe("Unique identifier e.g. hyperscaler-capex"),
  name: z
    .string()
    .describe("Readable name e.g. Hyperscaler Cloud CapEx Growth"),
  exposureShare: z
    .number()
    .min(0)
    .max(1)
    .describe("Share of revenue exposed to this driver"),
  elasticity: z.number().describe("Demand elasticity multiplier, e.g. 0.85"),
  defaultShockPct: z
    .number()
    .default(0)
    .describe("Baseline shock pct (0 for unperturbed)"),
  minShockPct: z.number().default(-50),
  maxShockPct: z.number().default(50),
});
export type UpstreamDriver = z.infer<typeof UpstreamDriverSchema>;

export const MultipleRegimesSchema = z.object({
  bull: z.number().positive(),
  base: z.number().positive(),
  panic: z.number().positive(),
});
export type MultipleRegimes = z.infer<typeof MultipleRegimesSchema>;

export const FinancialModelBaselineSchema = z.object({
  baseRevenueBillions: z.number().positive(),
  baseGrossMarginPct: z.number().min(0).max(100),
  fixedOpexBillions: z.number().nonnegative(),
  taxRatePct: z.number().min(0).max(100).default(16.5),
  dilutedSharesBillions: z.number().positive(),
  multipleRegimes: MultipleRegimesSchema,
  upstreamDrivers: z.array(UpstreamDriverSchema).default([]),
});
export type FinancialModelBaseline = z.infer<
  typeof FinancialModelBaselineSchema
>;

export const ValuationBandSchema = z.object({
  regime: z.enum(["bull", "base", "panic"]),
  label: z.string(),
  multiple: z.number(),
  targetPrice: z.number(),
  deltaFromCurrentPct: z.number(),
});
export type ValuationBand = z.infer<typeof ValuationBandSchema>;

export const StressAsymmetrySchema = z.object({
  downsideToBasePct: z.number(),
  downsideToPanicPct: z.number(),
  upsideToBullPct: z.number(),
  marketPricedInMultiple: z.number(),
  riskRewardRatio: z.number(),
});
export type StressAsymmetry = z.infer<typeof StressAsymmetrySchema>;

export const StressResultSchema = z.object({
  stressRevenueBillions: z.number(),
  stressGrossProfitBillions: z.number(),
  stressOperatingIncomeBillions: z.number(),
  stressNetIncomeBillions: z.number(),
  stressEps: z.number(),
  valuationBands: z.object({
    bull: ValuationBandSchema,
    base: ValuationBandSchema,
    panic: ValuationBandSchema,
  }),
  asymmetry: StressAsymmetrySchema,
  driverShocksApplied: z.record(z.number()),
  grossMarginBpsDeltaApplied: z.number(),
  fixedOpexShiftPctApplied: z.number(),
});
export type StressResult = z.infer<typeof StressResultSchema>;

// --- Stage 3: Scenarios ---
export const ScenarioSchema = z.object({
  name: z.string().describe("e.g. Bull, Base, Bear"),
  probability: z.number().min(0).max(1),
  forwardEps: z.number().describe("Estimated EPS for basis year"),
  multiple: z.number().describe("P/E multiple applied"),
  assumptions: z.array(z.string()).default([]),
  keyDrivers: z.array(z.string()).default([]),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

export const ScenariosSchema = z.object({
  ticker: z.string(),
  basisYear: z.string().describe("e.g. FY2027"),
  currentPrice: z.number(),
  consensusTarget: z.number().optional().default(0),
  baseline: FinancialModelBaselineSchema.optional(),
  scenarios: z.array(ScenarioSchema).min(1),
});
export type Scenarios = z.infer<typeof ScenariosSchema>;

// --- Stage 4: Reactions (optional) ---
export const ReactionEventSchema = z.object({
  date: z.string(),
  event: z.string(),
  priceMovePct: z.number(),
  context: z.string(),
  source: SourceSchema.optional(),
});
export type ReactionEvent = z.infer<typeof ReactionEventSchema>;

export const ReactionsSchema = z.object({
  ticker: z.string(),
  events: z.array(ReactionEventSchema).default([]),
  conditionalFraming: z
    .string()
    .optional()
    .describe(
      "Summary of what conditions historically produce positive/negative reactions"
    ),
});
export type Reactions = z.infer<typeof ReactionsSchema>;

// --- Earnings Sentiment ---
export const KeyQuoteSchema = z.object({
  quote: z.string(),
  speaker: z.string(),
  context: z.string(),
  sentiment: z.enum(["bullish", "neutral", "bearish"]).or(z.string()),
});
export type KeyQuote = z.infer<typeof KeyQuoteSchema>;

export const AnalystConcernTopicSchema = z.object({
  topic: z.string(),
  frequency: z.number(),
  managementResponse: z.string(),
});
export type AnalystConcernTopic = z.infer<typeof AnalystConcernTopicSchema>;

export const EarningsSentimentSchema = z.object({
  ticker: z.string().optional(),
  quarter: z.string().optional(),
  managementTone: z
    .object({
      overallConfidence: z.number(),
      specificity: z.number(),
      forwardConfidence: z.number(),
      capexJustification: z.number(),
      competitivePositioning: z.number(),
      riskAcknowledgment: z.number(),
      evidenceNotes: z.string().optional(),
    })
    .optional(),
  analystConcerns: z
    .object({
      topTopics: z.array(AnalystConcernTopicSchema).optional().default([]),
    })
    .optional(),
  keyQuotes: z.array(KeyQuoteSchema).optional().default([]),
});
export type EarningsSentiment = z.infer<typeof EarningsSentimentSchema>;

// --- Filing Extracts ---
export const NewRiskFactorSchema = z.object({
  risk: z.string(),
  severity: z.string(),
  priorLanguage: z.string().optional(),
});
export type NewRiskFactor = z.infer<typeof NewRiskFactorSchema>;

export const FilingSectionSchema = z.object({
  section: z.string(),
  keyFindings: z.array(
    z.object({
      finding: z.string(),
      implication: z.string().optional(),
      novelty: z.string().optional(),
    })
  ),
});
export type FilingSection = z.infer<typeof FilingSectionSchema>;

export const FilingExtractsSchema = z.object({
  ticker: z.string().optional(),
  quarter: z.string().optional(),
  newRiskFactors: z.array(NewRiskFactorSchema).optional().default([]),
  sections: z.array(FilingSectionSchema).optional().default([]),
});
export type FilingExtracts = z.infer<typeof FilingExtractsSchema>;

// --- Stage 1b: Economic Moat & Competitor Benchmarking ---
export const MoatSourceSchema = z.object({
  source: z.enum([
    "Intangible Assets",
    "Switching Costs",
    "Cost Advantage",
    "Network Effects",
    "Efficient Scale",
  ]),
  strength: z.enum(["Strong", "Moderate", "Weak", "None"]),
  description: z.string(),
  durabilityYears: z
    .number()
    .describe("Estimated years of sustainable advantage"),
});
export type MoatSource = z.infer<typeof MoatSourceSchema>;

export const CompetitorComparisonSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  marketCapBillions: z.number(),
  revenueBillions: z.number(),
  revenueGrowthPct: z.number().optional(),
  grossMarginPct: z.number(),
  operatingMarginPct: z.number(),
  forwardPe: z.number().optional(),
  marketSharePct: z.number().optional(),
  productComparison: z.string(),
  pricingPower: z.enum(["Superior", "Parity", "Inferior"]).or(z.string()),
  keyAdvantageOrVulnerability: z.string(),
});
export type CompetitorComparison = z.infer<typeof CompetitorComparisonSchema>;

export const MoatCompetitorsSchema = z.object({
  ticker: z.string(),
  overallMoatRating: z.enum(["Wide", "Narrow", "None"]),
  moatTrend: z.enum(["Widening", "Stable", "Narrowing"]),
  moatSources: z.array(MoatSourceSchema).min(1),
  competitors: z.array(CompetitorComparisonSchema).default([]),
  competitiveDynamicsSummary: z.string(),
  sources: z.array(SourceSchema).optional().default([]),
});
export type MoatCompetitors = z.infer<typeof MoatCompetitorsSchema>;

// --- Valuation Output ---
export const ScenarioResultSchema = z.object({
  name: z.string(),
  probability: z.number(),
  fairValue: z.number(),
  upsideFromCurrent: z.number(),
});
export type ScenarioResult = z.infer<typeof ScenarioResultSchema>;

export const SensitivityEntrySchema = z.object({
  scenario: z.string(),
  parameter: z.string(),
  baseValue: z.number(),
  altValue: z.number(),
  fairValueDelta: z.number(),
});
export type SensitivityEntry = z.infer<typeof SensitivityEntrySchema>;

export const ValuationSchema = z.object({
  ticker: z.string(),
  analysisDate: z.string().optional(),
  currentPrice: z.number(),
  weightedFairValue: z.number(),
  upsidePct: z.number(),
  scenarioResults: z.array(ScenarioResultSchema),
  sensitivity: z.array(SensitivityEntrySchema).default([]),
  consensusTarget: z.number(),
  verdictVsConsensus: z.string(),
  baseline: FinancialModelBaselineSchema.optional(),
  stressTest: StressResultSchema.optional(),
});
export type Valuation = z.infer<typeof ValuationSchema>;

// --- Stage 1c: Wall Street Analyst Estimates & Consensus (Perplexity Finance style) ---
export const AnalystEstimateEntrySchema = z.object({
  firm: z
    .string()
    .describe("Brokerage / Investment bank name e.g. Rosenblatt, JP Morgan"),
  analyst: z
    .string()
    .optional()
    .nullable()
    .describe("Lead analyst name e.g. Kevin Cassidy, Harlan Sur"),
  rating: z
    .enum([
      "Strong Buy",
      "Buy",
      "Outperform",
      "Overweight",
      "Hold",
      "Neutral",
      "Equal-weight",
      "Underperform",
      "Underweight",
      "Sell",
    ])
    .or(z.string()),
  priceTarget: z.number().positive(),
  priorPriceTarget: z.number().positive().optional().nullable(),
  upsidePct: z.number(),
  date: z.string().describe("Rating date YYYY-MM-DD or MM/DD/YYYY"),
  action: z
    .enum([
      "Reiterated",
      "Raised",
      "Lowered",
      "Initiated",
      "Downgraded",
      "Upgraded",
    ])
    .or(z.string())
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
});
export type AnalystEstimateEntry = z.infer<typeof AnalystEstimateEntrySchema>;

export const AnalystConsensusBreakdownSchema = z.object({
  consensus: z.string().describe("e.g. Strong Buy, Moderate Buy, Hold"),
  totalAnalysts: z.number().nonnegative(),
  bullishCount: z.number().nonnegative(),
  bullishPct: z.number().min(0).max(100),
  neutralCount: z.number().nonnegative(),
  neutralPct: z.number().min(0).max(100),
  bearishCount: z.number().nonnegative(),
  bearishPct: z.number().min(0).max(100),
});
export type AnalystConsensusBreakdown = z.infer<
  typeof AnalystConsensusBreakdownSchema
>;

export const AnalystPriceTargetsRangeSchema = z.object({
  currentPrice: z.number().positive(),
  low: z.number().positive(),
  average: z.number().positive(),
  median: z.number().positive().optional(),
  high: z.number().positive(),
  currency: z.string().default("USD"),
});
export type AnalystPriceTargetsRange = z.infer<
  typeof AnalystPriceTargetsRangeSchema
>;

export const AnalystEstimatesSchema = z.object({
  ticker: z.string(),
  asOfDate: z.string().optional(),
  consensus: AnalystConsensusBreakdownSchema,
  priceTargets: AnalystPriceTargetsRangeSchema,
  synthesisNarrative: z
    .string()
    .describe(
      "Comprehensive synthesis of Wall Street sentiment, target dispersion, and post-earnings revision wave"
    ),
  estimates: z.array(AnalystEstimateEntrySchema).default([]),
  sources: z.array(SourceSchema).optional().default([]),
});
export type AnalystEstimates = z.infer<typeof AnalystEstimatesSchema>;

// --- Full Dataset Loaded in UI ---
export interface ReportData {
  folderSlug: string;
  folderName: string;
  facts: Facts;
  catalysts?: Catalysts;
  scenarios: Scenarios;
  valuation?: Valuation;
  reactions?: Reactions;
  sentiment?: EarningsSentiment;
  filing?: FilingExtracts;
  baseline?: FinancialModelBaseline;
  moat?: MoatCompetitors;
  moatZh?: MoatCompetitors;
  estimates?: AnalystEstimates;
  estimatesZh?: AnalystEstimates;
  factsZh?: Facts;
  catalystsZh?: Catalysts;
  scenariosZh?: Scenarios;
  sentimentZh?: EarningsSentiment;
  filingZh?: FilingExtracts;
  reactionsZh?: Reactions;
  reportMarkdown?: string;
  reportMarkdownZh?: string;
}
