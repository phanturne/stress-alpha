import type {
  ReportData,
  StressResult,
  Facts,
  Valuation,
  MoatCompetitors,
  Catalysts,
} from "./schemas";
import type { Locale } from "./i18n";
import { round2 } from "./valuation";

export type SnowflakeAxisId =
  "valuation" | "future" | "earnings" | "moat" | "resilience";

export interface SnowflakeCriterion {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  passed: boolean;
  valueDisplay: string;
  benchmarkDisplay: string;
}

export interface SnowflakePillar {
  id: SnowflakeAxisId;
  label: string;
  labelZh: string;
  shortLabel: string;
  shortLabelZh: string;
  score: number; // 0 to 6
  maxScore: number; // 6
  color: string;
  summary: string;
  summaryZh: string;
  criteria: SnowflakeCriterion[]; // 6 criteria
}

export interface SnowflakeScoreResult {
  totalScore: number; // 0 to 30
  maxScore: number; // 30
  percentage: number; // 0 to 100
  ratingTier: "exceptional" | "strong" | "balanced" | "cautious";
  ratingLabel: string;
  ratingLabelZh: string;
  pillars: Record<SnowflakeAxisId, SnowflakePillar>;
  pillarList: SnowflakePillar[];
}

/**
 * Helper to compute 6 criteria for Valuation Pillar
 */
function computeValuationCriteria(
  facts: Facts,
  valuation?: Valuation,
  stressResult?: StressResult
): SnowflakeCriterion[] {
  const currentPrice = facts.currentPrice;
  const weightedFairValue = valuation?.weightedFairValue ?? currentPrice;
  const upsidePct = valuation?.upsidePct ?? 0;
  const consensusTarget = valuation?.consensusTarget ?? 0;
  const pricedInMultiple =
    stressResult?.asymmetry?.marketPricedInMultiple ??
    (facts.trailingEps > 0 ? round2(currentPrice / facts.trailingEps) : 0);
  const baseRegimeTarget =
    stressResult?.valuationBands?.base?.targetPrice ?? weightedFairValue;
  const asymmetryRatio = stressResult?.asymmetry?.riskRewardRatio ?? 1.0;

  return [
    {
      id: "val_discount",
      name: "Undervalued vs Weighted Fair Value",
      nameZh: "估值相对加权公允价值折价",
      description:
        "Current market price trades below model-weighted fair value",
      descriptionZh: "当前市价低于模型加权公允价值",
      passed: upsidePct > 0,
      valueDisplay: `${upsidePct > 0 ? "+" : ""}${upsidePct}%`,
      benchmarkDisplay: "> 0%",
    },
    {
      id: "val_margin_safety",
      name: "High Margin of Safety (≥ 15%)",
      nameZh: "充足安全边际 (≥ 15%)",
      description: "Upside to fair value provides institutional buffer ≥ 15%",
      descriptionZh: "上行空间提供 ≥ 15% 的机构级安全边际缓冲",
      passed: upsidePct >= 15,
      valueDisplay: `${upsidePct > 0 ? "+" : ""}${upsidePct}%`,
      benchmarkDisplay: "≥ 15%",
    },
    {
      id: "val_multiple_attractive",
      name: "Disciplined Pricing Multiple (≤ 30x)",
      nameZh: "理性定价倍数 (≤ 30x)",
      description:
        "Implied market earnings multiple is disciplined given current earnings power",
      descriptionZh: "在当前盈利能力下隐含市盈率处于理性健康区间",
      passed: pricedInMultiple > 0 && pricedInMultiple <= 30,
      valueDisplay: pricedInMultiple > 0 ? `${pricedInMultiple}x` : "N/A",
      benchmarkDisplay: "≤ 30.0x",
    },
    {
      id: "val_consensus_headroom",
      name: "Wall St Consensus Target Headroom",
      nameZh: "华尔街卖方目标价存在上行空间",
      description:
        "Current price trades below average Wall Street consensus price target",
      descriptionZh: "当前股价低于华尔街一致预期目标价",
      passed: consensusTarget > 0 && currentPrice < consensusTarget,
      valueDisplay:
        consensusTarget > 0
          ? `$${round2(currentPrice)} vs $${consensusTarget}`
          : "N/A",
      benchmarkDisplay: "< Target PT",
    },
    {
      id: "val_asymmetry_skew",
      name: "Favorable Risk/Reward Asymmetry (≥ 1.5x)",
      nameZh: "积极风险收益不对称性 (≥ 1.5x)",
      description:
        "Bull scenario potential upside outweighs downside risk by ≥ 1.5x",
      descriptionZh: "乐观情景上行收益至少为下行风险的 1.5 倍",
      passed: asymmetryRatio >= 1.5,
      valueDisplay: `${round2(asymmetryRatio)}:1`,
      benchmarkDisplay: "≥ 1.5:1",
    },
    {
      id: "val_base_regime_support",
      name: "Base Regime Target Support",
      nameZh: "基准情景目标价底线支撑",
      description:
        "Base stress scenario target price meets or exceeds current market price",
      descriptionZh: "基准压力情景目标价达到或超过当前市场价格",
      passed: baseRegimeTarget >= currentPrice,
      valueDisplay: `$${round2(baseRegimeTarget)}`,
      benchmarkDisplay: `≥ $${round2(currentPrice)}`,
    },
  ];
}

