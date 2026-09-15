import type { Facts, Catalysts, Valuation, Reactions, MoatCompetitors } from "./schemas";

export interface ReportInput {
  facts: Facts;
  catalysts?: Catalysts;
  valuation: Valuation;
  reactions?: Reactions;
  moat?: MoatCompetitors;
}

export interface RenderOptions {
  language?: "en" | "zh";
}

export function renderReport(input: ReportInput, options: RenderOptions = {}): string {
  const lang = options.language ?? "en";
  if (lang === "zh") {
    return renderReportChinese(input);
  }
  return renderReportEnglish(input);
}

function renderReportEnglish(input: ReportInput): string {
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

  // Economic Moat & Competitor Benchmarking
  if (input.moat) {
    const m = input.moat;
    lines.push("## 🏰 Economic Moat & Competitor Benchmarking");
    lines.push("");
    lines.push(`- **Overall Moat Rating:** **${m.overallMoatRating} Moat**`);
    lines.push(`- **Moat Trend:** **${m.moatTrend}**`);
    lines.push("");
    if (m.moatSources && m.moatSources.length > 0) {
      lines.push("### Moat Sources");
      lines.push("");
      lines.push("| Moat Source | Strength | Durability | Description |");
      lines.push("|-------------|----------|------------|-------------|");
      for (const ms of m.moatSources) {
        lines.push(`| ${ms.source} | ${ms.strength} | ${ms.durabilityYears} yrs | ${ms.description} |`);
      }
      lines.push("");
    }
    if (m.competitors && m.competitors.length > 0) {
      lines.push("### Competitor Peer Benchmarking");
      lines.push("");
      lines.push("| Peer | Market Cap | Revenue | YoY Growth | Gross Margin | Op. Margin | Forward P/E | Market Share | Pricing Power | Key Advantage / Vulnerability |");
      lines.push("|------|------------|---------|------------|--------------|------------|-------------|--------------|---------------|-------------------------------|");
      for (const comp of m.competitors) {
        const revGrowth = comp.revenueGrowthPct != null ? `${comp.revenueGrowthPct > 0 ? "+" : ""}${comp.revenueGrowthPct}%` : "—";
        const fwdPe = comp.forwardPe != null ? `${comp.forwardPe}x` : "—";
        const share = comp.marketSharePct != null ? `${comp.marketSharePct}%` : "—";
        lines.push(`| **${comp.ticker}** (${comp.name}) | $${comp.marketCapBillions}B | $${comp.revenueBillions}B | ${revGrowth} | ${comp.grossMarginPct}% | ${comp.operatingMarginPct}% | ${fwdPe} | ${share} | ${comp.pricingPower} | ${comp.keyAdvantageOrVulnerability} |`);
      }
      lines.push("");
    }
    if (m.competitiveDynamicsSummary) {
      lines.push("### Competitive Dynamics Summary");
      lines.push("");
      lines.push(`> ${m.competitiveDynamicsSummary}`);
      lines.push("");
    }
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

function renderReportChinese(input: ReportInput): string {
  const { facts, catalysts, valuation, reactions } = input;
  const lines: string[] = [];

  lines.push(`# 财报深度分析与压力测试研报：${facts.ticker} (${facts.company}) — ${facts.quarter}`);
  lines.push("");
  lines.push(`*分析日期：${valuation.analysisDate || "未填"} | 财报披露日：${facts.reportDate} | 当前基准股价：$${valuation.currentPrice}*`);
  lines.push("");

  // 核心估值摘要
  lines.push("## 一、 核心估值结论与投资摘要 (Summary)");
  lines.push("");
  lines.push(`| 估值与收益指标 | 测算结果 | 说明与对比 |`);
  lines.push(`|----------------|----------|------------|`);
  lines.push(`| 概率加权公允价值 (WFV) | **$${valuation.weightedFairValue}** | 综合各情景概率测算 |`);
  lines.push(`| 相对当前股价预期涨跌幅 | **${valuation.upsidePct > 0 ? "+" : ""}${valuation.upsidePct}%** | 隐含安全边际 |`);
  lines.push(`| 华尔街一致预期目标价 | $${valuation.consensusTarget} | 买方/卖方基准 |`);
  lines.push(`| 一致预期偏离评价 | ${translateVerdict(valuation.verdictVsConsensus)} | 决策倾向 |`);
  lines.push("");

  // 收益质量防线
  if (facts.oneTimeItems && facts.oneTimeItems.length > 0) {
    lines.push("## 二、 ⚠️ 收益质量与核心经营利润审计 (Income Quality Audit)");
    lines.push("");
    lines.push(`GAAP 名义每股收益 **$${facts.epsReported}** 包含以下一次性或非经营性账面调整：`);
    lines.push("");
    for (const item of facts.oneTimeItems) {
      lines.push(`- **${item.description}**: $${item.amountBillions}B (${item.isOperating ? "经营性" : "非经营性/公允价值波动"})${item.note ? ` — ${item.note}` : ""}`);
    }
    lines.push("");
    lines.push(`调整后真实核心经营 EPS (Operating EPS)：**$${facts.epsOperating}**（剥离账面公允价值扰动）`);
    lines.push("");
  }

  // 业绩明细
  lines.push("## 三、 季度业绩与一致预期对比 (Earnings Breakdown)");
  lines.push("");
  lines.push(`| 财务指标 | 实际公布值 | 彭博/彭博预期值 | 超/低预期评价 |`);
  lines.push(`|----------|------------|-----------------|----------------|`);
  lines.push(`| 营业收入 | $${facts.revenueBillions}B | ${facts.revenueEstimateBillions ? `$${facts.revenueEstimateBillions}B` : "—"} | ${facts.revenueEstimateBillions ? (facts.revenueBillions >= facts.revenueEstimateBillions ? "✅ 超预期 (Beat)" : "❌ 低于预期 (Miss)") : "—"} |`);
  lines.push(`| 营业利润 | $${facts.operatingIncomeBillions}B | — | ${facts.operatingIncomeGrowthPct ? `同比 +${facts.operatingIncomeGrowthPct}%` : "—"} |`);
  lines.push(`| 核心经营 EPS | $${facts.epsOperating} | $${facts.epsConsensus} | ${facts.epsOperating >= facts.epsConsensus ? "✅ 超预期 (Beat)" : "❌ 低于预期 (Miss)"} |`);
  lines.push("");

  // 业务分部
  lines.push("### 业务单元与分部数据 (Segment Breakdown)");
  lines.push("");
  lines.push(`| 业务分部名称 | 营业收入 | 同比增速 (YoY) | 营业利润率 (Op. Margin) |`);
  lines.push(`|--------------|----------|----------------|-------------------------|`);
  for (const seg of facts.segments) {
    const margin = seg.operatingMarginPct != null ? `${seg.operatingMarginPct}%` : "—";
    lines.push(`| ${seg.name} | $${seg.revenueBillions}B | ${seg.growthPct > 0 ? "+" : ""}${seg.growthPct}% | ${margin} |`);
  }
  lines.push("");

  // 催化剂
  if (catalysts && catalysts.catalysts && catalysts.catalysts.length > 0) {
    lines.push("## 四、 核心基本面催化剂与概率锚定 (Catalysts & Anchors)");
    lines.push("");
    lines.push(`| 序号 | 催化剂事件 | 驱动属性 | 发生概率 | 时间跨度 | 证据与概率锚定依据 |`);
    lines.push(`|------|------------|----------|----------|----------|--------------------|`);
    catalysts.catalysts.forEach((c, i) => {
      const dirZh = c.direction === "growth" ? "📈 积极驱动" : "📉 下行风险";
      const horizonZh = c.horizon === "near-term" ? "短期 (<3个月)" : c.horizon === "medium-term" ? "中期 (3-12个月)" : "长期 (>12个月)";
      lines.push(`| ${i + 1} | ${c.title} | ${dirZh} | ${(c.probability * 100).toFixed(0)}% | ${horizonZh} | ${c.probabilityAnchor} |`);
    });
    lines.push("");
  }

  // 护城河壁垒与竞品对标
  if (input.moat) {
    const m = input.moat;
    lines.push("## 五、 🏰 护城河壁垒与竞品对标 (Economic Moat & Competitors)");
    lines.push("");
    const moatRatingZh = m.overallMoatRating === "Wide" ? "宽护城河 (Wide Moat)" : m.overallMoatRating === "Narrow" ? "窄护城河 (Narrow Moat)" : "无明显壁垒 (No Moat)";
    const moatTrendZh = m.moatTrend === "Widening" ? "持续拓宽 (Widening)" : m.moatTrend === "Stable" ? "保持稳定 (Stable)" : "面临侵蚀收窄 (Narrowing)";
    lines.push(`- **护城河评级:** **${moatRatingZh}**`);
    lines.push(`- **演变趋势:** **${moatTrendZh}**`);
    lines.push("");
    if (m.moatSources && m.moatSources.length > 0) {
      lines.push("### 核心护城河支柱");
      lines.push("");
      lines.push("| 护城河支柱 | 壁垒强度 | 保护年限 | 核心结构性壁垒论据 |");
      lines.push("|------------|----------|----------|--------------------|");
      for (const ms of m.moatSources) {
        const strengthZh = ms.strength === "Strong" ? "极强 (Strong)" : ms.strength === "Moderate" ? "中等 (Moderate)" : ms.strength === "Weak" ? "较弱 (Weak)" : "无 (None)";
        lines.push(`| ${ms.source} | ${strengthZh} | ${ms.durabilityYears} 年 | ${ms.description} |`);
      }
      lines.push("");
    }
    if (m.competitors && m.competitors.length > 0) {
      lines.push("### 核心同行竞品对标矩阵");
      lines.push("");
      lines.push("| 竞品代码 / 公司 | 市值 | 年化营收 | 营收增速 | 毛利率 | 营业利润率 | 远期 P/E | 核心份额 | 定价权 | 相对优势与潜在软肋 |");
      lines.push("|-----------------|------|----------|----------|--------|------------|----------|----------|--------|-------------------|");
      for (const comp of m.competitors) {
        const revGrowth = comp.revenueGrowthPct != null ? `${comp.revenueGrowthPct > 0 ? "+" : ""}${comp.revenueGrowthPct}%` : "—";
        const fwdPe = comp.forwardPe != null ? `${comp.forwardPe}x` : "—";
        const share = comp.marketSharePct != null ? `${comp.marketSharePct}%` : "—";
        lines.push(`| **${comp.ticker}** (${comp.name}) | $${comp.marketCapBillions}B | $${comp.revenueBillions}B | ${revGrowth} | ${comp.grossMarginPct}% | ${comp.operatingMarginPct}% | ${fwdPe} | ${share} | ${comp.pricingPower} | ${comp.keyAdvantageOrVulnerability} |`);
      }
      lines.push("");
    }
    if (m.competitiveDynamicsSummary) {
      lines.push("### 竞争格局与护城河综述");
      lines.push("");
      lines.push(`> ${m.competitiveDynamicsSummary}`);
      lines.push("");
    }
  }

  // 估值区间
  if (valuation.stressTest && valuation.baseline) {
    const st = valuation.stressTest;
    lines.push(`## ${input.moat ? "六" : "五"}、 ⚡ StressAlpha 动态估值区间与利润穿透 (Valuation Regimes)`);
    lines.push("");
    lines.push(`- **压力测试预测 EPS:** $${st.stressEps}`);
    lines.push(`- **测算压力营业收入:** $${st.stressRevenueBillions}B`);
    lines.push(`- **测算压力毛利润:** $${st.stressGrossProfitBillions}B`);
    lines.push(`- **测算压力营业利润:** $${st.stressOperatingIncomeBillions}B`);
    lines.push(`- **测算压力净利润:** $${st.stressNetIncomeBillions}B`);
    lines.push(`- **恐慌底最大回撤空间:** ${st.asymmetry.downsideToPanicPct}%`);
    lines.push(`- **当前现价对应隐含 PE:** ${st.asymmetry.marketPricedInMultiple}x`);
    lines.push("");
    lines.push(`| 市场情景区间 | 估值倍数 (P/E) | 目标价格 | 相对现价预期涨跌 | 情景逻辑定义 |`);
    lines.push(`|--------------|----------------|----------|------------------|--------------|`);
    lines.push(`| 🐂 牛市情景 (Bull) | ${st.valuationBands.bull.multiple}x | $${st.valuationBands.bull.targetPrice} | ${st.valuationBands.bull.deltaFromCurrentPct > 0 ? "+" : ""}${st.valuationBands.bull.deltaFromCurrentPct}% | 需求超预期，估值倍数戴维斯双击扩张 |`);
    lines.push(`| ⚖️ 基准情景 (Base) | ${st.valuationBands.base.multiple}x | $${st.valuationBands.base.targetPrice} | ${st.valuationBands.base.deltaFromCurrentPct > 0 ? "+" : ""}${st.valuationBands.base.deltaFromCurrentPct}% | 指引中枢平稳兑现，倍数维持历史中位数 |`);
    lines.push(`| 🚨 恐慌底价 (Panic) | ${st.valuationBands.panic.multiple}x | $${st.valuationBands.panic.targetPrice} | ${st.valuationBands.panic.deltaFromCurrentPct > 0 ? "+" : ""}${st.valuationBands.panic.deltaFromCurrentPct}% | 宏观严重衰退叠加供应链资本开支削减 |`);
    lines.push("");
  }

  // 情景矩阵
  lines.push("## 六、 离散情景估值树 (Scenario Tree)");
  lines.push("");
  lines.push(`| 情景名称 | 赋予概率 | 目标公允价 | 较现价涨跌幅 |`);
  lines.push(`|----------|----------|------------|--------------|`);
  for (const sr of valuation.scenarioResults) {
    lines.push(`| ${sr.name} | ${(sr.probability * 100).toFixed(0)}% | $${sr.fairValue} | ${sr.upsideFromCurrent > 0 ? "+" : ""}${sr.upsideFromCurrent}% |`);
  }
  lines.push("");

  // 敏感性分析
  if (valuation.sensitivity.length > 0) {
    lines.push("## 七、 敏感性分析矩阵 (Sensitivity Analysis)");
    lines.push("");
    lines.push(`| 情景 | 敏感性参数 | 基准值 → 扰动值 | 目标公允价绝对变化 |`);
    lines.push(`|------|------------|-----------------|--------------------|`);
    for (const se of valuation.sensitivity) {
      lines.push(`| ${se.scenario} | ${se.parameter} | ${se.baseValue} → ${se.altValue} | ${se.fairValueDelta > 0 ? "+" : ""}$${se.fairValueDelta} |`);
    }
    lines.push("");
  }

  // 历史复盘
  if (reactions && reactions.events.length > 0) {
    lines.push("## 八、 历史财报市场反应复盘 (Historical Reactions)");
    lines.push("");
    if (reactions.conditionalFraming) {
      lines.push(`> **市场归因规律提炼：** ${reactions.conditionalFraming}`);
      lines.push("");
    }
    lines.push(`| 财报日期 | 季度事件 | 发布次日涨跌幅 | 归因背景与核心驱动 |`);
    lines.push(`|----------|----------|----------------|--------------------|`);
    for (const ev of reactions.events) {
      lines.push(`| ${ev.date} | ${ev.event} | ${ev.priceMovePct > 0 ? "+" : ""}${ev.priceMovePct}% | ${ev.context} |`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function translateVerdict(verdict: string): string {
  if (verdict.includes("In line with consensus")) {
    return "基本符合华尔街一致预期 (In Line)";
  }
  if (verdict.includes("Above consensus")) {
    return "高于华尔街一致预期，持更积极看法 (Bullish)";
  }
  if (verdict.includes("Below consensus")) {
    return "低于华尔街一致预期，持相对谨慎审慎态度 (Cautious)";
  }
  return verdict;
}
