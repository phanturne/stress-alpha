"use client";

import React from "react";
import { AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import type { Scenarios, Scenario, Valuation } from "@/lib/schemas";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";

interface ScenariosTabProps {
  scenariosData: Scenarios;
  currentPrice: number;
  valuation?: Valuation;
  onScenarioChange: (index: number, updated: Partial<Scenario>) => void;
  locale?: Locale;
}

export const ScenariosTab: React.FC<ScenariosTabProps> = ({
  scenariosData,
  currentPrice,
  valuation,
  onScenarioChange,
  locale = "zh",
}) => {
  const t = getTranslations(locale).scenariosTab;
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
            {t.title(basisYear)}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isProbValid ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-fintech-amberGlow/10 border border-fintech-amber/30 text-fintech-amber text-xs font-mono">
              <AlertCircle className="w-3.5 h-3.5" />
              {t.probMismatch(Math.round(totalProbability * 100))}
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-fintech-greenGlow/10 border border-fintech-green/30 text-fintech-green text-xs font-mono">
              <CheckCircle2 className="w-3 h-3" />
              {t.probValid}
            </div>
          )}
        </div>
      </div>

      {/* Live Weighted Fair Value Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl glass-panel border border-white/[0.08] flex flex-col justify-between shadow-md relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-accent/5 rounded-full blur-xl pointer-events-none" />
          <span className="text-xs text-slate-400 font-medium font-mono uppercase tracking-wider">
            {t.wfv}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight tabular-nums">
              {formatCurrency(weightedFairValue, 2)}
            </span>
            <span
              className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full border tabular-nums ${
                weightedUpsidePct >= 0
                  ? "text-fintech-green bg-fintech-greenGlow/15 border-fintech-green/30"
                  : "text-fintech-red bg-fintech-redGlow/15 border-fintech-red/30"
              }`}
            >
              {formatPercent(weightedUpsidePct)} {t.vsCurrent}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-white/[0.08] flex flex-col justify-between shadow-md">
          <span className="text-xs text-slate-400 font-medium font-mono uppercase tracking-wider">
            {t.consensusTarget}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-300 tracking-tight tabular-nums">
              {consensusTarget ? formatCurrency(consensusTarget, 2) : "N/A"}
            </span>
            {consensusTarget > 0 && (
              <span className="text-xs text-slate-400 font-mono tabular-nums px-2 py-0.5 rounded-full bg-surface-2 border border-white/[0.06]">
                {formatPercent(((consensusTarget - currentPrice) / currentPrice) * 100)} {t.implied}
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-white/[0.08] flex flex-col justify-between shadow-md">
          <span className="text-xs text-slate-400 font-medium font-mono uppercase tracking-wider">
            {t.alphaConsensus}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tracking-tight tabular-nums ${
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
            <span className="text-[11px] text-slate-400 font-medium">
              {weightedFairValue >= consensusTarget
                ? t.bullishPremium
                : t.discountedSafety}
            </span>
          </div>
        </div>
      </div>

      {/* Scenarios Interactive Table */}
      <div className="rounded-2xl border border-white/[0.08] glass-panel overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-0/90 backdrop-blur-md border-b border-white/[0.08] text-slate-400 font-mono uppercase text-[11px]">
                <th className="p-3.5 sticky left-0 bg-surface-0/95 z-20 font-semibold">{t.colScenario}</th>
                <th className="p-3.5 text-right font-semibold">{t.colProbability}</th>
                <th className="p-3.5 text-right font-semibold">{t.colFwdEps}</th>
                <th className="p-3.5 text-right font-semibold">{t.colExitPe}</th>
                <th className="p-3.5 text-right font-semibold">{t.colFairValue}</th>
                <th className="p-3.5 text-right font-semibold">{t.colUpside}</th>
                <th className="p-3.5 font-semibold min-w-[200px]">{t.colAssumptions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {scenarios.map((scenario, idx) => {
                const res = valuation?.scenarioResults?.[idx];
                const fairValue = res?.fairValue ?? scenario.forwardEps * scenario.multiple;
                const upside =
                  res?.upsideFromCurrent ??
                  (currentPrice > 0 ? ((fairValue - currentPrice) / currentPrice) * 100 : 0);

                return (
                  <tr
                    key={scenario.name || idx}
                    className="hover:bg-accent/5 transition-colors group"
                  >
                    <td className="p-3.5 font-bold text-white text-sm sticky left-0 bg-surface-1/95 backdrop-blur-sm z-10 border-r border-white/[0.05] whitespace-nowrap">
                      {scenario.name}
                    </td>
                    <td className="p-3.5 text-right">
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
                          className="w-16 px-2 py-1 rounded-lg bg-surface-0/90 border border-white/[0.1] text-right font-mono font-bold text-slate-100 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/40 tabular-nums no-spinners transition-all"
                        />
                        <span className="text-slate-400 font-mono text-xs">%</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <span className="text-slate-400 font-mono text-xs">$</span>
                        <input
                          type="number"
                          step="0.05"
                          value={scenario.forwardEps}
                          onChange={(e) =>
                            onScenarioChange(idx, {
                              forwardEps: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-20 px-2 py-1 rounded-lg bg-surface-0/90 border border-white/[0.1] text-right font-mono font-bold text-slate-100 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/40 tabular-nums no-spinners transition-all"
                        />
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
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
                          className="w-16 px-2 py-1 rounded-lg bg-surface-0/90 border border-white/[0.1] text-right font-mono font-bold text-slate-100 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/40 tabular-nums no-spinners transition-all"
                        />
                        <span className="text-slate-400 font-mono text-xs">x</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-white text-sm tabular-nums whitespace-nowrap">
                      {formatCurrency(fairValue, 2)}
                    </td>
                    <td
                      className={`p-3.5 text-right font-mono font-bold text-sm tabular-nums whitespace-nowrap ${
                        upside >= 0 ? "text-fintech-green" : "text-fintech-red"
                      }`}
                    >
                      {formatPercent(upside)}
                    </td>
                    <td className="p-3.5 text-slate-300 text-xs leading-relaxed max-w-sm">
                      {scenario.assumptions?.join("; ") || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