/**
 * Helper to compute 6 criteria for Future Growth & Catalysts Pillar
 */
function computeFutureCriteria(
  facts: Facts,
  catalysts?: Catalysts
): SnowflakeCriterion[] {
  const revGrowth = facts.revenueGrowthPct ?? 0;
  const forwardEps = facts.forwardEpsConsensus ?? 0;
  const trailingEps = facts.trailingEps ?? facts.epsOperating;
  const catList = catalysts?.catalysts ?? [];
  const growthCats = catList.filter((c) => c.direction === "growth");
  const riskCats = catList.filter((c) => c.direction === "risk");
  const highConvictionGrowth = growthCats.some((c) => c.probability >= 0.55);
  const topSegmentGrowth = Math.max(
    0,
    ...facts.segments.map((s) => s.growthPct ?? 0)
  );
  const hasForwardGuidance =
    (facts.guidanceOperatingIncomeLowBillions != null &&
      facts.guidanceOperatingIncomeLowBillions > 0) ||
    (facts.guidanceRevenueLowBillions != null &&
      facts.guidanceRevenueLowBillions > 0) ||
    forwardEps > trailingEps;

  return [
    {
      id: "fut_rev_growth",
      name: "Double-Digit Revenue Growth (≥ 10%)",
      nameZh: "双位数营收同比增长 (≥ 10%)",
      description:
        "Company generates robust top-line year-over-year revenue expansion",
      descriptionZh: "公司实现强劲的营业收入双位数年度同比增长",
      passed: revGrowth >= 10,
      valueDisplay: `${revGrowth > 0 ? "+" : ""}${round2(revGrowth)}%`,
      benchmarkDisplay: "≥ +10%",
    },
    {
      id: "fut_forward_eps",
      name: "Forward Consensus EPS Expansion",
      nameZh: "远期一致预期每股收益扩张",
      description:
        "Forward consensus FY EPS exceeds trailing baseline earnings",
      descriptionZh: "下一财年一致预期 EPS 高于过去四个季度基准盈利",
      passed: forwardEps > 0 && forwardEps > trailingEps,
      valueDisplay:
        forwardEps > 0
          ? `$${round2(forwardEps)} vs $${round2(trailingEps)}`
          : "N/A",
      benchmarkDisplay: "> Trailing EPS",
    },
    {
      id: "fut_net_catalysts",
      name: "Net Positive Catalyst Skew",
      nameZh: "增长催化剂净主导地位",
      description:
        "Positive growth catalysts outnumber downside fundamental risk triggers",
      descriptionZh: "积极增长催化剂数量等于或超过潜在风险触发点",
      passed: growthCats.length >= riskCats.length && growthCats.length > 0,
      valueDisplay: `${growthCats.length} Growth vs ${riskCats.length} Risk`,
      benchmarkDisplay: "Growth ≥ Risk",
    },
    {
      id: "fut_conviction_catalyst",
      name: "High-Conviction Growth Trigger (≥ 55%)",
      nameZh: "高置信度核心增长催化剂 (≥ 55%)",
      description:
        "Identified at least one structural growth catalyst with probability ≥ 55%",
      descriptionZh: "存在发生概率 ≥ 55% 的结构性主线催化剂",
      passed: highConvictionGrowth,
      valueDisplay: highConvictionGrowth
        ? `${Math.round(
            Math.max(0, ...growthCats.map((c) => c.probability)) * 100
          )}% max prob`
        : "None ≥ 55%",
      benchmarkDisplay: "≥ 55% Prob",
    },
    {
      id: "fut_guidance_momentum",
      name: "Constructive Management Guidance",
      nameZh: "管理层提供具有建设性的正向指引",
      description:
        "Active operating income or revenue guidance signals continued forward expansion",
      descriptionZh: "给出的前瞻营业利润或收入指引预示可持续业务扩张",
      passed: hasForwardGuidance,
      valueDisplay: hasForwardGuidance ? "Positive Forward" : "Conservative",
      benchmarkDisplay: "Expansionary",
    },
    {
      id: "fut_segment_traction",
      name: "Core Segment Growth Engine (≥ 20%)",
      nameZh: "核心业务引擎高速增长 (≥ 20%)",
      description:
        "Largest or key strategic segment achieves ≥ 20% YoY growth rate",
      descriptionZh: "主要战略业务部门实现 ≥ 20% 的同比高速增长",
      passed: topSegmentGrowth >= 20,
      valueDisplay: `${topSegmentGrowth > 0 ? "+" : ""}${round2(topSegmentGrowth)}%`,
      benchmarkDisplay: "≥ +20%",
    },
  ];
}

