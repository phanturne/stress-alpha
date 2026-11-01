import {
  type Facts,
  type AnalystEstimates,
  type FinancialModelBaseline,
  type Scenarios,
  type Catalysts,
  type MoatCompetitors,
  type EarningsSentiment,
  type FilingExtracts,
  FactsSchema,
  FinancialModelBaselineSchema,
  ScenariosSchema,
  CatalystsSchema,
  MoatCompetitorsSchema,
  EarningsSentimentSchema,
  FilingExtractsSchema,
} from "@/lib/schemas";
import type { FinancialProfile, CalendarActualsOverride } from "./types";
import { round2 } from "./utils";

// --- Pre-Populate Facts Draft ---

export function generateFactsDraft(
  profile: FinancialProfile,
  estimates: AnalystEstimates,
  quarterStr?: string,
  calendarActuals?: CalendarActualsOverride
): Facts {
  const latestStmt = profile.quarterlyStatements[0];
  const priorYearStmt = profile.quarterlyStatements[4]; // 4 quarters ago for YoY

  const normalizeBillions = (val?: number | null): number | undefined => {
    if (val == null || !Number.isFinite(val) || val <= 0) return undefined;
    return val > 1000 ? round2(val / 1e9) : round2(val);
  };

  const calRevBillions = normalizeBillions(calendarActuals?.revenueActual);
  const calRevEstBillions = normalizeBillions(calendarActuals?.revenueEstimate);

  const revenueBillions =
    calRevBillions ?? (latestStmt?.revenueBillions || 10.0);
  let revenueGrowthPct = 15.0;
  if (priorYearStmt && priorYearStmt.revenueBillions > 0) {
    revenueGrowthPct = round2(
      ((revenueBillions - priorYearStmt.revenueBillions) /
        priorYearStmt.revenueBillions) *
        100
    );
  } else if (calRevBillions && latestStmt && latestStmt.revenueBillions > 0) {
    revenueGrowthPct = round2(
      ((calRevBillions - latestStmt.revenueBillions) /
        latestStmt.revenueBillions) *
        100
    );
  }

  const operatingMarginPct =
    latestStmt && latestStmt.revenueBillions > 0
      ? round2(
          (latestStmt.operatingIncomeBillions / latestStmt.revenueBillions) *
            100
        )
      : 25.0;

  const operatingIncomeBillions = calRevBillions
    ? round2(revenueBillions * (operatingMarginPct / 100))
    : latestStmt?.operatingIncomeBillions || 2.5;

  const grossMarginPct =
    latestStmt?.grossProfitBillions && latestStmt.revenueBillions > 0
      ? round2(
          (latestStmt.grossProfitBillions / latestStmt.revenueBillions) * 100
        )
      : 55.0;

  const epsReported =
    calendarActuals?.epsActual != null &&
    Number.isFinite(calendarActuals.epsActual)
      ? round2(calendarActuals.epsActual)
      : (latestStmt?.dilutedEps ?? 1.25);

  const epsConsensus =
    calendarActuals?.epsEstimate != null &&
    Number.isFinite(calendarActuals.epsEstimate)
      ? round2(calendarActuals.epsEstimate)
      : round2(epsReported * 0.97);

  const epsOperating = epsReported; // Default clean operating EPS

  // Determine Valuation Archetype
  let valuationArchetype: Facts["valuationArchetype"] = "compounder";
  if (
    (revenueGrowthPct >= 35 && operatingMarginPct < 8) ||
    operatingMarginPct < 0
  ) {
    valuationArchetype = "venture_hypergrowth";
  } else if (revenueGrowthPct >= 18 && grossMarginPct >= 48) {
    valuationArchetype = "operating_scaler";
  }

  const cashAndEquivalentsBillions =
    profile.balanceSheet.totalCashBillions || 5.0;
  const shortTermDebtBillions =
    profile.balanceSheet.shortTermDebtBillions || 0.0;

  const quarterlyCashBurn =
    profile.cashFlow.operatingCashFlowBillions < 0
      ? round2(Math.abs(profile.cashFlow.operatingCashFlowBillions))
      : 0.0;

  const cashRunwayMonths =
    quarterlyCashBurn > 0
      ? round2(
          (cashAndEquivalentsBillions - shortTermDebtBillions) /
            (quarterlyCashBurn / 3)
        )
      : 999.0;

  const derivedQuarter =
    quarterStr ||
    (latestStmt?.fiscalPeriod && latestStmt?.fiscalYear
      ? `${latestStmt.fiscalPeriod} ${latestStmt.fiscalYear}`
      : `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`);

  let reportDate = calendarActuals?.date || latestStmt?.date;
  if (!reportDate || !/^\d{4}-\d{2}-\d{2}/.test(reportDate)) {
    reportDate = new Date().toISOString().split("T")[0];
  }

  // Propagate earnings-day beat/miss surprise into forward EPS consensus
  let rawForwardEps =
    profile.forwardEpsConsensus ||
    round2((profile.trailingEps || epsReported * 4) * 1.15);
  if (
    calendarActuals?.epsActual != null &&
    calendarActuals?.epsEstimate != null &&
    Number.isFinite(calendarActuals.epsActual) &&
    Number.isFinite(calendarActuals.epsEstimate)
  ) {
    if (calendarActuals.epsEstimate > 0) {
      const surpriseRatio = Math.max(
        0.55,
        Math.min(1.25, calendarActuals.epsActual / calendarActuals.epsEstimate)
      );
      rawForwardEps = round2(rawForwardEps * surpriseRatio);
    } else if (calendarActuals.epsActual < calendarActuals.epsEstimate) {
      rawForwardEps = round2(rawForwardEps * 0.75);
    }
  }

  const draft: Facts = {
    ticker: profile.ticker,
    company: profile.companyName,
    quarter: derivedQuarter,
    reportDate,
    revenueBillions,
    revenueGrowthPct,
    revenueEstimateBillions:
      calRevEstBillions ?? round2(revenueBillions * 0.98),
    operatingIncomeBillions,
    operatingMarginPct,
    operatingIncomeGrowthPct: round2(revenueGrowthPct * 1.1),
    epsReported,
    epsConsensus,
    epsOperating,
    segments: [
      {
        name: "Core Business & Solutions",
        revenueBillions,
        growthPct: revenueGrowthPct,
        operatingIncomeBillions,
        operatingMarginPct,
      },
    ],
    oneTimeItems: [],
    guidanceRevenueLowBillions: round2(revenueBillions * 1.02),
    guidanceRevenueHighBillions: round2(revenueBillions * 1.05),
    guidanceOperatingIncomeLowBillions: round2(operatingIncomeBillions * 1.02),
    guidanceOperatingIncomeHighBillions: round2(operatingIncomeBillions * 1.06),
    currentPrice: profile.currentPrice,
    marketCapBillions: profile.marketCapBillions,
    trailingEps: profile.trailingEps || round2(epsReported * 4),
    forwardEpsConsensus: rawForwardEps,
    valuationArchetype,
    grossMarginPct,
    cashAndEquivalentsBillions,
    shortTermDebtBillions,
    quarterlyCashBurnBillions: quarterlyCashBurn,
    cashRunwayMonths,
    governanceRisk: "none",
    accountingFlags: [],
    materialLitigationOrDoj: false,
    customerConcentrationPct: 5.0,
    shortInterestPct: 1.2,
    sources: [
      {
        title: `${profile.ticker} SEC EDGAR Filings & Financial Statements`,
        publisher: profile.dataSource,
        url: `https://www.sec.gov/edgar/searchedgar/companysearch`,
        date: reportDate,
      },
    ],
  };

  return FactsSchema.parse(draft);
}

