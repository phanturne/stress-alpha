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
  onLocaleChange?: (locale: Locale) => void;
}

export const MemoView: React.FC<MemoViewProps> = ({
  reportData,
  stressResult,
  onBackToCockpit,
  locale = "zh",
  onLocaleChange,
}) => {
  const [selectedLang, setSelectedLang] = useState<Locale | null>(null);
  const memoLang = selectedLang ?? locale;

  const handleLangChange = (lang: Locale) => {
    setSelectedLang(lang);
    onLocaleChange?.(lang);
  };

  const isZh = memoLang === "zh";
  const t = getTranslations(memoLang).memo;
  const facts =
    isZh && reportData.factsZh ? reportData.factsZh : reportData.facts;
  const catalysts =
    isZh && reportData.catalystsZh
      ? reportData.catalystsZh
      : reportData.catalysts;
  const filing =
    isZh && reportData.filingZh ? reportData.filingZh : reportData.filing;
  const scenarios =
    isZh && reportData.scenariosZh
      ? reportData.scenariosZh
      : reportData.scenarios;
  const moat = isZh && reportData.moatZh ? reportData.moatZh : reportData.moat;
  const estimates =
    isZh && reportData.estimatesZh
      ? reportData.estimatesZh
      : reportData.estimates;
  const currentPrice = facts.currentPrice;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      {/* Control Bar */}
      <div className="no-print mb-6 flex items-center justify-between border-b border-border/80 pb-6">
        <button
          type="button"
          onClick={onBackToCockpit}
          className="glass-panel flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-300 shadow-sm transition-all hover:border-slate-500 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          {t.backToCockpit}
        </button>

        <div className="flex items-center gap-3">
          {/* Report Language Switcher */}
          <div className="glass-panel flex items-center rounded-xl border border-border/80 p-1 text-xs shadow-sm">
            <button
              type="button"
              onClick={() => handleLangChange("en")}
              className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                memoLang === "en"
                  ? "bg-accent/20 font-bold text-accent shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t.enMemoBtn}
            </button>
            <button
              type="button"
              onClick={() => handleLangChange("zh")}
              className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                memoLang === "zh"
                  ? "bg-accent/20 font-bold text-accent shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t.zhMemoBtn}
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-accent/20 transition-all hover:bg-accent-hover hover:shadow-accent/40"
          >
            <Printer className="size-4" />
            {t.printPdf}
          </button>
        </div>
      </div>

      {/* Printable Memo Sheet */}
      <div className="memo-print-page glass-panel flex flex-col gap-8 rounded-2xl border border-border/80 p-8 text-slate-100 shadow-2xl md:p-12">
        {/* Memo Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-border/80 pb-6 md:flex-row md:items-end">
          <div>
            <div className="mb-1.5 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-accent">
              <Zap className="size-3.5" />
              {t.committeeMemo}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              {facts.ticker} ({facts.company}) &bull; {facts.quarter}{" "}
              {t.decisionAudit}
            </h1>
            <div className="mt-1.5 font-mono text-xs text-slate-400">
              {t.reportDate}: {facts.reportDate} | {t.generatedVia}
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-border/80 bg-surface-0/90 px-4 py-2.5 shadow-sm">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                {t.currentStock}
              </div>
              <div className="font-mono text-base font-bold tabular-nums text-white">
                {formatCurrency(currentPrice)}
              </div>
            </div>
            <div className="h-6 w-px bg-border" />
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                {t.weightedFairValue}
              </div>
              <div className="font-mono text-base font-bold tabular-nums text-accent">
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
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
            {t.sec1Title}
          </h2>
          {isZh ? (
            <>
              <p className="text-sm leading-relaxed text-slate-300">
                本备忘录为针对{" "}
                <strong className="text-white">{facts.ticker}</strong> (
                {facts.company}) 发布的{" "}
                <strong className="text-white">{facts.quarter}</strong>{" "}
                财报提供结构化的基本面决策审计。名义 GAAP 稀释每股收益为 $
                {facts.epsReported}（彭博一致预期为 ${facts.epsConsensus}
                ），经收益质量穿透并剔除非经营性一次性账面损益后，真实核心经营
                EPS 确立为{" "}
                <strong className="text-accent">
                  {formatCurrency(facts.epsOperating)}
                </strong>
                。
              </p>
              <p className="text-sm leading-relaxed text-slate-300">
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
              <p className="text-sm leading-relaxed text-slate-300">
                This memorandum provides a structured fundamental equity
                synthesis for{" "}
                <strong className="text-white">{facts.ticker}</strong> following
                the <strong className="text-white">{facts.quarter}</strong>{" "}
                release. While headline GAAP earnings showed an apparent beat ($
                {facts.epsReported} vs ${facts.epsConsensus} est), intrinsic
                cash operating earnings stand at{" "}
                <strong className="text-accent">
                  {formatCurrency(facts.epsOperating)}
                </strong>
                , normalized for one-time paper accounting noise.
              </p>
              <p className="text-sm leading-relaxed text-slate-300">
                Under active StressAlpha parameter assumptions, implied forward
                stressed EPS is{" "}
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
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
            {t.sec2Title}
          </h2>
          <div className="custom-scrollbar overflow-x-auto rounded-xl border border-border/80">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-0/90 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="p-3 font-semibold">{t.colRegime}</th>
                  <th className="p-3 text-right font-semibold">
                    {t.colMultiple}
                  </th>
                  <th className="p-3 text-right font-semibold">
                    {t.colStressedEps}
                  </th>
                  <th className="p-3 text-right font-semibold">
                    {t.colTargetPrice}
                  </th>
                  <th className="p-3 text-right font-semibold">{t.colDelta}</th>
                  <th className="p-3 font-semibold">{t.colThesis}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr className="transition-colors hover:bg-surface-0/40">
                  <td className="whitespace-nowrap p-3 font-bold text-fintech-green">
                    {t.regimeBull}
                  </td>
                  <td className="whitespace-nowrap p-3 text-right font-mono tabular-nums">
                    {stressResult.valuationBands.bull.multiple}x
                  </td>
                  <td className="whitespace-nowrap p-3 text-right font-mono tabular-nums">
                    {formatCurrency(stressResult.stressEps)}
                  </td>
                  <td className="whitespace-nowrap p-3 text-right font-mono font-bold tabular-nums text-white">
                    {formatCurrency(
                      stressResult.valuationBands.bull.targetPrice
                    )}
                  </td>
                  <td className="whitespace-nowrap p-3 text-right font-mono font-bold tabular-nums text-fintech-green">
                    {formatPercent(
                      stressResult.valuationBands.bull.deltaFromCurrentPct
                    )}
                  </td>
                  <td className="min-w-[240px] p-3 text-[11px] leading-relaxed text-slate-300">
                    {scenarios?.scenarios?.find(
                      (s) =>
                        s.name.toLowerCase().includes("bull") ||
                        s.name.includes("牛市")
                    )?.assumptions?.[0] ??
                      (isZh
                        ? "强劲基本面超预期，关键增长催化剂落地，估值倍数扩张。"
                        : "Strong fundamental outperformance, catalyst execution, and multiple expansion.")}
                  </td>
                </tr>
                <tr className="transition-colors hover:bg-surface-0/40">
                  <td className="whitespace-nowrap p-3 font-bold text-slate-200">
                    {t.regimeBase}
                  </td>
                  <td className="whitespace-nowrap p-3 text-right font-mono tabular-nums">
                    {stressResult.valuationBands.base.multiple}x
                  </td>
                  <td className="whitespace-nowrap p-3 text-right font-mono tabular-nums">
                    {formatCurrency(stressResult.stressEps)}
                  </td>
                  <td className="whitespace-nowrap p-3 text-right font-mono font-bold tabular-nums text-white">
                    {formatCurrency(
                      stressResult.valuationBands.base.targetPrice
                    )}
                  </td>
                  <td
                    className={`whitespace-nowrap p-3 text-right font-mono font-bold tabular-nums ${
                      stressResult.valuationBands.base.deltaFromCurrentPct >= 0
                        ? "text-fintech-green"
                        : "text-fintech-red"
                    }`}
                  >
                    {formatPercent(
                      stressResult.valuationBands.base.deltaFromCurrentPct
                    )}
                  </td>
                  <td className="min-w-[240px] p-3 text-[11px] leading-relaxed text-slate-300">
                    {scenarios?.scenarios?.find(
                      (s) =>
                        s.name.toLowerCase().includes("base") ||
                        s.name.includes("基准")
                    )?.assumptions?.[0] ??
                      (isZh
                        ? "管理层指引中枢平稳兑现，市场份额稳固，估值倍数维持合理中枢。"
                        : "Guidance mid-point execution, steady market share, and normalized multiple stability.")}
                  </td>
                </tr>
                <tr className="transition-colors hover:bg-surface-0/40">
                  <td className="whitespace-nowrap p-3 font-bold text-fintech-red">
                    {t.regimePanic}
                  </td>
                  <td className="whitespace-nowrap p-3 text-right font-mono tabular-nums">
                    {stressResult.valuationBands.panic.multiple}x
                  </td>
                  <td className="whitespace-nowrap p-3 text-right font-mono tabular-nums">
                    {formatCurrency(stressResult.stressEps)}
                  </td>
                  <td className="whitespace-nowrap p-3 text-right font-mono font-bold tabular-nums text-white">
                    {formatCurrency(
                      stressResult.valuationBands.panic.targetPrice
                    )}
                  </td>
                  <td className="whitespace-nowrap p-3 text-right font-mono font-bold tabular-nums text-fintech-red">
                    {formatPercent(
                      stressResult.valuationBands.panic.deltaFromCurrentPct
                    )}
                  </td>
                  <td className="min-w-[240px] p-3 text-[11px] leading-relaxed text-slate-300">
                    {scenarios?.scenarios?.find(
                      (s) =>
                        s.name.toLowerCase().includes("bear") ||
                        s.name.toLowerCase().includes("panic") ||
                        s.name.includes("熊市") ||
                        s.name.includes("恐慌")
                    )?.assumptions?.[0] ??
                      (isZh
                        ? "核心业务承压，监管或竞争加剧引发利润率收缩与倍数戴维斯双杀。"
                        : "Severe top-line contraction, margin compression, and multiple de-rating.")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Quality of Earnings Guardrail */}
        {facts.oneTimeItems && facts.oneTimeItems.length > 0 && (
          <div className="flex flex-col gap-2 rounded-xl border border-fintech-amber/30 bg-surface-0/80 p-4 shadow-sm">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-fintech-amber">
              <ShieldCheck className="size-4" />
              {t.sec3Title}
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              {isZh ? (
                <>
                  名义报告 GAAP EPS 为 ${facts.epsReported}
                  。模型严格剔除非经营性与过渡性损益：
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
                  Reported GAAP diluted EPS was ${facts.epsReported}.
                  Fundamental equity assessment strips non-operating and
                  transitory noise:{" "}
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
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
              {t.sec4Title}
            </h2>
            <ul className="list-disc space-y-1.5 pl-4 text-xs text-slate-300">
              {catalysts.catalysts.map((c, i) => (
                <li key={i} className="leading-relaxed">
                  <strong className="text-white">{c.title}</strong> (
                  {(c.probability * 100).toFixed(0)}% {t.prob}, {c.horizon}):{" "}
                  {c.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Economic Moat & Competitors */}
        {moat && (
          <div className="flex flex-col gap-3">
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
              {t.secMoatTitle}
            </h2>

            <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-surface-0/80 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="rounded border border-fintech-green/30 bg-fintech-greenGlow/20 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-fintech-green shadow-sm">
                  {moat.overallMoatRating} Moat
                </span>
                <span className="rounded border border-border bg-surface-2 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-300">
                  Trend: {moat.moatTrend}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                {moat.competitiveDynamicsSummary}
              </p>
            </div>

            {/* Moat Sources Grid */}
            {moat.moatSources && moat.moatSources.length > 0 && (
              <div className="grid grid-cols-1 gap-2.5 text-xs md:grid-cols-2">
                {moat.moatSources.map((s, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1.5 rounded-xl border border-border/70 bg-surface-0/80 p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="font-medium text-white">
                        {s.source}
                      </strong>
                      <span className="rounded border border-border/60 bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-accent">
                        {s.strength}{" "}
                        {s.durabilityYears ? `(${s.durabilityYears}y)` : ""}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      {s.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Peer Benchmarking Table */}
            {moat.competitors && moat.competitors.length > 0 && (
              <div className="custom-scrollbar overflow-x-auto rounded-xl border border-border/80">
                <table className="w-full border-collapse text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-border bg-surface-0/90 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                      <th className="p-2.5 font-semibold">Ticker</th>
                      <th className="p-2.5 font-semibold">Company</th>
                      <th className="p-2.5 text-right font-semibold">
                        Mkt Cap
                      </th>
                      <th className="p-2.5 text-right font-semibold">
                        Rev / YoY
                      </th>
                      <th className="p-2.5 text-right font-semibold">
                        Op Margin
                      </th>
                      <th className="p-2.5 text-right font-semibold">
                        FWD P/E
                      </th>
                      <th className="p-2.5 font-semibold">Pricing Power</th>
                      <th className="p-2.5 font-semibold">
                        {isZh
                          ? "产品管线与核心优劣势"
                          : "Key Advantage / Vulnerability"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {moat.competitors.map((peer, i) => (
                      <tr
                        key={i}
                        className="transition-colors hover:bg-surface-0/50"
                      >
                        <td className="whitespace-nowrap p-2.5 font-mono font-bold text-accent">
                          {peer.ticker}
                        </td>
                        <td className="whitespace-nowrap p-2.5 font-medium text-white">
                          {peer.name}
                        </td>
                        <td className="whitespace-nowrap p-2.5 text-right font-mono tabular-nums text-slate-300">
                          {peer.marketCapBillions !== undefined
                            ? `$${peer.marketCapBillions.toFixed(1)}B`
                            : "-"}
                        </td>
                        <td className="whitespace-nowrap p-2.5 text-right font-mono tabular-nums text-slate-300">
                          {peer.revenueBillions !== undefined
                            ? `$${peer.revenueBillions.toFixed(1)}B`
                            : "-"}
                          {peer.revenueGrowthPct !== undefined && (
                            <span
                              className={`ml-1 font-bold ${peer.revenueGrowthPct >= 0 ? "text-fintech-green" : "text-fintech-red"}`}
                            >
                              {peer.revenueGrowthPct.toFixed(0)}%
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap p-2.5 text-right font-mono tabular-nums text-slate-300">
                          {peer.operatingMarginPct !== undefined
                            ? `${peer.operatingMarginPct.toFixed(1)}%`
                            : "-"}
                        </td>
                        <td className="whitespace-nowrap p-2.5 text-right font-mono tabular-nums text-slate-300">
                          {peer.forwardPe !== undefined
                            ? `${peer.forwardPe.toFixed(1)}x`
                            : "-"}
                        </td>
                        <td className="whitespace-nowrap p-2.5">
                          <span className="rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                            {peer.pricingPower ?? "-"}
                          </span>
                        </td>
                        <td
                          className="max-w-[240px] truncate p-2.5 text-[10px] text-slate-300"
                          title={`${peer.productComparison} — ${peer.keyAdvantageOrVulnerability}`}
                        >
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

        {/* Analyst Estimates & Consensus */}
        {estimates && (
          <div className="flex flex-col gap-3">
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
              {t.secEstimatesTitle ??
                (isZh
                  ? "五(附)、 华尔街分析师共识与目标价 (Analyst Estimates)"
                  : "5b. Wall Street Analyst Consensus & Estimates")}
            </h2>

            <div className="flex flex-col gap-2.5 rounded-xl border border-border/80 bg-surface-0/80 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded border border-fintech-green/30 bg-fintech-greenGlow/20 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-fintech-green shadow-sm">
                    {estimates.consensus.consensus}
                  </span>
                  <span className="font-mono text-[11px] text-slate-300">
                    {estimates.consensus.totalAnalysts}{" "}
                    {isZh ? "位分析师覆盖" : "Analysts"} (
                    {estimates.consensus.bullishCount}{" "}
                    {isZh ? "看多" : "Bullish"},{" "}
                    {estimates.consensus.neutralCount}{" "}
                    {isZh ? "中性" : "Neutral"},{" "}
                    {estimates.consensus.bearishCount}{" "}
                    {isZh ? "看空" : "Bearish"})
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-300">
                  {isZh ? "目标价区间: " : "52W Range: "}
                  <span className="font-bold text-white">
                    ${estimates.priceTargets.low} – $
                    {estimates.priceTargets.high}
                  </span>
                  <span className="ml-1.5 font-bold text-fintech-green">
                    (Avg ${estimates.priceTargets.average})
                  </span>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-300">
                {estimates.synthesisNarrative}
              </p>
            </div>

            {estimates.estimates && estimates.estimates.length > 0 && (
              <div className="custom-scrollbar overflow-x-auto rounded-xl border border-border/80">
                <table className="w-full border-collapse text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-border bg-surface-0/90 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                      <th className="p-2.5 font-semibold">
                        {isZh ? "券商机构" : "Firm"}
                      </th>
                      <th className="p-2.5 font-semibold">
                        {isZh ? "分析师" : "Analyst"}
                      </th>
                      <th className="p-2.5 font-semibold">
                        {isZh ? "评级" : "Rating"}
                      </th>
                      <th className="p-2.5 text-right font-semibold">
                        {isZh ? "52周目标价" : "Price Target"}
                      </th>
                      <th className="p-2.5 text-right font-semibold">
                        {isZh ? "预期空间" : "Upside"}
                      </th>
                      <th className="p-2.5 text-right font-semibold">
                        {isZh ? "日期" : "Date"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {estimates.estimates.slice(0, 10).map((e, i) => (
                      <tr
                        key={i}
                        className="transition-colors hover:bg-surface-0/50"
                      >
                        <td className="whitespace-nowrap p-2.5 font-medium text-white">
                          {e.firm}
                        </td>
                        <td className="whitespace-nowrap p-2.5 text-slate-400">
                          {e.analyst || "—"}
                        </td>
                        <td className="whitespace-nowrap p-2.5">
                          <span className="rounded border border-fintech-green/30 bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-fintech-green">
                            {e.rating}
                          </span>
                        </td>
                        <td className="whitespace-nowrap p-2.5 text-right font-mono font-bold tabular-nums text-white">
                          ${e.priceTarget.toFixed(2)}
                          {e.priorPriceTarget && (
                            <span className="ml-1 text-[10px] font-normal text-slate-500">
                              ({isZh ? "前值" : "from"} $
                              {e.priorPriceTarget.toFixed(0)})
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap p-2.5 text-right font-mono font-semibold tabular-nums text-fintech-green">
                          {e.upsidePct >= 0 ? "+" : ""}
                          {e.upsidePct.toFixed(1)}%
                        </td>
                        <td className="whitespace-nowrap p-2.5 text-right font-mono text-[10px] text-slate-400">
                          {e.date}
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
        {filing &&
          filing.newRiskFactors &&
          filing.newRiskFactors.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
                {t.sec5Title}
              </h2>
              <ul className="list-disc space-y-1 pl-4 text-xs text-slate-300">
                {filing.newRiskFactors.map((r, i) => (
                  <li key={i} className="leading-relaxed">
                    <span className="font-semibold text-fintech-red">
                      [{r.severity}]
                    </span>{" "}
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
