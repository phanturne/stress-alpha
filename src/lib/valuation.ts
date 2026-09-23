import type {
  Facts,
  Scenarios,
  Scenario,
  Valuation,
  FinancialModelBaseline,
  StressResult,
  ScenarioResult,
  SensitivityEntry,
  MoatCompetitors,
  AnalystEstimates,
  CalibrationAudit,
  CalibrationStep,
  ValuationArchetype,
} from "./schemas";

export interface StressTestParams {
  driverShocks?: Record<string, number>; // driverId -> shock percentage (e.g. -20 for -20%)
  grossMarginBpsDelta?: number; // e.g. -250 for -250 bps (-2.5%)
  fixedOpexShiftPct?: number; // e.g. +5 for +5% OpEx shift
}

export interface ValuationInput {
  facts: Facts;
  scenarios: Scenarios;
  baseline?: FinancialModelBaseline;
  stressParams?: StressTestParams;
  moat?: MoatCompetitors;
  estimates?: AnalystEstimates;
  disableAutoCalibration?: boolean;
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
    totalRevShiftPct +=
      driver.exposureShare * driver.elasticity * (shock / 100);
  }

  const stressRevenueBillions = round2(
    baseline.baseRevenueBillions * (1 + totalRevShiftPct)
  );

  // 2. Gross profit with margin compression / expansion
  const stressGrossMarginPct = baseline.baseGrossMarginPct + gmBpsDelta / 100;
  const stressGrossProfitBillions = round2(
    stressRevenueBillions * (stressGrossMarginPct / 100)
  );

  // 3. Operating income with operating leverage / fixed costs
  const stressFixedOpex = baseline.fixedOpexBillions * (1 + opexShiftPct / 100);
  const stressOperatingIncomeBillions = round2(
    stressGrossProfitBillions - stressFixedOpex
  );

  // 4. Net income and EPS
  const taxRate = (baseline.taxRatePct ?? 16.5) / 100;
  const stressNetIncomeBillions = round2(
    Math.max(0, stressOperatingIncomeBillions * (1 - taxRate))
  );
  const stressEps = round2(
    baseline.dilutedSharesBillions > 0
      ? (stressNetIncomeBillions * 1000) /
          (baseline.dilutedSharesBillions * 1000)
      : 0
  );

  // 5. Valuation Bands across Regimes
  const targetBull = round2(stressEps * baseline.multipleRegimes.bull);
  const targetBase = round2(stressEps * baseline.multipleRegimes.base);
  const targetPanic = round2(stressEps * baseline.multipleRegimes.panic);

  const deltaBull =
    currentPrice > 0
      ? round2(((targetBull - currentPrice) / currentPrice) * 100)
      : 0;
  const deltaBase =
    currentPrice > 0
      ? round2(((targetBase - currentPrice) / currentPrice) * 100)
      : 0;
  const deltaPanic =
    currentPrice > 0
      ? round2(((targetPanic - currentPrice) / currentPrice) * 100)
      : 0;

  // 6. Asymmetry metrics
  const marketPricedInMultiple =
    stressEps > 0 ? round2(currentPrice / stressEps) : 0;
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

export interface CalibrationInput {
  scenarios: Scenario[];
  facts: Facts;
  baseline?: FinancialModelBaseline;
  moat?: MoatCompetitors;
  estimates?: AnalystEstimates;
  currentPrice: number;
}

export interface CalibrationResult {
  probabilities: number[];
  calibrationAudit: CalibrationAudit;
}

/**
 * Quantitative Probability Calibration Engine (QPCE).
 * Dynamically modulates scenario probability distributions using:
 * Pillar 1: Governance & Event-Risk Haircut (Lexicographic Governance Veto)
 * Pillar 2: Moat & Margin Resilience (Costco Compounder Exemption)
 * Pillar 3: Sell-Side Consensus Skew & Dispersion
 * Pillar 4: Market-Implied Reality Check (Bayesian Shrinkage, w_mkt = 0.20)
 * All operations executed in Multinomial Log-Odds (Softmax) space.
 */