/**
 * Helper to compute 6 criteria for Earnings Quality Pillar
 */
function computeEarningsQualityCriteria(facts: Facts): SnowflakeCriterion[] {
  const opMargin = facts.operatingMarginPct ?? 0;
  const opIncomeGrowth = facts.operatingIncomeGrowthPct ?? 0;
  const revGrowth = facts.revenueGrowthPct ?? 0;
  const epsReported = facts.epsReported ?? 0;
  const epsOperating = facts.epsOperating ?? epsReported;
  const epsConsensus = facts.epsConsensus ?? 0;
  const revActual = facts.revenueBillions ?? 0;
  const revEst = facts.revenueEstimateBillions ?? 0;

  // Check one-time charges impact: clean operating is not artificially propped up by one-offs
  const cleanEarningsRatio =
    epsReported !== 0 ? Math.abs(epsOperating / epsReported) : 1;
  const isCleanStream =
    facts.oneTimeItems.length === 0 ||
    cleanEarningsRatio >= 0.85 ||
    epsOperating >= epsReported;

  const profitableSegments = facts.segments.every(
    (s) => s.operatingMarginPct == null || s.operatingMarginPct > 0
  );

  return [
    {
      id: "earn_op_margin",
      name: "High Operating Margin (≥ 15%)",
      nameZh: "健康营业利润率水平 (≥ 15%)",
      description:
        "Operating margin demonstrates healthy commercial conversion",
      descriptionZh: "营业利润率展现出健康的商业转化与定价效率",
      passed: opMargin >= 15,
      valueDisplay: `${round2(opMargin)}%`,
      benchmarkDisplay: "≥ 15.0%",
    },
    {
      id: "earn_clean_stream",
      name: "Clean Operating Income Stream",
      nameZh: "经常性经营收益纯净度 (无恶性一次性调整)",
      description:
        "Core operating earnings reflect sustainable cash flows free of distortive write-offs",
      descriptionZh: "核心经营利润真实反映可持续现金流，无重大粉饰调整",
      passed: isCleanStream,
      valueDisplay:
        facts.oneTimeItems.length > 0
          ? `${facts.oneTimeItems.length} one-off items`
          : "Clean GAAP/Non-GAAP",
      benchmarkDisplay: "Clean Stream",
    },
    {
      id: "earn_revenue_beat",
      name: "Top-Line Revenue Consensus Beat",
      nameZh: "季度营业收入超越一致预期",
      description:
        "Quarterly revenue outperformed Wall Street consensus expectations",
      descriptionZh: "单季度营收表现强于华尔街卖方普遍共识",
      passed: revEst > 0 ? revActual >= revEst : true,
      valueDisplay:
        revEst > 0
          ? `$${round2(revActual)}B vs $${round2(revEst)}B`
          : `$${round2(revActual)}B (Met)`,
      benchmarkDisplay: "≥ Consensus",
    },
    {
      id: "earn_eps_beat",
      name: "Bottom-Line EPS Consensus Beat",
      nameZh: "单季度每股收益超预期",
      description: "Operating EPS beat consensus analyst projections",
      descriptionZh: "核心营业每股收益超越分析师一致预测",
      passed: epsConsensus > 0 ? epsOperating >= epsConsensus : true,
      valueDisplay:
        epsConsensus > 0
          ? `$${round2(epsOperating)} vs $${round2(epsConsensus)}`
          : `$${round2(epsOperating)} (Clean)`,
      benchmarkDisplay: "≥ Consensus",
    },
    {
      id: "earn_operating_leverage",
      name: "Positive Operating Leverage",
      nameZh: "正向经营杠杆效应 (利润增速 ≥ 营收增速)",
      description:
        "Operating income grows faster than top-line revenue, showing cost discipline",
      descriptionZh: "营业利润增长快于营业收入增长，体现固定成本摊薄与规模杠杆",
      passed: opIncomeGrowth >= revGrowth || opMargin >= 30,
      valueDisplay:
        opIncomeGrowth !== 0
          ? `Op +${round2(opIncomeGrowth)}% vs Rev +${round2(revGrowth)}%`
          : `${round2(opMargin)}% Margin`,
      benchmarkDisplay: "Op Growth ≥ Rev",
    },
    {
      id: "earn_segment_health",
      name: "All Segments Operating in Black",
      nameZh: "所有分部业务均实现经营盈利",
      description:
        "No subsidized cash-drain segments pulling down total corporate health",
      descriptionZh: "所有主要披露部门均维持正经营利润率，不存在重大失血分部",
      passed: profitableSegments,
      valueDisplay: profitableSegments ? "100% Profitable" : "Subsidized Units",
      benchmarkDisplay: "All Profitable",
    },
  ];
}

