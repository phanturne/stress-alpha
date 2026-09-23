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
  Star,
  History,
} from "lucide-react";
import type {
  FinancialModelBaseline,
  Facts,
  StressResult,
  Valuation,
  ReportData,
} from "@/lib/schemas";
import { type StressTestParams, round2 } from "@/lib/valuation";
import { PriceMeter } from "./PriceMeter";
import { formatCurrency, formatPercent, formatBillions } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";
import {
  computeSnowflakeScore,
  type SnowflakeScoreResult,
} from "@/lib/snowflake";
import { useWatchlist } from "@/lib/watchlist";
import { SnowflakeCard } from "./snowflake/SnowflakeCard";

interface CockpitProps {
  baseline: FinancialModelBaseline;
  facts: Facts;
  stressParams: StressTestParams;
  stressResult: StressResult;
  valuation?: Valuation;
  reportData?: ReportData;
  latestSlug?: string;
  latestQuarter?: string;
  isHistorical?: boolean;
  onSelectReport?: (slug: string) => void;
  onDriverShockChange: (driverId: string, shockPct: number) => void;
  onGrossMarginDeltaChange: (bps: number) => void;
  onFixedOpexShiftChange: (shiftPct: number) => void;
  onResetDefaults: () => void;
  onOpenSnowflake?: () => void;
  locale?: Locale;
  snowflakeScore?: SnowflakeScoreResult | null;
}