// --- Scaffolding Generators for Complete 8-Module Dataset ---

export function generateFactsZh(factsEn: Facts): Facts {
  const zhDraft: Facts = {
    ...factsEn,
    sources: factsEn.sources.map((s) => ({
      ...s,
      title: `${factsEn.ticker} SEC 财务报告数据源`,
      publisher: s.publisher?.includes("Massive")
        ? "Massive.com (Polygon.io) SEC 财务报表 API"
        : s.publisher,
    })),
  };
  return FactsSchema.parse(zhDraft);
}

export function generateBaselineDraft(
  facts: Facts,
  profile: FinancialProfile
): FinancialModelBaseline {
  const baseRevenue = round2(Math.max(facts.revenueBillions * 4, 0.1));
  const baseGrossMargin = round2(
    facts.grossMarginPct && facts.grossMarginPct > 0
      ? facts.grossMarginPct
      : 45.0
  );
  const annualizedGrossProfit = baseRevenue * (baseGrossMargin / 100);
  const annualizedOpIncome = facts.operatingIncomeBillions * 4;
  const impliedOpex = annualizedGrossProfit - annualizedOpIncome;
  const fixedOpex = round2(
    impliedOpex > 0
      ? Math.max(impliedOpex * 0.7, 0.05)
      : Math.max(baseRevenue * 0.25, 0.05)
  );

  let bullMult = 35.0;
  let baseMult = 25.0;
  let panicMult = 15.0;

  // Defensive Guardrail: Relax lower bound to 1.5x to preserve legitimate low-multiple
  // compounders (e.g. debt-heavy cable/utilities/telecom) rather than forcing arbitrary 26x multiples
  if (
    profile.forwardPE &&
    profile.forwardPE >= 1.5 &&
    profile.forwardPE < 150
  ) {
    baseMult = round2(profile.forwardPE);
    bullMult = round2(profile.forwardPE * 1.35);
    panicMult = round2(Math.max(profile.forwardPE * 0.55, 1.0));
  } else if (
    profile.trailingPE &&
    profile.trailingPE >= 1.5 &&
    profile.trailingPE < 150
  ) {
    baseMult = round2(profile.trailingPE);
    bullMult = round2(profile.trailingPE * 1.35);
    panicMult = round2(Math.max(profile.trailingPE * 0.55, 1.0));
  } else if (facts.valuationArchetype === "venture_hypergrowth") {
    baseMult = 55.0;
    bullMult = 75.0;
    panicMult = 25.0;
  } else if (facts.valuationArchetype === "operating_scaler") {
    baseMult = 35.0;
    bullMult = 48.0;
    panicMult = 20.0;
  } else {
    baseMult = 26.0;
    bullMult = 34.0;
    panicMult = 16.0;
  }

  const shares =
    profile.sharesOutstandingBillions > 0
      ? profile.sharesOutstandingBillions
      : 1.0;

  const baseline: FinancialModelBaseline = {
    baseRevenueBillions: baseRevenue,
    baseGrossMarginPct: baseGrossMargin,
    fixedOpexBillions: fixedOpex,
    taxRatePct: 16.5,
    dilutedSharesBillions: shares,
    multipleRegimes: {
      bull: bullMult,
      base: baseMult,
      panic: panicMult,
    },
    upstreamDrivers: [
      {
        id: `${profile.ticker.toLowerCase()}-core-demand`,
        name: `${profile.companyName} Core Segment Demand & Growth Velocity`,
        exposureShare: 0.5,
        elasticity: 1.0,
        defaultShockPct: 0,
        minShockPct: -40,
        maxShockPct: 40,
      },
      {
        id: `${profile.ticker.toLowerCase()}-operational-efficiency`,
        name: "Gross Margin & Operating Leverage Conversion",
        exposureShare: 0.3,
        elasticity: 0.85,
        defaultShockPct: 0,
        minShockPct: -30,
        maxShockPct: 30,
      },
      {
        id: `${profile.ticker.toLowerCase()}-macro-capex`,
        name: "Macro Enterprise CapEx & Discretionary Industry Spending",
        exposureShare: 0.2,
        elasticity: 0.75,
        defaultShockPct: 0,
        minShockPct: -30,
        maxShockPct: 30,
      },
    ],
  };

  return FinancialModelBaselineSchema.parse(baseline);
}