/**
 * Helper to compute 6 criteria for Economic Moat Pillar
 */
function computeMoatCriteria(
  facts: Facts,
  moat?: MoatCompetitors
): SnowflakeCriterion[] {
  const rating = moat?.overallMoatRating ?? "None";
  const trend = moat?.moatTrend ?? "Stable";
  const sources = moat?.moatSources ?? [];
  const competitors = moat?.competitors ?? [];
  const maxDurability = Math.max(
    0,
    ...sources.map((s) => s.durabilityYears ?? 0)
  );
  const hasWideOrNarrow = rating === "Wide" || rating === "Narrow";
  const hasWide = rating === "Wide";
  const isWidening = trend === "Widening";

  // Peer pricing power comparison
  const superiorPricing =
    competitors.some(
      (c) => c.pricingPower === "Inferior" // Peer inferior implies target superior
    ) || facts.operatingMarginPct >= 35;

  // Peer margin superiority
  const avgPeerMargin =
    competitors.length > 0
      ? competitors.reduce((acc, c) => acc + (c.operatingMarginPct ?? 0), 0) /
        competitors.length
      : 20;
  const marginSuperiority = facts.operatingMarginPct >= avgPeerMargin;

  return [
    {
      id: "moat_classification",
      name: "Confirmed Economic Moat (Wide / Narrow)",
      nameZh: "具备确立的经济护城河 (Wide / Narrow)",
      description: "Company possesses recognized competitive economic barriers",
      descriptionZh: "企业拥有经过审计认证的结构性竞争壁垒",
      passed: hasWideOrNarrow,
      valueDisplay: `${rating} Moat`,
      benchmarkDisplay: "Wide / Narrow",
    },
    {
      id: "moat_durability",
      name: "Advantage Durability (≥ 5 Years)",
      nameZh: "优势可持续性久期 (≥ 5 年)",
      description:
        "Primary moat sources have estimated durability horizon of 5+ years",
      descriptionZh: "核心护城河来源预期具备 5 年以上持久优势期限",
      passed: maxDurability >= 5,
      valueDisplay: `${maxDurability} Years`,
      benchmarkDisplay: "≥ 5 Years",
    },
    {
      id: "moat_widening",
      name: "Widening Moat Trajectory",
      nameZh: "护城河演化趋势持续拓宽 (Widening)",
      description:
        "Moat trajectory is actively expanding rather than eroding under peer competition",
      descriptionZh: "在同行竞争格局中壁垒处于主动扩张而非被侵蚀状态",
      passed: isWidening || (rating === "Wide" && trend === "Stable"),
      valueDisplay: `${trend} Trend`,
      benchmarkDisplay: "Widening / Wide",
    },
    {
      id: "moat_multi_source",
      name: "Multiple Moat Vectors (≥ 2 Sources)",
      nameZh: "多元护城河壁垒矩阵 (≥ 2 项支柱)",
      description:
        "Advantage reinforced across switching costs, network effects, or cost advantages",
      descriptionZh: "优势受到转换成本、网络效应或成本优势等多重防线加固",
      passed: sources.length >= 2,
      valueDisplay: `${sources.length} Moat Vectors`,
      benchmarkDisplay: "≥ 2 Vectors",
    },
    {
      id: "moat_pricing_power",
      name: "Demonstrated Industry Pricing Power",
      nameZh: "行业议价与溢价定价权",
      description:
        "Maintains superior or parity pricing power against primary peer competitors",
      descriptionZh: "面对主要同业竞争者保持优越或均势的定价能力与客户黏性",
      passed: superiorPricing,
      valueDisplay: superiorPricing
        ? "High Pricing Power"
        : "Parity / Follower",
      benchmarkDisplay: "Superior / Parity",
    },
    {
      id: "moat_margin_leadership",
      name: "Peer Benchmark Margin Leadership",
      nameZh: "超越同业对手的营业利润率标杆",
      description: "Operating margin exceeds peer competitor group average",
      descriptionZh: "营业利润率超越主要竞争对手平均水平",
      passed: marginSuperiority,
      valueDisplay: `${round2(facts.operatingMarginPct)}% vs ${round2(avgPeerMargin)}% peer`,
      benchmarkDisplay: "≥ Peer Avg",
    },
  ];
}

