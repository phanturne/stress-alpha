"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Scale,
  Activity,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import type { Scenarios, Scenario, Valuation, SensitivityEntry } from "@/lib/schemas";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";

interface ScenariosTabProps {
  scenariosData: Scenarios;
  currentPrice: number;
  valuation?: Valuation;
  sensitivityData?: SensitivityEntry[];
  onScenarioChange: (index: number, updated: Partial<Scenario>) => void;
  locale?: Locale;
}

export const ScenariosTab: React.FC<ScenariosTabProps> = ({
  scenariosData,
  currentPrice,
  valuation,
  sensitivityData,
  onScenarioChange,
  locale = "zh",
}) => {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
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

  // Group sensitivity data by scenario if available
  const groupedSensitivity: Record<string, SensitivityEntry[]> = {};
  if (sensitivityData && sensitivityData.length > 0) {
    for (const item of sensitivityData) {
      if (!groupedSensitivity[item.scenario]) {
        groupedSensitivity[item.scenario] = [];
      }
      groupedSensitivity[item.scenario].push(item);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Status & View Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            {t.title(basisYear)}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Probability Validation Pill */}
          {!isProbValid ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-fintech-amberGlow/10 border border-fintech-amber/30 text-fintech-amber text-xs font-mono">
              <AlertCircle className="w-3.5 h-3.5" />
              {t.probMismatch(Math.round(totalProbability * 100))}
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-fintech-greenGlow/10 border border-fintech-green/30 text-fintech-green text-xs font-mono">
              <CheckCircle2 className="w-3 h-3" />
              {t.probValid}
            </div>
          )}

          {/* View Toggle: Columns / Table */}
          <div className="flex items-center p-0.5 rounded-lg bg-surface-0/80 border border-white/[0.08] text-xs">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewMode === "cards"
                  ? "bg-accent/20 text-accent font-bold shadow-sm ring-1 ring-accent/30"
                  : "text-slate-400 hover:text-white"
              }`}
              title={t.viewCards}
            >
              <LayoutGrid className="w-3 h-3" />
              <span className="hidden sm:inline">{t.viewCards}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-accent/20 text-accent font-bold shadow-sm ring-1 ring-accent/30"
                  : "text-slate-400 hover:text-white"
              }`}
              title={t.viewTable}
            >
              <TableIcon className="w-3 h-3" />
              <span className="hidden sm:inline">{t.viewTable}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Weighted Fair Value Summary Cards */}
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

      {/* Primary Scenarios: Side-by-Side Horizontal Comparison Columns (Default) */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xl:gap-5 items-stretch">
          {scenarios.map((scenario, idx) => {
            const res = valuation?.scenarioResults?.[idx];
            const fairValue = res?.fairValue ?? scenario.forwardEps * scenario.multiple;
            const upside =
              res?.upsideFromCurrent ??
              (currentPrice > 0 ? ((fairValue - currentPrice) / currentPrice) * 100 : 0);

            const nameLower = scenario.name.toLowerCase();
            const isBull = nameLower.includes("bull") || nameLower.includes("牛");
            const isBear = nameLower.includes("bear") || nameLower.includes("熊");

            const cardBorderCls = isBull
              ? "border-emerald-500/35 hover:border-emerald-400/60 bg-gradient-to-b from-emerald-950/20 via-surface-1/95 to-surface-1/90 shadow-emerald-950/20"
              : isBear
              ? "border-rose-500/35 hover:border-rose-400/60 bg-gradient-to-b from-rose-950/20 via-surface-1/95 to-surface-1/90 shadow-rose-950/20"
              : "border-sky-500/35 hover:border-sky-400/60 bg-gradient-to-b from-sky-950/20 via-surface-1/95 to-surface-1/90 shadow-sky-950/20";

            const badgeCls = isBull
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : isBear
              ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
              : "bg-sky-500/15 border-sky-500/30 text-sky-400";

            const priceTextCls = isBull
              ? "text-emerald-300"
              : isBear
              ? "text-rose-300"
              : "text-sky-200";

            const Icon = isBull ? TrendingUp : isBear ? TrendingDown : Scale;

            return (
              <div
                key={scenario.name || idx}
                className={`p-5 rounded-2xl glass-panel border flex flex-col justify-between gap-4 transition-all duration-200 shadow-xl ${cardBorderCls}`}
              >
                {/* Card Header: Name & Upside Pill */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border flex items-center justify-center ${badgeCls}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-sm text-white tracking-wide">
                      {scenario.name}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border tabular-nums ${
                      upside >= 0
                        ? "text-fintech-green bg-fintech-greenGlow/15 border-fintech-green/30"
                        : "text-fintech-red bg-fintech-redGlow/15 border-fintech-red/30"
                    }`}
                  >
                    {formatPercent(upside)}
                  </span>
                </div>

                {/* Hero Target Price */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                    {t.targetPrice}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl xl:text-4xl font-black font-mono tracking-tight tabular-nums ${priceTextCls}`}>
                      {formatCurrency(fairValue, 2)}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                      ({formatCurrency(scenario.forwardEps, 2)} × {scenario.multiple}x)
                    </span>
                  </div>
                </div>

                {/* Interactive Sliders & Inputs Container */}
                <div className="flex flex-col gap-3">
                  {/* Probability Slider & Numeric Input */}
                  <div className="p-3 rounded-xl bg-surface-0/80 border border-white/[0.06] flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">{t.weight}</span>
                      <div className="flex items-center gap-1 font-mono">
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
                          className="w-14 px-1.5 py-0.5 rounded bg-surface-1 border border-white/[0.12] text-right font-mono font-bold text-white focus:outline-none focus:border-accent tabular-nums text-xs"
                        />
                        <span className="text-slate-400 text-xs">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={Math.round(scenario.probability * 100)}
                      onChange={(e) =>
                        onScenarioChange(idx, {
                          probability: (parseFloat(e.target.value) || 0) / 100,
                        })
                      }
                      className="w-full accent-accent h-1.5 bg-surface-2 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* 2-Column EPS & Multiple Inline Inputs */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-surface-0/80 border border-white/[0.06] flex flex-col gap-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400">{t.fwdEps}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-xs font-mono">$</span>
                        <input
                          type="number"
                          step="0.05"
                          value={scenario.forwardEps}
                          onChange={(e) =>
                            onScenarioChange(idx, {
                              forwardEps: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-1.5 py-0.5 rounded bg-surface-1 border border-white/[0.12] text-right font-mono font-bold text-white focus:outline-none focus:border-accent tabular-nums text-xs"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-surface-0/80 border border-white/[0.06] flex flex-col gap-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400">{t.exitPe}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          value={scenario.multiple}
                          onChange={(e) =>
                            onScenarioChange(idx, {
                              multiple: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-1.5 py-0.5 rounded bg-surface-1 border border-white/[0.12] text-right font-mono font-bold text-white focus:outline-none focus:border-accent tabular-nums text-xs"
                        />
                        <span className="text-slate-400 text-xs font-mono">x</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Qualitative Assumptions Bullet List */}
                <div className="flex-1 flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    {t.assumptionsTitle}
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
                    {scenario.assumptions?.map((assump, aIdx) => (
                      <li key={aIdx} className="flex items-start gap-2">
                        <span className="text-slate-500 font-mono select-none mt-0.5">•</span>
                        <span>{assump}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Alternative Dense Interactive Table View */
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
      )}

      {/* Integrated Sensitivity Analysis Section */}
      {sensitivityData && sensitivityData.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/[0.08] flex flex-col gap-4 shadow-xl mt-2">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  {t.sensitivityTitle}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t.sensitivitySubtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pt-1">
            {Object.entries(groupedSensitivity).map(([scenarioName, items]) => (
              <div
                key={scenarioName}
                className="p-4.5 rounded-xl bg-surface-0/60 border border-white/[0.06] flex flex-col gap-3 hover:border-accent/30 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <span className="text-xs font-bold text-white tracking-tight">
                    {scenarioName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Δ Fair Value
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {items.map((it, idx) => {
                    const isPositive = it.fairValueDelta >= 0;
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border flex flex-col justify-between gap-1 transition-all ${
                          isPositive
                            ? "bg-fintech-greenGlow/10 border-fintech-green/30 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
                            : "bg-fintech-redGlow/10 border-fintech-red/30 shadow-[0_0_10px_rgba(244,63,94,0.05)]"
                        }`}
                      >
                        <span className="text-[11px] font-semibold text-slate-300">
                          {it.parameter}
                        </span>
                        <div className="flex items-baseline justify-between mt-0.5 pt-1 border-t border-white/5">
                          <span className="text-[10px] font-mono text-slate-400">
                            {it.baseValue} → {it.altValue}
                          </span>
                          <span
                            className={`text-xs font-bold font-mono tabular-nums ${
                              isPositive ? "text-fintech-green" : "text-fintech-red"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {formatCurrency(it.fairValueDelta, 0)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