export function generateScenariosDraft(
  facts: Facts,
  profile: FinancialProfile,
  baseline: FinancialModelBaseline,
  estimates?: AnalystEstimates
): { scenariosEn: Scenarios; scenariosZh: Scenarios } {
  const basisYear = `FY${new Date().getFullYear() + 1}`;
  const consensusTarget =
    estimates?.priceTargets?.average ||
    round2(profile.currentPrice > 0 ? profile.currentPrice * 1.15 : 100);

  let baseEps: number;

  // Guardrail 1: Valid Positive Forward EPS Consensus
  if (facts.forwardEpsConsensus && facts.forwardEpsConsensus > 0) {
    const rawFwdEps = facts.forwardEpsConsensus;
    const impliedBaseTarget = rawFwdEps * baseline.multipleRegimes.base;

    // Guardrail 3 (Stock-Split Mismatch Protection):
    // If raw implied target is > 3.0x current price while consensus target is within 2.2x price,
    // detect unadjusted stock split lag (e.g. 10:1 or 3:1) and re-normalize base EPS to consensus target
    if (
      profile.currentPrice > 0 &&
      impliedBaseTarget > profile.currentPrice * 3.0 &&
      consensusTarget > 0 &&
      consensusTarget < profile.currentPrice * 2.2
    ) {
      baseEps = round2(consensusTarget / baseline.multipleRegimes.base);
    } else {
      baseEps = rawFwdEps;
    }
  } else if (facts.epsOperating && facts.epsOperating > 0) {
    const impliedBaseTarget =
      facts.epsOperating * 4 * 1.15 * baseline.multipleRegimes.base;
    // Guardrail 4 (Early-Stage Hypergrowth Scale-Up Protection):
    // If annualized trailing operating EPS implies a valuation < 35% of current price while consensus is bullish,
    // anchor base EPS to consensus price target to avoid collapsing scale-up AI stocks
    if (
      profile.currentPrice > 0 &&
      impliedBaseTarget < profile.currentPrice * 0.35 &&
      consensusTarget > profile.currentPrice * 0.8
    ) {
      baseEps = round2(consensusTarget / baseline.multipleRegimes.base);
    } else {
      baseEps = round2(facts.epsOperating * 4 * 1.15);
    }
  } else {
    // Guardrail 2 (Negative EPS / Unprofitable Starter Fallback):
    // For companies with negative forward EPS and negative operating income (biotech, REITs, pre-profit AI, or restructuring),
    // anchor implied forward earnings power to current price or discounted consensus if operating margins are negative
    const isDistressedTurnaround =
      facts.operatingMarginPct < 0 && facts.revenueGrowthPct < 10;
    const anchorPrice = isDistressedTurnaround
      ? profile.currentPrice > 0
        ? profile.currentPrice * 0.85
        : consensusTarget * 0.75
      : consensusTarget > 0
        ? consensusTarget
        : profile.currentPrice > 0
          ? profile.currentPrice
          : 50.0;
    const anchorMultiple = Math.max(baseline.multipleRegimes.base, 10.0);
    baseEps = round2(Math.max(anchorPrice / anchorMultiple, 0.1));
  }

  // Apply earnings-surprise adjustment when actual reported EPS or revenue misses consensus
  if (
    facts.epsConsensus !== 0 &&
    facts.epsReported < facts.epsConsensus &&
    (facts.forwardEpsConsensus ?? 0) <= 0
  ) {
    const missFactor =
      facts.epsConsensus > 0
        ? Math.max(0.6, Math.min(1.0, facts.epsReported / facts.epsConsensus))
        : 0.8;
    baseEps = round2(Math.max(baseEps * missFactor, 0.1));
  }

  const bullEps = round2(baseEps * 1.35);
  const panicEps = round2(Math.max(baseEps * 0.55, 0.1));

  const scenariosEn: Scenarios = {
    ticker: profile.ticker,
    basisYear,
    currentPrice: profile.currentPrice,
    consensusTarget,
    scenarios: [
      {
        name: "Bull",
        probability: 0.25,
        rawProbability: 0.25,
        forwardEps: bullEps,
        multiple: baseline.multipleRegimes.bull,
        assumptions: [
          "Accelerating top-line revenue velocity outperforming baseline guidance",
          "Operating leverage expansion driving operating margin accretion",
          "Market share consolidation across core customer verticals",
        ],
        keyDrivers: [
          "Core product expansion ramp",
          "Operating margin expansion",
          "Multiple re-rating toward bull regime",
        ],
      },
      {
        name: "Base",
        probability: 0.5,
        rawProbability: 0.5,
        forwardEps: baseEps,
        multiple: baseline.multipleRegimes.base,
        assumptions: [
          "Execution in line with management medium-term operating targets",
          "Stable pricing power and steady customer expansion",
          "Normalized multiple stability reflecting consistent cash generation",
        ],
        keyDrivers: [
          "Steady execution across core operations",
          "Normalized operating margins",
          "Target multiple stability",
        ],
      },
      {
        name: "Panic",
        probability: 0.25,
        rawProbability: 0.25,
        forwardEps: panicEps,
        multiple: baseline.multipleRegimes.panic,
        assumptions: [
          "Macro deceleration and cyclical demand contraction",
          "Gross margin compression from competitive pricing pressure",
          "Multiple de-rating towards historical liquidity safety floor",
        ],
        keyDrivers: [
          "Macro spending deceleration",
          "Gross margin compression",
          "Valuation de-rating to liquidity floor",
        ],
      },
    ],
  };

  const scenariosZh: Scenarios = {
    ticker: profile.ticker,
    basisYear,
    currentPrice: profile.currentPrice,
    consensusTarget,
    scenarios: [
      {
        name: "Bull",
        probability: 0.25,
        rawProbability: 0.25,
        forwardEps: bullEps,
        multiple: baseline.multipleRegimes.bull,
        assumptions: [
          "核心业务营收增速显著超越管理层指引上限",
          "规模效应显现带动营业利润率超预期扩张",
          "在核心客户细分领域市场份额进一步提升",
        ],
        keyDrivers: [
          "核心产品商业化放量",
          "营业利润率超预期改善",
          "估值倍数向乐观区间扩张",
        ],
      },
      {
        name: "Base",
        probability: 0.5,
        rawProbability: 0.5,
        forwardEps: baseEps,
        multiple: baseline.multipleRegimes.base,
        assumptions: [
          "平稳达成管理层给出的中长期经营预期与交付里程碑",
          "维持稳定的产品定价权与客户留存扩张率",
          "估值倍数保持在历史中枢区间",
        ],
        keyDrivers: [
          "主营业务稳健交付",
          "常态化营业利润率水平",
          "基准估值倍数维持",
        ],
      },
      {
        name: "Panic",
        probability: 0.25,
        rawProbability: 0.25,
        forwardEps: panicEps,
        multiple: baseline.multipleRegimes.panic,
        assumptions: [
          "宏观经济逆风导致行业需求与企业资本开支明显放缓",
          "竞争加剧引发毛利率承压与获客成本上升",
          "估值倍数回撤至历史周期安全边际底线",
        ],
        keyDrivers: [
          "宏观行业景气度下滑",
          "毛利率竞争性承压",
          "估值倍数回撤至流动性防御底线",
        ],
      },
    ],
  };

  return {
    scenariosEn: ScenariosSchema.parse(scenariosEn),
    scenariosZh: ScenariosSchema.parse(scenariosZh),
  };
}