/**
 * Helper to compute 6 criteria for Stress Resilience Pillar
 */
function computeResilienceCriteria(
  facts: Facts,
  stressResult?: StressResult,
  baseline?: ReportData["baseline"]
): SnowflakeCriterion[] {
  const panicDownside = stressResult?.asymmetry?.downsideToPanicPct ?? -30;
  const baseDownside = stressResult?.asymmetry?.downsideToBasePct ?? 0;
  const stressNetIncome = stressResult?.stressNetIncomeBillions ?? 1;
  const baseGrossMargin =
    baseline?.baseGrossMarginPct ?? facts.operatingMarginPct;
  const baseRevenue =
    baseline?.baseRevenueBillions ?? facts.revenueBillions * 4;
  const fixedOpex =
    baseline?.fixedOpexBillions ?? facts.operatingIncomeBillions * 0.3;
  const opexRatio = baseRevenue > 0 ? (fixedOpex / baseRevenue) * 100 : 25;
  const multipleBull = baseline?.multipleRegimes?.bull ?? 18;
  const multiplePanic = baseline?.multipleRegimes?.panic ?? 8;
  const multipleSpread = multiplePanic > 0 ? multipleBull / multiplePanic : 2.0;

  return [
    {
      id: "res_panic_drawdown",
      name: "Contained Panic Drawdown (Floor ≥ -35%)",
      nameZh: "极端恐慌回撤底线可控 (跌幅 ≤ 35%)",
      description:
        "Worst-case panic multiple stress test bounds downside to within -35%",
      descriptionZh: "在极端情绪与估值收缩的恐慌底线情景下回撤控制在 35% 以内",
      passed: panicDownside >= -35,
      valueDisplay: `${round2(panicDownside)}%`,
      benchmarkDisplay: "≥ -35.0%",
    },
    {
      id: "res_base_regime_protection",
      name: "Base Stress Regime Resilience (≥ -10%)",
      nameZh: "基准压力情景抗跌韧性 (跌幅 ≤ 10%)",
      description:
        "Under base upstream volume and cost shock, downside remains contained",
      descriptionZh: "在上游供给与成本基准冲击下，估值下行风险仍牢牢受控",
      passed: baseDownside >= -10,
      valueDisplay: `${baseDownside > 0 ? "+" : ""}${round2(baseDownside)}%`,
      benchmarkDisplay: "≥ -10.0%",
    },
    {
      id: "res_stress_net_income",
      name: "Solid Solvency Under Upstream Shocks",
      nameZh: "极端供需冲击下的绝对偿付与盈利能力",
      description:
        "Company remains firmly net profitable even after modeled revenue shocks",
      descriptionZh: "经过全套上游驱动因素负向冲击后，净利润仍保持正值",
      passed: stressNetIncome > 0,
      valueDisplay: `$${round2(stressNetIncome)}B Stressed NI`,
      benchmarkDisplay: "> $0 Net Income",
    },
    {
      id: "res_gross_margin_buffer",
      name: "Gross Margin Shock Absorber (≥ 40%)",
      nameZh: "毛利率抗震缓冲垫 (≥ 40%)",
      description:
        "High gross margin absorbs upstream cost inflation without crippling operating earnings",
      descriptionZh: "高毛利结构能够从容化解上游通胀与关税冲击，保障营业利润",
      passed: baseGrossMargin >= 40,
      valueDisplay: `${round2(baseGrossMargin)}%`,
      benchmarkDisplay: "≥ 40.0%",
    },
    {
      id: "res_fixed_opex_flexibility",
      name: "Manageable Fixed OpEx Burden (≤ 40%)",
      nameZh: "轻量化固定运营支出负担 (≤ 40%)",
      description:
        "Fixed operating costs account for less than 40% of baseline revenues",
      descriptionZh:
        "固定运营开支占基准营收比重不超过 40%，具备优良经营抗风险弹性",
      passed: opexRatio <= 40,
      valueDisplay: `${round2(opexRatio)}% of rev`,
      benchmarkDisplay: "≤ 40.0%",
    },
    {
      id: "res_regime_spread",
      name: "Resilient Multiple Support Spread",
      nameZh: "估值倍数体制安全跨度 (≥ 1.8x)",
      description:
        "Healthy spread between bull market appetite and panic multiple floor",
      descriptionZh: "多头倍数与恐慌倍数之间具备合理的流动性风险跨度缓冲",
      passed: multipleSpread >= 1.8,
      valueDisplay: `${round2(multipleSpread)}x Spread`,
      benchmarkDisplay: "≥ 1.8x",
    },
  ];
}

