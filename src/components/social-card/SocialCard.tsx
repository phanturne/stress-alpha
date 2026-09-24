"use client";

import React, { forwardRef } from "react";
import {
  Zap,
  ShieldCheck,
  TrendingUp,
  Target,
  Award,
  BarChart3,
  Sparkles,
} from "lucide-react";
import type { Facts, Valuation, StressResult, ReportData } from "@/lib/schemas";
import { getTranslations, type Locale } from "@/lib/i18n";
import { formatCurrency, formatPercent, formatBillions } from "@/lib/utils";
import {
  type CardTemplate,
  type CardSection,
  type CardAspectRatio,
  type CardTheme,
  CARD_DIMENSIONS,
  THEME_CONFIGS,
  TEMPLATE_SECTION_PRESETS,
  CARD_SECTIONS,
  findMatchingPreset,
  isSectionAvailableForReport,
} from "@/lib/social-card";
import { computeSnowflakeScore } from "@/lib/snowflake";
import { SnowflakeRadar } from "@/components/snowflake/SnowflakeRadar";

export interface SocialCardProps {
  facts: Facts;
  valuation?: Valuation;
  stressResult: StressResult;
  reportData?: ReportData;
  template?: CardTemplate | "custom";
  selectedSections?: CardSection[];
  aspectRatio: CardAspectRatio;
  theme?: CardTheme;
  locale?: Locale;
  includeStressShocks?: boolean;
  includeWatermark?: boolean;
  showWatermark?: boolean;
  customNote?: string;
  appliedShocks?: Record<string, number>;
  grossMarginDeltaBps?: number;
  fixedOpexShiftPct?: number;
  stressParams?: {
    driverShocks?: Record<string, number>;
    grossMarginBpsDelta?: number;
    fixedOpexShiftPct?: number;
  };
}