export function generateMoatCompetitorsDraft(
  profile: FinancialProfile,
  facts: Facts
): { moatEn: MoatCompetitors; moatZh: MoatCompetitors } {
  const opMargin = facts.operatingMarginPct ?? 0;
  const grossMargin = facts.grossMarginPct ?? 40;
  const revGrowth = facts.revenueGrowthPct ?? 0;
  const mktCap = profile.marketCapBillions ?? 0;

  let overallMoatRating: MoatCompetitors["overallMoatRating"] = "Narrow";
  if (
    opMargin < 8 ||
    (grossMargin < 28 && opMargin < 12) ||
    (revGrowth < -5 && opMargin < 15)
  ) {
    overallMoatRating = "None";
  } else if (
    (opMargin >= 22 && grossMargin >= 45 && revGrowth >= 0) ||
    (opMargin >= 20 && mktCap >= 200 && revGrowth >= 3) ||
    (opMargin >= 30 && revGrowth >= -2)
  ) {
    overallMoatRating = "Wide";
  }

  let moatTrend: MoatCompetitors["moatTrend"] = "Stable";
  if (revGrowth >= 15 && opMargin >= 20) {
    moatTrend = "Widening";
  } else if (revGrowth < -3 || opMargin < 5) {
    moatTrend = "Narrowing";
  }

  const intangibleStrength: "Strong" | "Moderate" | "Weak" =
    grossMargin >= 55 && overallMoatRating === "Wide"
      ? "Strong"
      : overallMoatRating === "None"
        ? "Weak"
        : "Moderate";
  const switchingStrength: "Strong" | "Moderate" | "Weak" =
    opMargin >= 22 && revGrowth >= 5
      ? "Strong"
      : overallMoatRating === "None" && revGrowth < 0
        ? "Weak"
        : "Moderate";
  const costStrength: "Strong" | "Moderate" | "Weak" =
    mktCap >= 150 && opMargin >= 18
      ? "Strong"
      : opMargin < 8
        ? "Weak"
        : "Moderate";

  const moatEn: MoatCompetitors = {
    ticker: profile.ticker,
    overallMoatRating,
    moatTrend,
    moatSources: [
      {
        source: "Intangible Assets",
        strength: intangibleStrength,
        description: `Proprietary technology stack, brand reputation, and domain IP across ${profile.companyName}.`,
        durabilityYears:
          overallMoatRating === "Wide"
            ? 10
            : overallMoatRating === "Narrow"
              ? 6
              : 3,
      },
      {
        source: "Switching Costs",
        strength: switchingStrength,
        description: `Deep workflow and mission-critical enterprise integration providing customer retention.`,
        durabilityYears:
          overallMoatRating === "Wide"
            ? 8
            : overallMoatRating === "Narrow"
              ? 5
              : 2,
      },
      {
        source: "Cost Advantage",
        strength: costStrength,
        description: `Operational scale and supply chain integration yielding unit cost efficiencies.`,
        durabilityYears:
          overallMoatRating === "Wide"
            ? 8
            : overallMoatRating === "Narrow"
              ? 5
              : 2,
      },
    ],
    competitors: [
      {
        ticker: "PEER",
        name: "Sector Benchmark Peer",
        marketCapBillions: round2(profile.marketCapBillions * 1.1),
        revenueBillions: round2(facts.revenueBillions * 4.2),
        grossMarginPct: round2(facts.grossMarginPct || 42.0),
        operatingMarginPct: round2(facts.operatingMarginPct || 16.0),
        productComparison: `Direct industry peer competing across core enterprise and commercial segments.`,
        pricingPower: "Parity",
        keyAdvantageOrVulnerability: `Established market presence with comparable technology footprint.`,
      },
    ],
    competitiveDynamicsSummary: `${profile.companyName} maintains a defensible market position supported by proprietary technology and customer retention, while operating in an active competitive landscape.`,
    sources: facts.sources,
  };

  const moatZh: MoatCompetitors = {
    ticker: profile.ticker,
    overallMoatRating,
    moatTrend,
    moatSources: [
      {
        source: "Intangible Assets",
        strength: intangibleStrength,
        description: `${profile.companyName} 积累的核心自研技术架构、专有专利资产与行业品牌信誉。`,
        durabilityYears:
          overallMoatRating === "Wide"
            ? 10
            : overallMoatRating === "Narrow"
              ? 6
              : 3,
      },
      {
        source: "Switching Costs",
        strength: switchingStrength,
        description: `深度嵌入客户业务流程与关键工作流，带来显著的迁移壁垒与客户黏性。`,
        durabilityYears:
          overallMoatRating === "Wide"
            ? 8
            : overallMoatRating === "Narrow"
              ? 5
              : 2,
      },
      {
        source: "Cost Advantage",
        strength: costStrength,
        description: `规模化运营带来的采购议价与供应链单位成本优势。`,
        durabilityYears:
          overallMoatRating === "Wide"
            ? 8
            : overallMoatRating === "Narrow"
              ? 5
              : 2,
      },
    ],
    competitors: [
      {
        ticker: "PEER",
        name: "同业代表性基准企业",
        marketCapBillions: round2(profile.marketCapBillions * 1.1),
        revenueBillions: round2(facts.revenueBillions * 4.2),
        grossMarginPct: round2(facts.grossMarginPct || 42.0),
        operatingMarginPct: round2(facts.operatingMarginPct || 16.0),
        productComparison: `在主营核心产品线及商业解决方案细分领域展开直接对标竞争。`,
        pricingPower: "Parity",
        keyAdvantageOrVulnerability: `具备成熟的渠道网络与相似的行业覆盖，在核心领域形成竞合关系。`,
      },
    ],
    competitiveDynamicsSummary: `${profile.companyName} 在主营细分赛道具备清晰的护城河壁垒与客户黏性，在行业竞争中保持稳固地位。`,
    sources: facts.sources,
  };

  return {
    moatEn: MoatCompetitorsSchema.parse(moatEn),
    moatZh: MoatCompetitorsSchema.parse(moatZh),
  };
}

