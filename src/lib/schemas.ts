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

  // Qualitative risk & governance indicators (Scenario Calibration)
  governanceRisk: z.enum(["none", "low", "moderate", "severe"]).optional(),
  accountingFlags: z.array(z.string()).optional(),
  materialLitigationOrDoj: z.boolean().optional(),
  customerConcentrationPct: z.number().min(0).max(100).optional(),
  shortInterestPct: z.number().min(0).max(100).optional(),

  // Valuation Archetype & Capital Runway (Scenario Calibration)
  valuationArchetype: z
    .enum(["compounder", "operating_scaler", "venture_hypergrowth"])
    .optional(),
  grossMarginPct: z.number().min(-100).max(100).optional(),
  cashAndEquivalentsBillions: z.number().nonnegative().optional(),
  shortTermDebtBillions: z.number().nonnegative().optional(),
  quarterlyCashBurnBillions: z.number().nonnegative().optional(),
  cashRunwayMonths: z.number().nonnegative().optional(),
  dilutionShareGrowthYoYPct: z
    .number()
    .optional()
    .describe("Annual share count inflation %"),
});
export type ValuationArchetype =
  "compounder" | "operating_scaler" | "venture_hypergrowth";
export type GovernanceRiskLevel = "none" | "low" | "moderate" | "severe";
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
  capexBillions: z
    .number()
    .nonnegative()
    .optional()
    .describe("Baseline annualized capital expenditures (billions)"),
  dnaBillions: z
    .number()
    .nonnegative()
    .optional()
    .describe("Baseline depreciation & amortization (billions)"),
  fcfConversionRatio: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .describe("FCF / Net Income conversion ratio (e.g. 0.85)"),
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
  freeCashFlowBillions: z
    .number()
    .optional()
    .describe("Stressed free cash flow in billions"),
  stressFreeCashFlowBillions: z
    .number()
    .optional()
    .describe(
      "Alias for freeCashFlowBillions matching stress prefix conventions"
    ),
  fcfConversionPct: z
    .number()
    .optional()
    .describe("FCF conversion percentage relative to Net Income"),
  fcfPerShare: z
    .number()
    .optional()
    .describe("Free cash flow per diluted share"),
  fcfYieldPct: z
    .number()
    .optional()
    .describe("FCF yield percentage relative to current stock price"),
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
  rawProbability: z.number().min(0).max(1).optional(),
  calibratedProbability: z.number().min(0).max(1).optional(),
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

// --- Deterministic Scenario Calibration Audit Schema (formerly QPCE) ---
export const CalibrationStepSchema = z.object({
  pillar: z.enum([
    "prior",
    "governance",
    "moat_margin",
    "consensus_skew",
    "market_implied",
  ]),
  label: z.string(),
  deltaBullLogit: z.number(),
  deltaBaseLogit: z.number(),
  deltaPanicLogit: z.number(),
  rationale: z.string(),
});
export type CalibrationStep = z.infer<typeof CalibrationStepSchema>;

export const CalibrationAuditSchema = z.object({
  rawProbabilities: z.record(z.string(), z.number()),
  calibratedProbabilities: z.record(z.string(), z.number()),
  marketImpliedPanicProb: z.number().optional(),
  governanceVetoTriggered: z.boolean().default(false),
  skewDirection: z.enum(["bull_skewed", "balanced", "panic_skewed"]),
  archetypeUsed: z
    .enum(["compounder", "operating_scaler", "venture_hypergrowth"])
    .optional(),
  netRunwayMonths: z.number().optional(),
  steps: z.array(CalibrationStepSchema).default([]),
});
export type CalibrationAudit = z.infer<typeof CalibrationAuditSchema>;

// --- Sanity & Variant Perception Audit Schema ---
export const SanitySeveritySchema = z.enum(["critical", "warning", "info"]);
export type SanitySeverity = z.infer<typeof SanitySeveritySchema>;

export const DivergenceClassificationSchema = z.enum([
  "in_line",
  "moderate_alpha",
  "high_conviction_alpha",
  "extreme_divergence",
]);
export type DivergenceClassification = z.infer<
  typeof DivergenceClassificationSchema
>;

export const SanityIssueSchema = z.object({
  severity: SanitySeveritySchema,
  code: z.string(),
  field: z.string().optional(),
  message: z.string(),
});
export type SanityIssue = z.infer<typeof SanityIssueSchema>;

