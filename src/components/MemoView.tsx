"use client";

import React from "react";
import { Printer, ArrowLeft, ShieldCheck, Zap } from "lucide-react";
import type { ReportData } from "@/lib/schemas";
import type { StressResult } from "@/lib/schemas";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface MemoViewProps {
  reportData: ReportData;
  stressResult: StressResult;
  onBackToCockpit: () => void;
}

export const MemoView: React.FC<MemoViewProps> = ({
  reportData,
  stressResult,
  onBackToCockpit,
}) => {
  const { facts, scenarios, catalysts, filing } = reportData;
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
          Back to Cockpit
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-slate-950 font-bold text-xs transition-colors shadow-md shadow-accent/20"
        >
          <Printer className="w-4 h-4" />
          Print / Export PDF Memo
        </button>
      </div>

      {/* Printable Memo Sheet */}
      <div className="memo-print-page bg-surface-1 text-slate-100 rounded-2xl border border-border p-8 md:p-12 shadow-2xl flex flex-col gap-8">
        {/* Memo Header */}
        <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-accent uppercase tracking-widest mb-1">
              <Zap className="w-3.5 h-3.5" />
              StressAlpha Investment Committee Memorandum
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {facts.ticker} ({facts.company}) &bull; {facts.quarter} Decision Audit
            </h1>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              Report Date: {facts.reportDate} | Generated via Deterministic Stress Engine
            </div>
          </div>

          <div className="flex items-center gap-4 bg-surface-0 px-4 py-2.5 rounded-xl border border-border">
            <div>
              <div className="text-[10px] text-slate-400 font-mono">Current Stock</div>
              <div className="text-base font-bold font-mono text-white">
                {formatCurrency(currentPrice)}
              </div>
            </div>
            <div className="h-6 w-[1px] bg-border" />
            <div>
              <div className="text-[10px] text-slate-400 font-mono">Weighted Fair Value</div>
              <div className="text-base font-bold font-mono text-accent">
                {formatCurrency(
                  reportData.valuation?.weightedFairValue ?? currentPrice,
                  0
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Executive Synthesis */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
            1. Executive Decision Synthesis
          </h2>
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
        </div>

        {/* Valuation Regimes Table */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
            2. Valuation Regimes & Stress Flow-Through
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-0 border-b border-border text-slate-400 font-mono uppercase text-[10px]">
                  <th className="p-3">Regime</th>
                  <th className="p-3 text-right">Multiple</th>
                  <th className="p-3 text-right">Stressed EPS</th>
                  <th className="p-3 text-right">Target Price</th>
                  <th className="p-3 text-right">Delta vs Current</th>
                  <th className="p-3">Core Scenario Thesis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="p-3 font-bold text-fintech-green">🐂 Bull Regime</td>
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
                    Enterprise re-acceleration accelerates; customer demand expands multiple.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-200">⚖️ Base Regime</td>
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
                    Guidance mid-point execution; steady normalized workload migration and margin discipline.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-fintech-red">🚨 Panic Floor</td>
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
                    Severe upstream CapEx curtailment, recessionary demand contraction, multiple de-rating.
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
              3. Income Quality Audit
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
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
              <strong className="text-accent">{formatCurrency(facts.epsOperating)}</strong>.
            </p>
          </div>
        )}

        {/* Catalysts Summary */}
        {catalysts && catalysts.catalysts && (
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
              4. Key Audited Catalysts & Probability Anchors
            </h2>
            <ul className="space-y-1.5 text-xs text-slate-300 pl-4 list-disc">
              {catalysts.catalysts.map((c, i) => (
                <li key={i} className="leading-relaxed">
                  <strong className="text-white">{c.title}</strong> (
                  {(c.probability * 100).toFixed(0)}% prob, {c.horizon}): {c.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* SEC Risk Disclosures */}
        {filing && filing.newRiskFactors && filing.newRiskFactors.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
              5. SEC Regulatory Risk Escalations
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