/**
 * Main deterministic engine computing the 5-Pillar Snowflake Score.
 */
export function computeSnowflakeScore(
  reportData: ReportData,
  stressResult?: StressResult,
  locale: Locale = "en"
): SnowflakeScoreResult {
  const isZh = locale === "zh";
  const facts =
    isZh && reportData.factsZh ? reportData.factsZh : reportData.facts;
  const valuation = reportData.valuation;
  const catalysts =
    isZh && reportData.catalystsZh
      ? reportData.catalystsZh
      : reportData.catalysts;
  const moat = isZh && reportData.moatZh ? reportData.moatZh : reportData.moat;
  const baseline = reportData.baseline;

  function localizeCriteria(
    criteria: SnowflakeCriterion[]
  ): SnowflakeCriterion[] {
    return criteria.map((c) => ({
      ...c,
      name: isZh ? c.nameZh : c.name,
      description: isZh ? c.descriptionZh : c.description,
    }));
  }

  // 1. Valuation Pillar
  const rawValCriteria = computeValuationCriteria(
    facts,
    valuation,
    stressResult
  );
  const valScore = rawValCriteria.filter((c) => c.passed).length;
  const valSummaryEn =
    valScore >= 5
      ? "Substantial margin of safety with attractive risk/reward asymmetry"
      : valScore >= 3
        ? "Moderate valuation support with balanced upside"
        : "Elevated market multiple with compressed margin of safety";
  const valSummaryZh =
    valScore >= 5
      ? "安全边际极为充裕，具备高度不对称的上行收益赔率"
      : valScore >= 3
        ? "估值处于合理中枢，上行空间与风险相对平衡"
        : "当前市场估值倍数偏高，安全边际受到压缩";

  const valPillar: SnowflakePillar = {
    id: "valuation",
    label: isZh ? "估值与安全边际" : "Valuation & Margin of Safety",
    labelZh: "估值与安全边际",
    shortLabel: isZh ? "估值" : "Valuation",
    shortLabelZh: "估值",
    score: valScore,
    maxScore: 6,
    color: "#10b981", // Emerald
    summary: isZh ? valSummaryZh : valSummaryEn,
    summaryZh: valSummaryZh,
    criteria: localizeCriteria(rawValCriteria),
  };

  // 2. Future Growth & Catalysts Pillar
  const rawFutCriteria = computeFutureCriteria(facts, catalysts);
  const futScore = rawFutCriteria.filter((c) => c.passed).length;
  const futSummaryEn =
    futScore >= 5
      ? "Aggressive multi-segment growth backed by high-conviction catalysts"
      : futScore >= 3
        ? "Steady forward trajectory with selective catalyst triggers"
        : "Decelerating forward trajectory with subdued forward drivers";
  const futSummaryZh =
    futScore >= 5
      ? "各主营分部实现高速扩张，具备高概率核心催化剂护航"
      : futScore >= 3
        ? "前瞻增速稳健，由局部产品与结构性催化剂驱动"
        : "增长出现减速迹象，前瞻上行动能相对有限";

  const futPillar: SnowflakePillar = {
    id: "future",
    label: isZh ? "未来增长与催化剂" : "Future Growth & Catalysts",
    labelZh: "未来增长与催化剂",
    shortLabel: isZh ? "增长" : "Future",
    shortLabelZh: "增长",
    score: futScore,
    maxScore: 6,
    color: "#06b6d4", // Cyan
    summary: isZh ? futSummaryZh : futSummaryEn,
    summaryZh: futSummaryZh,
    criteria: localizeCriteria(rawFutCriteria),
  };

  // 3. Earnings Quality Pillar
  const rawEarnCriteria = computeEarningsQualityCriteria(facts);
  const earnScore = rawEarnCriteria.filter((c) => c.passed).length;
  const earnSummaryEn =
    earnScore >= 5
      ? "Top-tier operating efficiency with clean GAAP conversion"
      : earnScore >= 3
        ? "Acceptable commercial margins with manageable one-offs"
        : "Margin compression or heavy reliance on non-operating adjustments";
  const earnSummaryZh =
    earnScore >= 5
      ? "卓越的营业利润率与经营杠杆，经常性盈利现金转化极高"
      : earnScore >= 3
        ? "利润率处于行业平均水平，一次性非经常损益可控"
        : "面临利润率承压或较多依赖非经常性调整项";

  const earnPillar: SnowflakePillar = {
    id: "earnings",
    label: isZh ? "盈利质量与利润率" : "Earnings Quality & Margins",
    labelZh: "盈利质量与利润率",
    shortLabel: isZh ? "质量" : "Quality",
    shortLabelZh: "质量",
    score: earnScore,
    maxScore: 6,
    color: "#6366f1", // Indigo
    summary: isZh ? earnSummaryZh : earnSummaryEn,
    summaryZh: earnSummaryZh,
    criteria: localizeCriteria(rawEarnCriteria),
  };

  // 4. Economic Moat Pillar
  const rawMoatCriteria = computeMoatCriteria(facts, moat);
  const moatScore = rawMoatCriteria.filter((c) => c.passed).length;
  const moatSummaryEn =
    moatScore >= 5
      ? "Durable structural moat with expanding industry pricing power"
      : moatScore >= 3
        ? "Identifiable competitive advantages with stable peer positioning"
        : "Vulnerable to peer price cuts and technological commoditization";
  const moatSummaryZh =
    moatScore >= 5
      ? "具备深厚且持续拓宽的结构性壁垒与强势定价权"
      : moatScore >= 3
        ? "具备明确竞争壁垒，在同行竞争中占据稳固生态位"
        : "容易受到同业价格战与技术商品化侵蚀";

  const moatPillar: SnowflakePillar = {
    id: "moat",
    label: isZh ? "经济护城河与竞争优势" : "Economic Moat & Benchmarking",
    labelZh: "经济护城河与竞争优势",
    shortLabel: isZh ? "壁垒" : "Moat",
    shortLabelZh: "壁垒",
    score: moatScore,
    maxScore: 6,
    color: "#f59e0b", // Amber
    summary: isZh ? moatSummaryZh : moatSummaryEn,
    summaryZh: moatSummaryZh,
    criteria: localizeCriteria(rawMoatCriteria),
  };

  // 5. Stress Resilience Pillar
  const rawResCriteria = computeResilienceCriteria(
    facts,
    stressResult,
    baseline
  );
  const resScore = rawResCriteria.filter((c) => c.passed).length;
  const resSummaryEn =
    resScore >= 5
      ? "Robust panic floor and high solvency cushion under upstream shocks"
      : resScore >= 3
        ? "Manageable sensitivity to macro downturns with moderate buffer"
        : "Elevated vulnerability to demand contractions and operating deleverage";
  const resSummaryZh =
    resScore >= 5
      ? "极端压力测试下偿付与底线防御力卓越，安全边际极强"
      : resScore >= 3
        ? "在宏观逆风下表现出较强承受力，下行具备一定缓冲"
        : "面对需求回落与经营去杠杆时容易出现较大幅度回撤";

  const resPillar: SnowflakePillar = {
    id: "resilience",
    label: isZh ? "压力韧性与下行底线" : "Downside Floor & Stress Resilience",
    labelZh: "压力韧性与下行底线",
    shortLabel: isZh ? "韧性" : "Resilience",
    shortLabelZh: "韧性",
    score: resScore,
    maxScore: 6,
    color: "#ec4899", // Rose
    summary: isZh ? resSummaryZh : resSummaryEn,
    summaryZh: resSummaryZh,
    criteria: localizeCriteria(rawResCriteria),
  };

  const totalScore = valScore + futScore + earnScore + moatScore + resScore;
  const maxScore = 30;
  const percentage = Math.round((totalScore / maxScore) * 100);

  let ratingTier: SnowflakeScoreResult["ratingTier"] = "balanced";
  let ratingLabelEn = "Balanced Institutional Setup";
  let ratingLabelZh = "均衡稳健型配置";

  if (totalScore >= 24) {
    ratingTier = "exceptional";
    ratingLabelEn = "Exceptional Alpha Conviction";
    ratingLabelZh = "顶级阿尔法强置信度";
  } else if (totalScore >= 18) {
    ratingTier = "strong";
    ratingLabelEn = "High-Quality Investment Grade";
    ratingLabelZh = "高确定性投资级";
  } else if (totalScore >= 12) {
    ratingTier = "balanced";
    ratingLabelEn = "Selective Opportunity";
    ratingLabelZh = "结构性择时配置";
  } else {
    ratingTier = "cautious";
    ratingLabelEn = "Elevated Fundamental Risk";
    ratingLabelZh = "基本面风险预警";
  }

  const pillars: Record<SnowflakeAxisId, SnowflakePillar> = {
    valuation: valPillar,
    future: futPillar,
    earnings: earnPillar,
    moat: moatPillar,
    resilience: resPillar,
  };

  const pillarList: SnowflakePillar[] = [
    valPillar,
    futPillar,
    earnPillar,
    moatPillar,
    resPillar,
  ];

  return {
    totalScore,
    maxScore,
    percentage,
    ratingTier,
    ratingLabel: isZh ? ratingLabelZh : ratingLabelEn,
    ratingLabelZh,
    pillars,
    pillarList,
  };
}