export const Cockpit: React.FC<CockpitProps> = ({
  baseline,
  facts,
  stressParams,
  stressResult,
  valuation,
  reportData,
  latestSlug,
  latestQuarter,
  isHistorical = false,
  onSelectReport,
  onDriverShockChange,
  onGrossMarginDeltaChange,
  onFixedOpexShiftChange,
  onResetDefaults,
  onOpenSnowflake,
  locale = "zh",
  snowflakeScore: propSnowflakeScore,
}) => {
  const t = getTranslations(locale).cockpit;
  const headerT = getTranslations(locale).header;
  const { isFavorite, toggleFavorite } = useWatchlist();
  const isFav = isFavorite(facts.ticker);

  const snowflakeScore = React.useMemo(() => {
    if (propSnowflakeScore) return propSnowflakeScore;
    const effectiveReportData: ReportData = reportData ?? {
      folderSlug: facts.ticker,
      folderName: facts.company,
      facts,
      valuation,
      baseline,
      scenarios: {
        ticker: facts.ticker,
        basisYear: "FY2027",
        currentPrice: facts.currentPrice,
        consensusTarget: valuation?.consensusTarget ?? 0,
        scenarios: [],
      },
    };
    return computeSnowflakeScore(effectiveReportData, stressResult, locale);
  }, [
    propSnowflakeScore,
    reportData,
    facts,
    valuation,
    baseline,
    stressResult,
    locale,
  ]);
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
  const weightedFairValue =
    valuation?.weightedFairValue ??
    valuation?.scenarioResults?.reduce(
      (acc, s) => acc + s.probability * s.fairValue,
      0
    ) ??
    0;
  const upsidePct =
    valuation?.upsidePct ??
    (currentPrice > 0 && weightedFairValue > 0
      ? round2(((weightedFairValue - currentPrice) / currentPrice) * 100)
      : 0);

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
      {/* Historical Quarter Notice Banner */}
      {isHistorical && latestSlug && onSelectReport && (
        <div className="flex items-center justify-between gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-200 shadow-sm">
          <div className="flex min-w-0 items-center gap-2">
            <History className="size-4 shrink-0 text-amber-400" />
            <span className="truncate text-[11px] leading-tight">
              {headerT.historicalBanner(facts.quarter, facts.reportDate)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectReport(latestSlug)}
            className="shrink-0 rounded-md border border-amber-500/40 bg-amber-500/20 px-2 py-1 font-mono text-[10px] font-bold text-amber-300 transition-colors hover:bg-amber-500/30"
          >
            {headerT.jumpToLatest(latestQuarter || "Latest")} →
          </button>
        </div>
      )}

      {/* 1. Header, Stock Identity & Live Valuation Strip */}
      <div className="glass-panel flex flex-col gap-3 rounded-2xl border border-white/[0.08] p-4 shadow-xl sm:p-4.5">
        {/* Stock Identity & Reset Action */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="shrink-0 rounded-lg border border-accent/20 bg-accent/10 p-1.5 text-accent">
              <Zap className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-sm font-black uppercase tracking-tight text-white sm:text-base">
                  {facts.ticker}
                </h2>
                <button
                  type="button"
                  onClick={() => toggleFavorite(facts.ticker)}
                  className="rounded p-0.5 text-slate-500 transition-transform hover:scale-125 hover:text-amber-400 active:scale-95"
                  title={
                    isFav ? headerT.removeFromWatchlist : headerT.addToWatchlist
                  }
                  aria-label={
                    isFav ? headerT.removeFromWatchlist : headerT.addToWatchlist
                  }
                >
                  <Star
                    className={`size-3.5 transition-colors ${
                      isFav
                        ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                        : "text-slate-500 hover:text-amber-300"
                    }`}
                  />
                </button>
                <span className="rounded border border-white/[0.08] bg-surface-2/90 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-300">
                  {facts.quarter}
                </span>
                {isHistorical ? (
                  <span className="rounded border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-400">
                    {headerT.historicalBadge}
                  </span>
                ) : (
                  <span className="rounded border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-400">
                    {headerT.latestBadge}
                  </span>
                )}
              </div>
              <div
                className="truncate text-xs font-medium text-slate-400"
                title={facts.company}
              >
                {facts.company}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
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
        </div>

        {/* Live Stock Pricing & Weighted Fair Value Strip */}
        <div className="relative grid grid-cols-2 gap-3 overflow-hidden rounded-xl border border-white/[0.08] bg-surface-0/80 p-3 shadow-inner">
          <div className="pointer-events-none absolute left-0 top-0 size-28 rounded-full bg-accent/5 blur-2xl" />
          {/* Current Price */}
          <div>
            <div
              className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[11px]"
              title={t.currentPrice}
            >
              {t.currentPrice}
            </div>
            <div className="mt-0.5 font-mono text-xl font-black tabular-nums tracking-tight text-white sm:text-2xl">
              {formatCurrency(currentPrice)}
            </div>
          </div>

          {/* Weighted Fair Value */}
          <div className="text-right">
            <div
              className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[11px]"
              title={t.weightedFairValue}
            >
              {t.weightedFairValue}
            </div>
            <div className="mt-0.5 flex items-baseline justify-end gap-1.5">
              <span className="font-mono text-xl font-black tabular-nums tracking-tight text-accent sm:text-2xl">
                {formatCurrency(weightedFairValue, 2)}
              </span>
              <span
                className={`rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums ${
                  upsidePct >= 0
                    ? "bg-fintech-greenGlow/15 border-fintech-green/30 text-fintech-green"
                    : "bg-fintech-redGlow/15 border-fintech-red/30 text-fintech-red"
                }`}
              >
                {formatPercent(upsidePct)}
              </span>
            </div>
          </div>
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
              title={t.presets.baselineTooltip}
            >
              {t.presets.baseline}
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("mild")}
              className="bg-fintech-amberGlow/10 hover:bg-fintech-amberGlow/20 truncate rounded-lg border border-fintech-amber/25 px-1.5 py-1 text-center text-[11px] font-medium text-fintech-amber transition-colors"
              title={t.presets.mildTooltip}
            >
              {t.presets.mild}
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("severe")}
              className="bg-fintech-redGlow/10 hover:bg-fintech-redGlow/20 truncate rounded-lg border border-fintech-red/25 px-1.5 py-1 text-center text-[11px] font-medium text-fintech-red transition-colors"
              title={t.presets.severeTooltip}
            >
              {t.presets.severe}
            </button>
          </div>
        </div>

        {/* Big Stressed EPS Tag */}
        <div className="relative flex items-baseline justify-between overflow-hidden rounded-xl border border-white/[0.08] bg-surface-0/80 p-3.5 shadow-inner">
          <div className="pointer-events-none absolute right-0 top-0 size-32 rounded-full bg-accent/5 blur-2xl" />
          <div>
            <div
              className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[11px]"
              title={t.stressedForwardEps}
            >
              <span className="size-1.5 animate-pulse rounded-full bg-accent" />
              {t.stressedForwardEps}
            </div>
            <div className="mt-0.5 font-mono text-2xl font-black tabular-nums tracking-tight text-accent sm:text-3xl">
              {formatCurrency(stressEps)}
            </div>
          </div>
          <div className="text-right">
            <div
              className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[11px]"
              title={`${facts.quarter} ${t.cleanOperatingEps}`}
            >
              {facts.quarter} {t.cleanOperatingEps}
            </div>
            <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-200 sm:text-base">
              {formatCurrency(facts.epsOperating)}
            </div>
          </div>
        </div>

        {/* Live Stressed P&L Ribbon */}
        <div className="grid grid-cols-2 gap-2 pt-0.5 text-center sm:grid-cols-4">
          <div
            className="flex flex-col rounded-lg border border-white/[0.05] bg-surface-0/60 p-2"
            title={`${t.stressedRev}: ${formatBillions(stressRevenueBillions)}`}
          >
            <div
              className="truncate font-mono text-[9px] font-medium uppercase text-slate-400"
              title={t.stressedRev}
            >
              {t.stressedRev}
            </div>
            <div className="mt-0.5 font-mono text-xs font-bold tabular-nums text-white sm:text-sm">
              {formatBillions(stressRevenueBillions)}
            </div>
          </div>
          <div
            className="flex flex-col rounded-lg border border-white/[0.05] bg-surface-0/60 p-2"
            title={`${t.grossProfit}: ${formatBillions(stressGrossProfitBillions)}`}
          >
            <div
              className="truncate font-mono text-[9px] font-medium uppercase text-slate-400"
              title={t.grossProfit}
            >
              {t.grossProfit}
            </div>
            <div className="mt-0.5 font-mono text-xs font-bold tabular-nums text-white sm:text-sm">
              {formatBillions(stressGrossProfitBillions)}
            </div>
          </div>
          <div
            className="flex flex-col rounded-lg border border-white/[0.05] bg-surface-0/60 p-2"
            title={`${t.operatingIncome}: ${formatBillions(stressOperatingIncomeBillions)}`}
          >
            <div
              className="truncate font-mono text-[9px] font-medium uppercase text-slate-400"
              title={t.operatingIncome}
            >
              {t.operatingIncome}
            </div>
            <div className="mt-0.5 font-mono text-xs font-bold tabular-nums text-white sm:text-sm">
              {formatBillions(stressOperatingIncomeBillions)}
            </div>
          </div>
          <div
            className="flex flex-col rounded-lg border border-white/[0.05] bg-surface-0/60 p-2"
            title={`${t.netIncome}: ${formatBillions(stressNetIncomeBillions)}`}
          >
            <div
              className="truncate font-mono text-[9px] font-medium uppercase text-slate-400"
              title={t.netIncome}
            >
              {t.netIncome}
            </div>
            <div className="mt-0.5 font-mono text-xs font-bold tabular-nums text-white sm:text-sm">
              {formatBillions(stressNetIncomeBillions)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. 5-Pillar Snowflake Radar Overview */}
      <SnowflakeCard
        scoreResult={snowflakeScore}
        onOpenModal={() => onOpenSnowflake?.()}
        locale={locale}
      />

      {/* 3. Harmonized Dynamic Scenario Targets (Bull, Base, Bear) + Panic Floor */}
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
              <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
                <span className="text-slate-400">
                  {t.current}: {formatCurrency(currentPrice)}
                </span>
                {weightedFairValue > 0 && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span
                      className={`font-bold ${
                        upsidePct >= 0
                          ? "text-fintech-green"
                          : "text-fintech-red"
                      }`}
                      title={`${t.weightedFairValue}: ${formatCurrency(weightedFairValue, 2)}`}
                    >
                      {t.wfvShort}: {formatCurrency(weightedFairValue, 0)} (
                      {formatPercent(upsidePct)})
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 3 Core Scenario Cards: Bull, Base, Bear */}
            <div className="grid grid-cols-3 gap-2">
              {/* Bull */}
              <div
                className="from-fintech-greenGlow/15 flex flex-col rounded-xl border border-fintech-green/30 bg-gradient-to-b to-surface-0/60 p-3 shadow-sm"
                title={`${t.regimes.bull}: Optimistic expansion regime with premium multiple`}
              >
                <div className="flex items-center justify-between font-mono text-[11px] font-bold text-fintech-green">
                  <span className="truncate" title={t.regimes.bull}>
                    {t.regimes.bull}
                  </span>
                </div>
                <div className="mt-1 font-mono text-base font-extrabold tabular-nums text-white">
                  {formatCurrency(targetBull)}
                </div>
                <div className="mt-0.5 font-mono text-[11px] font-bold tabular-nums text-fintech-green">
                  {formatPercent(deltaBull)}
                </div>
              </div>

              {/* Base */}
              <div
                className="flex flex-col rounded-xl border border-white/[0.09] bg-surface-0/80 p-3 shadow-sm"
                title={`${t.regimes.base}: Baseline execution matching management consensus guidance`}
              >
                <div className="flex items-center justify-between font-mono text-[11px] font-bold text-slate-200">
                  <span className="truncate" title={t.regimes.base}>
                    {t.regimes.base}
                  </span>
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
              <div
                className="from-fintech-redGlow/15 flex flex-col rounded-xl border border-fintech-red/30 bg-gradient-to-b to-surface-0/60 p-3 shadow-sm"
                title={`${t.regimes.bear}: Contraction regime with macroeconomic multiple de-rating`}
              >
                <div className="flex items-center justify-between font-mono text-[11px] font-bold text-fintech-red">
                  <span className="truncate" title={t.regimes.bear}>
                    {t.regimes.bear}
                  </span>
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
            <div
              className="bg-fintech-redGlow/10 flex items-center justify-between rounded-xl border border-fintech-red/25 px-3 py-2 font-mono text-xs"
              title="Panic Floor: Cycle trough valuation limit during severe recession"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-fintech-red">
                <AlertOctagon className="size-3.5 shrink-0" />
                <span
                  className="truncate"
                  title={`${t.regimes.panicFloorLabel} (${baseline.multipleRegimes.panic}x P/E)`}
                >
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
              <div
                className="rounded-xl border border-white/[0.06] bg-surface-0/70 p-2.5"
                title={`${t.asymmetry.upsideToBull}: Potential percentage gain if stock expands to Bull multiple`}
              >
                <div
                  className="truncate text-[10px] font-medium text-slate-400"
                  title={t.asymmetry.upsideToBull}
                >
                  {t.asymmetry.upsideToBull}
                </div>
                <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-fintech-green">
                  {formatPercent(deltaBull)}
                </div>
              </div>
              <div
                className="rounded-xl border border-white/[0.06] bg-surface-0/70 p-2.5"
                title={`${t.asymmetry.downsideToPanic}: Maximum downside drawdown to Panic Floor valuation`}
              >
                <div
                  className="truncate text-[10px] font-medium text-slate-400"
                  title={t.asymmetry.downsideToPanic}
                >
                  {t.asymmetry.downsideToPanic}
                </div>
                <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-fintech-red">
                  {formatPercent(panicDelta)}
                </div>
              </div>
              <div
                className="rounded-xl border border-white/[0.06] bg-surface-0/70 p-2.5"
                title={`${t.asymmetry.pricedInMultiple}: Implied P/E ratio currently priced in at market price`}
              >
                <div
                  className="truncate text-[10px] font-medium text-slate-400"
                  title={t.asymmetry.pricedInMultiple}
                >
                  {t.asymmetry.pricedInMultiple}
                </div>
                <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-200">
                  {asymmetry.marketPricedInMultiple.toFixed(1)}x
                </div>
              </div>
              <div
                className="rounded-xl border border-white/[0.06] bg-surface-0/70 p-2.5"
                title={`${t.asymmetry.asymmetrySkew}: Ratio of upside to Bull vs downside to Panic Floor (>2.0x is attractive)`}
              >
                <div
                  className="truncate text-[10px] font-medium text-slate-400"
                  title={t.asymmetry.asymmetrySkew}
                >
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
                <div key={driver.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
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
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300">
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
                          ? "bg-fintech-greenGlow/15 border-fintech-green/30 text-fintech-green"
                          : (stressParams.grossMarginBpsDelta ?? 0) < 0
                            ? "bg-fintech-redGlow/15 border-fintech-red/30 text-fintech-red"
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
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300">
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
                          ? "bg-fintech-redGlow/15 border-fintech-red/30 text-fintech-red"
                          : (stressParams.fixedOpexShiftPct ?? 0) < 0
                            ? "bg-fintech-greenGlow/15 border-fintech-green/30 text-fintech-green"
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
        <div className="glass-panel bg-fintech-amberGlow/5 flex flex-col gap-2 rounded-2xl border border-fintech-amber/30 p-3.5 shadow-lg sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-fintech-amber">
              <ShieldAlert className="size-4" />
              <span>{t.guardrail.title}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsGuardrailOpen(!isGuardrailOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-surface-2/90 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-300 shadow-sm transition-colors hover:border-accent/40 hover:text-white"
              title={
                isGuardrailOpen
                  ? t.guardrail.toggleHide
                  : t.guardrail.toggleShow
              }
            >
              <span>
                {isGuardrailOpen
                  ? t.guardrail.toggleHide
                  : t.guardrail.toggleShow}
              </span>
              {isGuardrailOpen ? (
                <ChevronUp className="size-3 text-accent" />
              ) : (
                <ChevronDown className="size-3 text-slate-400" />
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