export function generateCatalystsDraft(
  profile: FinancialProfile,
  facts: Facts
): { catalystsEn: Catalysts; catalystsZh: Catalysts } {
  const tickerLower = profile.ticker.toLowerCase();

  const catalystsEn: Catalysts = {
    ticker: profile.ticker,
    catalysts: [
      {
        id: `${tickerLower}-product-adoption`,
        title: "Next-Generation Product Ramp & Customer Volume Acceleration",
        direction: "growth",
        probability: 0.7,
        probabilityAnchor:
          "Active commercial pipeline rollout and strong recurring contract expansions.",
        horizon: "near-term",
        description:
          "Accelerated adoption of flagship product lines driving top-line revenue velocity outperformance.",
        evidence: [
          {
            fact: `Reported ${facts.revenueGrowthPct}% YoY revenue velocity in the latest period.`,
          },
        ],
      },
      {
        id: `${tickerLower}-margin-expansion`,
        title: "Operating Leverage Accretion & Unit Margin Expansion",
        direction: "growth",
        probability: 0.65,
        probabilityAnchor: "Fixed cost absorption and operational scaling.",
        horizon: "medium-term",
        description:
          "Scale efficiencies expanding clean operating conversion and free cash flow generation.",
        evidence: [
          {
            fact: `Latest operating margin benchmarked at ${facts.operatingMarginPct}%.`,
          },
        ],
      },
      {
        id: `${tickerLower}-macro-headwinds`,
        title: "Macro Demand Deceleration & Enterprise Budget Caution",
        direction: "risk",
        probability: 0.35,
        probabilityAnchor:
          "Broader macroeconomic tightening and elongated enterprise procurement cycles.",
        horizon: "medium-term",
        description:
          "Customer budget constraints or delayed procurement cycles impacting top-line velocity.",
        evidence: [
          {
            fact: "Industry-wide scrutiny on discretionary enterprise capital expenditures.",
          },
        ],
      },
      {
        id: `${tickerLower}-competitive-pricing`,
        title: "Competitive Pricing Pressure & Supply Chain Friction",
        direction: "risk",
        probability: 0.3,
        probabilityAnchor:
          "Intensifying price competition across adjacent market tiers.",
        horizon: "near-term",
        description:
          "Aggressive discounting or input cost inflation pressuring baseline gross margins.",
        evidence: [
          {
            fact: `Baseline gross margin benchmarked at ${facts.grossMarginPct || 40}%.`,
          },
        ],
      },
    ],
  };

  const catalystsZh: Catalysts = {
    ticker: profile.ticker,
    catalysts: [
      {
        id: `${tickerLower}-product-adoption`,
        title: "新一代核心产品放量与重点客户渗透加速",
        direction: "growth",
        probability: 0.7,
        probabilityAnchor: "商业化交付按计划推进，核心客户复购与扩单态势积极。",
        horizon: "near-term",
        description: "主力产品线渗透加速带动整体营收增速超越市场基准预期。",
        evidence: [
          {
            fact: `最新季度营收同比增速达到 ${facts.revenueGrowthPct}%。`,
          },
        ],
      },
      {
        id: `${tickerLower}-margin-expansion`,
        title: "经营杠杆释放与单位利润率结构性改善",
        direction: "growth",
        probability: 0.65,
        probabilityAnchor: "固定成本分摊效应显著，费用端规模经济持续体现。",
        horizon: "medium-term",
        description: "业务规模扩张推动主营业务利润率与自由现金流表现持续优化。",
        evidence: [
          {
            fact: `最新季度营业利润率达到 ${facts.operatingMarginPct}%。`,
          },
        ],
      },
      {
        id: `${tickerLower}-macro-headwinds`,
        title: "宏观行业需求波动与客户支出周期性放缓",
        direction: "risk",
        probability: 0.35,
        probabilityAnchor: "宏观经济不确定性导致企业客户采购审批周期拉长。",
        horizon: "medium-term",
        description:
          "客户缩减非刚性开支或推迟落地进度，对中短期营收交付构成扰动。",
        evidence: [
          {
            fact: "行业普遍面临企业开支审慎与预算控制考量。",
          },
        ],
      },
      {
        id: `${tickerLower}-competitive-pricing`,
        title: "行业竞争加剧与供应链要素成本波动",
        direction: "risk",
        probability: 0.3,
        probabilityAnchor: "同业竞争对手加大让利促销与获客争夺力度。",
        horizon: "near-term",
        description:
          "潜在的价格竞争或供应链成本波动可能对综合毛利率造成短期挤压。",
        evidence: [
          {
            fact: `基准毛利率水平约为 ${facts.grossMarginPct || 40}%。`,
          },
        ],
      },
    ],
  };

  return {
    catalystsEn: CatalystsSchema.parse(catalystsEn),
    catalystsZh: CatalystsSchema.parse(catalystsZh),
  };
}

