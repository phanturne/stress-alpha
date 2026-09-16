"use client";

import React, { useState } from "react";
import {
  RotateCcw,
  Sliders,
  ShieldAlert,
  AlertOctagon,
  Zap,
  Wand2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type {
  FinancialModelBaseline,
  Facts,
  StressResult,
  Valuation,
} from "@/lib/schemas";
import { type StressTestParams, round2 } from "@/lib/valuation";
import { PriceMeter } from "./PriceMeter";
import { formatCurrency, formatPercent, formatBillions } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";

interface CockpitProps {
  baseline: FinancialModelBaseline;
  facts: Facts;
  stressParams: StressTestParams;
  stressResult: StressResult;
  valuation?: Valuation;
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
  valuation,
  onDriverShockChange,
  onGrossMarginDeltaChange,
  onFixedOpexShiftChange,
  onResetDefaults,
  locale = "zh",
}) => {
  const t = getTranslations(locale).cockpit;
  const [activeSliderTab, setActiveSliderTab] = useState<
    "volume" | "margins" | "all"
  >("volume");
  const [isGuardrailOpen, setIsGuardrailOpen] = useState<boolean>(false);
  const [editingParam, setEditingParam] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");

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

  const handleApplyPreset = (preset: "baseline" | "mild" | "severe") => {
    if (preset === "baseline") {
      onResetDefaults();
    } else if (preset === "mild") {
      baseline.upstreamDrivers.forEach((d) => onDriverShockChange(d.id, -10));
      onGrossMarginDeltaChange(-100);
      onFixedOpexShiftChange(2);
    } else if (preset === "severe") {
      baseline.upstreamDrivers.forEach((d) => onDriverShockChange(d.id, -25));
      onGrossMarginDeltaChange(-300);
      onFixedOpexShiftChange(5);
    }
  };

  return (
    <aside className="custom-scrollbar flex w-full shrink-0 flex-col gap-4 lg:sticky lg:top-[66px] lg:max-h-[calc(100vh-82px)] lg:w-[380px] lg:overflow-y-auto lg:pr-1 xl:w-[415px] 2xl:w-[440px]">
      {/* 1. Header, Presets & Live P&L Strip */}
      <div className="glass-panel flex flex-col gap-3 rounded-2xl border border-white/[0.08] p-4 shadow-xl sm:p-4.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-accent/20 bg-accent/10 p-1.5 text-accent">
              <Zap className="size-3.5" />
            </div>
            <h2 className="font-mono text-xs font-bold uppercase tracking-tight text-white sm:text-sm">
              {t.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onResetDefaults}
            className="group flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-surface-2/90 px-2.5 py-1 text-xs font-medium text-slate-300 shadow-sm transition-all hover:border-accent/40 hover:bg-surface-3 hover:text-white"
            title={t.resetTooltip}
          >
            <RotateCcw className="size-3 text-accent transition-transform duration-200 group-hover:-rotate-45" />
            <span>{t.reset}</span>
          </button>
        </div>

        {/* 1-Click Macro Presets Bar */}
        <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-surface-0/70 p-1 text-[11px]">
          <span className="flex shrink-0 items-center gap-1 px-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
            <Wand2 className="size-3 text-accent" />
            {t.presets.title}:
          </span>
          <div className="grid w-full grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => handleApplyPreset("baseline")}
              className="truncate rounded-lg bg-surface-2/70 px-1.5 py-1 text-center text-[11px] font-medium text-slate-300 transition-colors hover:bg-surface-3 hover:text-white"
            >
              {t.presets.baseline}
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("mild")}
              className="truncate rounded-lg border border-fintech-amber/25 bg-fintech-amberGlow/10 px-1.5 py-1 text-center text-[11px] font-medium text-fintech-amber transition-colors hover:bg-fintech-amberGlow/20"
            >
              {t.presets.mild}
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("severe")}
              className="truncate rounded-lg border border-fintech-red/25 bg-fintech-redGlow/10 px-1.5 py-1 text-center text-[11px] font-medium text-fintech-red transition-colors hover:bg-fintech-redGlow/20"
            >
              {t.presets.severe}
            </button>
          </div>
        </div>

        {/* Big Stressed EPS Tag */}
        <div className="relative flex items-baseline justify-between overflow-hidden rounded-xl border border-white/[0.08] bg-surface-0/80 p-3.5 shadow-inner">
          <div className="pointer-events-none absolute right-0 top-0 size-32 rounded-full bg-accent/5 blur-2xl" />
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[11px]">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" />
              {t.stressedForwardEps}
            </div>
            <div className="mt-0.5 font-mono text-2xl font-black tabular-nums tracking-tight text-accent sm:text-3xl">
              {formatCurrency(stressEps)}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[11px]">
              {facts.quarter} {t.cleanOperatingEps}
            </div>
            <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-200 sm:text-base">
              {formatCurrency(facts.epsOperating)}
            </div>
          </div>
        </div>

        {/* Live Stressed P&L Ribbon */}
        <div className="grid grid-cols-2 gap-2 pt-0.5 text-center sm:grid-cols-4">
          <div className="flex flex-col rounded-lg border border-white/[0.05] bg-surface-0/60 p-2">
            <div className="truncate font-mono text-[9px] font-medium uppercase text-slate-400">
              {t.stressedRev}
            </div>
            <div className="mt-0.5 font-mono text-xs font-bold tabular-nums text-white sm:text-sm">
              {formatBillions(stressRevenueBillions)}
            </div>
          </div>
          <div className="flex flex-col rounded-lg border border-white/[0.05] bg-surface-0/60 p-2">
            <div className="truncate font-mono text-[9px] font-medium uppercase text-slate-400">
              {t.grossProfit}
            </div>
            <div className="mt-0.5 font-mono text-xs font-bold tabular-nums text-white sm:text-sm">
              {formatBillions(stressGrossProfitBillions)}
            </div>
          </div>
          <div className="flex flex-col rounded-lg border border-white/[0.05] bg-surface-0/60 p-2">
            <div className="truncate font-mono text-[9px] font-medium uppercase text-slate-400">
              {t.operatingIncome}
            </div>
            <div className="mt-0.5 font-mono text-xs font-bold tabular-nums text-white sm:text-sm">
              {formatBillions(stressOperatingIncomeBillions)}
            </div>
          </div>
          <div className="flex flex-col rounded-lg border border-white/[0.05] bg-surface-0/60 p-2">
            <div className="truncate font-mono text-[9px] font-medium uppercase text-slate-400">
              {t.netIncome}
            </div>
            <div className="mt-0.5 font-mono text-xs font-bold tabular-nums text-white sm:text-sm">
              {formatBillions(stressNetIncomeBillions)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Harmonized Dynamic Scenario Targets (Bull, Base, Bear) + Panic Floor */}
      {(() => {
        const bullScenario = valuation?.scenarioResults?.find(
          (s) => s.name.toLowerCase().includes("bull") || s.name.includes("牛")
        );
        const baseScenario = valuation?.scenarioResults?.find(
          (s) =>
            s.name.toLowerCase().includes("base") || s.name.includes("基准")
        );
        const bearScenario = valuation?.scenarioResults?.find(
          (s) => s.name.toLowerCase().includes("bear") || s.name.includes("熊")
        );

        const targetBull =
          bullScenario?.fairValue ?? valuationBands.bull.targetPrice;
        const deltaBull =
          bullScenario?.upsideFromCurrent ??
          valuationBands.bull.deltaFromCurrentPct;

        const targetBase =
          baseScenario?.fairValue ?? valuationBands.base.targetPrice;
        const deltaBase =
          baseScenario?.upsideFromCurrent ??
          valuationBands.base.deltaFromCurrentPct;

        const targetBear =
          bearScenario?.fairValue ?? round2(currentPrice * 0.7);
        const deltaBear = bearScenario?.upsideFromCurrent ?? -30;

        const panicTarget = valuationBands.panic.targetPrice;
        const panicDelta = valuationBands.panic.deltaFromCurrentPct;

        const riskReward =
          panicDelta < 0 ? round2(Math.abs(deltaBull / panicDelta)) : deltaBull;

        return (
          <div className="glass-panel flex flex-col gap-3.5 rounded-2xl border border-white/[0.08] p-4 shadow-xl sm:p-4.5">
            <div className="flex items-center justify-between font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>{t.valuationRegimes}</span>
              <span className="font-mono text-[11px] tabular-nums text-slate-400">
                {t.current}: {formatCurrency(currentPrice)}
              </span>
            </div>

            {/* 3 Core Scenario Cards: Bull, Base, Bear */}
            <div className="grid grid-cols-3 gap-2">
              {/* Bull */}
              <div className="flex flex-col rounded-xl border border-fintech-green/30 bg-gradient-to-b from-fintech-greenGlow/15 to-surface-0/60 p-3 shadow-sm transition-all hover:border-fintech-green/60">
                <div className="flex items-center justify-between font-mono text-[11px] font-bold text-fintech-green">
                  <span className="truncate">{t.regimes.bull}</span>
                </div>
                <div className="mt-1 font-mono text-base font-extrabold tabular-nums text-white">
                  {formatCurrency(targetBull)}
                </div>
                <div className="mt-0.5 font-mono text-[11px] font-bold tabular-nums text-fintech-green">
                  {formatPercent(deltaBull)}
                </div>
              </div>

              {/* Base */}
              <div className="flex flex-col rounded-xl border border-white/[0.09] bg-surface-0/80 p-3 shadow-sm transition-all hover:border-accent/40">
                <div className="flex items-center justify-between font-mono text-[11px] font-bold text-slate-200">
                  <span className="truncate">{t.regimes.base}</span>
                </div>
                <div className="mt-1 font-mono text-base font-extrabold tabular-nums text-white">
                  {formatCurrency(targetBase)}
                </div>
                <div
                  className={`mt-0.5 font-mono text-[11px] font-bold tabular-nums ${
                    deltaBase >= 0 ? "text-fintech-green" : "text-fintech-red"
                  }`}
                >
                  {formatPercent(deltaBase)}
                </div>
              </div>

              {/* Bear */}
              <div className="flex flex-col rounded-xl border border-fintech-red/30 bg-gradient-to-b from-fintech-redGlow/15 to-surface-0/60 p-3 shadow-sm transition-all hover:border-fintech-red/60">
                <div className="flex items-center justify-between font-mono text-[11px] font-bold text-fintech-red">
                  <span className="truncate">{t.regimes.bear}</span>
                </div>
                <div className="mt-1 font-mono text-base font-extrabold tabular-nums text-white">
                  {formatCurrency(targetBear)}
                </div>
                <div className="mt-0.5 font-mono text-[11px] font-bold tabular-nums text-fintech-red">
                  {formatPercent(deltaBear)}
                </div>
              </div>
            </div>

            {/* Panic Floor Callout (Stress Test Worst-Case Limit) */}
            <div className="flex items-center justify-between rounded-xl border border-fintech-red/25 bg-fintech-redGlow/10 px-3 py-2 font-mono text-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-fintech-red">
                <AlertOctagon className="size-3.5 shrink-0" />
                <span className="truncate">
                  {t.regimes.panicFloorLabel} ({baseline.multipleRegimes.panic}x
                  P/E)
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs font-extrabold tabular-nums text-white">
                  {formatCurrency(panicTarget)}
                </span>
                <span className="font-mono text-[11px] font-bold tabular-nums text-fintech-red">
                  {formatPercent(panicDelta)}
                </span>
              </div>
            </div>

            {/* Visual Price Meter */}
            <PriceMeter
              currentPrice={currentPrice}
              panicTarget={panicTarget}
              baseTarget={targetBase}
              bullTarget={targetBull}
              locale={locale}
            />

            {/* 2x2 Risk Asymmetry Matrix */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div className="rounded-xl border border-white/[0.06] bg-surface-0/70 p-2.5 transition-colors hover:border-white/[0.12]">
                <div className="truncate text-[10px] font-medium text-slate-400">
                  {t.asymmetry.upsideToBull}
                </div>
                <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-fintech-green">
                  {formatPercent(deltaBull)}
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-surface-0/70 p-2.5 transition-colors hover:border-white/[0.12]">
                <div className="truncate text-[10px] font-medium text-slate-400">
                  {t.asymmetry.downsideToPanic}
                </div>
                <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-fintech-red">
                  {formatPercent(panicDelta)}
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-surface-0/70 p-2.5 transition-colors hover:border-white/[0.12]">
                <div className="truncate text-[10px] font-medium text-slate-400">
                  {t.asymmetry.pricedInMultiple}
                </div>
                <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-200">
                  {asymmetry.marketPricedInMultiple.toFixed(1)}x
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-surface-0/70 p-2.5 transition-colors hover:border-white/[0.12]">
                <div className="truncate text-[10px] font-medium text-slate-400">
                  {t.asymmetry.asymmetrySkew}
                </div>
                <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-accent">
                  {riskReward.toFixed(2)}x
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. Shock Sliders with Tabbed View (Eliminates Vertical Scroll Fatigue) */}
      <div className="glass-panel flex flex-col gap-3.5 rounded-2xl border border-white/[0.08] p-4 shadow-xl sm:p-4.5">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            <Sliders className="size-3.5 text-accent" />
            <span>{t.upstreamTitle}</span>
          </div>
          {/* Tab switcher: Volume vs Margins vs All */}
          <div className="flex items-center rounded-lg border border-white/[0.08] bg-surface-0/90 p-0.5 font-mono text-[10px]">
            <button
              type="button"
              onClick={() => setActiveSliderTab("volume")}
              className={`rounded-md px-2 py-0.5 font-medium transition-all ${
                activeSliderTab === "volume"
                  ? "bg-accent/20 font-bold text-accent shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t.sliderTabs.volume}
            </button>
            <button
              type="button"
              onClick={() => setActiveSliderTab("margins")}
              className={`rounded-md px-2 py-0.5 font-medium transition-all ${
                activeSliderTab === "margins"
                  ? "bg-accent/20 font-bold text-accent shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t.sliderTabs.margins}
            </button>
            <button
              type="button"
              onClick={() => setActiveSliderTab("all")}
              className={`rounded-md px-2 py-0.5 font-medium transition-all ${
                activeSliderTab === "all"
                  ? "bg-accent/20 font-bold text-accent shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t.sliderTabs.all}
            </button>
          </div>
        </div>

        {/* Volume / Segment Drivers */}
        {(activeSliderTab === "volume" || activeSliderTab === "all") && (
          <div className="flex flex-col gap-3.5">
            {baseline.upstreamDrivers.map((driver) => {
              const currentVal =
                stressParams.driverShocks?.[driver.id] ??
                driver.defaultShockPct ??
                0;
              const min = driver.minShockPct ?? -40;
              const max = driver.maxShockPct ?? 40;

              const badgeColorClass =
                currentVal > 0
                  ? "text-fintech-green bg-fintech-greenGlow/15 border-fintech-green/30"
                  : currentVal < 0
                    ? "text-fintech-red bg-fintech-redGlow/15 border-fintech-red/30"
                    : "text-slate-300 bg-surface-2 border-white/[0.08]";

              return (
                <div key={driver.id} className="group flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 transition-colors group-hover:text-accent">
                      {driver.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {editingParam === driver.id ? (
                        <input
                          type="number"
                          className="no-spinners w-16 rounded border border-accent bg-surface-0 px-1.5 py-0.5 text-right font-mono text-xs font-bold text-accent shadow-sm outline-none"
                          value={tempValue}
                          autoFocus
                          onChange={(e) => setTempValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = parseInt(tempValue, 10);
                              if (!isNaN(val))
                                onDriverShockChange(
                                  driver.id,
                                  Math.max(min, Math.min(max, val))
                                );
                              setEditingParam(null);
                            } else if (e.key === "Escape") {
                              setEditingParam(null);
                            }
                          }}
                          onBlur={() => {
                            const val = parseInt(tempValue, 10);
                            if (!isNaN(val))
                              onDriverShockChange(
                                driver.id,
                                Math.max(min, Math.min(max, val))
                              );
                            setEditingParam(null);
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingParam(driver.id);
                            setTempValue(String(currentVal));
                          }}
                          className={`rounded-full border px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums transition-all hover:ring-1 hover:ring-accent ${badgeColorClass}`}
                          title="Click to type exact percentage"
                        >
                          {currentVal > 0 ? "+" : ""}
                          {currentVal}%
                        </button>
                      )}
                      {currentVal !== 0 && (
                        <button
                          type="button"
                          onClick={() => onDriverShockChange(driver.id, 0)}
                          className="rounded p-1 text-slate-400 transition-colors hover:bg-surface-2 hover:text-accent"
                          title="Reset to 0%"
                        >
                          <RotateCcw className="size-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={1}
                    value={currentVal}
                    onChange={(e) =>
                      onDriverShockChange(
                        driver.id,
                        parseInt(e.target.value, 10)
                      )
                    }
                  />
                  <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                    <span>
                      {t.exposure}: {(driver.exposureShare * 100).toFixed(0)}%
                    </span>
                    <span>
                      {t.elasticity}: {driver.elasticity.toFixed(2)}x
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cost & Margins Controls */}
        {(activeSliderTab === "margins" || activeSliderTab === "all") && (
          <div
            className={`flex flex-col gap-3.5 ${activeSliderTab === "all" ? "border-t border-white/[0.08] pt-3.5" : ""}`}
          >
            <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300">
              {t.accountingTitle}
            </div>

            {/* Gross Margin Slider */}
            <div className="group flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300 transition-colors group-hover:text-accent">
                  {t.grossMarginPerturbation}
                </span>
                <div className="flex items-center gap-1.5">
                  {editingParam === "grossMargin" ? (
                    <input
                      type="number"
                      step={25}
                      className="no-spinners w-20 rounded border border-accent bg-surface-0 px-1.5 py-0.5 text-right font-mono text-xs font-bold text-accent shadow-sm outline-none"
                      value={tempValue}
                      autoFocus
                      onChange={(e) => setTempValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = parseInt(tempValue, 10);
                          if (!isNaN(val))
                            onGrossMarginDeltaChange(
                              Math.max(-500, Math.min(500, val))
                            );
                          setEditingParam(null);
                        } else if (e.key === "Escape") {
                          setEditingParam(null);
                        }
                      }}
                      onBlur={() => {
                        const val = parseInt(tempValue, 10);
                        if (!isNaN(val))
                          onGrossMarginDeltaChange(
                            Math.max(-500, Math.min(500, val))
                          );
                        setEditingParam(null);
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingParam("grossMargin");
                        setTempValue(
                          String(stressParams.grossMarginBpsDelta ?? 0)
                        );
                      }}
                      className={`rounded-full border px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums transition-all hover:ring-1 hover:ring-accent ${
                        (stressParams.grossMarginBpsDelta ?? 0) > 0
                          ? "border-fintech-green/30 bg-fintech-greenGlow/15 text-fintech-green"
                          : (stressParams.grossMarginBpsDelta ?? 0) < 0
                            ? "border-fintech-red/30 bg-fintech-redGlow/15 text-fintech-red"
                            : "border-white/[0.08] bg-surface-2 text-slate-300"
                      }`}
                      title="Click to type exact bps"
                    >
                      {(stressParams.grossMarginBpsDelta ?? 0) > 0 ? "+" : ""}
                      {stressParams.grossMarginBpsDelta ?? 0} bps
                    </button>
                  )}
                  {(stressParams.grossMarginBpsDelta ?? 0) !== 0 && (
                    <button
                      type="button"
                      onClick={() => onGrossMarginDeltaChange(0)}
                      className="rounded p-1 text-slate-400 transition-colors hover:bg-surface-2 hover:text-accent"
                      title="Reset to 0 bps"
                    >
                      <RotateCcw className="size-2.5" />
                    </button>
                  )}
                </div>
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
            <div className="group flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300 transition-colors group-hover:text-accent">
                  {t.fixedOpexShift}
                </span>
                <div className="flex items-center gap-1.5">
                  {editingParam === "fixedOpex" ? (
                    <input
                      type="number"
                      step={1}
                      className="no-spinners w-16 rounded border border-accent bg-surface-0 px-1.5 py-0.5 text-right font-mono text-xs font-bold text-accent shadow-sm outline-none"
                      value={tempValue}
                      autoFocus
                      onChange={(e) => setTempValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = parseInt(tempValue, 10);
                          if (!isNaN(val))
                            onFixedOpexShiftChange(
                              Math.max(-20, Math.min(20, val))
                            );
                          setEditingParam(null);
                        } else if (e.key === "Escape") {
                          setEditingParam(null);
                        }
                      }}
                      onBlur={() => {
                        const val = parseInt(tempValue, 10);
                        if (!isNaN(val))
                          onFixedOpexShiftChange(
                            Math.max(-20, Math.min(20, val))
                          );
                        setEditingParam(null);
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingParam("fixedOpex");
                        setTempValue(
                          String(stressParams.fixedOpexShiftPct ?? 0)
                        );
                      }}
                      className={`rounded-full border px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums transition-all hover:ring-1 hover:ring-accent ${
                        (stressParams.fixedOpexShiftPct ?? 0) > 0
                          ? "border-fintech-red/30 bg-fintech-redGlow/15 text-fintech-red"
                          : (stressParams.fixedOpexShiftPct ?? 0) < 0
                            ? "border-fintech-green/30 bg-fintech-greenGlow/15 text-fintech-green"
                            : "border-white/[0.08] bg-surface-2 text-slate-300"
                      }`}
                      title="Click to type exact percentage"
                    >
                      {(stressParams.fixedOpexShiftPct ?? 0) > 0 ? "+" : ""}
                      {stressParams.fixedOpexShiftPct ?? 0}%
                    </button>
                  )}
                  {(stressParams.fixedOpexShiftPct ?? 0) !== 0 && (
                    <button
                      type="button"
                      onClick={() => onFixedOpexShiftChange(0)}
                      className="rounded p-1 text-slate-400 transition-colors hover:bg-surface-2 hover:text-accent"
                      title="Reset to 0%"
                    >
                      <RotateCcw className="size-2.5" />
                    </button>
                  )}
                </div>
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
        )}

        {/* Baseline Metadata Pills */}
        <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-surface-0/80 p-2.5 font-mono text-[11px] tabular-nums text-slate-400">
          <span>
            {t.metadata.baseRev}: {formatBillions(baseline.baseRevenueBillions)}
          </span>
          <span>
            {t.metadata.shares}: {baseline.dilutedSharesBillions}B
          </span>
          <span>
            {t.metadata.tax}: {baseline.taxRatePct}%
          </span>
        </div>
      </div>

      {/* 4. Collapsible Income Quality Guardrail Card (Saves 150px vertical height) */}
      {facts.oneTimeItems && facts.oneTimeItems.length > 0 && (
        <div className="glass-panel flex flex-col gap-2 rounded-2xl border border-fintech-amber/30 bg-fintech-amberGlow/5 p-3.5 shadow-lg sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-fintech-amber">
              <ShieldAlert className="size-4" />
              <span>{t.guardrail.title}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsGuardrailOpen(!isGuardrailOpen)}
              className="flex items-center gap-1 rounded border border-white/[0.08] bg-surface-2/70 px-2 py-0.5 font-mono text-[11px] text-slate-300 transition-colors hover:text-white"
            >
              <span>
                {isGuardrailOpen
                  ? t.guardrail.toggleHide
                  : t.guardrail.toggleShow}
              </span>
              {isGuardrailOpen ? (
                <ChevronUp className="size-3" />
              ) : (
                <ChevronDown className="size-3" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-[11px] text-slate-400">
              {t.guardrail.itemsCount(facts.oneTimeItems.length)}
            </span>
            <span className="font-mono text-xs font-bold tabular-nums text-accent">
              {t.guardrail.operatingCleanEps}{" "}
              {formatCurrency(facts.epsOperating)}
            </span>
          </div>

          {isGuardrailOpen && (
            <div className="mt-1 flex flex-col gap-2 border-t border-fintech-amber/20 pt-2">
              <p className="text-xs leading-relaxed text-slate-300">
                {t.guardrail.description}
              </p>
              <ul className="my-1 space-y-1.5 text-xs text-slate-400">
                {facts.oneTimeItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex flex-col gap-0.5 rounded-lg border border-fintech-amber/15 bg-surface-0/60 p-2"
                  >
                    <span className="text-xs font-medium text-slate-200">
                      • <strong>{item.description}</strong>:{" "}
                      {formatBillions(item.amountBillions)}{" "}
                      <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                        {item.isOperating
                          ? t.guardrail.operating
                          : t.guardrail.nonOperating}
                      </span>
                    </span>
                    {item.note && (
                      <span className="pl-3 text-[11px] leading-snug text-slate-400">
                        {item.note}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
