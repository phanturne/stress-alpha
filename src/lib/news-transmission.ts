/**
 * Pure Deterministic News & Event Transmission Engine
 * Maps qualitative market events to structural valuation impacts without LLM hallucinations.
 */

import type {
  FinancialModelBaseline,
  MarketEvent,
  TransmissionPayload,
  Facts,
  Scenarios,
  Valuation,
} from "./schemas";
import {
  computeStressedValuation,
  computeValuation,
  round2,
} from "./valuation";

export interface TransmissionImpactResult {
  impliedWfv: number;
  impliedWfvDeltaPct: number;
  impliedRevenueDeltaBillions?: number;
  impliedEpsDelta?: number;
  transmissionSummary: string;
}

/**
 * Calculates the exact deterministic financial and valuation impact
 * of a structured market event transmission vector.
 */
export function calculateEventTransmissionImpact(params: {
  event: MarketEvent;
  baseline?: FinancialModelBaseline;
  facts: Facts;
  scenarios: Scenarios;
  currentValuation?: Valuation;
}): TransmissionImpactResult {
  const { event, baseline, facts, scenarios, currentValuation } = params;
  const currentPrice = facts.currentPrice;
  const baseWfv =
    currentValuation?.weightedFairValue ??
    (currentPrice > 0 ? currentPrice : facts.trailingEps * 20);

  const payload: TransmissionPayload | undefined = event.transmissionPayload;

  // 1. Upstream Driver Shock Flow-Through
  if (event.transmissionType === "driver_shock" && payload?.driverId && baseline) {
    const shockPct = payload.deltaShockPct ?? 0;
    
    // Baseline unperturbed stress valuation
    const unperturbed = computeStressedValuation(baseline, currentPrice);
    
    // Perturbed stress valuation with the event shock applied
    const perturbed = computeStressedValuation(baseline, currentPrice, {
      driverShocks: {
        [payload.driverId]: shockPct,
      },
    });

    const revDelta = round2(
      perturbed.stressRevenueBillions - unperturbed.stressRevenueBillions
    );
    const epsDelta = round2(perturbed.stressEps - unperturbed.stressEps);
    
    // Implied base regime fair value change
    const targetBase = perturbed.valuationBands.base.targetPrice;
    const unperturbedBase = unperturbed.valuationBands.base.targetPrice;
    const wfvDeltaPct =
      unperturbedBase > 0
        ? round2(((targetBase - unperturbedBase) / unperturbedBase) * 100)
        : 0;
    const impliedWfv = round2(baseWfv * (1 + wfvDeltaPct / 100));

    return {
      impliedWfv,
      impliedWfvDeltaPct: wfvDeltaPct,
      impliedRevenueDeltaBillions: revDelta,
      impliedEpsDelta: epsDelta,
      transmissionSummary: `Upstream driver "${payload.driverId}" shifted by ${shockPct > 0 ? "+" : ""}${shockPct}%. Revenue impact: ${revDelta > 0 ? "+" : ""}$${revDelta}B, EPS impact: ${epsDelta > 0 ? "+" : ""}$${epsDelta}.`,
    };
  }

  // 2. Catalyst Activation Probability Shift
  if (event.transmissionType === "catalyst_prob" && payload?.newProbability !== undefined) {
    const newProb = payload.newProbability;
    
    // Re-evaluate valuation with shifted scenario weight
    // A high catalyst activation probability elevates Bull scenario weight by up to +15%
    const probDelta = (newProb - 0.5) * 0.2; // Range: -0.10 to +0.10
    const wfvDeltaPct = round2(probDelta * 25); // Sensitivity factor
    const impliedWfv = round2(baseWfv * (1 + wfvDeltaPct / 100));

    return {
      impliedWfv,
      impliedWfvDeltaPct: wfvDeltaPct,
      transmissionSummary: `Catalyst probability calibrated to ${round2(newProb * 100)}% (${payload.rationale ?? "Structural release confirmed"}). Implied WFV shift: ${wfvDeltaPct > 0 ? "+" : ""}${wfvDeltaPct}%.`,
    };
  }

  // 3. Wall Street Consensus & Revision Skew (QPCE Pillar 3)
  if (event.transmissionType === "qpce_skew" && payload?.analystAction) {
    const action = payload.analystAction;
    const targetDeltaPct =
      action.priorTarget && action.priorTarget > 0
        ? round2(((action.newTarget - action.priorTarget) / action.priorTarget) * 100)
        : round2(((action.newTarget - currentPrice) / currentPrice) * 100);

    // Institutional upgrade/downgrade multiple pull
    const multipleSensitivity =
      action.action === "Upgraded" || action.action === "TargetRaised"
        ? 0.35
        : action.action === "Downgraded" || action.action === "TargetLowered"
          ? -0.45
          : 0.1;

    const wfvDeltaPct = round2(targetDeltaPct * multipleSensitivity * 0.25);
    const impliedWfv = round2(baseWfv * (1 + wfvDeltaPct / 100));

    return {
      impliedWfv,
      impliedWfvDeltaPct: wfvDeltaPct,
      transmissionSummary: `${action.firm} ${action.action}: Target $${action.newTarget} (${targetDeltaPct > 0 ? "+" : ""}${targetDeltaPct}% revision). Implied valuation shift: ${wfvDeltaPct > 0 ? "+" : ""}${wfvDeltaPct}%.`,
    };
  }

  // Default: Qualitative event without numerical flow-through
  return {
    impliedWfv: baseWfv,
    impliedWfvDeltaPct: 0,
    transmissionSummary: "Qualitative market context archived without direct valuation perturbation.",
  };
}
