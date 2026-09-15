"use client";

import React from "react";
import {
  RotateCcw,
  Sliders,
  ShieldAlert,
  Zap,
  TrendingUp,
  AlertTriangle,
  Info,
} from "lucide-react";
import type { FinancialModelBaseline, Facts, StressResult } from "@/lib/schemas";
import type { StressTestParams } from "@/lib/valuation";
import { PriceMeter } from "./PriceMeter";
import { formatCurrency, formatPercent, formatBillions } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";

interface CockpitProps {
  baseline: FinancialModelBaseline;
  facts: Facts;
  stressParams: StressTestParams;
  stressResult: StressResult;
  onDriverShockChange: (driverId: string, shockPct: number) => void;
  onGrossMarginDeltaChange: (bps: number) => void;
  onFixedOpexShiftChange: (shiftPct: number) => void;
  onResetDefaults: () => void;
  locale?: Locale;
}

export const Cockpit: React.FC<CockpitProps> = ({
  baseline,
  facts,
  stressParams,
  stressResult,
  onDriverShockChange,
  onGrossMarginDeltaChange,
  onFixedOpexShiftChange,
  onResetDefaults,
  locale = "zh",
}) => {
  const t = getTranslations(locale).cockpit;
  const {
    stressRevenueBillions,
    stressGrossProfitBillions,
    stressOperatingIncomeBillions,
    stressNetIncomeBillions,
    stressEps,
    valuationBands,
    asymmetry,
  } = stressResult;

  const currentPrice = facts.currentPrice;

  return (
    <aside className="w-full lg:w-[380px] xl:w-[415px] 2xl:w-[440px] shrink-0 flex flex-col gap-4 lg:sticky lg:top-[66px] lg:max-h-[calc(100vh-82px)] lg:overflow-y-auto custom-scrollbar lg:pr-1">
      {/* 1. Header & Live P&L Strip */}
      <div className="glass-panel rounded-2xl p-4 sm:p-4.5 border border-white/[0.08] flex flex-col gap-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold tracking-tight text-white uppercase font-mono">
              {t.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onResetDefaults}
            className="group flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-surface-2/90 hover:bg-surface-3 text-slate-300 hover:text-white border border-white/[0.08] hover:border-accent/40 transition-all font-medium shadow-sm"
            title={t.resetTooltip}
          >
            <RotateCcw className="w-3 h-3 group-hover:-rotate-45 transition-transform duration-200 text-accent" />
            <span>{t.reset}</span>
          </button>
        </div>

        {/* Big Stressed EPS Tag */}
        <div className="relative overflow-hidden flex items-baseline justify-between p-3.5 rounded-xl bg-surface-0/80 border border-white/[0.08] shadow-inner">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              {t.stressedForwardEps}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-accent tabular-nums tracking-tight mt-0.5">
              {formatCurrency(stressEps)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              {facts.quarter} {t.cleanOperatingEps}
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-slate-200 tabular-nums mt-0.5">
              {formatCurrency(facts.epsOperating)}
            </div>
          </div>
        </div>

        {/* Live Stressed P&L Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 text-center">
          <div className="p-2 rounded-lg bg-surface-0/60 border border-white/[0.05] flex flex-col">
            <div className="text-[9px] text-slate-400 font-medium uppercase font-mono truncate">{t.stressedRev}</div>
            <div className="text-xs sm:text-sm font-bold font-mono text-white mt-0.5 tabular-nums">
              {formatBillions(stressRevenueBillions)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-surface-0/60 border border-white/[0.05] flex flex-col">
            <div className="text-[9px] text-slate-400 font-medium uppercase font-mono truncate">{t.grossProfit}</div>
            <div className="text-xs sm:text-sm font-bold font-mono text-white mt-0.5 tabular-nums">
              {formatBillions(stressGrossProfitBillions)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-surface-0/60 border border-white/[0.05] flex flex-col">
            <div className="text-[9px] text-slate-400 font-medium uppercase font-mono truncate">{t.operatingIncome}</div>
            <div className="text-xs sm:text-sm font-bold font-mono text-white mt-0.5 tabular-nums">
              {formatBillions(stressOperatingIncomeBillions)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-surface-0/60 border border-white/[0.05] flex flex-col">
            <div className="text-[9px] text-slate-400 font-medium uppercase font-mono truncate">{t.netIncome}</div>
            <div className="text-xs sm:text-sm font-bold font-mono text-white mt-0.5 tabular-nums">
              {formatBillions(stressNetIncomeBillions)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Valuation Regimes (Bull, Base, Panic) */}
      <div className="glass-panel rounded-2xl p-4 sm:p-4.5 border border-white/[0.08] flex flex-col gap-3.5 shadow-xl">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
          <span>{t.valuationRegimes}</span>
          <span className="font-mono text-[11px] text-slate-400 tabular-nums">
            {t.current}: {formatCurrency(currentPrice)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Bull */}
          <div className="p-3 rounded-xl bg-gradient-to-b from-fintech-greenGlow/15 to-surface-0/60 border border-fintech-green/30 hover:border-fintech-green/60 transition-all flex flex-col shadow-sm">
            <div className="flex items-center justify-between text-[11px] font-bold text-fintech-green font-mono">
              <span className="truncate">{t.regimes.bull}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {valuationBands.bull.multiple}x
              </span>
            </div>
            <div className="text-base font-extrabold font-mono text-white mt-1 tabular-nums">
              {formatCurrency(valuationBands.bull.targetPrice)}
            </div>
            <div className="text-[11px] font-mono font-bold text-fintech-green mt-0.5 tabular-nums">
              {formatPercent(valuationBands.bull.deltaFromCurrentPct)}
            </div>
          </div>

          {/* Base */}
          <div className="p-3 rounded-xl bg-surface-0/80 border border-white/[0.09] hover:border-accent/40 transition-all flex flex-col shadow-sm">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-200 font-mono">
              <span className="truncate">{t.regimes.base}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {valuationBands.base.multiple}x
              </span>
            </div>
            <div className="text-base font-extrabold font-mono text-white mt-1 tabular-nums">
              {formatCurrency(valuationBands.base.targetPrice)}
            </div>
            <div
              className={`text-[11px] font-mono font-bold mt-0.5 tabular-nums ${
                valuationBands.base.deltaFromCurrentPct >= 0
                  ? "text-fintech-green"
                  : "text-fintech-red"
              }`}
            >
              {formatPercent(valuationBands.base.deltaFromCurrentPct)}
            </div>
          </div>

          {/* Panic */}
          <div className="p-3 rounded-xl bg-gradient-to-b from-fintech-redGlow/15 to-surface-0/60 border border-fintech-red/30 hover:border-fintech-red/60 transition-all flex flex-col shadow-sm">
            <div className="flex items-center justify-between text-[11px] font-bold text-fintech-red font-mono">
              <span className="truncate">{t.regimes.panic}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {valuationBands.panic.multiple}x
              </span>
            </div>
            <div className="text-base font-extrabold font-mono text-white mt-1 tabular-nums">
              {formatCurrency(valuationBands.panic.targetPrice)}
            </div>
            <div className="text-[11px] font-mono font-bold text-fintech-red mt-0.5 tabular-nums">
              {formatPercent(valuationBands.panic.deltaFromCurrentPct)}
            </div>
          </div>
        </div>

        {/* Visual Price Meter */}
        <PriceMeter
          currentPrice={currentPrice}
          panicTarget={valuationBands.panic.targetPrice}
          baseTarget={valuationBands.base.targetPrice}
          bullTarget={valuationBands.bull.targetPrice}
          locale={locale}
        />

        {/* 2x2 Risk Asymmetry Matrix */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <div className="p-2.5 rounded-xl bg-surface-0/70 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
            <div className="text-[10px] font-medium text-slate-400 truncate">{t.asymmetry.upsideToBull}</div>
            <div className="text-sm font-bold font-mono text-fintech-green mt-0.5 tabular-nums">
              {formatPercent(asymmetry.upsideToBullPct)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-surface-0/70 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
            <div className="text-[10px] font-medium text-slate-400 truncate">{t.asymmetry.downsideToPanic}</div>
            <div className="text-sm font-bold font-mono text-fintech-red mt-0.5 tabular-nums">
              {formatPercent(asymmetry.downsideToPanicPct)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-surface-0/70 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
            <div className="text-[10px] font-medium text-slate-400 truncate">{t.asymmetry.pricedInMultiple}</div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-0.5 tabular-nums">
              {asymmetry.marketPricedInMultiple.toFixed(1)}x
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-surface-0/70 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
            <div className="text-[10px] font-medium text-slate-400 truncate">{t.asymmetry.asymmetrySkew}</div>
            <div className="text-sm font-bold font-mono text-accent mt-0.5 tabular-nums">
              {asymmetry.riskRewardRatio.toFixed(2)}x
            </div>
          </div>
        </div>
      </div>

      {/* 3. Upstream Shock Sliders */}
      <div className="glass-panel rounded-2xl p-4 sm:p-4.5 border border-white/[0.08] flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            <Sliders className="w-3.5 h-3.5 text-accent" />
            <span>{t.upstreamTitle}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-surface-2/80 border border-white/[0.06]">
            Live &lt;1ms
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {baseline.upstreamDrivers.map((driver) => {
            const currentVal =
              stressParams.driverShocks?.[driver.id] ?? driver.defaultShockPct ?? 0;
            const min = driver.minShockPct ?? -40;
            const max = driver.maxShockPct ?? 40;

            const badgeColorClass =
              currentVal > 0
                ? "text-fintech-green bg-fintech-greenGlow/15 border-fintech-green/30"
                : currentVal < 0
                ? "text-fintech-red bg-fintech-redGlow/15 border-fintech-red/30"
                : "text-slate-300 bg-surface-2 border-white/[0.08]";

            return (
              <div key={driver.id} className="flex flex-col gap-1.5 group">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 group-hover:text-accent transition-colors">
                    {driver.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border tabular-nums transition-colors ${badgeColorClass}`}
                  >
                    {currentVal > 0 ? "+" : ""}
                    {currentVal}%
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={1}
                  value={currentVal}
                  onChange={(e) =>
                    onDriverShockChange(driver.id, parseInt(e.target.value, 10))
                  }
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{t.exposure}: {(driver.exposureShare * 100).toFixed(0)}%</span>
                  <span>{t.elasticity}: {driver.elasticity.toFixed(2)}x</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/[0.08] pt-3.5 flex flex-col gap-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono">
            {t.accountingTitle}
          </div>

          {/* Gross Margin Slider */}
          <div className="flex flex-col gap-1.5 group">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300 group-hover:text-accent transition-colors">
                {t.grossMarginPerturbation}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border tabular-nums transition-colors ${
                  (stressParams.grossMarginBpsDelta ?? 0) > 0
                    ? "text-fintech-green bg-fintech-greenGlow/15 border-fintech-green/30"
                    : (stressParams.grossMarginBpsDelta ?? 0) < 0
                    ? "text-fintech-red bg-fintech-redGlow/15 border-fintech-red/30"
                    : "text-slate-300 bg-surface-2 border-white/[0.08]"
                }`}
              >
                {(stressParams.grossMarginBpsDelta ?? 0) > 0 ? "+" : ""}
                {stressParams.grossMarginBpsDelta ?? 0} bps
              </span>
            </div>
            <input
              type="range"
              min={-500}
              max={500}
              step={25}
              value={stressParams.grossMarginBpsDelta ?? 0}
              onChange={(e) =>
                onGrossMarginDeltaChange(parseInt(e.target.value, 10))
              }
            />
          </div>

          {/* Fixed OpEx Shift Slider */}
          <div className="flex flex-col gap-1.5 group">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300 group-hover:text-accent transition-colors">
                {t.fixedOpexShift}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border tabular-nums transition-colors ${
                  (stressParams.fixedOpexShiftPct ?? 0) > 0
                    ? "text-fintech-red bg-fintech-redGlow/15 border-fintech-red/30"
                    : (stressParams.fixedOpexShiftPct ?? 0) < 0
                    ? "text-fintech-green bg-fintech-greenGlow/15 border-fintech-green/30"
                    : "text-slate-300 bg-surface-2 border-white/[0.08]"
                }`}
              >
                {(stressParams.fixedOpexShiftPct ?? 0) > 0 ? "+" : ""}
                {stressParams.fixedOpexShiftPct ?? 0}%
              </span>
            </div>
            <input
              type="range"
              min={-20}
              max={20}
              step={1}
              value={stressParams.fixedOpexShiftPct ?? 0}
              onChange={(e) =>
                onFixedOpexShiftChange(parseInt(e.target.value, 10))
              }
            />
          </div>
        </div>

        {/* Baseline Metadata Pills */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-surface-0/80 p-2.5 rounded-xl border border-white/[0.06] tabular-nums">
          <span>{t.metadata.baseRev}: {formatBillions(baseline.baseRevenueBillions)}</span>
          <span>{t.metadata.shares}: {baseline.dilutedSharesBillions}B</span>
          <span>{t.metadata.tax}: {baseline.taxRatePct}%</span>
        </div>
      </div>

      {/* 4. Income Quality Guardrail Card */}
      {facts.oneTimeItems && facts.oneTimeItems.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 sm:p-4.5 border border-fintech-amber/30 bg-fintech-amberGlow/5 flex flex-col gap-2.5 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-fintech-amber uppercase tracking-wider font-mono">
            <ShieldAlert className="w-4 h-4" />
            <span>{t.guardrail.title}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {t.guardrail.description}
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 my-1">
            {facts.oneTimeItems.map((item, idx) => (
              <li key={idx} className="flex flex-col gap-0.5 bg-surface-0/50 p-2 rounded-lg border border-fintech-amber/15">
                <span className="text-slate-200 font-medium text-xs">
                  • <strong>{item.description}</strong>: {formatBillions(item.amountBillions)}{" "}
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-2 text-slate-400">
                    {item.isOperating ? t.guardrail.operating : t.guardrail.nonOperating}
                  </span>
                </span>
                {item.note && (
                  <span className="text-[11px] text-slate-400 pl-3 leading-snug">
                    {item.note}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/[0.08]">
            <span className="text-slate-300 font-medium">{t.guardrail.operatingCleanEps}</span>
            <span className="font-mono font-bold text-accent text-sm tabular-nums">
              {formatCurrency(facts.epsOperating)}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