export const ConsensusAttributionSchema = z.object({
  consensusTarget: z.number(),
  weightedFairValue: z.number(),
  divergencePct: z.number(),
  divergenceClassification: DivergenceClassificationSchema,
  multipleDeltaPct: z.number().optional(),
  earningsDeltaPct: z.number().optional(),
  regimeStressHaircutPct: z.number().optional(),
  baseFairValue: z.number().optional(),
  rationaleComment: z.string(),
});
export type ConsensusAttribution = z.infer<typeof ConsensusAttributionSchema>;

export const SanityAuditSchema = z.object({
  passed: z.boolean(),
  status: z.enum(["pass", "warn", "fail"]),
  dataCompletenessScore: z.number(),
  populatedModulesCount: z.number(),
  totalModulesCount: z.number(),
  missingModules: z.array(z.string()),
  issues: z.array(SanityIssueSchema),
  consensusAttribution: ConsensusAttributionSchema.optional(),
  summary: z.string(),
});
export type SanityAudit = z.infer<typeof SanityAuditSchema>;

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
  calibrationAudit: CalibrationAuditSchema.optional(),
  sanityAudit: SanityAuditSchema.optional(),
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

// --- Stage 5: Market Events & News Pipeline ---
export const MarketEventTypeSchema = z.enum([
  "upstream_earnings",
  "product_release",
  "analyst_rating",
  "sec_filing",
  "general_catalyst",
]);
export type MarketEventType = z.infer<typeof MarketEventTypeSchema>;

export const TransmissionTypeSchema = z.enum([
  "driver_shock",
  "catalyst_prob",
  "qpce_skew",
  "segment_growth",
  "none",
]);
export type TransmissionType = z.infer<typeof TransmissionTypeSchema>;

export const TransmissionPayloadSchema = z.object({
  driverId: z.string().optional(),
  deltaShockPct: z.number().optional(),
  catalystId: z.string().optional(),
  newProbability: z.number().min(0).max(1).optional(),
  analystAction: z
    .object({
      firm: z.string(),
      action: z
        .enum([
          "Upgraded",
          "Downgraded",
          "TargetRaised",
          "TargetLowered",
          "Initiated",
          "Reiterated",
        ])
        .or(z.string()),
      priorTarget: z.number().optional().nullable(),
      newTarget: z.number(),
    })
    .optional(),
  segmentName: z.string().optional(),
  segmentDeltaGrowthPct: z.number().optional(),
  grossMarginBpsDelta: z.number().optional(),
  rationale: z.string().optional(),
});
export type TransmissionPayload = z.infer<typeof TransmissionPayloadSchema>;

export const MarketEventSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  title: z.string(),
  summary: z.string(),
  sourceUrl: z.string().optional().nullable(),
  publisher: z.string(),
  publishedAt: z.string().describe("ISO date string"),
  eventType: MarketEventTypeSchema,
  priceMovePct: z.number().optional().nullable(),
  abnormalReturnSigma: z.number().optional().nullable(),
  transmissionType: TransmissionTypeSchema.default("none"),
  transmissionPayload: TransmissionPayloadSchema.optional().nullable(),
  impliedWfvImpactPct: z.number().optional().nullable(),
  sources: z.array(SourceSchema).optional().default([]),
});
export type MarketEvent = z.infer<typeof MarketEventSchema>;

export const MarketEventsSchema = z.object({
  ticker: z.string(),
  events: z.array(MarketEventSchema),
});
export type MarketEvents = z.infer<typeof MarketEventsSchema>;

export const UpstreamDependencySchema = z.object({
  id: z.string().optional(),
  sourceTicker: z.string().describe("Upstream ticker e.g. TSM"),
  targetTicker: z.string().describe("Downstream ticker e.g. NVDA"),
  driverId: z.string().describe("Driver ID matching upstreamDrivers"),
  driverName: z.string().optional().nullable(),
  exposureShare: z.number().min(0).max(1),
  elasticity: z.number(),
  notes: z.string().optional().nullable(),
  createdAt: z.string().or(z.date()).optional(),
});
export type UpstreamDependency = z.infer<typeof UpstreamDependencySchema>;

export const UpstreamDependenciesListSchema = z.object({
  targetTicker: z.string(),
  dependencies: z.array(UpstreamDependencySchema),
});
export type UpstreamDependenciesList = z.infer<
  typeof UpstreamDependenciesListSchema
>;

// --- Stage 6: Fair Value Revision History & Valuation Ledger ---
export const ValuationRevisionStateDiffSchema = z.object({
  priorRegimes: z.object({
    bull: z.number(),
    base: z.number(),
    panic: z.number(),
  }),
  newRegimes: z.object({
    bull: z.number(),
    base: z.number(),
    panic: z.number(),
  }),
  priorProbabilities: z
    .object({
      bull: z.number(),
      base: z.number(),
      panic: z.number(),
    })
    .optional(),
  newProbabilities: z
    .object({
      bull: z.number(),
      base: z.number(),
      panic: z.number(),
    })
    .optional(),
  driverShocksApplied: z.record(z.string(), z.number()).optional(),
  grossMarginBpsDelta: z.number().optional(),
  fixedOpexShiftPct: z.number().optional(),
});
export type ValuationRevisionStateDiff = z.infer<
  typeof ValuationRevisionStateDiffSchema
