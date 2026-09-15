"use client";

import React from "react";
import { AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import type { Scenarios, Scenario, Valuation } from "@/lib/schemas";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface ScenariosTabProps {
  scenariosData: Scenarios;
  currentPrice: number;
  valuation?: Valuation;
  onScenarioChange: (index: number, updated: Partial<Scenario>) => void;
  locale?: "en" | "zh";
}

export const ScenariosTab: React.FC<ScenariosTabProps> = ({
  scenariosData,
  currentPrice,
  valuation,
  onScenarioChange,
  locale = "zh",
}) => {
  const isZh = locale === "zh";
  const { scenarios, basisYear, consensusTarget } = scenariosData;

  // Compute live fair values
  const totalProbability = scenarios.reduce((acc, s) => acc + s.probability, 0);
  const isProbValid = Math.abs(totalProbability - 1.0) < 0.015;

  const weightedFairValue =
    valuation?.weightedFairValue ??
    scenarios.reduce(
      (acc, s) => acc + s.probability * s.forwardEps * s.multiple,
      0
    );

  const weightedUpsidePct =
    valuation?.upsidePct ??
    (currentPrice > 0 ? ((weightedFairValue - currentPrice) / currentPrice) * 100 : 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Header & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            {isZh ? `情景发生概率树 (${basisYear})` : `Scenario Probability Tree (${basisYear})`}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isZh
              ? "确定性估值计算矩阵。支持直接内联编辑概率、远期 EPS 或目标倍数，实时重算。"
              : "Deterministic valuation matrix. Edit probabilities, forward EPS, or exit multiples inline for instant recalculation."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isProbValid ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-fintech-amberGlow/10 border border-fintech-amber/30 text-fintech-amber text-xs font-mono">
              <AlertCircle className="w-3.5 h-3.5" />
              {isZh
                ? `概率总和为 ${(totalProbability * 100).toFixed(0)}% (需等于 100%)`
                : `Probabilities sum to ${(totalProbability * 100).toFixed(0)}% (should be 100%)`}
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-fintech-greenGlow/10 border border-fintech-green/30 text-fintech-green text-xs font-mono">
              <CheckCircle2 className="w-3 h-3" />
              {isZh ? "100% 概率完全分配" : "100% Probability Distributed"}
            </div>
          )}
        </div>
      </div>

      {/* Live Weighted Fair Value Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-surface-1 border border-border flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">
            {isZh ? "加权公允价值 (WFV)" : "Weighted Fair Value"}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold font-mono text-white">
              {formatCurrency(weightedFairValue, 2)}
            </span>
            <span
              className={`text-xs font-bold font-mono ${
                weightedUpsidePct >= 0 ? "text-fintech-green" : "text-fintech-red"
              }`}
            >
              {formatPercent(weightedUpsidePct)} {isZh ? "较现价空间" : "vs current"}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-1 border border-border flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">
            {isZh ? "华尔街一致预期目标价" : "Consensus Price Target"}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold font-mono text-slate-300">
              {consensusTarget ? formatCurrency(consensusTarget, 2) : "N/A"}
            </span>
            {consensusTarget > 0 && (
              <span className="text-xs text-slate-400 font-mono">
                {formatPercent(((consensusTarget - currentPrice) / currentPrice) * 100)} {isZh ? "预期空间" : "implied"}
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-1 border border-border flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">
            {isZh ? "超额预期收益 (Alpha)" : "Alpha vs Consensus"}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-xl font-extrabold font-mono ${
                weightedFairValue >= consensusTarget
                  ? "text-fintech-green"
                  : "text-fintech-red"
              }`}
            >
              {consensusTarget > 0
                ? `${formatPercent(
                    ((weightedFairValue - consensusTarget) / consensusTarget) * 100
                  )}`
                : "—"}
            </span>
            <span className="text-[11px] text-slate-400">
              {weightedFairValue >= consensusTarget
                ? (isZh ? "看多溢价" : "Bullish premium")
                : (isZh ? "折价安全边际" : "Discounted safety")}
            </span>
          </div>
        </div>
      </div>

      {/* Scenarios Interactive Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-1 shadow-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface-0/80 border-b border-border text-slate-400 font-mono uppercase text-[11px]">
              <th className="p-3">{isZh ? "情景名称" : "Scenario"}</th>
              <th className="p-3 text-right">{isZh ? "发生概率" : "Probability"}</th>
              <th className="p-3 text-right">{isZh ? "远期 EPS" : "FWD EPS"}</th>
              <th className="p-3 text-right">{isZh ? "目标倍数" : "Exit P/E"}</th>
              <th className="p-3 text-right">{isZh ? "目标公允价" : "Fair Value Target"}</th>
              <th className="p-3 text-right">{isZh ? "较现价空间" : "Upside"}</th>
              <th className="p-3">{isZh ? "核心假设与驱动依据" : "Key Assumptions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {scenarios.map((scenario, idx) => {
              const res = valuation?.scenarioResults?.[idx];
              const fairValue = res?.fairValue ?? scenario.forwardEps * scenario.multiple;
              const upside =
                res?.upsideFromCurrent ??
                (currentPrice > 0 ? ((fairValue - currentPrice) / currentPrice) * 100 : 0);

              return (
                <tr
                  key={scenario.name || idx}
                  className="hover:bg-surface-2/40 transition-colors"
                >
                  <td className="p-3 font-bold text-white text-sm">
                    {scenario.name}
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={Math.round(scenario.probability * 100)}
                        onChange={(e) =>
                          onScenarioChange(idx, {
                            probability: (parseFloat(e.target.value) || 0) / 100,
                          })
                        }
                        className="w-16 px-2 py-1 rounded bg-surface-2 border border-border text-right font-mono font-bold text-slate-100 focus:outline-none focus:border-accent"
                      />
                      <span className="text-slate-400 font-mono">%</span>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <span className="text-slate-400 font-mono">$</span>
                      <input
                        type="number"
                        step="0.05"
                        value={scenario.forwardEps}
                        onChange={(e) =>
                          onScenarioChange(idx, {
                            forwardEps: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-20 px-2 py-1 rounded bg-surface-2 border border-border text-right font-mono font-bold text-slate-100 focus:outline-none focus:border-accent"
                      />
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <input
                        type="number"
                        step="0.5"
                        value={scenario.multiple}
                        onChange={(e) =>
                          onScenarioChange(idx, {
                            multiple: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-16 px-2 py-1 rounded bg-surface-2 border border-border text-right font-mono font-bold text-slate-100 focus:outline-none focus:border-accent"
                      />
                      <span className="text-slate-400 font-mono">x</span>
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-white text-sm">
                    {formatCurrency(fairValue, 2)}
                  </td>
                  <td
                    className={`p-3 text-right font-mono font-bold text-sm ${
                      upside >= 0 ? "text-fintech-green" : "text-fintech-red"
                    }`}
                  >
                    {formatPercent(upside)}
                  </td>
                  <td className="p-3 text-slate-300 max-w-xs text-[11px] leading-relaxed">
                    {scenario.assumptions?.join("; ") || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
