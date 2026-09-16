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
import type {
  Scenarios,
  Scenario,
  Valuation,
  SensitivityEntry,
} from "@/lib/schemas";
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
  locale = "en",
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
    (currentPrice > 0
      ? ((weightedFairValue - currentPrice) / currentPrice) * 100
      : 0);

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
          <p className="mt-0.5 text-xs text-slate-400">{t.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Probability Validation Pill */}
          {!isProbValid ? (
            <div className="flex items-center gap-1.5 rounded-md border border-fintech-amber/30 bg-fintech-amberGlow/10 px-2.5 py-1 font-mono text-xs text-fintech-amber">
              <AlertCircle className="size-3.5" />
              {t.probMismatch(Math.round(totalProbability * 100))}
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-md border border-fintech-green/30 bg-fintech-greenGlow/10 px-2.5 py-1 font-mono text-xs text-fintech-green">
              <CheckCircle2 className="size-3" />
              {t.probValid}
            </div>
          )}

          {/* View Toggle: Columns / Table */}
          <div className="flex items-center rounded-lg border border-white/[0.08] bg-surface-0/80 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition-all ${
                viewMode === "cards"
                  ? "bg-accent/20 font-bold text-accent shadow-sm ring-1 ring-accent/30"
                  : "text-slate-400 hover:text-white"
              }`}
              title={t.viewCards}
            >
              <LayoutGrid className="size-3" />
              <span className="hidden sm:inline">{t.viewCards}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-accent/20 font-bold text-accent shadow-sm ring-1 ring-accent/30"
                  : "text-slate-400 hover:text-white"
              }`}
              title={t.viewTable}
            >
              <TableIcon className="size-3" />
              <span className="hidden sm:inline">{t.viewTable}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Weighted Fair Value Summary Cards */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        <div className="glass-panel relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] p-4 shadow-md">
          <div className="pointer-events-none absolute -right-12 -top-12 size-28 rounded-full bg-accent/5 blur-xl" />
          <span className="font-mono text-xs font-medium uppercase tracking-wider text-slate-400">
            {t.wfv}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black tabular-nums tracking-tight text-white sm:text-3xl">
              {formatCurrency(weightedFairValue, 2)}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 font-mono text-xs font-bold tabular-nums ${
                weightedUpsidePct >= 0
                  ? "border-fintech-green/30 bg-fintech-greenGlow/15 text-fintech-green"
                  : "border-fintech-red/30 bg-fintech-redGlow/15 text-fintech-red"
              }`}
            >
              {formatPercent(weightedUpsidePct)} {t.vsCurrent}
            </span>
          </div>
        </div>

        <div className="glass-panel flex flex-col justify-between rounded-2xl border border-white/[0.08] p-4 shadow-md">
          <span className="font-mono text-xs font-medium uppercase tracking-wider text-slate-400">
            {t.consensusTarget}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black tabular-nums tracking-tight text-slate-300 sm:text-3xl">
              {consensusTarget ? formatCurrency(consensusTarget, 2) : "N/A"}
            </span>
            {consensusTarget > 0 && (
              <span className="rounded-full border border-white/[0.06] bg-surface-2 px-2 py-0.5 font-mono text-xs tabular-nums text-slate-400">
                {formatPercent(
                  ((consensusTarget - currentPrice) / currentPrice) * 100
                )}{" "}
                {t.implied}
              </span>
            )}
          </div>
        </div>

        <div className="glass-panel flex flex-col justify-between rounded-2xl border border-white/[0.08] p-4 shadow-md">
          <span className="font-mono text-xs font-medium uppercase tracking-wider text-slate-400">
            {t.alphaConsensus}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`font-mono text-2xl font-black tabular-nums tracking-tight sm:text-3xl ${
                weightedFairValue >= consensusTarget
                  ? "text-fintech-green"
                  : "text-fintech-red"
              }`}
            >
              {consensusTarget > 0
                ? `${formatPercent(
                    ((weightedFairValue - consensusTarget) / consensusTarget) *
                      100
                  )}`
                : "—"}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {weightedFairValue >= consensusTarget
                ? t.bullishPremium
                : t.discountedSafety}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Scenarios: Side-by-Side Horizontal Comparison Columns (Default) */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3 xl:gap-5">
          {scenarios.map((scenario, idx) => {
            const res = valuation?.scenarioResults?.[idx];
            const fairValue =
              res?.fairValue ?? scenario.forwardEps * scenario.multiple;
            const upside =
              res?.upsideFromCurrent ??
              (currentPrice > 0
                ? ((fairValue - currentPrice) / currentPrice) * 100
                : 0);

            const nameLower = scenario.name.toLowerCase();
            const isBull =
              nameLower.includes("bull") || nameLower.includes("牛");
            const isBear =
              nameLower.includes("bear") || nameLower.includes("熊");

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
                className={`glass-panel flex flex-col justify-between gap-4 rounded-2xl border p-5 shadow-xl transition-all duration-200 ${cardBorderCls}`}
              >
                {/* Card Header: Name & Upside Pill */}
                <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center justify-center rounded-lg border p-1.5 ${badgeCls}`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <span className="text-sm font-extrabold tracking-wide text-white">
                      {scenario.name}
                    </span>
                  </div>

                  <span
                    className={`rounded-full border px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums ${
                      upside >= 0
                        ? "border-fintech-green/30 bg-fintech-greenGlow/15 text-fintech-green"
                        : "border-fintech-red/30 bg-fintech-redGlow/15 text-fintech-red"
                    }`}
                  >
                    {formatPercent(upside)}
                  </span>
                </div>

                {/* Hero Target Price */}
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    {t.targetPrice}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`font-mono text-3xl font-black tabular-nums tracking-tight xl:text-4xl ${priceTextCls}`}
                    >
                      {formatCurrency(fairValue, 2)}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-slate-400">
                      ({formatCurrency(scenario.forwardEps, 2)} ×{" "}
                      {scenario.multiple}x)
                    </span>
                  </div>
                </div>

                {/* Interactive Sliders & Inputs Container */}
                <div className="flex flex-col gap-3">
                  {/* Probability Slider & Numeric Input */}
                  <div className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-surface-0/80 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-400">
                        {t.weight}
                      </span>
                      <div className="flex items-center gap-1 font-mono">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={Math.round(scenario.probability * 100)}
                          onChange={(e) =>
                            onScenarioChange(idx, {
                              probability:
                                (parseFloat(e.target.value) || 0) / 100,
                            })
                          }
                          className="w-14 rounded border border-white/[0.12] bg-surface-1 px-1.5 py-0.5 text-right font-mono text-xs font-bold tabular-nums text-white focus:border-accent focus:outline-none"
                        />
                        <span className="text-xs text-slate-400">%</span>
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
                      className="h-1.5 w-full cursor-pointer rounded-lg bg-surface-2 accent-accent"
                    />
                  </div>

                  {/* 2-Column EPS & Multiple Inline Inputs */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1 rounded-xl border border-white/[0.06] bg-surface-0/80 p-2.5">
                      <span className="font-mono text-[10px] uppercase text-slate-400">
                        {t.fwdEps}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-slate-400">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.05"
                          value={scenario.forwardEps}
                          onChange={(e) =>
                            onScenarioChange(idx, {
                              forwardEps: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded border border-white/[0.12] bg-surface-1 px-1.5 py-0.5 text-right font-mono text-xs font-bold tabular-nums text-white focus:border-accent focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 rounded-xl border border-white/[0.06] bg-surface-0/80 p-2.5">
                      <span className="font-mono text-[10px] uppercase text-slate-400">
                        {t.exitPe}
                      </span>
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
                          className="w-full rounded border border-white/[0.12] bg-surface-1 px-1.5 py-0.5 text-right font-mono text-xs font-bold tabular-nums text-white focus:border-accent focus:outline-none"
                        />
                        <span className="font-mono text-xs text-slate-400">
                          x
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Qualitative Assumptions Bullet List */}
                <div className="flex flex-1 flex-col gap-2 border-t border-white/[0.06] pt-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {t.assumptionsTitle}
                  </span>
                  <ul className="space-y-1.5 text-xs leading-relaxed text-slate-300">
                    {scenario.assumptions?.map((assump, aIdx) => (
                      <li key={aIdx} className="flex items-start gap-2">
                        <span className="mt-0.5 select-none font-mono text-slate-500">
                          •
                        </span>
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
        <div className="glass-panel overflow-hidden rounded-2xl border border-white/[0.08] shadow-xl">
          <div className="custom-scrollbar overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-surface-0/90 font-mono text-[11px] uppercase text-slate-400 backdrop-blur-md">
                  <th className="sticky left-0 z-20 bg-surface-0/95 p-3.5 font-semibold">
                    {t.colScenario}
                  </th>
                  <th className="p-3.5 text-right font-semibold">
                    {t.colProbability}
                  </th>
                  <th className="p-3.5 text-right font-semibold">
                    {t.colFwdEps}
                  </th>
                  <th className="p-3.5 text-right font-semibold">
                    {t.colExitPe}
                  </th>
                  <th className="p-3.5 text-right font-semibold">
                    {t.colFairValue}
                  </th>
                  <th className="p-3.5 text-right font-semibold">
                    {t.colUpside}
                  </th>
                  <th className="min-w-[200px] p-3.5 font-semibold">
                    {t.colAssumptions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {scenarios.map((scenario, idx) => {
                  const res = valuation?.scenarioResults?.[idx];
                  const fairValue =
                    res?.fairValue ?? scenario.forwardEps * scenario.multiple;
                  const upside =
                    res?.upsideFromCurrent ??
                    (currentPrice > 0
                      ? ((fairValue - currentPrice) / currentPrice) * 100
                      : 0);

                  return (
                    <tr
                      key={scenario.name || idx}
                      className="group transition-colors hover:bg-accent/5"
                    >
                      <td className="sticky left-0 z-10 whitespace-nowrap border-r border-white/[0.05] bg-surface-1/95 p-3.5 text-sm font-bold text-white backdrop-blur-sm">
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
                                probability:
                                  (parseFloat(e.target.value) || 0) / 100,
                              })
                            }
                            className="no-spinners w-16 rounded-lg border border-white/[0.1] bg-surface-0/90 px-2 py-1 text-right font-mono font-bold tabular-nums text-slate-100 transition-all focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                          />
                          <span className="font-mono text-xs text-slate-400">
                            %
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <span className="font-mono text-xs text-slate-400">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.05"
                            value={scenario.forwardEps}
                            onChange={(e) =>
                              onScenarioChange(idx, {
                                forwardEps: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="no-spinners w-20 rounded-lg border border-white/[0.1] bg-surface-0/90 px-2 py-1 text-right font-mono font-bold tabular-nums text-slate-100 transition-all focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
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
                            className="no-spinners w-16 rounded-lg border border-white/[0.1] bg-surface-0/90 px-2 py-1 text-right font-mono font-bold tabular-nums text-slate-100 transition-all focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                          />
                          <span className="font-mono text-xs text-slate-400">
                            x
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap p-3.5 text-right font-mono text-sm font-bold tabular-nums text-white">
                        {formatCurrency(fairValue, 2)}
                      </td>
                      <td
                        className={`whitespace-nowrap p-3.5 text-right font-mono text-sm font-bold tabular-nums ${
                          upside >= 0
                            ? "text-fintech-green"
                            : "text-fintech-red"
                        }`}
                      >
                        {formatPercent(upside)}
                      </td>
                      <td className="max-w-sm p-3.5 text-xs leading-relaxed text-slate-300">
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
        <div className="glass-panel mt-2 flex flex-col gap-4 rounded-2xl border border-white/[0.08] p-5 shadow-xl sm:p-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg border border-accent/20 bg-accent/10 p-1.5 text-accent">
                <Activity className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  {t.sensitivityTitle}
                </h4>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {t.sensitivitySubtitle}
                </p>
              </div>
            </div>
          </div>

          {/* 3 Horizontal Columns for Bull / Base / Bear Sensitivity */}
          <div className="grid grid-cols-1 items-stretch gap-4 pt-1 lg:grid-cols-3 xl:gap-5">
            {scenarios.map((scenario, sIdx) => {
              const items = groupedSensitivity[scenario.name] || [];
              if (items.length === 0) return null;

              const nameLower = scenario.name.toLowerCase();
              const isBull =
                nameLower.includes("bull") || nameLower.includes("牛");
              const isBear =
                nameLower.includes("bear") || nameLower.includes("熊");

              const colBorderCls = isBull
                ? "border-emerald-500/30 hover:border-emerald-500/50 bg-gradient-to-b from-emerald-950/20 via-surface-0/70 to-surface-0/60 shadow-emerald-950/10"
                : isBear
                  ? "border-rose-500/30 hover:border-rose-500/50 bg-gradient-to-b from-rose-950/20 via-surface-0/70 to-surface-0/60 shadow-rose-950/10"
                  : "border-sky-500/30 hover:border-sky-500/50 bg-gradient-to-b from-sky-950/20 via-surface-0/70 to-surface-0/60 shadow-sky-950/10";

              const badgeCls = isBull
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : isBear
                  ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                  : "bg-sky-500/15 border-sky-500/30 text-sky-400";

              const Icon = isBull ? TrendingUp : isBear ? TrendingDown : Scale;

              return (
                <div
                  key={scenario.name || sIdx}
                  className={`flex flex-col justify-between gap-3.5 rounded-2xl border p-4 shadow-lg transition-all sm:p-4.5 ${colBorderCls}`}
                >
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center justify-center rounded-md border p-1 ${badgeCls}`}
                      >
                        <Icon className="size-3.5" />
                      </div>
                      <span className="text-xs font-extrabold tracking-wide text-white">
                        {scenario.name}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                      Δ Fair Value
                    </span>
                  </div>

                  {/* Clean List of Parameter Sensitivities (Replaces Cluttered Cards) */}
                  <div className="flex flex-col divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.06] bg-surface-0/70">
                    {items.map((it, idx) => {
                      const isPositive = it.fairValueDelta >= 0;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors hover:bg-white/[0.02]"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-slate-200">
                              {it.parameter}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {it.baseValue} → {it.altValue}
                            </span>
                          </div>
                          <span
                            className={`rounded border px-2 py-0.5 font-mono text-xs font-bold tabular-nums ${
                              isPositive
                                ? "border-fintech-green/30 bg-fintech-greenGlow/10 text-fintech-green"
                                : "border-fintech-red/30 bg-fintech-redGlow/10 text-fintech-red"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {formatCurrency(it.fairValueDelta, 0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
