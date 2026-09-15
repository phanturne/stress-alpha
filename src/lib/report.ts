import type { Facts, Catalysts, Valuation, Reactions } from "./schemas";

export interface ReportInput {
  facts: Facts;
  catalysts?: Catalysts;
  valuation: Valuation;
  reactions?: Reactions;
}

export function renderReport(input: ReportInput): string {
  const { facts, catalysts, valuation, reactions } = input;
  const lines: string[] = [];

  lines.push(`# Earnings Analysis: ${facts.ticker} — ${facts.quarter}`);
  lines.push("");
  lines.push(`*Analysis date: ${valuation.analysisDate || "N/A"} | Report date: ${facts.reportDate} | Price: $${valuation.currentPrice}*`);
  lines.push("");

  // Summary box
  lines.push("## Summary");
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Weighted Fair Value | **$${valuation.weightedFairValue}** |`);
  lines.push(`| Upside from Current | ${valuation.upsidePct > 0 ? "+" : ""}${valuation.upsidePct}% |`);
  lines.push(`| Consensus PT | $${valuation.consensusTarget} |`);
  lines.push(`| Verdict | ${valuation.verdictVsConsensus} |`);
  lines.push("");

  // Income quality callout
  if (facts.oneTimeItems && facts.oneTimeItems.length > 0) {
    lines.push("## ⚠️ Income Quality Adjustment");
    lines.push("");
    lines.push(`Headline EPS $${facts.epsReported} includes one-time items:`);
    lines.push("");
    for (const item of facts.oneTimeItems) {
      lines.push(`- **${item.description}**: $${item.amountBillions}B (${item.isOperating ? "operating" : "non-operating"})${item.note ? ` — ${item.note}` : ""}`);
    }
    lines.push("");
    lines.push(`Operating EPS (adjusted): **$${facts.epsOperating}**`);
    lines.push("");
  }

  // Earnings breakdown
  lines.push("## Earnings Breakdown");
  lines.push("");
  lines.push(`| Metric | Actual | Estimate | Beat/Miss |`);
  lines.push(`|--------|--------|----------|-----------|`);
  lines.push(`| Revenue | $${facts.revenueBillions}B | ${facts.revenueEstimateBillions ? `$${facts.revenueEstimateBillions}B` : "—"} | ${facts.revenueEstimateBillions ? (facts.revenueBillions > facts.revenueEstimateBillions ? "✅ Beat" : "❌ Miss") : "—"} |`);
  lines.push(`| Op. Income | $${facts.operatingIncomeBillions}B | — | ${facts.operatingIncomeGrowthPct ? `+${facts.operatingIncomeGrowthPct}% YoY` : "—"} |`);
  lines.push(`| EPS (operating) | $${facts.epsOperating} | $${facts.epsConsensus} | ${facts.epsOperating > facts.epsConsensus ? "✅ Beat" : "❌ Miss"} |`);
  lines.push("");

  // Segments
  lines.push("### Segments");
  lines.push("");
  lines.push(`| Segment | Revenue | Growth | Op. Margin |`);
  lines.push(`|---------|---------|--------|------------|`);
  for (const seg of facts.segments) {
    const margin = seg.operatingMarginPct != null ? `${seg.operatingMarginPct}%` : "—";
    lines.push(`| ${seg.name} | $${seg.revenueBillions}B | ${seg.growthPct > 0 ? "+" : ""}${seg.growthPct}% | ${margin} |`);
  }
  lines.push("");

  // Catalysts
  if (catalysts && catalysts.catalysts && catalysts.catalysts.length > 0) {
    lines.push("## Catalysts");
    lines.push("");
    lines.push(`| # | Catalyst | Dir. | Prob. | Horizon | Anchor |`);
    lines.push(`|---|----------|------|-------|---------|--------|`);
    catalysts.catalysts.forEach((c, i) => {
      const emoji = c.direction === "growth" ? "📈" : "📉";
      lines.push(`| ${i + 1} | ${c.title} | ${emoji} ${c.direction} | ${(c.probability * 100).toFixed(0)}% | ${c.horizon} | ${c.probabilityAnchor} |`);
    });
    lines.push("");
  }

  // StressAlpha Valuation Bands & Accounting Flow-Through
  if (valuation.stressTest && valuation.baseline) {
    const st = valuation.stressTest;
    lines.push("## ⚡ StressAlpha Dynamic Valuation Bands & Flow-Through");
    lines.push("");
    lines.push(`- **Stressed Diluted EPS:** $${st.stressEps}`);
    lines.push(`- **Stressed Revenue:** $${st.stressRevenueBillions}B`);
    lines.push(`- **Stressed Gross Profit:** $${st.stressGrossProfitBillions}B`);
    lines.push(`- **Stressed Operating Income:** $${st.stressOperatingIncomeBillions}B`);
    lines.push(`- **Stressed Net Income:** $${st.stressNetIncomeBillions}B`);
    lines.push(`- **Downside to Panic Floor:** ${st.asymmetry.downsideToPanicPct}%`);
    lines.push(`- **Market Priced-In Multiple:** ${st.asymmetry.marketPricedInMultiple}x`);
    lines.push("");
    lines.push(`| Regime | Multiple | Target Price | Delta vs Current |`);
    lines.push(`|--------|----------|--------------|------------------|`);
    lines.push(`| 🐂 Bull | ${st.valuationBands.bull.multiple}x | $${st.valuationBands.bull.targetPrice} | ${st.valuationBands.bull.deltaFromCurrentPct > 0 ? "+" : ""}${st.valuationBands.bull.deltaFromCurrentPct}% |`);
    lines.push(`| ⚖️ Base | ${st.valuationBands.base.multiple}x | $${st.valuationBands.base.targetPrice} | ${st.valuationBands.base.deltaFromCurrentPct > 0 ? "+" : ""}${st.valuationBands.base.deltaFromCurrentPct}% |`);
    lines.push(`| 🚨 Panic | ${st.valuationBands.panic.multiple}x | $${st.valuationBands.panic.targetPrice} | ${st.valuationBands.panic.deltaFromCurrentPct > 0 ? "+" : ""}${st.valuationBands.panic.deltaFromCurrentPct}% |`);
    lines.push("");
  }

  // Scenario table
  lines.push("## Scenario Analysis");
  lines.push("");
  lines.push(`| Scenario | Prob. | Fair Value | Upside |`);
  lines.push(`|----------|-------|------------|--------|`);
  for (const sr of valuation.scenarioResults) {
    lines.push(`| ${sr.name} | ${(sr.probability * 100).toFixed(0)}% | $${sr.fairValue} | ${sr.upsideFromCurrent > 0 ? "+" : ""}${sr.upsideFromCurrent}% |`);
  }
  lines.push("");

  // Sensitivity
  if (valuation.sensitivity.length > 0) {
    lines.push("## Sensitivity Analysis");
    lines.push("");
    lines.push(`| Scenario | Parameter | Base → Alt | FV Delta |`);
    lines.push(`|----------|-----------|------------|----------|`);
    for (const se of valuation.sensitivity) {
      lines.push(`| ${se.scenario} | ${se.parameter} | ${se.baseValue} → ${se.altValue} | ${se.fairValueDelta > 0 ? "+" : ""}$${se.fairValueDelta} |`);
    }
    lines.push("");
  }

  // Historical reactions
  if (reactions && reactions.events.length > 0) {
    lines.push("## Historical Reactions");
    lines.push("");
    if (reactions.conditionalFraming) {
      lines.push(`> ${reactions.conditionalFraming}`);
      lines.push("");
    }
    lines.push(`| Date | Event | Price Move | Context |`);
    lines.push(`|------|-------|------------|---------|`);
    for (const ev of reactions.events) {
      lines.push(`| ${ev.date} | ${ev.event} | ${ev.priceMovePct > 0 ? "+" : ""}${ev.priceMovePct}% | ${ev.context} |`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
