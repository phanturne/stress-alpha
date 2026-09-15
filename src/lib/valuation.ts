import type {
  Facts,
  Scenarios,
  Valuation,
  FinancialModelBaseline,
  StressResult,
  ScenarioResult,
  SensitivityEntry,
} from "./schemas";

export interface StressTestParams {
  driverShocks?: Record<string, number>; // driverId -> shock percentage (e.g. -20 for -20%)
  grossMarginBpsDelta?: number;          // e.g. -250 for -250 bps (-2.5%)
  fixedOpexShiftPct?: number;            // e.g. +5 for +5% OpEx shift
}

export interface ValuationInput {
  facts: Facts;
  scenarios: Scenarios;
  baseline?: FinancialModelBaseline;
  stressParams?: StressTestParams;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Deterministic stress-testing engine (StressAlpha flow-through accounting).
 * Upstream shocks -> ΔRevenue -> Gross Profit -> OpEx leverage -> Net Income -> EPS -> Valuation Bands
 */
export function computeStressedValuation(
  baseline: FinancialModelBaseline,
  currentPrice: number,
  params: StressTestParams = {}
): StressResult {
  const driverShocks = params.driverShocks ?? {};
  const gmBpsDelta = params.grossMarginBpsDelta ?? 0;
  const opexShiftPct = params.fixedOpexShiftPct ?? 0;

  // 1. Calculate revenue shock from upstream exposure
  let totalRevShiftPct = 0;
  const appliedShocks: Record<string, number> = {};

  for (const driver of baseline.upstreamDrivers) {
    const shock = driverShocks[driver.id] ?? driver.defaultShockPct ?? 0;
    appliedShocks[driver.id] = shock;
    totalRevShiftPct += driver.exposureShare * driver.elasticity * (shock / 100);
  }

  const stressRevenueBillions = round2(baseline.baseRevenueBillions * (1 + totalRevShiftPct));

  // 2. Gross profit with margin compression / expansion
  const stressGrossMarginPct = baseline.baseGrossMarginPct + (gmBpsDelta / 100);
  const stressGrossProfitBillions = round2(stressRevenueBillions * (stressGrossMarginPct / 100));

  // 3. Operating income with operating leverage / fixed costs
  const stressFixedOpex = baseline.fixedOpexBillions * (1 + opexShiftPct / 100);
  const stressOperatingIncomeBillions = round2(stressGrossProfitBillions - stressFixedOpex);

  // 4. Net income and EPS
  const taxRate = (baseline.taxRatePct ?? 16.5) / 100;
  const stressNetIncomeBillions = round2(Math.max(0, stressOperatingIncomeBillions * (1 - taxRate)));
  const stressEps = round2(
    baseline.dilutedSharesBillions > 0
      ? (stressNetIncomeBillions * 1000) / (baseline.dilutedSharesBillions * 1000)
      : 0
  );

  // 5. Valuation Bands across Regimes
  const targetBull = round2(stressEps * baseline.multipleRegimes.bull);
  const targetBase = round2(stressEps * baseline.multipleRegimes.base);
  const targetPanic = round2(stressEps * baseline.multipleRegimes.panic);

  const deltaBull = currentPrice > 0 ? round2(((targetBull - currentPrice) / currentPrice) * 100) : 0;
  const deltaBase = currentPrice > 0 ? round2(((targetBase - currentPrice) / currentPrice) * 100) : 0;
  const deltaPanic = currentPrice > 0 ? round2(((targetPanic - currentPrice) / currentPrice) * 100) : 0;

  // 6. Asymmetry metrics
  const marketPricedInMultiple = stressEps > 0 ? round2(currentPrice / stressEps) : 0;
  const downsideToPanic = deltaPanic;
  const downsideToBase = deltaBase;
  const upsideToBull = deltaBull;
  const riskRewardRatio =
    downsideToPanic < 0
      ? round2(Math.abs(upsideToBull / downsideToPanic))
      : round2(upsideToBull);

  return {
    stressRevenueBillions,
    stressGrossProfitBillions,
    stressOperatingIncomeBillions,
    stressNetIncomeBillions,
    stressEps,
    valuationBands: {
      bull: {
        regime: "bull",
        label: `Bull Regime (${baseline.multipleRegimes.bull}x P/E)`,
        multiple: baseline.multipleRegimes.bull,
        targetPrice: targetBull,
        deltaFromCurrentPct: deltaBull,
      },
      base: {
        regime: "base",
        label: `Base Regime (${baseline.multipleRegimes.base}x P/E)`,
        multiple: baseline.multipleRegimes.base,
        targetPrice: targetBase,
        deltaFromCurrentPct: deltaBase,
      },
      panic: {
        regime: "panic",
        label: `Panic Regime (${baseline.multipleRegimes.panic}x P/E)`,
        multiple: baseline.multipleRegimes.panic,
        targetPrice: targetPanic,
        deltaFromCurrentPct: deltaPanic,
      },
    },
    asymmetry: {
      downsideToBasePct: downsideToBase,
      downsideToPanicPct: downsideToPanic,
      upsideToBullPct: upsideToBull,
      marketPricedInMultiple,
      riskRewardRatio,
    },
    driverShocksApplied: appliedShocks,
    grossMarginBpsDeltaApplied: gmBpsDelta,
    fixedOpexShiftPctApplied: opexShiftPct,
  };
}

/**
 * Compute the probability-weighted fair value and per-scenario results.
 */
export function computeValuation(input: ValuationInput): Valuation {
  const { facts, scenarios } = input;
  const currentPrice = scenarios.currentPrice || facts.currentPrice;

  // StressAlpha flow-through computation if baseline provided
  const baseline = input.baseline ?? scenarios.baseline;
  let stressTest: StressResult | undefined;
  let shockMultiplier = 1.0;

  if (baseline) {
    stressTest = computeStressedValuation(baseline, currentPrice, input.stressParams);
    // If stressParams are supplied, calculate the flow-through scale multiplier
    const unperturbed = computeStressedValuation(baseline, currentPrice, {});
    if (unperturbed.stressEps > 0 && stressTest.stressEps > 0) {
      shockMultiplier = stressTest.stressEps / unperturbed.stressEps;
    }
  }

  // Per-scenario fair values (dynamically modulated by flow-through shock)
  const scenarioResults: ScenarioResult[] = scenarios.scenarios.map((s) => {
    const effectiveEps = s.forwardEps * shockMultiplier;
    const fairValue = effectiveEps * s.multiple;
    const upsideFromCurrent = currentPrice > 0 ? ((fairValue - currentPrice) / currentPrice) * 100 : 0;
    return {
      name: s.name,
      probability: s.probability,
      fairValue: round2(fairValue),
      upsideFromCurrent: round2(upsideFromCurrent),
    };
  });

  // Probability-weighted fair value
  const weightedFairValue = round2(
    scenarioResults.reduce((acc, r) => acc + r.probability * r.fairValue, 0)
  );

  const upsidePct = currentPrice > 0 ? round2(((weightedFairValue - currentPrice) / currentPrice) * 100) : 0;

  // Sensitivity analysis: perturb EPS ±10% and multiple ±2 for each scenario
  const sensitivity: SensitivityEntry[] = [];

  for (const s of scenarios.scenarios) {
    const effectiveEps = s.forwardEps * shockMultiplier;
    const baseFV = effectiveEps * s.multiple;

    // EPS sensitivity
    const epsUp = effectiveEps * 1.1;
    const epsDown = effectiveEps * 0.9;
    sensitivity.push({
      scenario: s.name,
      parameter: "EPS +10%",
      baseValue: round2(effectiveEps),
      altValue: round2(epsUp),
      fairValueDelta: round2(epsUp * s.multiple - baseFV),
    });
    sensitivity.push({
      scenario: s.name,
      parameter: "EPS -10%",
      baseValue: round2(effectiveEps),
      altValue: round2(epsDown),
      fairValueDelta: round2(epsDown * s.multiple - baseFV),
    });

    // Multiple sensitivity
    const multUp = s.multiple + 2;
    const multDown = s.multiple - 2;
    sensitivity.push({
      scenario: s.name,
      parameter: "Multiple +2",
      baseValue: s.multiple,
      altValue: multUp,
      fairValueDelta: round2(effectiveEps * multUp - baseFV),
    });
    sensitivity.push({
      scenario: s.name,
      parameter: "Multiple -2",
      baseValue: s.multiple,
      altValue: multDown,
      fairValueDelta: round2(effectiveEps * multDown - baseFV),
    });
  }

  // Verdict vs consensus
  const consensusTarget = scenarios.consensusTarget || 0;
  let verdictVsConsensus = "N/A";
  if (consensusTarget > 0) {
    const diff = weightedFairValue - consensusTarget;
    const diffPct = round2((diff / consensusTarget) * 100);
    if (Math.abs(diffPct) < 5) {
      verdictVsConsensus = `In line with consensus ($${consensusTarget}) — delta ${diffPct > 0 ? "+" : ""}${diffPct}%`;
    } else if (diffPct > 0) {
      verdictVsConsensus = `Above consensus ($${consensusTarget}) by ${diffPct}% — more bullish`;
    } else {
      verdictVsConsensus = `Below consensus ($${consensusTarget}) by ${Math.abs(diffPct)}% — more cautious`;
    }
  }

  return {
    ticker: facts.ticker,
    analysisDate: facts.analysisDate,
    currentPrice,
    weightedFairValue,
    upsidePct,
    scenarioResults,
    sensitivity,
    consensusTarget,
    verdictVsConsensus,
    baseline,
    stressTest,
  };
}

/**
 * Derives a fallback baseline if stress-baseline.json is not present
 */
export function deriveEffectiveBaseline(facts: Facts): FinancialModelBaseline {
  const shares = facts.currentPrice > 0 ? (facts.marketCapBillions * 1000) / facts.currentPrice : 10.83;
  const opIncome = facts.operatingIncomeBillions || 25;
  const estGrossMargin = 48.0;
  const grossProfit = facts.revenueBillions * (estGrossMargin / 100);
  const fixedOpex = Math.max(0, grossProfit - opIncome);

  return {
    baseRevenueBillions: facts.revenueBillions,
    baseGrossMarginPct: estGrossMargin,
    fixedOpexBillions: round2(fixedOpex),
    taxRatePct: 16.5,
    dilutedSharesBillions: round2(shares),
    multipleRegimes: { bull: 34, base: 28, panic: 18 },
    upstreamDrivers: [
      { id: "hyperscaler-capex", name: "Hyperscaler Cloud CapEx Growth", exposureShare: 0.35, elasticity: 0.85, defaultShockPct: 0, minShockPct: -40, maxShockPct: 40 },
      { id: "consumer-demand", name: "Consumer & E-Commerce Demand", exposureShare: 0.45, elasticity: 0.70, defaultShockPct: 0, minShockPct: -30, maxShockPct: 30 },
      { id: "ad-budgets", name: "Digital Advertising Budgets", exposureShare: 0.20, elasticity: 0.90, defaultShockPct: 0, minShockPct: -40, maxShockPct: 40 },
    ],
  };
}