export function generateEarningsSentimentDraft(
  profile: FinancialProfile,
  facts: Facts
): EarningsSentiment {
  const sentiment: EarningsSentiment = {
    ticker: profile.ticker,
    quarter: facts.quarter,
    managementTone: {
      overallConfidence: 8.0,
      specificity: 7.5,
      forwardConfidence: 8.0,
      capexJustification: 7.5,
      competitivePositioning: 8.0,
      riskAcknowledgment: 7.0,
      evidenceNotes: `Management expressed solid conviction on commercial execution, roadmap delivery, and capital discipline during the quarterly earnings review.`,
    },
    analystConcerns: {
      topTopics: [
        {
          topic: "Revenue Growth Durability & Backlog Conversion",
          frequency: 5,
          managementResponse: `Affirmed healthy order visibility and steady milestone conversion into recognized revenue.`,
        },
        {
          topic: "Operating Margin Trajectory & Operating Leverage",
          frequency: 4,
          managementResponse: `Reiterated commitment to disciplined cost management while funding strategic growth initiatives.`,
        },
      ],
    },
    keyQuotes: [
      {
        speaker: "Management",
        quote: `We continue to see robust fundamental demand across our core solutions and remain focused on disciplined operational execution.`,
        context: `Opening remarks during the quarterly earnings presentation`,
        sentiment: "bullish",
      },
    ],
  };

  return EarningsSentimentSchema.parse(sentiment);
}

