/**
 * Deterministic Sanity & Variant Perception Audit Engine for StressAlpha
 *
 * Enforces two-sided auditing:
 * 1. Defensive Data Integrity: Verifies module completeness, cross-artifact consistency,
 *    positive operating bases, valid share counts, and regime bounds.
 * 2. Offensive Variant Perception: Quantifies and decomposes the delta between StressAlpha
 *    Weighted Fair Value (WFV) and Wall Street consensus target prices into multiple spreads,
 *    earnings variances, and stress-regime safety haircuts.
 */

import type { Locale } from "@/lib/i18n";
import type {
  Facts,
  Scenarios,
  FinancialModelBaseline,
  MoatCompetitors,
  AnalystEstimates,
  FilingExtracts,
  EarningsSentiment,
  Reactions,
  Catalysts,
  Valuation,
  SanityAudit,
  SanityIssue,
  ConsensusAttribution,
  DivergenceClassification,
} from "@/lib/schemas";

export interface SanityAuditInput {
  facts: Facts;
  scenarios: Scenarios;
  baseline?: FinancialModelBaseline;
  moat?: MoatCompetitors;
  estimates?: AnalystEstimates;
  filing?: FilingExtracts;
  sentiment?: EarningsSentiment;
  reactions?: Reactions;
  catalysts?: Catalysts;
  valuation?: Valuation;
  weightedFairValue?: number;
  locale?: Locale;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Standard audited quarterly report modules.
 */
export const AUDITED_MODULES = [
  "facts",
  "scenarios",
  "baseline",
  "moat",
  "estimates",
  "filing",
  "sentiment",
  "catalysts",
] as const;

export type AuditedModuleName = (typeof AUDITED_MODULES)[number];

/**
 * Audits quarterly data artifacts for mathematical integrity and consensus divergence.
 */
export function auditReportData(input: SanityAuditInput): SanityAudit {
  const {
    facts,
    scenarios,
    baseline = scenarios.baseline,
    moat,
    estimates,
    filing,
    sentiment,
    catalysts,
    locale = "en",
  } = input;

  const issues: SanityIssue[] = [];
  const missingModules: string[] = [];

  // -------------------------------------------------------------------------
  // 1. Module Completeness Tracking
  // -------------------------------------------------------------------------
  const populatedModules: Record<AuditedModuleName, boolean> = {
    facts: !!facts,
    scenarios: !!scenarios,
    baseline: !!baseline,
    moat: !!moat,
    estimates: !!estimates,
    filing: !!filing,
    sentiment: !!sentiment,
    catalysts: !!catalysts,
  };

  let populatedCount = 0;
  for (const mod of AUDITED_MODULES) {
    if (populatedModules[mod]) {
      populatedCount++;
    } else {
      missingModules.push(mod);
    }
  }

  const totalModulesCount = AUDITED_MODULES.length;
  const dataCompletenessScore = Math.round(
    (populatedCount / totalModulesCount) * 100
  );

  // -------------------------------------------------------------------------
  // 2. Critical Defensive Invariants (Fatal if violated)
  // -------------------------------------------------------------------------

  // Ticker consistency
  const primaryTicker = (facts?.ticker || "").toUpperCase().trim();
  if (!primaryTicker) {
    issues.push({
      severity: "critical",
      code: "MISSING_TICKER",
      field: "facts.ticker",
      message: "Primary ticker symbol is missing or empty in facts.",
    });
  }

  if (
    scenarios?.ticker &&
    scenarios.ticker.toUpperCase().trim() !== primaryTicker
  ) {
    issues.push({
      severity: "critical",
      code: "TICKER_MISMATCH",
      field: "scenarios.ticker",
      message: `Scenario ticker '${scenarios.ticker}' does not match facts ticker '${primaryTicker}'.`,
    });
  }

  if (
    estimates?.ticker &&
    estimates.ticker.toUpperCase().trim() !== primaryTicker
  ) {
    issues.push({
      severity: "critical",
      code: "TICKER_MISMATCH",
      field: "estimates.ticker",
      message: `Estimates ticker '${estimates.ticker}' does not match facts ticker '${primaryTicker}'.`,
    });
  }

  if (moat?.ticker && moat.ticker.toUpperCase().trim() !== primaryTicker) {
    issues.push({
      severity: "critical",
      code: "TICKER_MISMATCH",
      field: "moat.ticker",
      message: `Moat ticker '${moat.ticker}' does not match facts ticker '${primaryTicker}'.`,
    });
  }

  // Current stock price validity
  const currentPrice = facts?.currentPrice || scenarios?.currentPrice || 0;
  if (currentPrice <= 0 || !Number.isFinite(currentPrice)) {
    issues.push({
      severity: "critical",
      code: "INVALID_CURRENT_PRICE",
      field: "facts.currentPrice",
      message: `Current stock price ($${currentPrice}) must be a positive finite number.`,
    });
  }

  // Operating EPS sanity (Income Quality Guardrail)
  if (
    facts?.epsOperating === undefined ||
    !Number.isFinite(facts.epsOperating)
  ) {
    issues.push({
      severity: "critical",
      code: "INVALID_OPERATING_EPS",
      field: "facts.epsOperating",
      message:
        "Normalized Operating EPS (epsOperating) is undefined or non-finite.",
    });
  }

  // Diluted shares validity
  const sharesBillions =
    baseline?.dilutedSharesBillions ||
    (facts?.marketCapBillions && currentPrice > 0
      ? facts.marketCapBillions / currentPrice
      : 0);
  if (sharesBillions <= 0 || !Number.isFinite(sharesBillions)) {
    issues.push({
      severity: "critical",
      code: "INVALID_DILUTED_SHARES",
      field: "baseline.dilutedSharesBillions",
      message: `Diluted shares count (${round2(sharesBillions)}B) must be strictly positive (via baseline.dilutedSharesBillions or marketCapBillions/currentPrice).`,
    });
  }

  // Scenario validity
  if (!scenarios?.scenarios || scenarios.scenarios.length === 0) {
    issues.push({
      severity: "critical",
      code: "EMPTY_SCENARIOS",
      field: "scenarios.scenarios",
      message: "At least one valuation scenario regime must be specified.",
    });
  } else {
    const probSum = scenarios.scenarios.reduce(
      (acc, s) => acc + s.probability,
      0
    );
    if (Math.abs(probSum - 1.0) > 0.05) {
      issues.push({
        severity: "critical",
        code: "PROBABILITY_SUM_INVALID",
        field: "scenarios.scenarios",
        message: `Scenario probabilities sum to ${round2(probSum)}, expected 1.00 ±0.05.`,
      });
    }
  }

  // Baseline model validity
  if (baseline) {
    if (baseline.baseRevenueBillions <= 0) {
      issues.push({
        severity: "critical",
        code: "INVALID_BASELINE_REVENUE",
        field: "baseline.baseRevenueBillions",
        message: `Baseline revenue ($${baseline.baseRevenueBillions}B) must be positive.`,
      });
    }
    if (
      baseline.baseGrossMarginPct < 0 ||
      baseline.baseGrossMarginPct > 100 ||
      !Number.isFinite(baseline.baseGrossMarginPct)
    ) {
      issues.push({
        severity: "critical",
        code: "INVALID_BASELINE_GROSS_MARGIN",
        field: "baseline.baseGrossMarginPct",
        message: `Baseline gross margin (${baseline.baseGrossMarginPct}%) must be between 0% and 100%.`,
      });
    }
  }

  // -------------------------------------------------------------------------
  // 3. Model Warnings (Non-fatal sanity & bounds checks)
  // -------------------------------------------------------------------------

  // Check price divergence between facts and analyst estimates
  if (
    estimates?.priceTargets?.currentPrice &&
    estimates.priceTargets.currentPrice > 0 &&
    currentPrice > 0
  ) {
    const priceDiffPct = Math.abs(
      ((currentPrice - estimates.priceTargets.currentPrice) / currentPrice) *
        100
    );
    if (priceDiffPct > 5.0) {
      issues.push({
        severity: "warning",
        code: "PRICE_TIMING_DISCREPANCY",
        field: "estimates.priceTargets.currentPrice",
        message: `Stock price in facts ($${currentPrice}) differs from estimates snapshot ($${estimates.priceTargets.currentPrice}) by ${round2(priceDiffPct)}%. Verify price timestamps.`,
      });
    }
  }

  // Missing optional modules
  if (!estimates) {
    issues.push({
      severity: "info",
      code: "MISSING_ESTIMATES_MODULE",
      field: "estimates",
      message:
        "Wall Street analyst consensus estimates module is not populated.",
    });
  }
  if (!filing) {
    issues.push({
      severity: "info",
      code: "MISSING_FILING_MODULE",
      field: "filing",
      message: "SEC 10-K/10-Q filing extracts module is not populated.",
    });
  }
  if (!sentiment) {
    issues.push({
      severity: "info",
      code: "MISSING_SENTIMENT_MODULE",
      field: "sentiment",
      message:
        "Earnings call tone & sentiment transcript analysis is not populated.",
    });
  }
  if (!moat) {
    issues.push({
      severity: "info",
      code: "MISSING_MOAT_MODULE",
      field: "moat",
      message:
        "Economic moat & competitor benchmarking module is not populated.",
    });
  }

  // -------------------------------------------------------------------------
  // 4. Variant Perception & Consensus Divergence Attribution
  // -------------------------------------------------------------------------
  const effectiveWfv =
    input.weightedFairValue ?? input.valuation?.weightedFairValue;

  const consensusTarget =
    scenarios?.consensusTarget && scenarios.consensusTarget > 0
      ? scenarios.consensusTarget
      : estimates?.priceTargets?.average && estimates.priceTargets.average > 0
        ? estimates.priceTargets.average
        : 0;

  let consensusAttribution: ConsensusAttribution | undefined;

  if (effectiveWfv !== undefined && effectiveWfv > 0) {
    // Valuation bounds check vs current price
    if (currentPrice > 0) {
      const wfvRatio = effectiveWfv / currentPrice;
      if (wfvRatio < 0.2 || wfvRatio > 4.0) {
        issues.push({
          severity: "warning",
          code: "EXTREME_VALUATION_BOUNDS",
          field: "weightedFairValue",
          message: `Weighted Fair Value ($${effectiveWfv}) is ${round2(wfvRatio)}x current price ($${currentPrice}). Potential parameter exaggeration.`,
        });
      }
    }

    if (consensusTarget > 0) {
      const diff = effectiveWfv - consensusTarget;
      const divergencePct = round2((diff / consensusTarget) * 100);
      const absDivergence = Math.abs(divergencePct);

      let classification: DivergenceClassification = "in_line";
      if (absDivergence >= 30) {
        classification = "extreme_divergence";
      } else if (absDivergence >= 15) {
        classification = "high_conviction_alpha";
      } else if (absDivergence >= 5) {
        classification = "moderate_alpha";
      }

      if (absDivergence >= 30) {
        issues.push({
          severity: "warning",
          code: "EXTREME_CONSENSUS_DIVERGENCE",
          field: "consensusTarget",
          message: `StressAlpha WFV ($${effectiveWfv}) diverges from consensus target ($${consensusTarget}) by ${divergencePct > 0 ? "+" : ""}${divergencePct}%. Requires analytical attribution.`,
        });
      }

      // Find Base scenario fair value and EPS
      const baseScenario = scenarios.scenarios.find((s) =>
        s.name.toLowerCase().includes("base")
      );
      const baseFairValue = baseScenario
        ? round2(baseScenario.forwardEps * baseScenario.multiple)
        : undefined;

      // Regime stress haircut (drag/lift of Bear & Panic regimes vs Base case)
      const regimeStressHaircutPct =
        baseFairValue && baseFairValue > 0
          ? round2(((effectiveWfv - baseFairValue) / baseFairValue) * 100)
          : undefined;

      // Implied consensus forward P/E and EPS delta
      // Only compare if consensus EPS is on an annualized forward scale comparable to baseScenario.forwardEps
      let multipleDeltaPct: number | undefined;
      let earningsDeltaPct: number | undefined;

      const fwdEpsConsensus =
        facts.forwardEpsConsensus && facts.forwardEpsConsensus > 0
          ? facts.forwardEpsConsensus
          : facts.epsConsensus &&
              facts.epsConsensus > 0 &&
              baseScenario &&
              baseScenario.forwardEps > 0 &&
              facts.epsConsensus / baseScenario.forwardEps > 0.4 &&
              facts.epsConsensus / baseScenario.forwardEps < 2.5
            ? facts.epsConsensus
            : undefined;

      if (fwdEpsConsensus && baseScenario && baseScenario.forwardEps > 0) {
        earningsDeltaPct = round2(
          ((baseScenario.forwardEps - fwdEpsConsensus) / fwdEpsConsensus) * 100
        );
        const impliedConsensusPe = consensusTarget / fwdEpsConsensus;
        if (impliedConsensusPe > 0 && baseScenario.multiple > 0) {
          multipleDeltaPct = round2(
            ((baseScenario.multiple - impliedConsensusPe) /
              impliedConsensusPe) *
              100
          );
        }
      }

      const rationaleComment = buildAnalyticalCommentary({
        ticker: primaryTicker,
        divergencePct,
        classification,
        consensusTarget,
        weightedFairValue: effectiveWfv,
        baseFairValue,
        regimeStressHaircutPct,
        multipleDeltaPct,
        earningsDeltaPct,
        locale,
      });

      consensusAttribution = {
        consensusTarget,
        weightedFairValue: effectiveWfv,
        divergencePct,
        divergenceClassification: classification,
        multipleDeltaPct,
        earningsDeltaPct,
        regimeStressHaircutPct,
        baseFairValue,
        rationaleComment,
      };
    } else {
      issues.push({
        severity: "info",
        code: "NO_CONSENSUS_TARGET",
        field: "consensusTarget",
        message:
          "No Wall Street consensus price target provided for variant perception comparison.",
      });
    }
  }

  // -------------------------------------------------------------------------
  // 5. Final Status & Summary Aggregation
  // -------------------------------------------------------------------------
  const hasCritical = issues.some((i) => i.severity === "critical");
  const hasWarning = issues.some((i) => i.severity === "warning");

  const status = hasCritical ? "fail" : hasWarning ? "warn" : "pass";
  const passed = !hasCritical;

  const summary =
    locale === "zh"
      ? `数据完整度 ${dataCompletenessScore}% (${populatedCount}/${totalModulesCount} 模块已加载)。` +
        (passed
          ? issues.length === 0
            ? "所有财务不变式与估值边界审计通过。"
            : `核心审计通过，附带 ${issues.length} 项关注提示。`
          : `❌ 发现 ${issues.filter((i) => i.severity === "critical").length} 项致命数据完整性错误。`)
      : `Data completeness ${dataCompletenessScore}% (${populatedCount}/${totalModulesCount} modules loaded). ` +
        (passed
          ? issues.length === 0
            ? "All financial invariants and valuation bounds passed."
            : `Core audit passed with ${issues.length} non-fatal advisory notice(s).`
          : `❌ Found ${issues.filter((i) => i.severity === "critical").length} fatal data integrity error(s).`);

  return {
    passed,
    status,
    dataCompletenessScore,
    populatedModulesCount: populatedCount,
    totalModulesCount,
    missingModules,
    issues,
    consensusAttribution,
    summary,
  };
}

/**
 * Builds pre-localized analytical commentary explaining the consensus divergence.
 */
function buildAnalyticalCommentary(params: {
  ticker: string;
  divergencePct: number;
  classification: DivergenceClassification;
  consensusTarget: number;
  weightedFairValue: number;
  baseFairValue?: number;
  regimeStressHaircutPct?: number;
  multipleDeltaPct?: number;
  earningsDeltaPct?: number;
  locale: Locale;
}): string {
  const {
    divergencePct,
    classification,
    regimeStressHaircutPct,
    multipleDeltaPct,
    earningsDeltaPct,
    locale,
  } = params;

  const sign = divergencePct > 0 ? "+" : "";

  if (locale === "zh") {
    switch (classification) {
      case "extreme_divergence":
        if (divergencePct > 0) {
          return (
            `高度多头预期差（较卖方一致预期 ${sign}${divergencePct}%）：` +
            `StressAlpha 估值中枢显著高于华尔街普遍预期。` +
            (earningsDeltaPct !== undefined
              ? `基准预期 EPS 较卖方高出 ${earningsDeltaPct}%，`
              : "") +
            `反映出模型计入了经营杠杆超预期释放与多头催化剂的确定性溢价。`
          );
        }
        return (
          `深度下行审慎警示（较卖方一致预期 ${divergencePct}%）：` +
          `估值较卖方一致预期呈现大幅折价。` +
          (regimeStressHaircutPct !== undefined
            ? `下行/恐慌底板测试对基线估值施加了 ${regimeStressHaircutPct}% 的安全缓冲折价，`
            : "") +
          `充分反映了固定费用刚性与供应链需求冲击下的经营去杠杆风险。`
        );

      case "high_conviction_alpha":
        if (divergencePct > 0) {
          return (
            `高确信度 Alpha 机会（较卖方一致预期 ${sign}${divergencePct}%）：` +
            `加权公允价值稳健高于卖方共识。` +
            (multipleDeltaPct !== undefined && multipleDeltaPct > 0
              ? `估值倍数溢价为 +${multipleDeltaPct}%，`
              : "") +
            `在维持扎实安全边际的同时，充分反映核心业务的定价权优势。`
          );
        }
        return (
          `压力折价审慎区间（较卖方一致预期 ${divergencePct}%）：` +
          `估值低于华尔街平均预期。` +
          `模型对宏观减速及估值倍数压缩保持戒备，提供了较共识目标价更坚实的安全垫。`
        );

      case "moderate_alpha":
        return (
          `适度预期差（较卖方一致预期 ${sign}${divergencePct}%）：` +
          `估值与市场普遍预期大体一致，存在适度定价偏离，反映了对未来细分催化剂执行节奏的差异化评估。`
        );

      case "in_line":
      default:
        return (
          `与一致预期高度吻合（偏差 ${sign}${divergencePct}%）：` +
          `StressAlpha 加权估值与华尔街共识目标价保持高度契合，反映当前市场定价已充分吸收现有公开基本面。`
        );
    }
  }

  // English commentary
  switch (classification) {
    case "extreme_divergence":
      if (divergencePct > 0) {
        return (
          `Extreme Bullish Variant Perception (${sign}${divergencePct}% vs Street): ` +
          `StressAlpha weighted valuation sits substantially above sell-side consensus. ` +
          (earningsDeltaPct !== undefined && earningsDeltaPct > 0
            ? `Baseline forward EPS exceeds consensus by +${earningsDeltaPct}%, `
            : "") +
          `reflecting operating leverage acceleration and catalyst execution that Wall Street has not yet priced in.`
        );
      }
      return (
        `Severe Downside Divergence Alert (${divergencePct}% vs Street): ` +
        `Substantial valuation discount vs consensus target. ` +
        (regimeStressHaircutPct !== undefined
          ? `Downside/Panic regime weighting exerts a ${regimeStressHaircutPct}% safety haircut, `
          : "") +
        `pricing in severe operational deleverage under fixed OpEx rigidity.`
      );

    case "high_conviction_alpha":
      if (divergencePct > 0) {
        return (
          `High-Conviction Alpha Opportunity (${sign}${divergencePct}% vs Street): ` +
          `StressAlpha fair value sits comfortably above consensus. ` +
          (multipleDeltaPct !== undefined && multipleDeltaPct > 0
            ? `Supported by a +${multipleDeltaPct}% valuation multiple spread, `
            : "") +
          `reflecting durable competitive moat pricing power.`
        );
      }
      return (
        `Stress-Discounted Caution (${divergencePct}% vs Street): ` +
        `Valuation prices in downside macro sensitivity and multiple de-rating, ` +
        `providing a more disciplined margin of safety than consensus.`
      );

    case "moderate_alpha":
      return (
        `Moderate Variant Perception (${sign}${divergencePct}% vs Street): ` +
        `Modest divergence from sell-side consensus reflecting differentiated scenario probability weights.`
      );

    case "in_line":
    default:
      return (
        `Consensus In-Line (Delta ${sign}${divergencePct}%): ` +
        `StressAlpha weighted fair value closely aligns with Wall Street consensus, indicating balanced market pricing.`
      );
  }
}

/**
 * Formats a terminal-friendly ASCII banner for the CLI analysis runner.
 */
export function formatSanityCliBanner(
  audit: SanityAudit,
  ticker: string
): string {
  const border = "═".repeat(64);
  const divider = "─".repeat(64);
  const lines: string[] = [];

  const statusEmoji = audit.passed
    ? audit.status === "pass"
      ? "🛡️  [AUDIT PASSED]"
      : "⚠️  [AUDIT PASSED WITH NOTICES]"
    : "🚨 [AUDIT CRITICAL FAILURE]";

  lines.push(`\n${border}`);
  lines.push(`  ${statusEmoji} DATA INTEGRITY & VARIANT PERCEPTION: ${ticker}`);
  lines.push(border);

  lines.push(
    `  Data Completeness:      ${audit.dataCompletenessScore}% (${audit.populatedModulesCount}/${audit.totalModulesCount} modules loaded)`
  );

  if (audit.missingModules.length > 0) {
    lines.push(`  Missing Modules:        ${audit.missingModules.join(", ")}`);
  }

  if (audit.consensusAttribution) {
    const ca = audit.consensusAttribution;
    const sign = ca.divergencePct > 0 ? "+" : "";
    lines.push(divider);
    lines.push(
      `  Consensus Target:       $${ca.consensusTarget} vs WFV $${ca.weightedFairValue}`
    );
    lines.push(
      `  Consensus Spread:       ${sign}${ca.divergencePct}% (${formatClassificationLabel(ca.divergenceClassification)})`
    );

    if (ca.baseFairValue !== undefined) {
      lines.push(`  Base Scenario FV:       $${ca.baseFairValue}`);
    }
    if (ca.regimeStressHaircutPct !== undefined) {
      lines.push(
        `  Regime Stress Impact:   ${ca.regimeStressHaircutPct > 0 ? "+" : ""}${ca.regimeStressHaircutPct}% (Bear/Panic drag on Base)`
      );
    }
    if (ca.earningsDeltaPct !== undefined) {
      lines.push(
        `  Earnings vs Consensus:  ${ca.earningsDeltaPct > 0 ? "+" : ""}${ca.earningsDeltaPct}% EPS spread`
      );
    }

    lines.push(divider);
    lines.push(`  Analytical Stance:`);
    lines.push(`  "${ca.rationaleComment}"`);
  }

  if (audit.issues.length > 0) {
    lines.push(divider);
    lines.push(`  Audit Flags (${audit.issues.length}):`);
    for (const issue of audit.issues) {
      const icon =
        issue.severity === "critical"
          ? "❌"
          : issue.severity === "warning"
            ? "⚠️ "
            : "ℹ️ ";
      lines.push(`    ${icon} [${issue.code}] ${issue.message}`);
    }
  }

  lines.push(`${border}\n`);
  return lines.join("\n");
}

function formatClassificationLabel(c: DivergenceClassification): string {
  switch (c) {
    case "in_line":
      return "In-Line with Consensus";
    case "moderate_alpha":
      return "Moderate Variant Perception";
    case "high_conviction_alpha":
      return "High-Conviction Alpha Opportunity";
    case "extreme_divergence":
      return "Extreme Consensus Divergence";
  }
}