>;

export const ValuationRevisionSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  revisionDate: z.string().or(z.date()),
  triggerType: z.string(), // 'quarterly_filing' | 'peer_earnings_shock' | 'sec_8k' | 'consensus_wave' | 'catalyst_activation'
  triggerEventId: z.string().optional().nullable(),
  headline: z.string(),
  rationale: z.string(),
  priorWfv: z.number().or(z.string().transform((v) => Number(v))),
  newWfv: z.number().or(z.string().transform((v) => Number(v))),
  wfvDeltaPct: z.number().or(z.string().transform((v) => Number(v))),
  fullStateDiff: ValuationRevisionStateDiffSchema,
  createdAt: z.string().or(z.date()).optional(),
});
export type ValuationRevision = z.infer<typeof ValuationRevisionSchema>;

// Convenience type aliases for UI modules
export type Moat = MoatCompetitors;
export type Estimates = AnalystEstimates;
export type Filing = FilingExtracts;
export type Sentiment = EarningsSentiment;

export const ValuationRevisionsListSchema = z.object({
  ticker: z.string(),
  revisions: z.array(ValuationRevisionSchema),
});
export type ValuationRevisionsList = z.infer<
  typeof ValuationRevisionsListSchema
>;

export const TechnicalLevelItemSchema = z.object({
  id: z.string(), // "sma50" | "sma200" | "high52" | "low52" | "pivot_p" | "pivot_s1" | "pivot_r1" | "pivot_s2" | "pivot_r2" | "pivot_s3" | "pivot_r3" | "gap_fill" | "gap_boundary" | "volume_poc" | "avwap_high" | "avwap_volume" | "swing_high" | "swing_low"
  label: z.string(), // e.g. "200-Day SMA", "52-Week High"
  price: z.number(),
  deltaPct: z.number(), // percentage from current price
  type: z.enum(["support", "resistance", "pivot"]),
  importance: z.enum(["major", "intermediate", "minor"]),
  zoneRange: z.tuple([z.number(), z.number()]).optional(),
  clusterCount: z.number().optional(),
});
export type TechnicalLevelItem = z.infer<typeof TechnicalLevelItemSchema>;

export interface PriceCorridorTier {
  id: string; // "s1" | "s2" | "s3" | "r1" | "r2" | "r3"
  tierNumber: 1 | 2 | 3;
  type: "support" | "resistance";
  tierTitle: string; // e.g. "Immediate Shelf", "Cycle Bedrock Floor", "Measured Breakdown"
  range: [number, number]; // [min, max]
  anchorPrice: number; // primary midpoint/anchor
  deltaPct: number; // percentage from current price
  rationale: string; // concise institutional rationale
}

export interface InstitutionalCorridors {
  supports: PriceCorridorTier[];
  resistances: PriceCorridorTier[];
}

export const TechnicalLevelsPayloadSchema = z.object({
  asOf: z.string(), // ISO date string
  currentPrice: z.number(),
  sma50: z.number().optional(),
  sma200: z.number().optional(),
  high52: z.number().optional(),
  low52: z.number().optional(),
  pivotP: z.number().optional(),
  support1: z.number().optional(),
  resistance1: z.number().optional(),
  support2: z.number().optional(),
  resistance2: z.number().optional(),
  support3: z.number().optional(),
  resistance3: z.number().optional(),
  volumePoc: z.number().optional(),
  avwap52High: z.number().optional(),
  avwapMaxVolume: z.number().optional(),
  gapFillTarget: z.number().optional(),
  gapDayBoundary: z.number().optional(),
  levels: z.array(TechnicalLevelItemSchema),
});
export type TechnicalLevelsPayload = z.infer<
  typeof TechnicalLevelsPayloadSchema
>;

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
  events?: MarketEvents;
  eventsZh?: MarketEvents;
  factsZh?: Facts;
  catalystsZh?: Catalysts;
  scenariosZh?: Scenarios;
  sentimentZh?: EarningsSentiment;
  filingZh?: FilingExtracts;
  reactionsZh?: Reactions;
  reportMarkdown?: string;
  reportMarkdownZh?: string;
  technicalLevels?: TechnicalLevelsPayload;
}