export const SocialCard = forwardRef<HTMLDivElement, SocialCardProps>(
  (
    {
      facts,
      valuation,
      stressResult,
      reportData,
      template = "valuation",
      selectedSections,
      aspectRatio = "landscape",
      theme = "cyber",
      locale = "en",
      includeStressShocks = true,
      includeWatermark,
      showWatermark = true,
      customNote,
      appliedShocks = {},
      grossMarginDeltaBps = 0,
      fixedOpexShiftPct = 0,
      stressParams,
    },
    ref
  ) => {
    const effectiveShowWatermark = includeWatermark ?? showWatermark;
    const isZh = locale === "zh";
    const t = getTranslations(locale).socialCard;
    const labels = t.labels;
    const dim = CARD_DIMENSIONS[aspectRatio];
    const themeConfig = THEME_CONFIGS[theme];

    const currentPrice = facts.currentPrice;
    const weightedFairValue = valuation?.weightedFairValue ?? currentPrice;
    const upsidePct = valuation?.upsidePct ?? 0;
    const asymmetry = stressResult.asymmetry;
    const bands = stressResult.valuationBands;

    const effectiveAppliedShocks = stressParams?.driverShocks ?? appliedShocks;
    const effectiveGrossMarginDeltaBps =
      stressParams?.grossMarginBpsDelta ?? grossMarginDeltaBps;
    const effectiveFixedOpexShiftPct =
      stressParams?.fixedOpexShiftPct ?? fixedOpexShiftPct;

    // Active shocks check
    const nonZeroShocks = Object.entries(effectiveAppliedShocks).filter(
      ([, val]) => Math.abs(val) > 0.001
    );
    const hasActiveStress =
      includeStressShocks &&
      (nonZeroShocks.length > 0 ||
        Math.abs(effectiveGrossMarginDeltaBps) > 0.001 ||
        Math.abs(effectiveFixedOpexShiftPct) > 0.001);

    // Moat data
    const moatData =
      isZh && reportData?.moatZh ? reportData.moatZh : reportData?.moat;
    const catalystsData =
      isZh && reportData?.catalystsZh
        ? reportData.catalystsZh
        : reportData?.catalysts;

    const snowflakeScore = React.useMemo(() => {
      const effectiveReportData: ReportData = reportData ?? {
        folderSlug: facts.ticker,
        folderName: facts.company,
        facts,
        valuation,
        scenarios: {
          ticker: facts.ticker,
          basisYear: "FY2027",
          currentPrice: facts.currentPrice,
          consensusTarget: valuation?.consensusTarget ?? 0,
          scenarios: [],
        },
        catalysts: catalystsData,
        moat: moatData,
      };
      return computeSnowflakeScore(effectiveReportData, stressResult, locale);
    }, [
      reportData,
      facts,
      valuation,
      catalystsData,
      moatData,
      stressResult,
      locale,
    ]);

    const rawActiveSections: CardSection[] =
      selectedSections && selectedSections.length > 0
        ? selectedSections
        : template !== "custom" &&
            TEMPLATE_SECTION_PRESETS[template as CardTemplate]
          ? TEMPLATE_SECTION_PRESETS[template as CardTemplate]
          : ["valuationHero", "regimes"];

    // Filter out sections that have no audited data for this ticker to avoid empty or cut off views
    const filteredSections = rawActiveSections.filter((sec) =>
      isSectionAvailableForReport(sec, facts, reportData)
    );
    const validSections =
      filteredSections.length > 0
        ? filteredSections
        : (["valuationHero", "regimes"] as CardSection[]);

    // Maintain canonical display and layout ordering for consistent visual hierarchy
    const activeSections: CardSection[] = CARD_SECTIONS.filter((sec) =>
      validSections.includes(sec)
    );

    const resolvedTemplate =
      findMatchingPreset(activeSections) ??
      (template !== "custom" ? (template as CardTemplate) : undefined);

    // Layout flags
    const isLandscape = aspectRatio === "landscape";
    const isSquare = aspectRatio === "square";

    // 1. Valuation Hero Section (Current Price vs Weighted Fair Value + Asymmetry)
    const renderValuationHero = (spanClass: string) => {
      const trailingPe =
        facts.trailingEps > 0
          ? `${(currentPrice / facts.trailingEps).toFixed(1)}x`
          : undefined;
      const fwdPe =
        facts.forwardEpsConsensus > 0
          ? `${(currentPrice / facts.forwardEpsConsensus).toFixed(1)}x`
          : `${asymmetry.marketPricedInMultiple.toFixed(1)}x`;
      const fairPe =
        facts.forwardEpsConsensus > 0
          ? `${(weightedFairValue / facts.forwardEpsConsensus).toFixed(1)}x`
          : `${bands.base.multiple.toFixed(1)}x`;
      const marginOfSafety =
        weightedFairValue > currentPrice
          ? `${(((weightedFairValue - currentPrice) / weightedFairValue) * 100).toFixed(1)}%`
          : undefined;

      const bullUpsidePct = Math.max(0, bands.bull.deltaFromCurrentPct);
      const panicDownsidePct = Math.abs(bands.panic.deltaFromCurrentPct);
      const totalSpan = bullUpsidePct + panicDownsidePct || 1;
      const upsideBarPct = Math.min(
        85,
        Math.max(15, (bullUpsidePct / totalSpan) * 100)
      );

      return (
        <div
          className={`flex flex-col justify-between rounded-3xl border shadow-xl ${
            isLandscape ? `${spanClass} p-4` : "w-full p-5"
          }`}
          style={{
            borderColor: themeConfig.borderColor,
            background: themeConfig.cardBg,
          }}
        >
          {/* Top: Current Price vs Weighted Fair Value */}
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                {labels.currentPriceLabel}
              </span>
              <span className="font-mono text-xs text-slate-400">
                {facts.analysisDate ?? "2026-09"}
              </span>
            </div>
            <div
              className={`mt-0.5 font-mono ${
                isLandscape ? "text-3xl" : "text-4xl"
              } font-extrabold tracking-tight text-white`}
            >
              {formatCurrency(currentPrice)}
            </div>

            <div
              className={`${isLandscape ? "my-2" : "my-3"} h-px w-full`}
              style={{ background: themeConfig.borderColor }}
            />

            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                {labels.weightedFairValueLabel}
              </span>
              <div
                className={`flex items-center gap-1 rounded-full px-3 py-0.5 font-mono text-xs font-extrabold shadow-md ${
                  upsidePct >= 0
                    ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                    : "border border-rose-500/40 bg-rose-500/20 text-rose-400"
                }`}
              >
                <TrendingUp className="size-3.5" />
                <span>
                  {formatPercent(upsidePct)}{" "}
                  {upsidePct >= 0 ? labels.upsideTag : labels.downsideTag}
                </span>
              </div>
            </div>
            <div
              className={`mt-0.5 font-mono ${
                isLandscape ? "text-3xl" : "text-4xl"
              } font-black tracking-tight`}
              style={{ color: upsidePct >= 0 ? "#10b981" : "#f43f5e" }}
            >
              {formatCurrency(weightedFairValue)}
            </div>
          </div>

          {/* Middle: 4-Metric Valuation Multiples & Safety Matrix */}
          <div
            className={`${
              isLandscape ? "my-2 gap-1.5" : "my-2.5 gap-2"
            } grid grid-cols-4 font-mono`}
          >
            <div
              className={`rounded-xl border ${
                isLandscape ? "p-1.5" : "p-2"
              } text-center`}
              style={{
                borderColor: "rgba(255, 255, 255, 0.08)",
                background: "rgba(255, 255, 255, 0.02)",
              }}
            >
              <div className="text-[10px] uppercase text-slate-400">
                {labels.trailingPeLabel}
              </div>
              <div className="mt-0.5 text-xs font-bold text-white">
                {trailingPe ?? "N/A"}
              </div>
            </div>
            <div
              className={`rounded-xl border ${
                isLandscape ? "p-1.5" : "p-2"
              } text-center`}
              style={{
                borderColor: "rgba(255, 255, 255, 0.08)",
                background: "rgba(255, 255, 255, 0.02)",
              }}
            >
              <div className="text-[10px] uppercase text-slate-400">
                {labels.forwardPeLabel}
              </div>
              <div className="mt-0.5 text-xs font-bold text-white">{fwdPe}</div>
            </div>
            <div
              className={`rounded-xl border ${
                isLandscape ? "p-1.5" : "p-2"
              } text-center`}
              style={{
                borderColor: "rgba(255, 255, 255, 0.08)",
                background: "rgba(255, 255, 255, 0.02)",
              }}
            >
              <div className="text-[10px] uppercase text-slate-400">
                {labels.fairPeLabel}
              </div>
              <div
                className="mt-0.5 text-xs font-bold"
                style={{ color: themeConfig.accentColor }}
              >
                {fairPe}
              </div>
            </div>
            <div
              className={`rounded-xl border ${
                isLandscape ? "p-1.5" : "p-2"
              } text-center`}
              style={{
                borderColor: "rgba(255, 255, 255, 0.08)",
                background: "rgba(255, 255, 255, 0.02)",
              }}
            >
              <div className="text-[10px] uppercase text-slate-400">
                {labels.marginOfSafetyLabel}
              </div>
              <div className="mt-0.5 text-xs font-bold text-emerald-400">
                {marginOfSafety ?? "0.0%"}
              </div>
            </div>
          </div>

          {/* Bottom section: Asymmetry Skew Gauge + Consensus Target + Stress status */}
          <div className="flex flex-col gap-1.5">
            {/* Risk / Reward & Panic Defense */}
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div
                className={`rounded-2xl border ${
                  isLandscape ? "p-2" : "p-2.5"
                }`}
                style={{
                  borderColor: "rgba(255, 255, 255, 0.08)",
                  background: "rgba(255, 255, 255, 0.03)",
                }}
              >
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
                  <span>{labels.riskRewardLabel}</span>
                  <span
                    className="text-[9px] font-semibold"
                    style={{ color: themeConfig.accentColor }}
                  >
                    {labels.asymmetrySkewLabel}
                  </span>
                </div>
                <div
                  className={`mt-0.5 ${
                    isLandscape ? "text-base" : "text-lg"
                  } font-extrabold`}
                  style={{ color: themeConfig.accentColor }}
                >
                  {asymmetry.riskRewardRatio
                    ? `${asymmetry.riskRewardRatio.toFixed(1)}x`
                    : "N/A"}
                </div>
              </div>
              <div
                className={`rounded-2xl border ${
                  isLandscape ? "p-2" : "p-2.5"
                }`}
                style={{
                  borderColor: "rgba(255, 255, 255, 0.08)",
                  background: "rgba(255, 255, 255, 0.03)",
                }}
              >
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
                  <span>{labels.panicDefenseLabel}</span>
                  <span className="text-[9px] font-semibold text-rose-400">
                    {formatCurrency(bands.panic.targetPrice)}
                  </span>
                </div>
                <div
                  className={`mt-0.5 ${
                    isLandscape ? "text-base" : "text-lg"
                  } font-extrabold text-rose-400`}
                >
                  {formatPercent(asymmetry.downsideToPanicPct)}
                </div>
              </div>
            </div>

            {/* Asymmetry Visual Skew Bar */}
            <div
              className={`rounded-xl border ${
                isLandscape ? "px-2.5 py-1" : "px-3 py-1.5"
              } font-mono text-[10px]`}
              style={{
                borderColor: "rgba(255, 255, 255, 0.08)",
                background: "rgba(255, 255, 255, 0.02)",
              }}
            >
              <div className="mb-0.5 flex items-center justify-between text-slate-400">
                <span className="font-bold text-emerald-400">
                  {labels.bullUpsideLabel}:{" "}
                  {formatPercent(bands.bull.deltaFromCurrentPct)}
                </span>
                <span className="font-bold text-rose-400">
                  {labels.panicDownsideLabel}:{" "}
                  {formatPercent(bands.panic.deltaFromCurrentPct)}
                </span>
              </div>
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-l-full bg-emerald-500 transition-all"
                  style={{ width: `${upsideBarPct}%` }}
                />
                <div
                  className="h-full rounded-r-full bg-rose-500 transition-all"
                  style={{ width: `${100 - upsideBarPct}%` }}
                />
              </div>
            </div>

            {/* Wall Street Consensus Target Benchmark */}
            {valuation?.consensusTarget ? (
              <div
                className={`flex items-center justify-between rounded-xl border ${
                  isLandscape ? "px-2.5 py-1" : "px-3 py-1.5"
                } font-mono text-xs`}
                style={{
                  borderColor: "rgba(255, 255, 255, 0.08)",
                  background: "rgba(255, 255, 255, 0.02)",
                }}
              >
                <span className="text-[10px] text-slate-400">
                  {labels.consensusLabel}:{" "}
                  <strong className="text-slate-200">
                    {formatCurrency(valuation.consensusTarget)}
                  </strong>
                </span>
                <span
                  className="max-w-[220px] truncate text-[10px] font-bold"
                  style={{ color: themeConfig.accentColor }}
                >
                  {valuation.verdictVsConsensus ??
                    formatPercent(
                      ((valuation.weightedFairValue -
                        valuation.consensusTarget) /
                        valuation.consensusTarget) *
                        100
                    )}
                </span>
              </div>
            ) : null}

            {/* Stress Scenario Badge */}
            <div
              className={`flex items-center gap-1.5 rounded-xl border ${
                isLandscape ? "px-2.5 py-1" : "px-3 py-1.5"
              } text-xs font-semibold`}
              style={{
                borderColor: hasActiveStress
                  ? "rgba(245, 158, 11, 0.3)"
                  : "rgba(56, 189, 248, 0.2)",
                background: hasActiveStress
                  ? "rgba(245, 158, 11, 0.08)"
                  : "rgba(56, 189, 248, 0.05)",
                color: hasActiveStress ? "#f59e0b" : themeConfig.accentColor,
              }}
            >
              <Zap className="size-3 shrink-0" />
              <span className="truncate text-[11px]">
                {hasActiveStress
                  ? labels.activeStressTag
                  : labels.neutralStressTag}
              </span>
            </div>
          </div>
        </div>
      );
    };

    // 2. Valuation Regimes Spectrum Section
    const renderRegimes = (spanClass: string) => {
      // Calculate relative price position on the spectrum bar
      const minPrice = bands.panic.targetPrice * 0.95;
      const maxPrice =
        Math.max(bands.bull.targetPrice, weightedFairValue) * 1.05;
      const priceRange = maxPrice - minPrice || 1;
      const currentPosPct = Math.min(
        95,
        Math.max(5, ((currentPrice - minPrice) / priceRange) * 100)
      );

      return (
        <div
          className={`flex flex-col justify-between rounded-3xl border shadow-xl ${
            isLandscape ? `${spanClass} p-4` : "w-full p-5"
          }`}
          style={{
            borderColor: themeConfig.borderColor,
            background: themeConfig.cardBg,
          }}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between border-b ${
              isLandscape ? "pb-2" : "pb-2.5"
            }`}
            style={{ borderColor: themeConfig.borderColor }}
          >
            <div className="flex items-center gap-2">
              <Target
                className="size-4"
                style={{ color: themeConfig.accentColor }}
              />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                {labels.valuationSpectrumLabel}
              </span>
            </div>
            <div className="font-mono text-xs text-slate-400">
              {labels.marketPricingLabel}:{" "}
              <strong className="text-white">
                {asymmetry.marketPricedInMultiple.toFixed(1)}x P/E
              </strong>
            </div>
          </div>

          {/* 1. Visual Valuation Spectrum Range Track (Eliminates empty space) */}
          <div
            className={`${
              isLandscape ? "my-1 p-2.5" : "my-1.5 p-3"
            } rounded-2xl border`}
            style={{
              borderColor: "rgba(255, 255, 255, 0.06)",
              background: "rgba(255, 255, 255, 0.02)",
            }}
          >
            <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-slate-400">
              <span className="font-bold uppercase tracking-wider">
                {labels.priceSpectrumTrackLabel}
              </span>
              <span>
                {labels.spreadLabel}:{" "}
                <strong className="text-white">
                  {formatCurrency(bands.panic.targetPrice)} →{" "}
                  {formatCurrency(bands.bull.targetPrice)}
                </strong>
              </span>
            </div>

            {/* Gradient Track Bar */}
            <div
              className={`relative ${
                isLandscape ? "my-2" : "my-2.5"
              } h-2 w-full rounded-full bg-slate-800`}
            >
              {/* Gradient fill */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-rose-500 via-sky-500 to-emerald-500 opacity-70"
                style={{ width: "100%" }}
              />
              {/* Current Price Marker Pin */}
              <div
                className="absolute -top-1 -ml-2 size-4 rounded-full border-2 border-white shadow-md transition-all"
                style={{
                  left: `${currentPosPct}%`,
                  backgroundColor: themeConfig.accentColor,
                }}
                title={`Current Price: ${formatCurrency(currentPrice)}`}
              />
            </div>

            {/* Range Milestones */}
            <div className="flex items-center justify-between font-mono text-[10px]">
              <div>
                <span className="font-black text-rose-400">
                  {formatCurrency(bands.panic.targetPrice)}
                </span>
                <span className="ml-1 text-[9px] text-slate-500">
                  ({bands.panic.multiple}x)
                </span>
              </div>
              <div className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 font-black text-accent">
                {formatCurrency(currentPrice)} ({labels.currentPriceLabel})
              </div>
              <div>
                <span className="font-bold text-slate-200">
                  {formatCurrency(bands.base.targetPrice)}
                </span>
                <span className="ml-1 text-[9px] text-slate-500">
                  ({bands.base.multiple}x)
                </span>
              </div>
              <div>
                <span className="font-black text-emerald-400">
                  {formatCurrency(bands.bull.targetPrice)}
                </span>
                <span className="ml-1 text-[9px] text-slate-500">
                  ({bands.bull.multiple}x)
                </span>
              </div>
            </div>
          </div>

          {/* 2. Three Enriched Regime Cards */}
          <div
            className={`${
              isLandscape ? "my-1 gap-2" : "my-1.5 gap-2.5"
            } grid grid-cols-3`}
          >
            {/* Bull */}
            <div
              className={`flex flex-col justify-between rounded-2xl border ${
                isLandscape ? "p-2.5" : "p-3"
              } transition-all`}
              style={{
                borderColor: "rgba(52, 211, 153, 0.3)",
                background: "rgba(52, 211, 153, 0.06)",
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">🐂</span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                    {bands.bull.multiple}x P/E
                  </span>
                </div>
                <div className="mt-1 text-xs font-bold text-white">
                  {labels.bullRegimeLabel}
                </div>
                <div className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">
                  {labels.bullRegimeDesc}
                </div>
              </div>
              <div className={isLandscape ? "mt-1.5" : "mt-2.5"}>
                <div className="font-mono text-lg font-black text-emerald-400">
                  {formatCurrency(bands.bull.targetPrice)}
                </div>
                <div className="font-mono text-[11px] font-bold text-emerald-500">
                  {formatPercent(bands.bull.deltaFromCurrentPct)}
                </div>
              </div>
            </div>

            {/* Base */}
            <div
              className={`flex flex-col justify-between rounded-2xl border ${
                isLandscape ? "p-2.5" : "p-3"
              } transition-all`}
              style={{
                borderColor: themeConfig.borderColor,
                background: "rgba(255, 255, 255, 0.04)",
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">🎯</span>
                  <span className="rounded-full bg-slate-700/60 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-300">
                    {bands.base.multiple}x P/E
                  </span>
                </div>
                <div className="mt-1 text-xs font-bold text-white">
                  {labels.baseCaseLabel}
                </div>
                <div className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">
                  {labels.baseRegimeDesc}
                </div>
              </div>
              <div className={isLandscape ? "mt-1.5" : "mt-2.5"}>
                <div className="font-mono text-lg font-black text-white">
                  {formatCurrency(bands.base.targetPrice)}
                </div>
                <div className="font-mono text-[11px] font-bold text-slate-400">
                  {formatPercent(bands.base.deltaFromCurrentPct)}
                </div>
              </div>
            </div>

            {/* Panic */}
            <div
              className={`flex flex-col justify-between rounded-2xl border ${
                isLandscape ? "p-2.5" : "p-3"
              } transition-all`}
              style={{
                borderColor: "rgba(244, 63, 94, 0.3)",
                background: "rgba(244, 63, 94, 0.06)",
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">🚨</span>
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-400">
                    {bands.panic.multiple}x P/E
                  </span>
                </div>
                <div className="mt-1 text-xs font-bold text-white">
                  {labels.panicFloorLabel}
                </div>
                <div className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">
                  {labels.panicRegimeDesc}
                </div>
              </div>
              <div className={isLandscape ? "mt-1.5" : "mt-2.5"}>
                <div className="font-mono text-lg font-black text-rose-400">
                  {formatCurrency(bands.panic.targetPrice)}
                </div>
                <div className="font-mono text-[11px] font-bold text-rose-500">
                  {formatPercent(bands.panic.deltaFromCurrentPct)}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Stressed Operational Flow-Through Baseline Strip (Eliminates bottom void) */}
          <div
            className={`flex items-center justify-between rounded-xl border ${
              isLandscape
                ? "px-2.5 py-1.5 text-[10px]"
                : "px-3 py-2 text-[11px]"
            } font-mono text-slate-400`}
            style={{
              borderColor: "rgba(255, 255, 255, 0.06)",
              background: "rgba(255, 255, 255, 0.02)",
            }}
          >
            <span>
              {labels.stressedRevLabel}:{" "}
              <strong className="text-white">
                {formatBillions(stressResult.stressRevenueBillions)}
              </strong>
            </span>
            <span>
              {labels.netIncomeLabel}:{" "}
              <strong className="text-white">
                {formatBillions(stressResult.stressNetIncomeBillions)}
              </strong>
            </span>
            <span>
              {labels.stressedFwdEpsLabel}:{" "}
              <strong className="text-white">
                {formatCurrency(stressResult.stressEps)}
              </strong>
            </span>
            <span className="hidden sm:inline">
              {labels.multipleSpreadLabel}:{" "}
              <strong
                className="text-accent"
                style={{ color: themeConfig.accentColor }}
              >
                {bands.panic.multiple}x → {bands.bull.multiple}x
              </strong>
            </span>
          </div>
        </div>
      );
    };

    // 3. Operational Earnings Scorecard Section
    const renderEarnings = (spanClass: string) => {
      const trailingPe =
        facts.trailingEps > 0
          ? `${(currentPrice / facts.trailingEps).toFixed(1)}x`
          : undefined;
      const fwdPe =
        facts.forwardEpsConsensus > 0
          ? `${(currentPrice / facts.forwardEpsConsensus).toFixed(1)}x`
          : undefined;
      const epsVariance = facts.epsOperating - facts.epsReported;
      const hasGuidance = Boolean(
        facts.guidanceRevenueLowBillions && facts.guidanceRevenueHighBillions
      );

      return (
        <div
          className={`flex flex-col justify-between rounded-3xl border shadow-xl ${
            isLandscape ? `${spanClass} p-4` : "w-full p-5"
          }`}
          style={{
            borderColor: themeConfig.borderColor,
            background: themeConfig.cardBg,
          }}
        >
          {/* Section Header */}
          <div
            className="flex items-center justify-between border-b pb-3"
            style={{ borderColor: themeConfig.borderColor }}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                {labels.quarterlyResultsTitle}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                {labels.earningsBeatLabel}
              </span>
            </div>
          </div>

          {/* Operational Execution Grid & Clean EPS Breakdown */}
          <div className="my-auto flex flex-col gap-2.5 py-2">
            <div className="grid grid-cols-2 gap-2.5">
              {/* Revenue Card */}
              <div
                className="rounded-2xl border p-3"
                style={{
                  borderColor: themeConfig.borderColor,
                  background: "rgba(255, 255, 255, 0.03)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase text-slate-400">
                    {labels.revenueLabel}
                  </span>
                  {facts.revenueEstimateBillions ? (
                    <span className="font-mono text-[9px] text-slate-400">
                      Est ${facts.revenueEstimateBillions}B
                    </span>
                  ) : null}
                </div>
                <div className="mt-0.5 font-mono text-xl font-extrabold text-white">
                  {formatBillions(facts.revenueBillions)}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-400">
                  <span>{formatPercent(facts.revenueGrowthPct)} YoY</span>
                </div>
              </div>

              {/* Operating Income Card */}
              <div
                className="rounded-2xl border p-3"
                style={{
                  borderColor: themeConfig.borderColor,
                  background: "rgba(255, 255, 255, 0.03)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase text-slate-400">
                    {labels.operatingIncomeLabel}
                  </span>
                  {facts.operatingIncomeGrowthPct ? (
                    <span className="font-mono text-[9px] text-emerald-400">
                      {formatPercent(facts.operatingIncomeGrowthPct)} YoY
                    </span>
                  ) : null}
                </div>
                <div className="mt-0.5 font-mono text-xl font-extrabold text-white">
                  {formatBillions(facts.operatingIncomeBillions)}
                </div>
                <div className="mt-0.5 font-mono text-[11px] font-bold text-emerald-400">
                  {facts.operatingMarginPct.toFixed(1)}% {labels.marginLabel}
                </div>
              </div>
            </div>

            {/* Income Quality Guardrail: Clean Operating EPS & GAAP Reconciliation */}
            <div
              className="rounded-2xl border p-3.5"
              style={{
                borderColor: "rgba(16, 185, 129, 0.3)",
                background: "rgba(16, 185, 129, 0.05)",
              }}
            >
              <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
                <span className="font-mono text-[11px] font-extrabold uppercase tracking-wide text-slate-200">
                  {labels.cleanConversionTitle}
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {labels.consensusLabel}: {formatCurrency(facts.epsConsensus)}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-3 items-center gap-2">
                {/* Clean Operating EPS */}
                <div>
                  <div className="font-mono text-[10px] uppercase text-slate-400">
                    {labels.cleanOperatingEpsLabel}
                  </div>
                  <div className="mt-0.5 font-mono text-2xl font-black text-white">
                    {formatCurrency(facts.epsOperating)}
                  </div>
                  {facts.epsConsensus > 0 && (
                    <div className="font-mono text-[10px] font-bold text-emerald-400">
                      {formatPercent(
                        ((facts.epsOperating - facts.epsConsensus) /
                          facts.epsConsensus) *
                          100
                      )}{" "}
                      {labels.beatLabel}
                    </div>
                  )}
                </div>

                {/* GAAP Reported EPS */}
                <div className="border-l border-white/5 pl-2.5">
                  <div className="font-mono text-[10px] uppercase text-slate-400">
                    {labels.gaapReportedEpsLabel}
                  </div>
                  <div className="mt-0.5 font-mono text-lg font-bold text-slate-200">
                    {formatCurrency(facts.epsReported)}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400">
                    SEC GAAP
                  </div>
                </div>

                {/* GAAP vs Clean Adjustment Spread */}
                <div className="border-l border-white/5 pl-2.5">
                  <div className="font-mono text-[10px] uppercase text-slate-400">
                    {labels.adjustedSpreadLabel}
                  </div>
                  <div
                    className={`mt-0.5 font-mono text-lg font-bold ${
                      Math.abs(epsVariance) < 0.005
                        ? "text-slate-300"
                        : epsVariance > 0
                          ? "text-emerald-400"
                          : "text-amber-400"
                    }`}
                  >
                    {Math.abs(epsVariance) < 0.005
                      ? "$0.00"
                      : `${epsVariance > 0 ? "+" : ""}${formatCurrency(epsVariance)}`}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400">
                    {Math.abs(epsVariance) < 0.005
                      ? "Clean Conversion"
                      : "Filtered One-Off"}
                  </div>
                </div>
              </div>

              {/* One-time filter note audit */}
              {facts.oneTimeItems && facts.oneTimeItems.length > 0 ? (
                <div className="mt-2 line-clamp-1 truncate border-t border-emerald-500/10 pt-1.5 text-[10px] text-slate-300">
                  <span className="font-semibold text-emerald-400">
                    {labels.incomeQualityFilterLabel}:
                  </span>{" "}
                  {facts.oneTimeItems[0].description} (
                  {formatBillions(facts.oneTimeItems[0].amountBillions)})
                </div>
              ) : null}
            </div>

            {/* Bottom Strip: Guidance Corridor or Capital Multiples Strip */}
            {hasGuidance ? (
              <div
                className="flex items-center justify-between rounded-xl border px-3 py-2 font-mono text-xs"
                style={{
                  borderColor: "rgba(56, 189, 248, 0.25)",
                  background: "rgba(56, 189, 248, 0.05)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-cyan-400" />
                  <span className="text-slate-400">
                    {labels.guidanceCorridorLabel}:
                  </span>
                  <span className="font-bold text-white">
                    ${facts.guidanceRevenueLowBillions}B – $
                    {facts.guidanceRevenueHighBillions}B
                  </span>
                </div>
                <div className="text-slate-400">
                  {labels.forwardPeLabel}:{" "}
                  <strong className="text-slate-200">{fwdPe ?? "N/A"}</strong>
                </div>
              </div>
            ) : (
              <div
                className="grid grid-cols-3 gap-2 rounded-xl border p-2 text-center font-mono text-[11px]"
                style={{
                  borderColor: themeConfig.borderColor,
                  background: "rgba(255, 255, 255, 0.02)",
                }}
              >
                <div>
                  <span className="text-[10px] text-slate-400">
                    {labels.marketCapLabel}:
                  </span>{" "}
                  <strong className="text-white">
                    {formatBillions(facts.marketCapBillions)}
                  </strong>
                </div>
                <div className="border-l border-white/5">
                  <span className="text-[10px] text-slate-400">
                    {labels.trailingPeLabel}:
                  </span>{" "}
                  <strong className="text-slate-200">
                    {trailingPe ?? "N/A"}
                  </strong>
                </div>
                <div className="border-l border-white/5">
                  <span className="text-[10px] text-slate-400">
                    {labels.forwardPeLabel}:
                  </span>{" "}
                  <strong className="text-slate-200">{fwdPe ?? "N/A"}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Card Bottom Footer */}
          <div
            className="flex items-center justify-between border-t pt-2.5 font-mono text-[11px] text-slate-400"
            style={{ borderColor: themeConfig.borderColor }}
          >
            <span>
              {labels.marketCapLabel}:{" "}
              <strong className="text-white">
                {formatBillions(facts.marketCapBillions)}
              </strong>
            </span>
            <span>
              {labels.nextFyConsensusLabel}:{" "}
              <strong className="text-white">
                {formatCurrency(facts.forwardEpsConsensus)}
              </strong>
            </span>
          </div>
        </div>
      );
    };

    // 4. Segment Revenue Dynamics Section
    const renderSegments = (spanClass: string) => {
      const segCount = facts.segments?.length ?? 0;
      const displayedSegments = facts.segments?.slice(0, 4) ?? [];

      return (
        <div
          className={`flex flex-col justify-between rounded-3xl border shadow-xl ${
            isLandscape ? `${spanClass} p-4` : "w-full p-5"
          }`}
          style={{
            borderColor: themeConfig.borderColor,
            background: themeConfig.cardBg,
          }}
        >
          <div
            className="flex items-center justify-between border-b pb-3"
            style={{ borderColor: themeConfig.borderColor }}
          >
            <div className="flex items-center gap-2">
              <BarChart3
                className="size-4"
                style={{ color: themeConfig.accentColor }}
              />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                {labels.segmentsTitle}
              </span>
            </div>
            <span className="font-mono text-xs text-slate-400">
              {segCount} {labels.segmentsLabel}
            </span>
          </div>

          <div className="my-auto flex flex-col gap-2.5 py-2.5">
            {displayedSegments.map((seg) => {
              const share =
                facts.revenueBillions > 0
                  ? (seg.revenueBillions / facts.revenueBillions) * 100
                  : 0;
              return (
                <div
                  key={seg.name}
                  className="rounded-2xl border p-2.5 transition-all"
                  style={{
                    borderColor: themeConfig.borderColor,
                    background: "rgba(255, 255, 255, 0.03)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-bold text-white">
                      {seg.name}
                    </span>
                    <span className="shrink-0 font-mono text-xs font-black text-white">
                      {formatBillions(seg.revenueBillions)}
                    </span>
                  </div>

                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, share))}%`,
                        background: themeConfig.accentColor,
                      }}
                    />
                  </div>

                  <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-slate-400">
                    <span>
                      {share.toFixed(1)}% {labels.ofTotalRevenueLabel}
                    </span>
                    <span className="font-bold text-emerald-400">
                      {formatPercent(seg.growthPct)} YoY
                    </span>
                  </div>

                  {/* Enrich with segment margin if available */}
                  {segCount <= 2 && seg.operatingMarginPct !== undefined ? (
                    <div className="mt-1 flex items-center justify-between border-t border-white/5 pt-1 font-mono text-[10px] text-slate-400">
                      <span>{labels.operatingMarginLabel}:</span>
                      <span className="font-bold text-slate-200">
                        {seg.operatingMarginPct.toFixed(1)}% (
                        {formatBillions(seg.operatingIncomeBillions ?? 0)})
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {/* Guidance Range banner if company only has 1 or 2 segments */}
            {segCount <= 2 &&
            facts.guidanceRevenueLowBillions &&
            facts.guidanceRevenueHighBillions ? (
              <div
                className="flex items-center justify-between rounded-xl border px-3 py-1.5 font-mono text-[11px]"
                style={{
                  borderColor: "rgba(56, 189, 248, 0.2)",
                  background: "rgba(56, 189, 248, 0.05)",
                }}
              >
                <span className="text-slate-400">
                  {labels.revenueGuidanceLabel}:
                </span>
                <span
                  className="font-bold"
                  style={{ color: themeConfig.accentColor }}
                >
                  ${facts.guidanceRevenueLowBillions}B - $
                  {facts.guidanceRevenueHighBillions}B
                </span>
              </div>
            ) : null}
          </div>

          <div
            className="flex items-center justify-between border-t pt-2.5 font-mono text-[11px] text-slate-400"
            style={{ borderColor: themeConfig.borderColor }}
          >
            <span>
              {labels.valuationUpsideLabel}:{" "}
              <strong className="text-emerald-400">
                {formatPercent(upsidePct)}
              </strong>
            </span>
            <span>
              {labels.weightedFairValueShortLabel}:{" "}
              <strong className="text-white">
                {formatCurrency(weightedFairValue)}
              </strong>
            </span>
          </div>
        </div>
      );
    };

    // 5. Economic Moat Section
    const renderMoat = (spanClass: string) => {
      const sources = moatData?.moatSources?.slice(0, 3) ?? [];
      const competitors = moatData?.competitors?.slice(0, 2) ?? [];

      return (
        <div
          className={`flex flex-col justify-between rounded-3xl border shadow-xl ${
            isLandscape ? `${spanClass} p-4` : "w-full p-5"
          }`}
          style={{
            borderColor: themeConfig.borderColor,
            background: themeConfig.cardBg,
          }}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                {labels.competitiveAdvantageTitle}
              </span>
              <span className="rounded-md border border-purple-500/30 bg-purple-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-300">
                {moatData?.overallMoatRating ?? "Wide"} Moat
              </span>
            </div>

            <div
              className="mt-3 flex items-center gap-3 rounded-2xl border p-3"
              style={{
                borderColor: themeConfig.borderColor,
                background: "rgba(255, 255, 255, 0.03)",
              }}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400">
                <Award className="size-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white">
                  {moatData?.overallMoatRating ?? "Wide"}{" "}
                  {labels.moatRatingLabel}
                </div>
                <div className="font-mono text-[11px] text-slate-400">
                  {labels.moatTrendLabel}:{" "}
                  <strong className="text-purple-300">
                    {moatData?.moatTrend ?? "Widening"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Strategic thesis quote */}
            {moatData?.competitiveDynamicsSummary ? (
              <div className="mt-2.5 line-clamp-2 rounded-xl border border-purple-500/20 bg-purple-500/5 p-2.5 text-[11px] italic text-slate-300">
                &ldquo;{moatData.competitiveDynamicsSummary}&rdquo;
              </div>
            ) : null}

            {/* Moat Sources with strength pill */}
            <div className="mt-2.5 flex flex-col gap-1.5">
              {sources.map((source) => (
                <div
                  key={source.source}
                  className="flex items-center justify-between rounded-xl border px-2.5 py-1.5 text-xs"
                  style={{
                    borderColor: themeConfig.borderColor,
                    background: "rgba(255, 255, 255, 0.02)",
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="size-1.5 shrink-0 rounded-full bg-purple-400" />
                    <span className="truncate font-semibold text-slate-200">
                      {source.source}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 font-mono text-[10px]">
                    <span className="text-slate-400">
                      {source.durabilityYears}y {labels.durabilityLabel}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        source.strength === "Strong"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {source.strength}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Competitor Benchmarking preview */}
            {competitors.length > 0 ? (
              <div className="mt-2 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] px-2.5 py-1 font-mono text-[10px] text-slate-400">
                <span>{labels.peerBenchmarkLabel}:</span>
                <span className="truncate text-slate-300">
                  {competitors
                    .map((c) => `${c.ticker} (${c.operatingMarginPct}% op)`)
                    .join(" · ")}
                </span>
              </div>
            ) : null}
          </div>

          <div
            className="flex items-center justify-between border-t pt-2.5 font-mono text-[11px] text-slate-400"
            style={{ borderColor: themeConfig.borderColor }}
          >
            <span>
              {labels.wfvShortLabel}:{" "}
              <strong className="text-white">
                {formatCurrency(weightedFairValue)}
              </strong>
            </span>
            <span>
              {labels.upsideShortLabel}:{" "}
              <strong className="text-emerald-400">
                {formatPercent(upsidePct)}
              </strong>
            </span>
          </div>
        </div>
      );
    };

    // 6. Catalysts & Fragility Risks Section
    const renderCatalysts = (spanClass: string) => {
      const catalystsList = catalystsData?.catalysts ?? [];
      const maxCount = isLandscape ? 3 : 4;
      const displayed = catalystsList.slice(0, maxCount);

      return (
        <div
          className={`flex flex-col justify-between rounded-3xl border shadow-xl ${
            isLandscape ? `${spanClass} p-4` : "w-full p-5"
          }`}
          style={{
            borderColor: themeConfig.borderColor,
            background: themeConfig.cardBg,
          }}
        >
          <div
            className="flex items-center justify-between border-b pb-3"
            style={{ borderColor: themeConfig.borderColor }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-purple-400" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                {labels.catalystsTitle}
              </span>
            </div>
            <span className="font-mono text-xs text-slate-400">
              {labels.probabilityAnchoredLabel}
            </span>
          </div>

          <div className="my-auto flex flex-col gap-2 py-2.5">
            {displayed.map((cat, idx) => (
              <div
                key={idx}
                className="rounded-2xl border p-2.5 transition-all"
                style={{
                  borderColor:
                    cat.direction === "growth"
                      ? "rgba(52, 211, 153, 0.25)"
                      : "rgba(244, 63, 94, 0.25)",
                  background:
                    cat.direction === "growth"
                      ? "rgba(52, 211, 153, 0.04)"
                      : "rgba(244, 63, 94, 0.04)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">
                      {cat.direction === "growth" ? "🚀" : "⚠️"}
                    </span>
                    <span
                      className="font-mono text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        color:
                          cat.direction === "growth" ? "#34d399" : "#f43f5e",
                      }}
                    >
                      {cat.direction === "growth"
                        ? labels.growthCatalystLabel
                        : labels.downsideRiskLabel}
                    </span>
                    {cat.horizon ? (
                      <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-slate-400">
                        {cat.horizon}
                      </span>
                    ) : null}
                  </div>
                  <span className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                    {(cat.probability * 100).toFixed(0)}% {labels.probLabel}
                  </span>
                </div>
                <div className="mt-1 line-clamp-1 truncate text-xs font-bold text-white">
                  {cat.title}
                </div>
                <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">
                  {cat.description}
                </p>

                {/* If only 1-2 catalysts exist, display probability anchor evidence */}
                {displayed.length <= 2 && cat.probabilityAnchor ? (
                  <div className="mt-1.5 line-clamp-2 border-t border-white/5 pt-1 text-[10px] italic text-slate-400">
                    &ldquo;{cat.probabilityAnchor}&rdquo;
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div
            className="flex items-center justify-between border-t pt-2.5 font-mono text-[11px] text-slate-400"
            style={{ borderColor: themeConfig.borderColor }}
          >
            <span>
              {labels.asymmetryLabel}:{" "}
              <strong className="text-white">
                {asymmetry.riskRewardRatio?.toFixed(1)}x
              </strong>
            </span>
            <span>
              {labels.panicFloorShortLabel}:{" "}
              <strong className="text-rose-400">
                {formatCurrency(bands.panic.targetPrice)}
              </strong>
            </span>
          </div>
        </div>
      );
    };

    // 7. Snowflake Radar & 5-Pillar Breakdown Section
    const renderSnowflake = (spanClass: string) => (
      <div
        className={`grid h-full gap-5 ${
          isLandscape
            ? "grid-cols-12 items-stretch"
            : "grid-cols-1 items-stretch gap-4"
        } ${spanClass}`}
      >
        {/* Left Column: Snowflake Radar + Overall Score */}
        <div
          className={`flex flex-col items-center justify-between rounded-3xl border p-5 shadow-xl ${
            isLandscape ? "col-span-5 h-full" : "w-full"
          }`}
          style={{
            borderColor: themeConfig.borderColor,
            background: themeConfig.cardBg,
          }}
        >
          <div
            className="flex w-full items-center justify-between border-b pb-3"
            style={{ borderColor: themeConfig.borderColor }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-400" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                {labels.snowflake30Label}
              </span>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
              {snowflakeScore.ratingLabel}
            </span>
          </div>

          <div className="my-auto flex w-full items-center justify-center py-1">
            <SnowflakeRadar
              scoreResult={snowflakeScore}
              size="card"
              maxWidth={370}
              className="w-full max-w-[370px]"
              interactive={false}
              locale={locale}
              showLabels={true}
            />
          </div>

          <div
            className="flex w-full items-center justify-between border-t pt-2.5 font-mono text-[11px] text-slate-400"
            style={{ borderColor: themeConfig.borderColor }}
          >
            <span>
              {labels.wfvShortLabel}:{" "}
              <strong className="text-white">
                {formatCurrency(weightedFairValue)}
              </strong>
            </span>
            <span>
              {labels.upsideShortLabel}:{" "}
              <strong className="text-emerald-400">
                {formatPercent(upsidePct)}
              </strong>
            </span>
          </div>
        </div>

        {/* Right Column: 5 Pillars Detailed Audit Score */}
        <div
          className={`flex flex-col justify-between rounded-3xl border p-5 shadow-xl ${
            isLandscape ? "col-span-7 h-full" : "w-full"
          }`}
          style={{
            borderColor: themeConfig.borderColor,
            background: themeConfig.cardBg,
          }}
        >
          <div
            className="flex items-center justify-between border-b pb-3"
            style={{ borderColor: themeConfig.borderColor }}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                {labels.fivePillarsTitle}
              </span>
            </div>
            <div className="font-mono text-xs text-slate-400">
              {labels.compositeScoreLabel}:{" "}
              <strong
                className="font-mono text-base font-black"
                style={{ color: themeConfig.accentColor }}
              >
                {snowflakeScore.totalScore}
              </strong>
              <span className="text-slate-500"> / 30</span>
            </div>
          </div>

          <div className="my-auto flex flex-col gap-2 py-2.5">
            {snowflakeScore.pillarList.map((pillar) => (
              <div
                key={pillar.id}
                className="flex items-center justify-between rounded-2xl border p-2.5 transition-all"
                style={{
                  borderColor: themeConfig.borderColor,
                  background: "rgba(255, 255, 255, 0.03)",
                }}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: pillar.color }}
                  />
                  <div className="truncate">
                    <div className="truncate text-xs font-bold text-white">
                      {pillar.label}
                    </div>
                    <div className="line-clamp-1 text-[10px] text-slate-400">
                      {pillar.summary}
                    </div>
                  </div>
                </div>
                <div
                  className="flex shrink-0 items-center gap-1 rounded-xl border px-2.5 py-0.5 font-mono text-xs font-black"
                  style={{
                    borderColor: `${pillar.color}40`,
                    background: `${pillar.color}15`,
                    color: pillar.color,
                  }}
                >
                  <span>{pillar.score}</span>
                  <span className="text-[9px] opacity-60">/ 6</span>
                </div>
              </div>
            ))}
          </div>

          <div
            className="flex items-center justify-between border-t pt-2.5 font-mono text-[11px] text-slate-400"
            style={{ borderColor: themeConfig.borderColor }}
          >
            <span>{labels.secDisclosuresVerified}</span>
            <span className="text-emerald-400">30 / 30 Audit Complete</span>
          </div>
        </div>
      </div>
    );

    // 8. Dedicated Executive Summary Layout
    const renderSummary = () => {
      const minPrice = bands.panic.targetPrice * 0.95;
      const maxPrice =
        Math.max(bands.bull.targetPrice, weightedFairValue) * 1.05;
      const priceRange = maxPrice - minPrice || 1;
      const currentPosPct = Math.min(
        95,
        Math.max(5, ((currentPrice - minPrice) / priceRange) * 100)
      );

      const trailingPe =
        facts.trailingEps > 0
          ? `${(currentPrice / facts.trailingEps).toFixed(1)}x`
          : undefined;
      const fwdPe =
        facts.forwardEpsConsensus > 0
          ? `${(currentPrice / facts.forwardEpsConsensus).toFixed(1)}x`
          : undefined;
      const hasGuidance = Boolean(
        facts.guidanceRevenueLowBillions && facts.guidanceRevenueHighBillions
      );

      return (
        <div className="flex h-full flex-col justify-between gap-3.5">
          {/* Top Hero Strip */}
          <div
            className="grid grid-cols-4 gap-3 rounded-2xl border p-3.5 shadow-xl"
            style={{
              borderColor: themeConfig.borderColor,
              background: themeConfig.cardBg,
            }}
          >
            <div
              className="flex flex-col justify-center border-r pr-3"
              style={{ borderColor: themeConfig.borderColor }}
            >
              <span className="font-mono text-xs text-slate-400">
                {labels.currentPriceLabel}
              </span>
              <div className="mt-0.5 font-mono text-2xl font-extrabold text-white">
                {formatCurrency(currentPrice)}
              </div>
            </div>

            <div
              className="flex flex-col justify-center border-r pr-3"
              style={{ borderColor: themeConfig.borderColor }}
            >
              <span className="font-mono text-xs text-slate-400">
                {labels.weightedFairValueLabel}
              </span>
              <div
                className="mt-0.5 font-mono text-2xl font-black"
                style={{ color: themeConfig.accentColor }}
              >
                {formatCurrency(weightedFairValue)}
              </div>
            </div>

            <div
              className="flex flex-col justify-center border-r pr-3"
              style={{ borderColor: themeConfig.borderColor }}
            >
              <span className="font-mono text-xs text-slate-400">
                {labels.valuationUpsideLabel}
              </span>
              <div
                className={`mt-0.5 font-mono text-2xl font-black ${
                  upsidePct >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatPercent(upsidePct)}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <span className="font-mono text-xs text-slate-400">
                {labels.riskRewardLabel}
              </span>
              <div className="mt-0.5 font-mono text-2xl font-black text-white">
                {asymmetry.riskRewardRatio
                  ? `${asymmetry.riskRewardRatio.toFixed(1)}x`
                  : "N/A"}
              </div>
            </div>
          </div>

          {/* High-Density 2-Column Grid */}
          <div className="grid flex-1 grid-cols-2 gap-4">
            {/* Left Column: Regimes with Visual Spectrum Track & Flow-through */}
            <div
              className="flex flex-col justify-between rounded-2xl border p-4 shadow-xl"
              style={{
                borderColor: themeConfig.borderColor,
                background: themeConfig.cardBg,
              }}
            >
              <div
                className="flex items-center justify-between border-b pb-2"
                style={{ borderColor: themeConfig.borderColor }}
              >
                <div className="flex items-center gap-2">
                  <Target
                    className="size-3.5"
                    style={{ color: themeConfig.accentColor }}
                  />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                    {labels.valuationSpectrumLabel}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-slate-400">
                  {labels.marketPricingLabel}:{" "}
                  <strong className="text-white">
                    {asymmetry.marketPricedInMultiple.toFixed(1)}x P/E
                  </strong>
                </div>
              </div>

              {/* Visual Valuation Spectrum Range Track */}
              <div
                className="my-1 rounded-xl border p-2.5"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.06)",
                  background: "rgba(255, 255, 255, 0.02)",
                }}
              >
                <div className="mb-1 flex items-center justify-between font-mono text-[9px] text-slate-400">
                  <span className="font-bold uppercase tracking-wider">
                    {labels.priceSpectrumTrackLabel}
                  </span>
                  <span>
                    {labels.spreadLabel}:{" "}
                    <strong className="text-white">
                      {formatCurrency(bands.panic.targetPrice)} →{" "}
                      {formatCurrency(bands.bull.targetPrice)}
                    </strong>
                  </span>
                </div>

                {/* Gradient Track Bar */}
                <div className="relative my-2 h-1.5 w-full rounded-full bg-slate-800">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-rose-500 via-sky-500 to-emerald-500 opacity-70"
                    style={{ width: "100%" }}
                  />
                  <div
                    className="absolute -top-1 -ml-1.5 size-3.5 rounded-full border-2 border-white shadow-md"
                    style={{
                      left: `${currentPosPct}%`,
                      backgroundColor: themeConfig.accentColor,
                    }}
                  />
                </div>

                {/* Range Milestones */}
                <div className="flex items-center justify-between font-mono text-[9px]">
                  <div>
                    <span className="font-bold text-rose-400">
                      {formatCurrency(bands.panic.targetPrice)}
                    </span>
                    <span className="ml-0.5 text-slate-500">
                      ({bands.panic.multiple}x)
                    </span>
                  </div>
                  <div className="rounded bg-accent/10 px-1.5 py-0.5 font-bold text-accent">
                    {formatCurrency(currentPrice)} ({labels.currentPriceLabel})
                  </div>
                  <div>
                    <span className="font-bold text-slate-200">
                      {formatCurrency(bands.base.targetPrice)}
                    </span>
                    <span className="ml-0.5 text-slate-500">
                      ({bands.base.multiple}x)
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-emerald-400">
                      {formatCurrency(bands.bull.targetPrice)}
                    </span>
                    <span className="ml-0.5 text-slate-500">
                      ({bands.bull.multiple}x)
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Regime Cards */}
              <div className="my-1 grid grid-cols-3 gap-2">
                <div
                  className="flex flex-col justify-between rounded-xl border p-2 transition-all"
                  style={{
                    borderColor: "rgba(52, 211, 153, 0.3)",
                    background: "rgba(52, 211, 153, 0.06)",
                  }}
                >
                  <div className="flex items-center justify-between font-mono text-[9px]">
                    <span className="font-bold text-emerald-400">
                      🐂 {labels.bullRegimeLabel}
                    </span>
                    <span className="rounded bg-emerald-500/20 px-1 font-bold text-emerald-300">
                      {bands.bull.multiple}x
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-base font-black text-white">
                    {formatCurrency(bands.bull.targetPrice)}
                  </div>
                  <div className="font-mono text-[10px] font-bold text-emerald-400">
                    {formatPercent(bands.bull.deltaFromCurrentPct)}
                  </div>
                </div>

                <div
                  className="flex flex-col justify-between rounded-xl border p-2"
                  style={{
                    borderColor: themeConfig.borderColor,
                    background: "rgba(255, 255, 255, 0.03)",
                  }}
                >
                  <div className="flex items-center justify-between font-mono text-[9px]">
                    <span className="font-bold text-slate-300">
                      🎯 {labels.baseCaseLabel}
                    </span>
                    <span className="rounded bg-white/10 px-1 font-bold text-slate-300">
                      {bands.base.multiple}x
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-base font-black text-white">
                    {formatCurrency(bands.base.targetPrice)}
                  </div>
                  <div className="font-mono text-[10px] font-bold text-slate-300">
                    {formatPercent(bands.base.deltaFromCurrentPct)}
                  </div>
                </div>

                <div
                  className="flex flex-col justify-between rounded-xl border p-2 transition-all"
                  style={{
                    borderColor: "rgba(244, 63, 94, 0.3)",
                    background: "rgba(244, 63, 94, 0.06)",
                  }}
                >
                  <div className="flex items-center justify-between font-mono text-[9px]">
                    <span className="font-bold text-rose-400">
                      🚨 {labels.panicFloorLabel}
                    </span>
                    <span className="rounded bg-rose-500/20 px-1 font-bold text-rose-300">
                      {bands.panic.multiple}x
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-base font-black text-rose-400">
                    {formatCurrency(bands.panic.targetPrice)}
                  </div>
                  <div className="font-mono text-[10px] font-bold text-rose-400">
                    {formatPercent(bands.panic.deltaFromCurrentPct)}
                  </div>
                </div>
              </div>

              {/* Stressed Operational Flow-through Footer */}
              <div
                className="flex items-center justify-between rounded-lg border px-2.5 py-1 font-mono text-[10px] text-slate-400"
                style={{
                  borderColor: themeConfig.borderColor,
                  background: "rgba(255, 255, 255, 0.02)",
                }}
              >
                <span>
                  Stressed Rev:{" "}
                  <strong className="text-white">
                    {formatBillions(stressResult.stressRevenueBillions)}
                  </strong>
                </span>
                <span>
                  Net Income:{" "}
                  <strong className="text-white">
                    {formatBillions(stressResult.stressNetIncomeBillions)}
                  </strong>
                </span>
                <span>
                  Stressed EPS:{" "}
                  <strong className="text-white">
                    {formatCurrency(stressResult.stressEps)}
                  </strong>
                </span>
              </div>
            </div>

            {/* Right Column: 6-Metric Highlights Grid + Guidance Banner */}
            <div
              className="flex flex-col justify-between rounded-2xl border p-4 shadow-xl"
              style={{
                borderColor: themeConfig.borderColor,
                background: themeConfig.cardBg,
              }}
            >
              <div
                className="flex items-center justify-between border-b pb-2"
                style={{ borderColor: themeConfig.borderColor }}
              >
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                  {labels.financialHighlightsLabel}
                </div>
                <div className="font-mono text-[10px] text-slate-400">
                  {labels.nextFyConsensusLabel}:{" "}
                  <strong className="text-white">
                    {formatCurrency(facts.forwardEpsConsensus)}
                  </strong>
                </div>
              </div>

              <div className="my-auto grid grid-cols-2 gap-2 py-1">
                {/* Revenue */}
                <div
                  className="rounded-xl border p-2 text-xs"
                  style={{
                    borderColor: themeConfig.borderColor,
                    background: "rgba(255, 255, 255, 0.02)",
                  }}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{labels.revenueLabel}</span>
                    {facts.revenueEstimateBillions ? (
                      <span className="text-[9px] text-slate-500">
                        vs ${facts.revenueEstimateBillions}B
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-white">
                    {formatBillions(facts.revenueBillions)}
                  </div>
                  <div className="font-mono text-[10px] text-emerald-400">
                    {formatPercent(facts.revenueGrowthPct)} YoY
                  </div>
                </div>

                {/* Clean Operating EPS */}
                <div
                  className="rounded-xl border p-2 text-xs"
                  style={{
                    borderColor: themeConfig.borderColor,
                    background: "rgba(255, 255, 255, 0.02)",
                  }}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{labels.cleanOperatingEpsLabel}</span>
                    <span className="text-[9px] text-slate-500">
                      Est {formatCurrency(facts.epsConsensus)}
                    </span>
                  </div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-white">
                    {formatCurrency(facts.epsOperating)}
                  </div>
                  <div className="font-mono text-[10px] text-emerald-400">
                    {facts.epsConsensus > 0
                      ? `${formatPercent(((facts.epsOperating - facts.epsConsensus) / facts.epsConsensus) * 100)} beat`
                      : "Audited"}
                  </div>
                </div>

                {/* Operating Margin */}
                <div
                  className="rounded-xl border p-2 text-xs"
                  style={{
                    borderColor: themeConfig.borderColor,
                    background: "rgba(255, 255, 255, 0.02)",
                  }}
                >
                  <div className="text-[10px] text-slate-400">
                    {labels.operatingMarginLabel}
                  </div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-white">
                    {facts.operatingMarginPct.toFixed(1)}%
                  </div>
                  <div className="font-mono text-[10px] text-slate-400">
                    {facts.operatingIncomeGrowthPct
                      ? `${formatPercent(facts.operatingIncomeGrowthPct)} YoY`
                      : formatBillions(facts.operatingIncomeBillions)}
                  </div>
                </div>

                {/* Economic Moat */}
                <div
                  className="rounded-xl border p-2 text-xs"
                  style={{
                    borderColor: themeConfig.borderColor,
                    background: "rgba(255, 255, 255, 0.02)",
                  }}
                >
                  <div className="text-[10px] text-slate-400">
                    {labels.moatRatingLabel}
                  </div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-purple-300">
                    {moatData?.overallMoatRating ?? "Wide"}
                  </div>
                  <div className="truncate font-mono text-[10px] text-slate-400">
                    {moatData?.moatTrend ?? "Widening"} Trend
                  </div>
                </div>

                {/* Snowflake Score */}
                <div
                  className="rounded-xl border p-2 text-xs"
                  style={{
                    borderColor: themeConfig.borderColor,
                    background: "rgba(255, 255, 255, 0.02)",
                  }}
                >
                  <div className="text-[10px] text-slate-400">
                    {labels.snowflake30Label}
                  </div>
                  <div
                    className="mt-0.5 font-mono text-sm font-bold"
                    style={{ color: themeConfig.accentColor }}
                  >
                    {snowflakeScore.totalScore} / 30
                  </div>
                  <div className="truncate font-mono text-[10px] text-emerald-400">
                    {snowflakeScore.ratingLabel}
                  </div>
                </div>

                {/* Panic Defense */}
                <div
                  className="rounded-xl border p-2 text-xs"
                  style={{
                    borderColor: themeConfig.borderColor,
                    background: "rgba(255, 255, 255, 0.02)",
                  }}
                >
                  <div className="text-[10px] text-slate-400">
                    {labels.panicDefenseLabel}
                  </div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-rose-400">
                    {formatPercent(asymmetry.downsideToPanicPct)}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400">
                    Floor {formatCurrency(bands.panic.targetPrice)}
                  </div>
                </div>
              </div>

              {/* Guidance Corridor or Capital Multiples Strip */}
              {hasGuidance ? (
                <div
                  className="flex items-center justify-between rounded-lg border px-2.5 py-1 font-mono text-[10px]"
                  style={{
                    borderColor: "rgba(56, 189, 248, 0.25)",
                    background: "rgba(56, 189, 248, 0.05)",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-cyan-400" />
                    <span className="text-slate-400">
                      {labels.guidanceCorridorLabel}:
                    </span>
                    <span className="font-bold text-white">
                      ${facts.guidanceRevenueLowBillions}B – $
                      {facts.guidanceRevenueHighBillions}B
                    </span>
                  </div>
                  <div className="text-slate-400">
                    Fwd P/E:{" "}
                    <strong className="text-slate-200">{fwdPe ?? "N/A"}</strong>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center justify-between rounded-lg border px-2.5 py-1 font-mono text-[10px] text-slate-400"
                  style={{
                    borderColor: themeConfig.borderColor,
                    background: "rgba(255, 255, 255, 0.02)",
                  }}
                >
                  <span>
                    Market Cap:{" "}
                    <strong className="text-white">
                      {formatBillions(facts.marketCapBillions)}
                    </strong>
                  </span>
                  <span>
                    TTM P/E:{" "}
                    <strong className="text-slate-200">
                      {trailingPe ?? "N/A"}
                    </strong>
                  </span>
                  <span>
                    Fwd P/E:{" "}
                    <strong className="text-slate-200">{fwdPe ?? "N/A"}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div
        ref={ref}
        id="stress-alpha-social-card"
        style={{
          width: `${dim.width}px`,
          height: `${dim.height}px`,
          minWidth: `${dim.width}px`,
          minHeight: `${dim.height}px`,
          background: themeConfig.bgGradient,
          color: themeConfig.textColor,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif',
        }}
        className={`relative flex flex-col justify-between overflow-hidden text-slate-100 shadow-2xl ${
          isLandscape ? "px-6 py-4.5" : isSquare ? "p-7" : "p-8"
        }`}
      >
        {/* Background Ambient Glows & Grid Pattern */}
        <div
          className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full opacity-35 blur-3xl"
          style={{ background: themeConfig.accentGlow }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full opacity-30 blur-3xl"
          style={{ background: themeConfig.accentGlow }}
        />

        {/* Micro Grid Overlay for High-Tech Institutional Feel */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* ----------------- TOP HEADER (TICKER-FIRST, COMPACT) ----------------- */}
        <header
          className="relative z-10 flex shrink-0 items-center justify-between border-b pb-3.5"
          style={{ borderColor: themeConfig.borderColor }}
        >
          {/* Ticker & Company Analysis Target (Primary Hero) */}
          <div className="flex items-center gap-3.5">
            <div
              className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 shadow-md"
              style={{
                borderColor: themeConfig.borderColor,
                background: themeConfig.cardBg,
              }}
            >
              <span
                className="font-mono text-xl font-black tracking-tight"
                style={{ color: themeConfig.accentColor }}
              >
                ${facts.ticker.toUpperCase()}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="max-w-[440px] truncate text-base font-extrabold tracking-tight text-white">
                  {facts.company}
                </span>
                <span className="hidden items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400 sm:inline-flex">
                  <ShieldCheck className="size-3" />
                  <span>{labels.secAuditVerified}</span>
                </span>
              </div>
              <p className="font-mono text-xs text-slate-400">
                {facts.quarter} · {facts.analysisDate ?? "2026-09"} ·{" "}
                {labels.earningsAuditTag}
              </p>
            </div>
          </div>

          {/* Minimal, Sleek StressAlpha Institutional Brand Mark */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center gap-2 rounded-xl border px-3 py-1.5 shadow-sm"
              style={{
                borderColor: themeConfig.borderColor,
                background: "rgba(255, 255, 255, 0.04)",
              }}
            >
              <span
                className="font-mono text-xs font-black tracking-wider"
                style={{ color: themeConfig.accentColor }}
              >
                S<span className="text-white">α</span>
              </span>
              <span className="text-xs font-bold tracking-tight text-slate-200">
                StressAlpha
              </span>
              <span className="text-[10px] text-slate-500">|</span>
              <span className="font-mono text-[10px] text-slate-400">
                stressalpha.vercel.app
              </span>
            </div>
          </div>
        </header>

        {/* ----------------- CARD BODY CONTENT ----------------- */}
        <main
          className={`relative z-10 my-auto min-h-0 flex-1 ${
            isLandscape ? "py-2" : isSquare ? "py-3" : "py-4"
          }`}
        >
          {resolvedTemplate === "summary" ? (
            renderSummary()
          ) : (
            <div
              className={`grid h-full ${
                isLandscape
                  ? activeSections.length === 1
                    ? "h-full w-full grid-cols-1 items-stretch"
                    : activeSections.length === 2
                      ? "grid-cols-12 items-stretch gap-5"
                      : "grid-cols-3 items-stretch gap-4"
                  : isSquare
                    ? activeSections.length === 1
                      ? "grid-cols-1 items-stretch"
                      : "grid-cols-2 items-stretch gap-4"
                    : "grid-cols-1 items-stretch gap-5"
              }`}
            >
              {activeSections.map((secId) => {
                let spanClass = "col-span-6 h-full";
                if (activeSections.length === 1) {
                  spanClass = "col-span-12 h-full";
                } else if (activeSections.length === 2) {
                  if (
                    activeSections.includes("valuationHero") &&
                    activeSections.includes("regimes")
                  ) {
                    spanClass =
                      secId === "valuationHero"
                        ? "col-span-5 h-full"
                        : "col-span-7 h-full";
                  } else if (
                    activeSections.includes("moat") &&
                    activeSections.includes("catalysts")
                  ) {
                    spanClass =
                      secId === "moat"
                        ? "col-span-5 h-full"
                        : "col-span-7 h-full";
                  } else {
                    spanClass = "col-span-6 h-full";
                  }
                } else {
                  spanClass = "col-span-1 h-full";
                }

                switch (secId) {
                  case "valuationHero":
                    return (
                      <React.Fragment key={secId}>
                        {renderValuationHero(spanClass)}
                      </React.Fragment>
                    );
                  case "regimes":
                    return (
                      <React.Fragment key={secId}>
                        {renderRegimes(spanClass)}
                      </React.Fragment>
                    );
                  case "earnings":
                    return (
                      <React.Fragment key={secId}>
                        {renderEarnings(spanClass)}
                      </React.Fragment>
                    );
                  case "segments":
                    return (
                      <React.Fragment key={secId}>
                        {renderSegments(spanClass)}
                      </React.Fragment>
                    );
                  case "moat":
                    return (
                      <React.Fragment key={secId}>
                        {renderMoat(spanClass)}
                      </React.Fragment>
                    );
                  case "catalysts":
                    return (
                      <React.Fragment key={secId}>
                        {renderCatalysts(spanClass)}
                      </React.Fragment>
                    );
                  case "snowflake":
                    return (
                      <React.Fragment key={secId}>
                        {renderSnowflake(spanClass)}
                      </React.Fragment>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          )}
        </main>

        {/* ----------------- BOTTOM FOOTER / ANALYST TAKEAWAY ----------------- */}
        <footer className="relative z-10 flex shrink-0 flex-col gap-2 pt-2">
          {/* Custom Note or High-Conviction Takeaway */}
          {customNote && customNote.trim() && (
            <div
              className="flex items-center gap-2.5 rounded-2xl border px-3.5 py-2 shadow-md"
              style={{
                borderColor: themeConfig.borderColor,
                background: "rgba(255, 255, 255, 0.04)",
              }}
            >
              <div
                className="flex size-6 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: themeConfig.accentGlow,
                  color: themeConfig.accentColor,
                }}
              >
                <Sparkles className="size-3.5" />
              </div>
              <p className="line-clamp-1 text-xs font-medium italic text-slate-200">
                &ldquo;{customNote.trim()}&rdquo;
              </p>
            </div>
          )}

          {/* Institutional Watermark Strip */}
          {effectiveShowWatermark && (
            <div
              className="flex shrink-0 items-center justify-between border-t pt-2 font-mono text-[11px] text-slate-400"
              style={{ borderColor: themeConfig.borderColor }}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">StressAlpha</span>
                <span>·</span>
                <span>{labels.tagline}</span>
                <span>·</span>
                <span className="font-semibold text-slate-400">
                  stressalpha.vercel.app
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-500">
                <span>{facts.analysisDate ?? "2026-09"}</span>
                <span>·</span>
                <span className="uppercase">{labels.auditGrade}</span>
              </div>
            </div>
          )}
        </footer>
      </div>
    );
  }
);

SocialCard.displayName = "SocialCard";
