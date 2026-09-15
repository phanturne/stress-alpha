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

interface CockpitProps {
  baseline: FinancialModelBaseline;
  facts: Facts;
  stressParams: StressTestParams;
  stressResult: StressResult;
  onDriverShockChange: (driverId: string, shockPct: number) => void;
  onGrossMarginDeltaChange: (bps: number) => void;
  onFixedOpexShiftChange: (shiftPct: number) => void;
  onResetDefaults: () => void;
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
}) => {
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
    <aside className="w-full lg:w-[440px] shrink-0 flex flex-col gap-4">
      {/* 1. Header & Live P&L Strip */}
      <div className="bg-surface-1 rounded-xl p-4 border border-border flex flex-col gap-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold tracking-tight text-white uppercase">
              Stress Flow-Through Cockpit
            </h2>
          </div>
          <button
            type="button"
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-surface-2 hover:bg-surface-3 text-slate-300 hover:text-white border border-border transition-colors font-medium"
            title="Reset all shock sliders to 0"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>

        {/* Big Stressed EPS Tag */}
        <div className="flex items-baseline justify-between p-3 rounded-lg bg-surface-0 border border-border/80">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Stressed Forward EPS
            </div>
            <div className="text-2xl font-extrabold font-mono text-accent">
              {formatCurrency(stressEps)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Clean Operating EPS
            </div>
            <div className="text-sm font-bold font-mono text-slate-200">
              {formatCurrency(facts.epsOperating)}
            </div>
          </div>
        </div>

        {/* Live Stressed P&L Ribbon */}
        <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
          <div className="p-2 rounded-lg bg-surface-2/60 border border-border/60">
            <div className="text-[10px] text-slate-400 font-medium">Stressed Rev</div>
            <div className="text-xs font-bold font-mono text-white mt-0.5">
              {formatBillions(stressRevenueBillions)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-surface-2/60 border border-border/60">
            <div className="text-[10px] text-slate-400 font-medium">Gross Profit</div>
            <div className="text-xs font-bold font-mono text-white mt-0.5">
              {formatBillions(stressGrossProfitBillions)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-surface-2/60 border border-border/60">
            <div className="text-[10px] text-slate-400 font-medium">Op. Income</div>
            <div className="text-xs font-bold font-mono text-white mt-0.5">
              {formatBillions(stressOperatingIncomeBillions)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-surface-2/60 border border-border/60">
            <div className="text-[10px] text-slate-400 font-medium">Net Income</div>
            <div className="text-xs font-bold font-mono text-white mt-0.5">
              {formatBillions(stressNetIncomeBillions)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Valuation Regimes (Bull, Base, Panic) */}
      <div className="bg-surface-1 rounded-xl p-4 border border-border flex flex-col gap-3 shadow-lg">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>Valuation Regimes</span>
          <span className="font-mono text-[11px] text-slate-400">
            Current: {formatCurrency(currentPrice)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Bull */}
          <div className="p-3 rounded-lg bg-fintech-greenGlow/10 border border-fintech-green/30 flex flex-col">
            <div className="flex items-center justify-between text-[11px] font-semibold text-fintech-green">
              <span>🐂 Bull</span>
              <span className="font-mono text-[10px] text-slate-400">
                {valuationBands.bull.multiple}x
              </span>
            </div>
            <div className="text-base font-extrabold font-mono text-white mt-1">
              {formatCurrency(valuationBands.bull.targetPrice)}
            </div>
            <div className="text-xs font-mono font-bold text-fintech-green mt-0.5">
              {formatPercent(valuationBands.bull.deltaFromCurrentPct)}
            </div>
          </div>

          {/* Base */}
          <div className="p-3 rounded-lg bg-surface-2/80 border border-border flex flex-col">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span>⚖️ Base</span>
              <span className="font-mono text-[10px] text-slate-400">
                {valuationBands.base.multiple}x
              </span>
            </div>
            <div className="text-base font-extrabold font-mono text-white mt-1">
              {formatCurrency(valuationBands.base.targetPrice)}
            </div>
            <div
              className={`text-xs font-mono font-bold mt-0.5 ${
                valuationBands.base.deltaFromCurrentPct >= 0
                  ? "text-fintech-green"
                  : "text-fintech-red"
              }`}
            >
              {formatPercent(valuationBands.base.deltaFromCurrentPct)}
            </div>
          </div>

          {/* Panic */}
          <div className="p-3 rounded-lg bg-fintech-redGlow/10 border border-fintech-red/30 flex flex-col">
            <div className="flex items-center justify-between text-[11px] font-semibold text-fintech-red">
              <span>🚨 Panic</span>
              <span className="font-mono text-[10px] text-slate-400">
                {valuationBands.panic.multiple}x
              </span>
            </div>
            <div className="text-base font-extrabold font-mono text-white mt-1">
              {formatCurrency(valuationBands.panic.targetPrice)}
            </div>
            <div className="text-xs font-mono font-bold text-fintech-red mt-0.5">
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
        />

        {/* 2x2 Risk Asymmetry Matrix */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-lg bg-surface-0 border border-border/70">
            <div className="text-[10px] font-medium text-slate-400">Upside to Bull</div>
            <div className="text-sm font-bold font-mono text-fintech-green mt-0.5">
              {formatPercent(asymmetry.upsideToBullPct)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-0 border border-border/70">
            <div className="text-[10px] font-medium text-slate-400">Downside to Panic</div>
            <div className="text-sm font-bold font-mono text-fintech-red mt-0.5">
              {formatPercent(asymmetry.downsideToPanicPct)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-0 border border-border/70">
            <div className="text-[10px] font-medium text-slate-400">Priced-in Multiple</div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
              {asymmetry.marketPricedInMultiple.toFixed(1)}x
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-0 border border-border/70">
            <div className="text-[10px] font-medium text-slate-400">Asymmetry Skew</div>
            <div className="text-sm font-bold font-mono text-accent mt-0.5">
              {asymmetry.riskRewardRatio.toFixed(2)}x
            </div>
          </div>
        </div>
      </div>

      {/* 3. Upstream Shock Sliders */}
      <div className="bg-surface-1 rounded-xl p-4 border border-border flex flex-col gap-4 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Sliders className="w-4 h-4 text-accent" />
          Upstream Demand Shock Sliders
        </div>

        <div className="flex flex-col gap-3.5">
          {baseline.upstreamDrivers.map((driver) => {
            const currentVal =
              stressParams.driverShocks?.[driver.id] ?? driver.defaultShockPct ?? 0;
            const min = driver.minShockPct ?? -40;
            const max = driver.maxShockPct ?? 40;

            const badgeColorClass =
              currentVal > 0
                ? "text-fintech-green bg-fintech-greenGlow/10 border-fintech-green/30"
                : currentVal < 0
                ? "text-fintech-red bg-fintech-redGlow/10 border-fintech-red/30"
                : "text-slate-300 bg-surface-2 border-border";

            return (
              <div key={driver.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{driver.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${badgeColorClass}`}
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
                  className="accent-accent"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Exposure: {(driver.exposureShare * 100).toFixed(0)}%</span>
                  <span>Elasticity: {driver.elasticity.toFixed(2)}x</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-border pt-3 flex flex-col gap-3.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Accounting Margin & Leverage Controls
          </div>

          {/* Gross Margin Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">Gross Margin Perturbation</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                  (stressParams.grossMarginBpsDelta ?? 0) > 0
                    ? "text-fintech-green bg-fintech-greenGlow/10 border-fintech-green/30"
                    : (stressParams.grossMarginBpsDelta ?? 0) < 0
                    ? "text-fintech-red bg-fintech-redGlow/10 border-fintech-red/30"
                    : "text-slate-300 bg-surface-2 border-border"
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
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">Fixed OpEx Shift</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                  (stressParams.fixedOpexShiftPct ?? 0) > 0
                    ? "text-fintech-red bg-fintech-redGlow/10 border-fintech-red/30"
                    : (stressParams.fixedOpexShiftPct ?? 0) < 0
                    ? "text-fintech-green bg-fintech-greenGlow/10 border-fintech-green/30"
                    : "text-slate-300 bg-surface-2 border-border"
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
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-surface-0 p-2 rounded-lg border border-border/60">
          <span>Base Rev: {formatBillions(baseline.baseRevenueBillions)}</span>
          <span>Shares: {baseline.dilutedSharesBillions}B</span>
          <span>Tax: {baseline.taxRatePct}%</span>
        </div>
      </div>

      {/* 4. Income Quality Guardrail Card */}
      {facts.oneTimeItems && facts.oneTimeItems.length > 0 && (
        <div className="bg-surface-1 rounded-xl p-4 border border-fintech-amber/30 bg-fintech-amberGlow/5 flex flex-col gap-2 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-fintech-amber uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            Income Quality Guardrail
          </div>
          <p className="text-xs text-slate-300">
            Audited GAAP adjustments isolating non-operating or transitory items:
          </p>
          <ul className="text-xs text-slate-400 space-y-1 my-1">
            {facts.oneTimeItems.map((item, idx) => (
              <li key={idx} className="flex flex-col gap-0.5">
                <span className="text-slate-200 font-medium">
                  • <strong>{item.description}</strong>: {formatBillions(item.amountBillions)}{" "}
                  ({item.isOperating ? "operating" : "non-operating"})
                </span>
                {item.note && (
                  <span className="text-[11px] text-slate-500 pl-3">
                    {item.note}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/80">
            <span className="text-slate-400">Operating Clean EPS:</span>
            <span className="font-mono font-bold text-accent">
              {formatCurrency(facts.epsOperating)}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
