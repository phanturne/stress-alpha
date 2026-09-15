"use client";

import React, { useState } from "react";
import { Printer, ArrowLeft, ShieldCheck, Zap, Globe } from "lucide-react";
import type { ReportData, StressResult } from "@/lib/schemas";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";

interface MemoViewProps {
  reportData: ReportData;
  stressResult: StressResult;
  onBackToCockpit: () => void;
  locale?: Locale;
}

export const MemoView: React.FC<MemoViewProps> = ({
  reportData,
  stressResult,
  onBackToCockpit,
  locale = "zh",
}) => {
  const [memoLang, setMemoLang] = useState<Locale>(locale);
  const isZh = memoLang === "zh";
  const t = getTranslations(memoLang).memo;
  const facts = (isZh && reportData.factsZh) ? reportData.factsZh : reportData.facts;
  const catalysts = (isZh && reportData.catalystsZh) ? reportData.catalystsZh : reportData.catalysts;
  const filing = (isZh && reportData.filingZh) ? reportData.filingZh : reportData.filing;
  const scenarios = (isZh && reportData.scenariosZh) ? reportData.scenariosZh : reportData.scenarios;
  const moat = (isZh && reportData.moatZh) ? reportData.moatZh : reportData.moat;
  const currentPrice = facts.currentPrice;

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4">
      {/* Control Bar */}
      <div className="no-print flex items-center justify-between pb-6 mb-6 border-b border-border">
        <button
          type="button"
          onClick={onBackToCockpit}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-1 hover:bg-surface-2 border border-border text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToCockpit}
        </button>

        <div className="flex items-center gap-3">
          {/* Report Language Switcher */}
          <div className="flex items-center bg-surface-1 p-0.5 rounded-lg border border-border text-xs">
            <button
              type="button"
              onClick={() => setMemoLang("en")}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                memoLang === "en"
                  ? "bg-surface-3 text-accent shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t.enMemoBtn}
            </button>
            <button
              type="button"
              onClick={() => setMemoLang("zh")}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                memoLang === "zh"
                  ? "bg-accent/20 text-accent font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t.zhMemoBtn}
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-slate-950 font-bold text-xs transition-colors shadow-md shadow-accent/20"
          >
            <Printer className="w-4 h-4" />
            {t.printPdf}
          </button>
        </div>
      </div>

      {/* Printable Memo Sheet */}
      <div className="memo-print-page bg-surface-1 text-slate-100 rounded-2xl border border-border p-8 md:p-12 shadow-2xl flex flex-col gap-8">
        {/* Memo Header */}
        <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-accent uppercase tracking-widest mb-1">
              <Zap className="w-3.5 h-3.5" />
              {t.committeeMemo}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {facts.ticker} ({facts.company}) &bull; {facts.quarter}{" "}
              {t.decisionAudit}
            </h1>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              {t.reportDate}: {facts.reportDate} |{" "}
              {t.generatedVia}
            </div>
          </div>

          <div className="flex items-center gap-4 bg-surface-0 px-4 py-2.5 rounded-xl border border-border">
            <div>
              <div className="text-[10px] text-slate-400 font-mono">
                {t.currentStock}
              </div>
              <div className="text-base font-bold font-mono text-white">
                {formatCurrency(currentPrice)}
              </div>
            </div>
            <div className="h-6 w-[1px] bg-border" />
            <div>
              <div className="text-[10px] text-slate-400 font-mono">
                {t.weightedFairValue}
              </div>
              <div className="text-base font-bold font-mono text-accent">
                {formatCurrency(
                  reportData.valuation?.weightedFairValue ?? currentPrice,
                  2
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Executive Synthesis */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
            {t.sec1Title}
          </h2>
          {isZh ? (
            <>
              <p className="text-sm text-slate-300 leading-relaxed">
                本备忘录为针对 <strong className="text-white">{facts.ticker}</strong> (
                {facts.company}) 发布的{" "}
                <strong className="text-white">{facts.quarter}</strong>{" "}
                财报提供结构化的基本面决策审计。名义 GAAP 稀释每股收益为 $
                {facts.epsReported}（彭博一致预期为 ${facts.epsConsensus}
                ），经收益质量穿透并剔除非经营性一次性账面损益后，真实核心经营 EPS 确立为{" "}
                <strong className="text-accent">{formatCurrency(facts.epsOperating)}</strong>。
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                基于当前 StressAlpha 压力测试参数设定，测算得出的压力预测 EPS 为{" "}
                <strong className="text-white">
                  {formatCurrency(stressResult.stressEps)}
                </strong>
                ，对应盈亏非对称比为{" "}
                <strong className="text-accent">
                  {stressResult.asymmetry.riskRewardRatio.toFixed(2)}x
                </strong>
                ，恐慌底价下行最大回撤风险为{" "}
                <strong className="text-fintech-red">
                  {formatPercent(stressResult.asymmetry.downsideToPanicPct)}
                </strong>
                。
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-300 leading-relaxed">
                This memorandum provides a structured fundamental equity synthesis for{" "}
                <strong className="text-white">{facts.ticker}</strong> following the{" "}
                <strong className="text-white">{facts.quarter}</strong> release. While headline
                GAAP earnings showed an apparent beat (${facts.epsReported} vs $
                {facts.epsConsensus} est), intrinsic cash operating earnings stand at{" "}
                <strong className="text-accent">{formatCurrency(facts.epsOperating)}</strong>,
                normalized for one-time paper accounting noise.
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Under active StressAlpha parameter assumptions, implied forward stressed EPS is{" "}
                <strong className="text-white">
                  {formatCurrency(stressResult.stressEps)}
                </strong>
                , yielding a risk/reward asymmetry ratio of{" "}
                <strong className="text-accent">
                  {stressResult.asymmetry.riskRewardRatio.toFixed(2)}x
                </strong>{" "}
                with a downside panic floor drawdown of{" "}
                <strong className="text-fintech-red">
                  {formatPercent(stressResult.asymmetry.downsideToPanicPct)}
                </strong>
                .
              </p>
            </>
          )}
        </div>

        {/* Valuation Regimes Table */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
            {t.sec2Title}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-0 border-b border-border text-slate-400 font-mono uppercase text-[10px]">
                  <th className="p-3">{t.colRegime}</th>
                  <th className="p-3 text-right">{t.colMultiple}</th>
                  <th className="p-3 text-right">{t.colStressedEps}</th>
                  <th className="p-3 text-right">{t.colTargetPrice}</th>
                  <th className="p-3 text-right">{t.colDelta}</th>
                  <th className="p-3">{t.colThesis}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="p-3 font-bold text-fintech-green">
                    {t.regimeBull}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {stressResult.valuationBands.bull.multiple}x
                  </td>
                  <td className="p-3 text-right font-mono">
                    {formatCurrency(stressResult.stressEps)}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-white">
                    {formatCurrency(stressResult.valuationBands.bull.targetPrice)}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-fintech-green">
                    {formatPercent(stressResult.valuationBands.bull.deltaFromCurrentPct)}
                  </td>
                  <td className="p-3 text-slate-300 text-[11px]">
                    {scenarios?.scenarios?.find(s => s.name.toLowerCase().includes("bull") || s.name.includes("牛市"))?.assumptions?.[0]
                      ?? (isZh ? "强劲基本面超预期，关键增长催化剂落地，估值倍数扩张。" : "Strong fundamental outperformance, catalyst execution, and multiple expansion.")}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-200">
                    {t.regimeBase}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {stressResult.valuationBands.base.multiple}x
                  </td>
                  <td className="p-3 text-right font-mono">
                    {formatCurrency(stressResult.stressEps)}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-white">
                    {formatCurrency(stressResult.valuationBands.base.targetPrice)}
                  </td>
                  <td
                    className={`p-3 text-right font-mono font-bold ${
                      stressResult.valuationBands.base.deltaFromCurrentPct >= 0
                        ? "text-fintech-green"
                        : "text-fintech-red"
                    }`}
                  >
                    {formatPercent(stressResult.valuationBands.base.deltaFromCurrentPct)}
                  </td>
                  <td className="p-3 text-slate-300 text-[11px]">
                    {scenarios?.scenarios?.find(s => s.name.toLowerCase().includes("base") || s.name.includes("基准"))?.assumptions?.[0]
                      ?? (isZh ? "管理层指引中枢平稳兑现，市场份额稳固，估值倍数维持合理中枢。" : "Guidance mid-point execution, steady market share, and normalized multiple stability.")}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-fintech-red">
                    {t.regimePanic}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {stressResult.valuationBands.panic.multiple}x
                  </td>
                  <td className="p-3 text-right font-mono">
                    {formatCurrency(stressResult.stressEps)}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-white">
                    {formatCurrency(stressResult.valuationBands.panic.targetPrice)}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-fintech-red">
                    {formatPercent(stressResult.valuationBands.panic.deltaFromCurrentPct)}
                  </td>
                  <td className="p-3 text-slate-300 text-[11px]">
                    {scenarios?.scenarios?.find(s => s.name.toLowerCase().includes("bear") || s.name.toLowerCase().includes("panic") || s.name.includes("熊市") || s.name.includes("恐慌"))?.assumptions?.[0]
                      ?? (isZh ? "核心业务承压，监管或竞争加剧引发利润率收缩与倍数戴维斯双杀。" : "Severe top-line contraction, margin compression, and multiple de-rating.")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Quality of Earnings Guardrail */}
        {facts.oneTimeItems && facts.oneTimeItems.length > 0 && (
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-surface-0 border border-fintech-amber/30">
            <div className="flex items-center gap-2 text-xs font-bold text-fintech-amber font-mono uppercase">
              <ShieldCheck className="w-4 h-4" />
              {t.sec3Title}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isZh ? (
                <>
                  名义报告 GAAP EPS 为 ${facts.epsReported}。模型严格剔除非经营性与过渡性损益：
                  {facts.oneTimeItems
                    .map(
                      (i) =>
                        `$${i.amountBillions}B 关联 ${i.description} (${
                          i.isOperating ? "经营性" : "非经营性公允价值变动"
                        })`
                    )
                    .join("，")}
                  。调整后标准化核心经营 EPS 确立为{" "}
                  <strong className="text-accent">
                    {formatCurrency(facts.epsOperating)}
                  </strong>
                  。
                </>
              ) : (
                <>
                  Reported GAAP diluted EPS was ${facts.epsReported}. Fundamental equity assessment strips non-operating and transitory noise:{" "}
                  {facts.oneTimeItems
                    .map(
                      (i) =>
                        `$${i.amountBillions}B related to ${i.description} (${
                          i.isOperating ? "operating" : "non-operating"
                        })`
                    )
                    .join(", ")}
                  . Normalized operating EPS is established at{" "}
                  <strong className="text-accent">
                    {formatCurrency(facts.epsOperating)}
                  </strong>
                  .
                </>
              )}
            </p>
          </div>
        )}

        {/* Catalysts Summary */}
        {catalysts && catalysts.catalysts && (
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
              {t.sec4Title}
            </h2>
            <ul className="space-y-1.5 text-xs text-slate-300 pl-4 list-disc">
              {catalysts.catalysts.map((c, i) => (
                <li key={i} className="leading-relaxed">
                  <strong className="text-white">{c.title}</strong> (
                  {(c.probability * 100).toFixed(0)}%{" "}
                  {t.prob}, {c.horizon}): {c.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Economic Moat & Competitors */}
        {moat && (
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
              {t.secMoatTitle}
            </h2>

            <div className="p-3.5 rounded-xl bg-surface-0 border border-border flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-fintech-greenGlow/20 text-fintech-green border border-fintech-green/30 font-mono">
                  {moat.overallMoatRating} Moat
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-300 bg-surface-2 border border-border font-mono">
                  Trend: {moat.moatTrend}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {moat.competitiveDynamicsSummary}
              </p>
            </div>

            {/* Moat Sources Grid */}
            {moat.moatSources && moat.moatSources.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {moat.moatSources.map((s, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-surface-0 border border-border/70 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-white font-medium">{s.source}</strong>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-accent">
                        {s.strength} {s.durabilityYears ? `(${s.durabilityYears}y)` : ""}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{s.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Peer Benchmarking Table */}
            {moat.competitors && moat.competitors.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-surface-0 text-slate-400 font-mono border-b border-border">
                      <th className="p-2">Ticker</th>
                      <th className="p-2">Company</th>
                      <th className="p-2 text-right">Mkt Cap</th>
                      <th className="p-2 text-right">Rev / YoY</th>
                      <th className="p-2 text-right">Op Margin</th>
                      <th className="p-2 text-right">FWD P/E</th>
                      <th className="p-2">Pricing Power</th>
                      <th className="p-2">{isZh ? "产品管线与核心优劣势" : "Key Advantage / Vulnerability"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {moat.competitors.map((peer, i) => (
                      <tr key={i} className="hover:bg-surface-0/50">
                        <td className="p-2 font-mono font-bold text-accent">{peer.ticker}</td>
                        <td className="p-2 text-white font-medium whitespace-nowrap">{peer.name}</td>
                        <td className="p-2 text-right font-mono text-slate-300">
                          {peer.marketCapBillions !== undefined ? `$${peer.marketCapBillions.toFixed(1)}B` : "-"}
                        </td>
                        <td className="p-2 text-right font-mono text-slate-300 whitespace-nowrap">
                          {peer.revenueBillions !== undefined ? `$${peer.revenueBillions.toFixed(1)}B` : "-"}
                          {peer.revenueGrowthPct !== undefined && (
                            <span className={`ml-1 font-bold ${peer.revenueGrowthPct >= 0 ? "text-fintech-green" : "text-fintech-red"}`}>
                              {(peer.revenueGrowthPct).toFixed(0)}%
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-right font-mono text-slate-300">
                          {peer.operatingMarginPct !== undefined ? `${(peer.operatingMarginPct).toFixed(1)}%` : "-"}
                        </td>
                        <td className="p-2 text-right font-mono text-slate-300">
                          {peer.forwardPe !== undefined ? `${peer.forwardPe.toFixed(1)}x` : "-"}
                        </td>
                        <td className="p-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-2 border border-border text-slate-300">
                            {peer.pricingPower ?? "-"}
                          </span>
                        </td>
                        <td className="p-2 text-slate-400 text-[10px] max-w-[240px] truncate" title={`${peer.productComparison} — ${peer.keyAdvantageOrVulnerability}`}>
                          {peer.keyAdvantageOrVulnerability}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SEC Risk Disclosures */}
        {filing && filing.newRiskFactors && filing.newRiskFactors.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
              {t.sec5Title}
            </h2>
            <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc">
              {filing.newRiskFactors.map((r, i) => (
                <li key={i} className="leading-relaxed">
                  <span className="text-fintech-red font-semibold">[{r.severity}]</span>{" "}
                  {r.risk}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