export function calibrateScenarioProbabilities(
  input: CalibrationInput
): CalibrationResult {
  const { scenarios, facts, moat, estimates, currentPrice } = input;

  // Identify standard regime indices
  const bullIdx = scenarios.findIndex((s) =>
    s.name.toLowerCase().includes("bull")
  );
  const baseIdx = scenarios.findIndex((s) =>
    s.name.toLowerCase().includes("base")
  );
  const panicIdx = scenarios.findIndex(
    (s) =>
      s.name.toLowerCase().includes("panic") ||
      s.name.toLowerCase().includes("bear")
  );

  const rawProbMap: Record<string, number> = {};
  for (const s of scenarios) {
    rawProbMap[s.name] = s.rawProbability ?? s.probability;
  }

  // Fallback: If scenarios do not map cleanly to 3 distinct regimes, retain raw probabilities
  if (
    scenarios.length !== 3 ||
    bullIdx === -1 ||
    baseIdx === -1 ||
    panicIdx === -1 ||
    new Set([bullIdx, baseIdx, panicIdx]).size !== 3
  ) {
    const rawProbs = scenarios.map((s) => s.rawProbability ?? s.probability);
    return {
      probabilities: rawProbs,
      calibrationAudit: {
        rawProbabilities: rawProbMap,
        calibratedProbabilities: rawProbMap,
        governanceVetoTriggered: false,
        skewDirection: "balanced",
        steps: [
          {
            pillar: "prior",
            label: "Custom Scenarios Passthrough",
            deltaBullLogit: 0,
            deltaBaseLogit: 0,
            deltaPanicLogit: 0,
            rationale:
              "Scenarios do not strictly conform to standard 3-regime triad (Bull, Base, Panic/Bear). Retaining raw priors.",
          },
        ],
      },
    };
  }

  // 1. Initial Log-odds from priors
  const p0_bull = Math.max(
    0.01,
    scenarios[bullIdx].rawProbability ?? scenarios[bullIdx].probability
  );
  const p0_base = Math.max(
    0.01,
    scenarios[baseIdx].rawProbability ?? scenarios[baseIdx].probability
  );
  const p0_panic = Math.max(
    0.01,
    scenarios[panicIdx].rawProbability ?? scenarios[panicIdx].probability
  );

  let z_bull = Math.log(p0_bull);
  let z_base = Math.log(p0_base);
  let z_panic = Math.log(p0_panic);

  const steps: CalibrationStep[] = [
    {
      pillar: "prior",
      label: "Prior Baseline Distribution",
      deltaBullLogit: round2(z_bull),
      deltaBaseLogit: round2(z_base),
      deltaPanicLogit: round2(z_panic),
      rationale: `Initialized log-odds from scenario priors (${round2(
        p0_bull * 100
      )}% Bull, ${round2(p0_base * 100)}% Base, ${round2(
        p0_panic * 100
      )}% Panic).`,
    },
  ];

  // 2. Pillar 1: Governance & Accounting Flags (Lexicographic Governance Veto)
  const govRisk = facts.governanceRisk ?? "none";
  const accountingFlagsCount = (facts.accountingFlags ?? []).length;
  const isDoj = facts.materialLitigationOrDoj ?? false;
  const isSevere = govRisk === "severe" || accountingFlagsCount >= 2 || isDoj;
  const isModerate =
    !isSevere && (govRisk === "moderate" || accountingFlagsCount === 1);
  const isLow = !isSevere && !isModerate && govRisk === "low";

  let govVeto = false;
  let d_bull_p1 = 0;
  let d_base_p1 = 0;
  let d_panic_p1 = 0;

  if (isSevere) {
    govVeto = true;
    d_panic_p1 = 1.35;
    d_bull_p1 = -1.6;
    d_base_p1 = -0.2;
    steps.push({
      pillar: "governance",
      label: "Severe Governance Veto Triggered",
      deltaBullLogit: d_bull_p1,
      deltaBaseLogit: d_base_p1,
      deltaPanicLogit: d_panic_p1,
      rationale: `Severe corporate governance risk detected (${accountingFlagsCount} accounting flag(s), DOJ/litigation: ${isDoj}). Asymmetric panic floor imposed; gross margin defense cushions disabled.`,
    });
  } else if (isModerate) {
    d_panic_p1 = 0.7;
    d_bull_p1 = -0.6;
    d_base_p1 = -0.1;
    steps.push({
      pillar: "governance",
      label: "Moderate Governance Penalty",
      deltaBullLogit: d_bull_p1,
      deltaBaseLogit: d_base_p1,
      deltaPanicLogit: d_panic_p1,
      rationale:
        "Moderate corporate governance risk detected. Downside tail weight elevated.",
    });
  } else if (isLow) {
    d_panic_p1 = 0.3;
    d_bull_p1 = -0.25;
    d_base_p1 = -0.05;
    steps.push({
      pillar: "governance",
      label: "Low Governance Adjustment",
      deltaBullLogit: d_bull_p1,
      deltaBaseLogit: d_base_p1,
      deltaPanicLogit: d_panic_p1,
      rationale: "Minor governance overhang noted. Minor adjustment applied.",
    });
  }

  z_bull += d_bull_p1;
  z_base += d_base_p1;
  z_panic += d_panic_p1;

  // 3. Pillar 2: Moat & Margin Resilience with Archetype-Aware Branching
  let d_bull_p2 = 0;
  let d_base_p2 = 0;
  let d_panic_p2 = 0;

  // Resolve Archetype with Deterministic Invariant Gating
  const rawArchetype = facts.valuationArchetype;
  const revGrowth = facts.revenueGrowthPct ?? 0;
  const opMargin = facts.operatingMarginPct ?? 0;
  const grossMargin =
    facts.grossMarginPct ?? input.baseline?.baseGrossMarginPct;

  let resolvedArchetype: ValuationArchetype = "compounder";
  let netRunwayMonths: number | undefined;

  const isVentureCandidate =
    rawArchetype === "venture_hypergrowth" || (revGrowth >= 50 && opMargin < 0);

  if (isVentureCandidate) {
    // Deterministic Gating Invariant: Must possess positive unit economics (grossMargin >= 35%) and revGrowth >= 50%
    if (
      revGrowth >= 50 &&
      (grossMargin !== undefined ? grossMargin >= 35 : true)
    ) {
      resolvedArchetype = "venture_hypergrowth";
    } else {
      // Invariant failed: cannot claim hypergrowth exemption without valid unit economics
      resolvedArchetype = "compounder";
      steps.push({
        pillar: "moat_margin",
        label: "Venture Archetype Gating Invariant Rejection",
        deltaBullLogit: 0,
        deltaBaseLogit: 0,
        deltaPanicLogit: 0,
        rationale: `Rejected venture hypergrowth classification: gross margin (${grossMargin ?? "N/A"}%) or revenue velocity (+${revGrowth}%) failed minimum unit-economics threshold (>= 35% GM, >= 50% growth). Reverted to compounder rubric.`,
      });
    }
  } else if (
    rawArchetype === "operating_scaler" ||
    (revGrowth >= 25 && (grossMargin ?? 60) >= 60 && opMargin >= 0)
  ) {
    resolvedArchetype = "operating_scaler";
  } else {
    resolvedArchetype = "compounder";
  }

  // Check Costco compounder exemption
  const isWideMoatCompounder =
    moat?.overallMoatRating === "Wide" &&
    (moat?.moatSources ?? []).some(
      (m) =>
        (m.source === "Switching Costs" || m.source === "Cost Advantage") &&
        m.durabilityYears >= 10
    );

  if (govVeto) {
    // Under governance veto, all margin cushions and venture exemptions are disabled.
    // Only negative moat trends apply.
    if (moat?.moatTrend === "Narrowing" || moat?.overallMoatRating === "None") {
      d_panic_p2 += 0.4;
      d_bull_p2 -= 0.35;
      steps.push({
        pillar: "moat_margin",
        label: "Narrowing Moat Under Governance Veto",
        deltaBullLogit: -0.35,
        deltaBaseLogit: 0,
        deltaPanicLogit: 0.4,
        rationale:
          "Governance veto active. Margin cushions and venture exemptions disabled; eroding moat accelerates panic probability.",
      });
    }
  } else if (resolvedArchetype === "venture_hypergrowth") {
    // Archetype C: Venture Hyper-Growth & Capital-Intensive Scale-Up
    // 1. Unit Economics Audit
    const gm = grossMargin ?? 50;
    if (gm < 35) {
      d_panic_p2 += 0.6;
      d_bull_p2 -= 0.5;
      steps.push({
        pillar: "moat_margin",
        label: "Deficient Unit Economics Penalty",
        deltaBullLogit: -0.5,
        deltaBaseLogit: 0,
        deltaPanicLogit: 0.6,
        rationale: `Venture scale-up has gross margin of ${gm}% (< 35% floor). Scaled revenue destroys capital with negative unit margins.`,
      });
    } else {
      // Unit economics exemption: Waive negative operating margin penalty!
      d_bull_p2 += 0.1;
      d_panic_p2 -= 0.1;
      steps.push({
        pillar: "moat_margin",
        label: "Venture Unit Economics Exemption",
        deltaBullLogit: 0.1,
        deltaBaseLogit: 0,
        deltaPanicLogit: -0.1,
        rationale: `High gross margin (${gm}%) and revenue velocity (+${revGrowth}%) validate unit economics. Operating loss treated as growth reinvestment rather than structural failure.`,
      });
    }

    // 2. Net Liquid Cash Runway & Dilution Overhang Audit
    const cash = facts.cashAndEquivalentsBillions ?? 0;
    const debt = facts.shortTermDebtBillions ?? 0;
    const netCash = Math.max(0, cash - debt);
    const quarterlyBurn =
      facts.quarterlyCashBurnBillions ??
      (facts.operatingIncomeBillions < 0
        ? Math.abs(facts.operatingIncomeBillions)
        : 0);
    const monthlyBurn = quarterlyBurn > 0 ? quarterlyBurn / 3 : 0;
    const computedRunway = monthlyBurn > 0 ? netCash / monthlyBurn : 24;
    netRunwayMonths =
      facts.cashRunwayMonths !== undefined
        ? facts.cashRunwayMonths
        : computedRunway;

    if (netRunwayMonths < 9) {
      d_panic_p2 += 1.25;
      d_bull_p2 -= 1.1;
      d_base_p2 -= 0.2;
      steps.push({
        pillar: "moat_margin",
        label: "Acute Capital Dilution Overhang",
        deltaBullLogit: -1.1,
        deltaBaseLogit: -0.2,
        deltaPanicLogit: 1.25,
        rationale: `Net liquid cash runway is only ${round2(
          netRunwayMonths
        )} months (< 9m critical threshold). Dilutive emergency equity financing or down-round multiple contraction is imminent.`,
      });
    } else if (netRunwayMonths < 18) {
      d_panic_p2 += 0.5;
      d_bull_p2 -= 0.35;
      d_base_p2 -= 0.15;
      steps.push({
        pillar: "moat_margin",
        label: "Moderate Runway Dilution Overhang",
        deltaBullLogit: -0.35,
        deltaBaseLogit: -0.15,
        deltaPanicLogit: 0.5,
        rationale: `Net liquid cash runway is ${round2(
          netRunwayMonths
        )} months (9-18m range). Secondary offering capital raise risk moderately dampens valuation multiples.`,
      });
    } else {
      d_bull_p2 += 0.15;
      steps.push({
        pillar: "moat_margin",
        label: "Abundant Net Liquid Runway",
        deltaBullLogit: 0.15,
        deltaBaseLogit: 0,
        deltaPanicLogit: 0,
        rationale: `Abundant net cash runway (${round2(
          netRunwayMonths
        )}m) fully funds scale-up path to cash flow breakeven without near-term equity dilution.`,
      });
    }

    if (moat?.overallMoatRating === "Wide" && moat?.moatTrend === "Widening") {
      d_bull_p2 += 0.2;
      d_panic_p2 -= 0.2;
    } else if (moat?.moatTrend === "Narrowing") {
      d_panic_p2 += 0.3;
      d_bull_p2 -= 0.25;
    }
  } else if (resolvedArchetype === "operating_scaler") {
    // Archetype B: Operating Leverage Scaler
    if (opMargin >= 20) {
      d_bull_p2 += 0.3;
      d_panic_p2 -= 0.35;
      d_base_p2 += 0.1;
    } else if (opMargin >= 10) {
      d_bull_p2 += 0.2;
      d_panic_p2 -= 0.2;
    }

    if (moat?.overallMoatRating === "Wide" && moat?.moatTrend === "Widening") {
      d_bull_p2 += 0.25;
      d_panic_p2 -= 0.25;
    } else if (
      moat?.overallMoatRating === "None" ||
      moat?.moatTrend === "Narrowing"
    ) {
      d_panic_p2 += 0.35;
      d_bull_p2 -= 0.3;
    }

    if (d_bull_p2 !== 0 || d_base_p2 !== 0 || d_panic_p2 !== 0) {
      steps.push({
        pillar: "moat_margin",
        label: "Operating Leverage Scaler Calibration",
        deltaBullLogit: round2(d_bull_p2),
        deltaBaseLogit: round2(d_base_p2),
        deltaPanicLogit: round2(d_panic_p2),
        rationale: `Operating scaler profile (revenue growth +${revGrowth}%, operating margin ${opMargin}%) evaluated for operating leverage velocity.`,
      });
    }
  } else {
    // Archetype A: Cash Flow Compounder
    if (opMargin < 15 && !isWideMoatCompounder) {
      d_panic_p2 += 0.5;
      d_bull_p2 -= 0.3;
      d_base_p2 -= 0.2;
    } else if (opMargin > 30) {
      d_bull_p2 += 0.3;
      d_panic_p2 -= 0.4;
      d_base_p2 += 0.1;
    }

    if (moat?.overallMoatRating === "Wide" && moat?.moatTrend === "Widening") {
      d_bull_p2 += 0.25;
      d_panic_p2 -= 0.25;
    } else if (
      moat?.overallMoatRating === "None" ||
      moat?.moatTrend === "Narrowing"
    ) {
      d_panic_p2 += 0.4;
      d_bull_p2 -= 0.35;
    }

    if (d_bull_p2 !== 0 || d_base_p2 !== 0 || d_panic_p2 !== 0) {
      steps.push({
        pillar: "moat_margin",
        label: "Moat & Margin Resilience Calibration",
        deltaBullLogit: round2(d_bull_p2),
        deltaBaseLogit: round2(d_base_p2),
        deltaPanicLogit: round2(d_panic_p2),
        rationale: `Operating margin (${opMargin}%) and moat profile (${
          moat?.overallMoatRating ?? "N/A"
        } / ${moat?.moatTrend ?? "N/A"}) evaluated. ${
          isWideMoatCompounder ? "Compounder defense exemption active." : ""
        }`,
      });
    }
  }

  z_bull += d_bull_p2;
  z_base += d_base_p2;
  z_panic += d_panic_p2;

  // 4. Pillar 3: Sell-Side Consensus Skew & Dispersion
  let d_bull_p3 = 0;
  let d_base_p3 = 0;
  let d_panic_p3 = 0;

  if (estimates?.consensus) {
    const total = estimates.consensus.totalAnalysts || 0;
    const bullish = estimates.consensus.bullishCount || 0;
    const bullRatio = total > 0 ? bullish / total : 0.5;

    if (bullRatio >= 0.8) {
      d_bull_p3 += 0.25;
      d_panic_p3 -= 0.25;
    } else if (bullRatio <= 0.35) {
      d_panic_p3 += 0.4;
      d_bull_p3 -= 0.4;
    }

    const avg = estimates.priceTargets?.average || 0;
    const high = estimates.priceTargets?.high || 0;
    const low = estimates.priceTargets?.low || 0;
    const dispersion = avg > 0 ? (high - low) / avg : 0;

    if (dispersion > 0.8) {
      d_base_p3 -= 0.25;
      d_panic_p3 += 0.15;
      d_bull_p3 += 0.1;
    } else if (dispersion < 0.35 && dispersion > 0) {
      d_base_p3 += 0.3;
      d_panic_p3 -= 0.15;
      d_bull_p3 -= 0.15;
    }

    if (d_bull_p3 !== 0 || d_base_p3 !== 0 || d_panic_p3 !== 0) {
      steps.push({
        pillar: "consensus_skew",
        label: "Analyst Consensus & Dispersion Skew",
        deltaBullLogit: round2(d_bull_p3),
        deltaBaseLogit: round2(d_base_p3),
        deltaPanicLogit: round2(d_panic_p3),
        rationale: `Street consensus bullish ratio (${round2(
          bullRatio * 100
        )}%) and target dispersion (${round2(dispersion * 100)}%) integrated.`,
      });
    }
  }

  z_bull += d_bull_p3;
  z_base += d_base_p3;
  z_panic += d_panic_p3;

  // 5. Pillar 4: Market-Implied Reality Check (Bayesian Shrinkage, w_mkt = 0.20)
  const fairBull = scenarios[bullIdx].forwardEps * scenarios[bullIdx].multiple;
  const fairBase = scenarios[baseIdx].forwardEps * scenarios[baseIdx].multiple;
  const fairPanic =
    scenarios[panicIdx].forwardEps * scenarios[panicIdx].multiple;

  let marketImpliedPanicProb: number | undefined;

  if (fairBull > fairPanic && currentPrice > 0) {
    let impliedPanic = 0.25;
    let impliedBull = 0.25;
    let impliedBase = 0.5;

    if (currentPrice < fairBase) {
      const spread = fairBase - fairPanic;
      if (spread > 0) {
        impliedPanic = Math.min(
          0.85,
          Math.max(0.05, (fairBase - currentPrice) / spread)
        );
        impliedBase = Math.max(0.05, 1.0 - impliedPanic - 0.05);
        impliedBull = 0.05;
      }
    } else {
      const spread = fairBull - fairBase;
      if (spread > 0) {
        impliedBull = Math.min(
          0.85,
          Math.max(0.05, (currentPrice - fairBase) / spread)
        );
        impliedBase = Math.max(0.05, 1.0 - impliedBull - 0.05);
        impliedPanic = 0.05;
      }
    }

    marketImpliedPanicProb = round2(impliedPanic);

    const z_mkt_bull = Math.log(impliedBull);
    const z_mkt_base = Math.log(impliedBase);
    const z_mkt_panic = Math.log(impliedPanic);

    const w_mkt = 0.2;
    const d_bull_p4 = w_mkt * (z_mkt_bull - z_bull);
    const d_base_p4 = w_mkt * (z_mkt_base - z_base);
    const d_panic_p4 = w_mkt * (z_mkt_panic - z_panic);

    z_bull += d_bull_p4;
    z_base += d_base_p4;
    z_panic += d_panic_p4;

    steps.push({
      pillar: "market_implied",
      label: "Market-Implied Bayesian Shrinkage",
      deltaBullLogit: round2(d_bull_p4),
      deltaBaseLogit: round2(d_base_p4),
      deltaPanicLogit: round2(d_panic_p4),
      rationale: `Applied 20% Bayesian shrinkage anchor against market-implied pricing (market implied panic probability: ${round2(
        impliedPanic * 100
      )}%).`,
    });
  }

  // 6. Numerically stable Softmax
  const maxZ = Math.max(z_bull, z_base, z_panic);
  const expBull = Math.exp(z_bull - maxZ);
  const expBase = Math.exp(z_base - maxZ);
  const expPanic = Math.exp(z_panic - maxZ);
  const sumExp = expBull + expBase + expPanic;

  let pBull = expBull / sumExp;
  let pBase = expBase / sumExp;
  let pPanic = expPanic / sumExp;

  // Convex simplex contraction with epsilon = 0.05 to guarantee p in [0.05, 0.85]
  const eps = 0.05;
  pBull = (1 - 3 * eps) * pBull + eps;
  pBase = (1 - 3 * eps) * pBase + eps;
  pPanic = (1 - 3 * eps) * pPanic + eps;

  // 7. Enforce Lexicographic Governance Veto bounds if triggered
  if (govVeto) {
    if (pPanic < 0.45) pPanic = 0.45;
    if (pBull > 0.08) pBull = 0.08;
    pBase = Math.max(0.05, 1.0 - pPanic - pBull);
  }

  // 8. Strict Simplex Normalization & Rounding Reconciliation
  let roundedBull = Math.round(pBull * 1000) / 1000;
  let roundedPanic = Math.round(pPanic * 1000) / 1000;
  let roundedBase =
    Math.round((1.0 - roundedBull - roundedPanic) * 1000) / 1000;

  // Ensure all strictly positive and sum === 1.000
  if (roundedBase < 0.05) {
    roundedBase = 0.05;
    roundedPanic = Math.round((1.0 - roundedBull - roundedBase) * 1000) / 1000;
  }

  const calibratedProbMap: Record<string, number> = {};
  const resultProbs = new Array(scenarios.length).fill(0);

  resultProbs[bullIdx] = roundedBull;
  resultProbs[baseIdx] = roundedBase;
  resultProbs[panicIdx] = roundedPanic;

  calibratedProbMap[scenarios[bullIdx].name] = roundedBull;
  calibratedProbMap[scenarios[baseIdx].name] = roundedBase;
  calibratedProbMap[scenarios[panicIdx].name] = roundedPanic;

  let skewDirection: "bull_skewed" | "balanced" | "panic_skewed" = "balanced";
  if (roundedBull > 0.35) {
    skewDirection = "bull_skewed";
  } else if (roundedPanic > 0.35) {
    skewDirection = "panic_skewed";
  }

  return {
    probabilities: resultProbs,
    calibrationAudit: {
      rawProbabilities: rawProbMap,
      calibratedProbabilities: calibratedProbMap,
      marketImpliedPanicProb,
      governanceVetoTriggered: govVeto,
      skewDirection,
      archetypeUsed: resolvedArchetype,
      netRunwayMonths:
        netRunwayMonths !== undefined ? round2(netRunwayMonths) : undefined,
      steps,
    },
  };
}