export function generateFilingExtractsDraft(
  profile: FinancialProfile,
  facts: Facts
): { filingEn: FilingExtracts; filingZh: FilingExtracts } {
  const filingEn: FilingExtracts = {
    ticker: profile.ticker,
    quarter: facts.quarter,
    newRiskFactors: [
      {
        risk: "Macroeconomic Volatility & Market Demand Cyclicality",
        severity: "Moderate",
        priorLanguage: "Standard macroeconomic risk factors.",
      },
      {
        risk: "Competitive Landscape & Technology Roadmap Execution",
        severity: "Moderate",
        priorLanguage: "General competitive industry risks.",
      },
    ],
    sections: [
      {
        section: "Item 2 - Management's Discussion and Analysis",
        keyFindings: [
          {
            finding: `Reported revenue of $${facts.revenueBillions}B, reflecting ${facts.revenueGrowthPct}% YoY velocity.`,
            implication:
              "Reflects underlying business demand and operational execution across primary operating units.",
            novelty: "Moderate",
          },
          {
            finding: `Clean operating income recorded at $${facts.operatingIncomeBillions}B with an operating margin of ${facts.operatingMarginPct}%.`,
            implication:
              "Demonstrates ongoing operating discipline relative to historical baseline levels.",
            novelty: "Moderate",
          },
        ],
      },
    ],
  };

  const filingZh: FilingExtracts = {
    ticker: profile.ticker,
    quarter: facts.quarter,
    newRiskFactors: [
      {
        risk: "宏观经济不确定性与市场需求周期性波动",
        severity: "Moderate",
        priorLanguage: "常规宏观经济风险披露。",
      },
      {
        risk: "行业竞品动态与技术路线图执行交付风险",
        severity: "Moderate",
        priorLanguage: "常规行业竞争与研发交付风险。",
      },
    ],
    sections: [
      {
        section: "Item 2 - 管理层讨论与分析 (MD&A)",
        keyFindings: [
          {
            finding: `本期实现营业收入 $${facts.revenueBillions}B，同比增长 ${facts.revenueGrowthPct}%。`,
            implication: "体现核心业务场景的市场需求支撑与主营业务交付进展。",
            novelty: "Moderate",
          },
          {
            finding: `录得经营性营业利润 $${facts.operatingIncomeBillions}B，对应营业利润率为 ${facts.operatingMarginPct}%。`,
            implication: "反映公司在扩张过程中保持合理的经营纪律与成本控制。",
            novelty: "Moderate",
          },
        ],
      },
    ],
  };

  return {
    filingEn: FilingExtractsSchema.parse(filingEn),
    filingZh: FilingExtractsSchema.parse(filingZh),
  };
}
