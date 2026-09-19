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

    // Maintain canonical display and layout ordering for consistent visual hierarchy
    const activeSections: CardSection[] = CARD_SECTIONS.filter((sec) =>
      rawActiveSections.includes(sec)
    );

    const resolvedTemplate =
      findMatchingPreset(activeSections) ??
      (template !== "custom" ? (template as CardTemplate) : undefined);

    // 1. Valuation Hero Section (Current Price vs Weighted Fair Value + Asymmetry)
    const renderValuationHero = (spanClass: string) => (
      <div
        className={`flex flex-col justify-between rounded-3xl border p-6 shadow-xl ${
          aspectRatio === "landscape" ? spanClass : "w-full"
        }`}
        style={{
          borderColor: themeConfig.borderColor,
          background: themeConfig.cardBg,
        }}
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
              {labels.currentPriceLabel}
            </span>
            <span className="font-mono text-xs text-slate-400">
              {facts.analysisDate ?? "2026-09"}
            </span>
          </div>
          <div className="mt-1 font-mono text-4xl font-extrabold tracking-tight text-white">
            {formatCurrency(currentPrice)}
          </div>

          <div
            className="my-5 h-px w-full"
            style={{ background: themeConfig.borderColor }}
          />

          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
              {labels.weightedFairValueLabel}
            </span>
            <div
              className={`flex items-center gap-1 rounded-full px-3 py-1 font-mono text-xs font-extrabold shadow-md ${
                upsidePct >= 0
                  ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                  : "border border-rose-500/40 bg-rose-500/20 text-rose-400"
              }`}
            >
              <TrendingUp className="size-3.5" />
              <span>
                {formatPercent(upsidePct)}{" "}
                {upsidePct >= 0
                  ? isZh
                    ? "空间"
                    : "UPSIDE"
                  : isZh
                    ? "折价"
                    : "DOWNSIDE"}
              </span>
            </div>
          </div>
          <div
            className="mt-1 font-mono text-5xl font-black tracking-tight"
            style={{ color: upsidePct >= 0 ? "#10b981" : "#f43f5e" }}
          >
            {formatCurrency(weightedFairValue)}
          </div>
        </div>

        {/* Asymmetry Metrics & Stress indicator */}
        <div className="mt-6 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 font-mono">
            <div
              className="rounded-2xl border p-3"
              style={{
                borderColor: "rgba(255, 255, 255, 0.08)",
                background: "rgba(255, 255, 255, 0.03)",
              }}
            >
              <span className="text-[11px] uppercase tracking-wider text-slate-400">
                {labels.riskRewardLabel}
              </span>
              <div
                className="mt-0.5 text-xl font-extrabold text-accent"
                style={{ color: themeConfig.accentColor }}
              >
                {asymmetry.riskRewardRatio
                  ? `${asymmetry.riskRewardRatio.toFixed(1)}x`
                  : "N/A"}
              </div>
            </div>
            <div
              className="rounded-2xl border p-3"
              style={{
                borderColor: "rgba(255, 255, 255, 0.08)",
                background: "rgba(255, 255, 255, 0.03)",
              }}
            >
              <span className="text-[11px] uppercase tracking-wider text-slate-400">
                {labels.panicDefenseLabel}
              </span>
              <div className="mt-0.5 text-xl font-extrabold text-rose-400">
                {formatPercent(asymmetry.downsideToPanicPct)}
              </div>
            </div>
          </div>

          {/* Stress Scenario Badge */}
          <div
            className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold"
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
            <Zap className="size-3.5 shrink-0" />
            <span className="truncate">
              {hasActiveStress
                ? isZh
                  ? "已启用当前自定义极端承压参数"
                  : "Live Stressed Scenario Applied"
                : isZh
                  ? "基准无损中性宏观假设 (0% 冲击)"
                  : "Baseline Macro Neutral Model (0% Shocks)"}
            </span>
          </div>
        </div>
      </div>
    );

    // 2. Valuation Regimes Spectrum Section
    const renderRegimes = (spanClass: string) => (
      <div
        className={`flex flex-col justify-between rounded-3xl border p-6 shadow-xl ${
          aspectRatio === "landscape" ? spanClass : "w-full"
        }`}
        style={{
          borderColor: themeConfig.borderColor,
          background: themeConfig.cardBg,
        }}
      >
        <div
          className="flex items-center justify-between border-b pb-4"
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

        {/* 3 Regime Cards */}
        <div className="my-auto grid grid-cols-3 gap-3 py-4">
          {/* Bull */}
          <div
            className="flex flex-col justify-between rounded-2xl border p-3.5 transition-all"
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
              <div className="mt-2 text-xs font-bold text-white">
                {labels.bullRegimeLabel}
              </div>
              <div className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">
                {isZh ? "多重估值扩张与高增速" : "Multiple Expansion"}
              </div>
            </div>
            <div className="mt-4">
              <div className="font-mono text-xl font-black text-emerald-400">
                {formatCurrency(bands.bull.targetPrice)}
              </div>
              <div className="font-mono text-[11px] font-bold text-emerald-500">
                +{formatPercent(bands.bull.deltaFromCurrentPct)}
              </div>
            </div>
          </div>

          {/* Base */}
          <div
            className="flex flex-col justify-between rounded-2xl border p-3.5 transition-all"
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
              <div className="mt-2 text-xs font-bold text-white">
                {labels.baseCaseLabel}
              </div>
              <div className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">
                {isZh ? "官方指引中值常态兑现" : "Guidance Midpoint"}
              </div>
            </div>
            <div className="mt-4">
              <div className="font-mono text-xl font-black text-white">
                {formatCurrency(bands.base.targetPrice)}
              </div>
              <div className="font-mono text-[11px] font-bold text-slate-400">
                +{formatPercent(bands.base.deltaFromCurrentPct)}
              </div>
            </div>
          </div>

          {/* Panic */}
          <div
            className="flex flex-col justify-between rounded-2xl border p-3.5 transition-all"
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
              <div className="mt-2 text-xs font-bold text-white">
                {labels.panicFloorLabel}
              </div>
              <div className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">
                {isZh ? "极端恐慌去杠杆与挤压" : "Liquidity Defense Floor"}
              </div>
            </div>
            <div className="mt-4">
              <div className="font-mono text-xl font-black text-rose-400">
                {formatCurrency(bands.panic.targetPrice)}
              </div>
              <div className="font-mono text-[11px] font-bold text-rose-500">
                {formatPercent(bands.panic.deltaFromCurrentPct)}
              </div>
            </div>
          </div>
        </div>

        {/* Stressed Baseline Factlets Strip */}
        <div
          className="flex items-center justify-between border-t pt-3 font-mono text-[11px] text-slate-400"
          style={{ borderColor: themeConfig.borderColor }}
        >
          <span>
            {labels.stressedFwdEpsLabel}:{" "}
            <strong className="text-white">
              {formatCurrency(stressResult.stressEps)}
            </strong>
          </span>
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
        </div>
      </div>
    );

    // 3. Earnings Scorecard Section
    const renderEarnings = (spanClass: string) => (
      <div
        className={`flex flex-col justify-between rounded-3xl border p-6 shadow-xl ${
          aspectRatio === "landscape" ? spanClass : "w-full"
        }`}
        style={{
          borderColor: themeConfig.borderColor,
          background: themeConfig.cardBg,
        }}
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
              {isZh ? "季度核心业绩概览" : "QUARTERLY OPERATIONAL RESULTS"}
            </span>
            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
              {labels.earningsBeatLabel}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div
              className="rounded-2xl border p-3.5"
              style={{
                borderColor: themeConfig.borderColor,
                background: "rgba(255, 255, 255, 0.03)",
              }}
            >
              <span className="font-mono text-[10px] uppercase text-slate-400">
                {labels.revenueLabel}
              </span>
              <div className="mt-1 font-mono text-2xl font-extrabold text-white">
                {formatBillions(facts.revenueBillions)}
              </div>
              <div className="mt-0.5 font-mono text-xs font-bold text-emerald-400">
                +{formatPercent(facts.revenueGrowthPct)} YoY
              </div>
            </div>

            <div
              className="rounded-2xl border p-3.5"
              style={{
                borderColor: themeConfig.borderColor,
                background: "rgba(255, 255, 255, 0.03)",
              }}
            >
              <span className="font-mono text-[10px] uppercase text-slate-400">
                {labels.operatingIncomeLabel}
              </span>
              <div className="mt-1 font-mono text-2xl font-extrabold text-white">
                {formatBillions(facts.operatingIncomeBillions)}
              </div>
              <div className="mt-0.5 font-mono text-xs font-bold text-emerald-400">
                {facts.operatingMarginPct.toFixed(1)}%{" "}
                {isZh ? "利润率" : "Margin"}
              </div>
            </div>
          </div>
        </div>

        <div
          className="my-3 rounded-2xl border p-4"
          style={{
            borderColor: "rgba(16, 185, 129, 0.3)",
            background: "rgba(16, 185, 129, 0.05)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-slate-300">
              {labels.cleanOperatingEpsLabel}
            </span>
            <span className="font-mono text-xs text-slate-400">
              {labels.consensusLabel}: {formatCurrency(facts.epsConsensus)}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-mono text-4xl font-black text-white">
              {formatCurrency(facts.epsOperating)}
            </span>
            {facts.epsConsensus > 0 && (
              <span className="font-mono text-sm font-extrabold text-emerald-400">
                +
                {formatPercent(
                  ((facts.epsOperating - facts.epsConsensus) /
                    facts.epsConsensus) *
                    100
                )}{" "}
                {labels.beatLabel}
              </span>
            )}
          </div>
          {facts.oneTimeItems && facts.oneTimeItems.length > 0 && (
            <div className="mt-2 text-[11px] text-slate-400">
              <span className="font-semibold text-emerald-400">
                {labels.incomeQualityFilterLabel}:
              </span>{" "}
              {facts.oneTimeItems[0].description} (
              {formatBillions(facts.oneTimeItems[0].amountBillions)})
            </div>
          )}
        </div>

        <div
          className="flex items-center justify-between border-t pt-3 font-mono text-[11px] text-slate-400"
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

    // 4. Segment Revenue Dynamics Section
    const renderSegments = (spanClass: string) => (
      <div
        className={`flex flex-col justify-between rounded-3xl border p-6 shadow-xl ${
          aspectRatio === "landscape" ? spanClass : "w-full"
        }`}
        style={{
          borderColor: themeConfig.borderColor,
          background: themeConfig.cardBg,
        }}
      >
        <div
          className="flex items-center justify-between border-b pb-4"
          style={{ borderColor: themeConfig.borderColor }}
        >
          <div className="flex items-center gap-2">
            <BarChart3
              className="size-4"
              style={{ color: themeConfig.accentColor }}
            />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              {isZh ? "核心业务分部营收全景" : "SEGMENT REVENUE DYNAMICS"}
            </span>
          </div>
          <span className="font-mono text-xs text-slate-400">
            {facts.segments.length} {labels.segmentsLabel}
          </span>
        </div>

        <div className="my-auto flex flex-col gap-3 py-3">
          {facts.segments.slice(0, 4).map((seg) => {
            const share =
              facts.revenueBillions > 0
                ? (seg.revenueBillions / facts.revenueBillions) * 100
                : 0;
            return (
              <div
                key={seg.name}
                className="rounded-2xl border p-3.5"
                style={{
                  borderColor: themeConfig.borderColor,
                  background: "rgba(255, 255, 255, 0.03)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    {seg.name}
                  </span>
                  <span className="font-mono text-xs font-black text-white">
                    {formatBillions(seg.revenueBillions)}
                  </span>
                </div>

                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(0, share))}%`,
                      background: themeConfig.accentColor,
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-slate-400">
                  <span>
                    {share.toFixed(1)}% {labels.ofTotalRevenueLabel}
                  </span>
                  <span className="font-bold text-emerald-400">
                    +{formatPercent(seg.growthPct)} YoY
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="flex items-center justify-between border-t pt-3 font-mono text-[11px] text-slate-400"
          style={{ borderColor: themeConfig.borderColor }}
        >
          <span>
            {labels.valuationUpsideLabel}:{" "}
            <strong className="text-emerald-400">
              +{formatPercent(upsidePct)}
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

    // 5. Economic Moat Section
    const renderMoat = (spanClass: string) => (
      <div
        className={`flex flex-col justify-between rounded-3xl border p-6 shadow-xl ${
          aspectRatio === "landscape" ? spanClass : "w-full"
        }`}
        style={{
          borderColor: themeConfig.borderColor,
          background: themeConfig.cardBg,
        }}
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
              {isZh ? "竞争优势与护城河壁垒" : "COMPETITIVE ADVANTAGE"}
            </span>
            <span className="rounded-md border border-purple-500/30 bg-purple-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-300">
              {moatData?.overallMoatRating ?? "Wide"} Moat
            </span>
          </div>

          <div
            className="mt-4 flex items-center gap-3.5 rounded-2xl border p-4"
            style={{
              borderColor: themeConfig.borderColor,
              background: "rgba(255, 255, 255, 0.03)",
            }}
          >
            <div className="flex size-10 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400">
              <Award className="size-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {moatData?.overallMoatRating ?? "Wide"} {labels.moatRatingLabel}
              </div>
              <div className="font-mono text-xs text-slate-400">
                {isZh ? "护城河趋势" : "Moat Trend"}:{" "}
                <strong className="text-purple-300">
                  {moatData?.moatTrend ?? "Widening"}
                </strong>
              </div>
            </div>
          </div>

          {/* Moat Sources */}
          <div className="mt-3 flex flex-col gap-2">
            {moatData?.moatSources?.slice(0, 3).map((source) => (
              <div
                key={source.source}
                className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs"
                style={{
                  borderColor: themeConfig.borderColor,
                  background: "rgba(255, 255, 255, 0.02)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-purple-400" />
                  <span className="font-semibold text-slate-200">
                    {source.source}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">
                  {source.durabilityYears}y {isZh ? "壁垒" : "durability"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex items-center justify-between border-t pt-3 font-mono text-[11px] text-slate-400"
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
              +{formatPercent(upsidePct)}
            </strong>
          </span>
        </div>
      </div>
    );

    // 6. Catalysts & Fragility Risks Section
    const renderCatalysts = (spanClass: string) => (
      <div
        className={`flex flex-col justify-between rounded-3xl border p-6 shadow-xl ${
          aspectRatio === "landscape" ? spanClass : "w-full"
        }`}
        style={{
          borderColor: themeConfig.borderColor,
          background: themeConfig.cardBg,
        }}
      >
        <div
          className="flex items-center justify-between border-b pb-4"
          style={{ borderColor: themeConfig.borderColor }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-purple-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              {isZh
                ? "核心催化剂与脆弱性风险"
                : "KEY CATALYSTS & FRAGILITY RISKS"}
            </span>
          </div>
          <span className="font-mono text-xs text-slate-400">
            {isZh ? "发生概率加权" : "Probability Anchored"}
          </span>
        </div>

        <div className="my-auto flex flex-col gap-2.5 py-3">
          {catalystsData?.catalysts?.slice(0, 4).map((cat, idx) => (
            <div
              key={idx}
              className="rounded-2xl border p-3 transition-all"
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
                <div className="flex items-center gap-2">
                  <span className="text-xs">
                    {cat.direction === "growth" ? "🚀" : "⚠️"}
                  </span>
                  <span
                    className="font-mono text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      color: cat.direction === "growth" ? "#34d399" : "#f43f5e",
                    }}
                  >
                    {cat.direction === "growth"
                      ? isZh
                        ? "成长催化"
                        : "GROWTH CATALYST"
                      : isZh
                        ? "下行风险"
                        : "DOWNSIDE RISK"}
                  </span>
                </div>
                <span className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                  {(cat.probability * 100).toFixed(0)}% {labels.probLabel}
                </span>
              </div>
              <div className="mt-1 line-clamp-1 text-xs font-bold text-white">
                {cat.title}
              </div>
              <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">
                {cat.description}
              </p>
            </div>
          ))}
        </div>

        <div
          className="flex items-center justify-between border-t pt-3 font-mono text-[11px] text-slate-400"
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

    // 7. Snowflake Radar & 5-Pillar Breakdown Section
    const renderSnowflake = (spanClass: string) => (
      <div
        className={`grid h-full gap-6 ${
          aspectRatio === "landscape"
            ? "grid-cols-12 items-center"
            : "grid-cols-1 items-center gap-5"
        } ${spanClass}`}
      >
        {/* Left Column: Snowflake Radar + Overall Score */}
        <div
          className={`flex flex-col items-center justify-between rounded-3xl border p-6 shadow-xl ${
            aspectRatio === "landscape" ? "col-span-5 h-full" : "w-full"
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

          <div className="my-auto flex items-center justify-center py-2">
            <SnowflakeRadar
              scoreResult={snowflakeScore}
              size={aspectRatio === "landscape" ? "md" : "sm"}
              interactive={false}
              locale={locale}
              showLabels={true}
            />
          </div>

          <div
            className="flex w-full items-center justify-between border-t pt-3 font-mono text-[11px] text-slate-400"
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
                +{formatPercent(upsidePct)}
              </strong>
            </span>
          </div>
        </div>

        {/* Right Column: 5 Pillars Detailed Audit Score */}
        <div
          className={`flex flex-col justify-between rounded-3xl border p-6 shadow-xl ${
            aspectRatio === "landscape" ? "col-span-7 h-full" : "w-full"
          }`}
          style={{
            borderColor: themeConfig.borderColor,
            background: themeConfig.cardBg,
          }}
        >
          <div
            className="flex items-center justify-between border-b pb-4"
            style={{ borderColor: themeConfig.borderColor }}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                {isZh ? "五维核心支柱审计得分" : "5-PILLAR INSTITUTIONAL AUDIT"}
              </span>
            </div>
            <div className="font-mono text-xs text-slate-400">
              {isZh ? "综合得分" : "Composite Score"}:{" "}
              <strong className="font-mono text-lg font-black text-accent">
                {snowflakeScore.totalScore}
              </strong>
              <span className="text-slate-500"> / 30</span>
            </div>
          </div>

          <div className="my-auto flex flex-col gap-2.5 py-3">
            {snowflakeScore.pillarList.map((pillar) => (
              <div
                key={pillar.id}
                className="flex items-center justify-between rounded-2xl border p-3 transition-all"
                style={{
                  borderColor: themeConfig.borderColor,
                  background: "rgba(255, 255, 255, 0.03)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="size-3 rounded-full"
                    style={{ background: pillar.color }}
                  />
                  <div>
                    <div className="text-xs font-bold text-white">
                      {pillar.label}
                    </div>
                    <div className="line-clamp-1 text-[10px] text-slate-400">
                      {pillar.summary}
                    </div>
                  </div>
                </div>
                <div
                  className="flex items-center gap-1 rounded-xl border px-3 py-1 font-mono text-sm font-black"
                  style={{
                    borderColor: `${pillar.color}40`,
                    background: `${pillar.color}15`,
                    color: pillar.color,
                  }}
                >
                  <span>{pillar.score}</span>
                  <span className="text-[10px] opacity-60">/ 6</span>
                </div>
              </div>
            ))}
          </div>

          <div
            className="flex items-center justify-between border-t pt-3 font-mono text-[11px] text-slate-400"
            style={{ borderColor: themeConfig.borderColor }}
          >
            <span>{labels.secDisclosuresVerified}</span>
            <span className="text-emerald-400">30 / 30 Audit Complete</span>
          </div>
        </div>
      </div>
    );

    // 8. Dedicated Executive Summary Layout
    const renderSummary = () => (
      <div className="flex h-full flex-col justify-between gap-5">
        {/* Top Hero Strip */}
        <div
          className="grid grid-cols-4 gap-4 rounded-3xl border p-5 shadow-xl"
          style={{
            borderColor: themeConfig.borderColor,
            background: themeConfig.cardBg,
          }}
        >
          <div
            className="flex flex-col justify-center border-r pr-4"
            style={{ borderColor: themeConfig.borderColor }}
          >
            <span className="font-mono text-xs text-slate-400">
              {labels.currentPriceLabel}
            </span>
            <div className="mt-1 font-mono text-3xl font-extrabold text-white">
              {formatCurrency(currentPrice)}
            </div>
          </div>

          <div
            className="flex flex-col justify-center border-r pr-4"
            style={{ borderColor: themeConfig.borderColor }}
          >
            <span className="font-mono text-xs text-slate-400">
              {labels.weightedFairValueLabel}
            </span>
            <div
              className="mt-1 font-mono text-3xl font-black"
              style={{ color: themeConfig.accentColor }}
            >
              {formatCurrency(weightedFairValue)}
            </div>
          </div>

          <div
            className="flex flex-col justify-center border-r pr-4"
            style={{ borderColor: themeConfig.borderColor }}
          >
            <span className="font-mono text-xs text-slate-400">
              {labels.valuationUpsideLabel}
            </span>
            <div
              className={`mt-1 font-mono text-3xl font-black ${
                upsidePct >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              +{formatPercent(upsidePct)}
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <span className="font-mono text-xs text-slate-400">
              {labels.riskRewardLabel}
            </span>
            <div className="mt-1 font-mono text-3xl font-black text-white">
              {asymmetry.riskRewardRatio
                ? `${asymmetry.riskRewardRatio.toFixed(1)}x`
                : "N/A"}
            </div>
          </div>
        </div>

        {/* High-Density 2-Column Grid */}
        <div className="grid flex-1 grid-cols-2 gap-5">
          {/* Left Column: Regimes */}
          <div
            className="flex flex-col justify-between rounded-3xl border p-5 shadow-xl"
            style={{
              borderColor: themeConfig.borderColor,
              background: themeConfig.cardBg,
            }}
          >
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
              {labels.valuationSpectrumLabel}
            </div>

            <div className="my-auto flex flex-col gap-2.5 py-2">
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5">
                <span className="text-xs font-bold text-emerald-300">
                  🐂 {labels.bullRegimeLabel} ({bands.bull.multiple}x P/E)
                </span>
                <span className="font-mono text-sm font-black text-emerald-400">
                  {formatCurrency(bands.bull.targetPrice)}
                </span>
              </div>

              <div
                className="flex items-center justify-between rounded-xl border p-2.5"
                style={{
                  borderColor: themeConfig.borderColor,
                  background: "rgba(255, 255, 255, 0.03)",
                }}
              >
                <span className="text-xs font-bold text-slate-200">
                  🎯 {labels.baseCaseLabel} ({bands.base.multiple}x P/E)
                </span>
                <span className="font-mono text-sm font-black text-white">
                  {formatCurrency(bands.base.targetPrice)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5">
                <span className="text-xs font-bold text-rose-300">
                  🚨 {labels.panicFloorLabel} ({bands.panic.multiple}x P/E)
                </span>
                <span className="font-mono text-sm font-black text-rose-400">
                  {formatCurrency(bands.panic.targetPrice)}
                </span>
              </div>
            </div>

            <div className="font-mono text-[11px] text-slate-400">
              {labels.pricedInMultipleLabel}:{" "}
              <strong className="text-white">
                {asymmetry.marketPricedInMultiple.toFixed(1)}x
              </strong>
            </div>
          </div>

          {/* Right Column: Highlights */}
          <div
            className="flex flex-col justify-between rounded-3xl border p-5 shadow-xl"
            style={{
              borderColor: themeConfig.borderColor,
              background: themeConfig.cardBg,
            }}
          >
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
              {labels.financialHighlightsLabel}
            </div>

            <div className="my-auto flex flex-col gap-2.5 py-2">
              <div
                className="flex items-center justify-between rounded-xl border p-2.5"
                style={{
                  borderColor: themeConfig.borderColor,
                  background: "rgba(255, 255, 255, 0.02)",
                }}
              >
                <span className="text-xs text-slate-300">
                  {labels.revenueLabel} & YoY
                </span>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {formatBillions(facts.revenueBillions)} (+
                  {formatPercent(facts.revenueGrowthPct)})
                </span>
              </div>

              <div
                className="flex items-center justify-between rounded-xl border p-2.5"
                style={{
                  borderColor: themeConfig.borderColor,
                  background: "rgba(255, 255, 255, 0.02)",
                }}
              >
                <span className="text-xs text-slate-300">
                  {labels.cleanOperatingEpsLabel}
                </span>
                <span className="font-mono text-xs font-bold text-white">
                  {formatCurrency(facts.epsOperating)}
                </span>
              </div>

              <div
                className="flex items-center justify-between rounded-xl border p-2.5"
                style={{
                  borderColor: themeConfig.borderColor,
                  background: "rgba(255, 255, 255, 0.02)",
                }}
              >
                <span className="text-xs text-slate-300">
                  {labels.moatRatingLabel}
                </span>
                <span className="font-mono text-xs font-bold text-purple-300">
                  {moatData?.overallMoatRating ?? "Wide"} (
                  {moatData?.moatTrend ?? "Widening"})
                </span>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              {labels.secDisclosuresVerified}
            </div>
          </div>
        </div>
      </div>
    );

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
        className="relative flex flex-col justify-between overflow-hidden p-9 text-slate-100 shadow-2xl"
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

        {/* ----------------- TOP HEADER ----------------- */}
        <header
          className="relative z-10 flex items-center justify-between border-b pb-5"
          style={{ borderColor: themeConfig.borderColor }}
        >
          <div className="flex items-center gap-4">
            {/* Logo Mark */}
            <div
              className="flex size-14 items-center justify-center rounded-2xl border shadow-lg"
              style={{
                borderColor: themeConfig.borderColor,
                background: "rgba(255, 255, 255, 0.06)",
                boxShadow: `0 0 20px ${themeConfig.accentGlow}`,
              }}
            >
              <span
                className="font-mono text-2xl font-black tracking-tight"
                style={{ color: themeConfig.accentColor }}
              >
                S<span className="text-white">α</span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-black tracking-tight text-white">
                  Stress
                  <span style={{ color: themeConfig.accentColor }}>Alpha</span>
                </span>
                <span
                  className="rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    borderColor: themeConfig.borderColor,
                    background: "rgba(255, 255, 255, 0.05)",
                    color: themeConfig.accentColor,
                  }}
                >
                  {labels.tagline}
                </span>
              </div>
              <p className="mt-0.5 text-xs font-medium tracking-wide text-slate-400">
                {facts.company} · {facts.quarter} {labels.earningsAuditTag}
              </p>
            </div>
          </div>

          {/* Big Ticker Badge */}
          <div className="flex items-center gap-3.5">
            <div
              className="flex items-center gap-2 rounded-2xl border px-4 py-2 shadow-lg"
              style={{
                borderColor: themeConfig.borderColor,
                background: themeConfig.cardBg,
              }}
            >
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                {labels.tickerLabel}
              </span>
              <span className="font-mono text-2xl font-extrabold tracking-tight text-white">
                {facts.ticker.toUpperCase()}
              </span>
            </div>

            <div
              className="hidden items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold sm:flex"
              style={{
                borderColor: "rgba(16, 185, 129, 0.3)",
                background: "rgba(16, 185, 129, 0.1)",
                color: "#10b981",
              }}
            >
              <ShieldCheck className="size-3.5" />
              <span>{labels.secAuditVerified}</span>
            </div>
          </div>
        </header>

        {/* ----------------- CARD BODY CONTENT ----------------- */}
        <main className="relative z-10 my-auto flex-1 py-6">
          {/* Executive Summary Preset or Matching Composed Sections */}
          {resolvedTemplate === "summary" ? (
            renderSummary()
          ) : (
            <div
              className={`grid h-full gap-6 ${
                aspectRatio === "landscape"
                  ? activeSections.length === 1
                    ? "grid-cols-1 items-center"
                    : activeSections.length === 2
                      ? "grid-cols-12 items-center"
                      : "grid-cols-2 items-center"
                  : "grid-cols-1 gap-5"
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
        <footer className="relative z-10 flex flex-col gap-3 pt-3">
          {/* Custom Note or High-Conviction Takeaway */}
          {customNote && customNote.trim() && (
            <div
              className="flex items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-md"
              style={{
                borderColor: themeConfig.borderColor,
                background: "rgba(255, 255, 255, 0.04)",
              }}
            >
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: themeConfig.accentGlow,
                  color: themeConfig.accentColor,
                }}
              >
                <Sparkles className="size-4" />
              </div>
              <p className="line-clamp-2 text-xs font-medium italic text-slate-200">
                &ldquo;{customNote.trim()}&rdquo;
              </p>
            </div>
          )}

          {/* Institutional Watermark Strip */}
          {effectiveShowWatermark && (
            <div
              className="flex items-center justify-between border-t pt-3 font-mono text-[11px] text-slate-400"
              style={{ borderColor: themeConfig.borderColor }}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">StressAlpha</span>
                <span>·</span>
                <span>{labels.tagline}</span>
                <span>·</span>
                <span className="text-slate-500">stressalpha.ai</span>
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