/**
 * Compute the probability-weighted fair value and per-scenario results.
 */
export function computeValuation(input: ValuationInput): Valuation {
  const { facts, scenarios } = input;
  const currentPrice = facts.currentPrice || scenarios.currentPrice;

  // StressAlpha flow-through computation if baseline provided
  const baseline = input.baseline ?? scenarios.baseline;
  let stressTest: StressResult | undefined;
  let shockMultiplier = 1.0;

  if (baseline) {
    stressTest = computeStressedValuation(
      baseline,
      currentPrice,
      input.stressParams
    );
    // If stressParams are supplied, calculate the flow-through scale multiplier
    const unperturbed = computeStressedValuation(baseline, currentPrice, {});
    if (unperturbed.stressEps > 0 && stressTest.stressEps > 0) {
      shockMultiplier = stressTest.stressEps / unperturbed.stressEps;
    }
  }

  // Determine scenario probabilities (QPCE Calibrated vs Manual/Raw)
  let calibrationAudit: CalibrationAudit | undefined;
  let scenarioProbabilities = scenarios.scenarios.map((s) => s.probability);

  if (!input.disableAutoCalibration) {
    const calibration = calibrateScenarioProbabilities({
      scenarios: scenarios.scenarios,
      facts,
      baseline,
      moat: input.moat,
      estimates: input.estimates,
      currentPrice,
    });
    scenarioProbabilities = calibration.probabilities;
    calibrationAudit = calibration.calibrationAudit;
  }

  // Per-scenario fair values (dynamically modulated by flow-through shock)
  const scenarioResults: ScenarioResult[] = scenarios.scenarios.map(
    (s, idx) => {
      const effectiveEps = s.forwardEps * shockMultiplier;
      const fairValue = effectiveEps * s.multiple;
      const probability = scenarioProbabilities[idx] ?? s.probability;
      const upsideFromCurrent =
        currentPrice > 0
          ? ((fairValue - currentPrice) / currentPrice) * 100
          : 0;

      // Record raw vs calibrated probabilities on the scenario object
      s.rawProbability = s.rawProbability ?? s.probability;
      s.calibratedProbability = probability;
      s.probability = probability;

      return {
        name: s.name,
        probability,
        fairValue: round2(fairValue),
        upsideFromCurrent: round2(upsideFromCurrent),
      };
    }
  );

  // Probability-weighted fair value
  const weightedFairValue = round2(
    scenarioResults.reduce((acc, r) => acc + r.probability * r.fairValue, 0)
  );

  const upsidePct =
    currentPrice > 0
      ? round2(((weightedFairValue - currentPrice) / currentPrice) * 100)
      : 0;

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
    const multDown = Math.max(1, s.multiple - 2);
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
      verdictVsConsensus = `In line with consensus ($${consensusTarget}) — delta ${
        diffPct > 0 ? "+" : ""
      }${diffPct}%`;
    } else if (diffPct > 0) {
      verdictVsConsensus = `Above consensus ($${consensusTarget}) by ${diffPct}% — more bullish`;
    } else {
      verdictVsConsensus = `Below consensus ($${consensusTarget}) by ${Math.abs(
        diffPct
      )}% — more cautious`;
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
    calibrationAudit,
  };
}

/**
 * Derives a fallback baseline if stress-baseline.json is not present
 */
export function deriveEffectiveBaseline(facts: Facts): FinancialModelBaseline {
  const shares =
    facts.currentPrice > 0
      ? facts.marketCapBillions / facts.currentPrice
      : 10.83;
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
      {
        id: "hyperscaler-capex",
        name: "Hyperscaler Cloud CapEx Growth",
        exposureShare: 0.35,
        elasticity: 0.85,
        defaultShockPct: 0,
        minShockPct: -40,
        maxShockPct: 40,
      },
      {
        id: "consumer-demand",
        name: "Consumer & E-Commerce Demand",
        exposureShare: 0.45,
        elasticity: 0.7,
        defaultShockPct: 0,
        minShockPct: -30,
        maxShockPct: 30,
      },
      {
        id: "ad-budgets",
        name: "Digital Advertising Budgets",
        exposureShare: 0.2,
        elasticity: 0.9,
        defaultShockPct: 0,
        minShockPct: -40,
        maxShockPct: 40,
      },
    ],
  };
}
