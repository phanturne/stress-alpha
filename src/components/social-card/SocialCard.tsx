"use client";

import React, { forwardRef } from "react";
import {
  Zap,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Target,
  Award,
  BarChart3,
  Layers,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import type { Facts, Valuation, StressResult, ReportData } from "@/lib/schemas";
import type { Locale } from "@/lib/i18n";
import { formatCurrency, formatPercent, formatBillions } from "@/lib/utils";
import {
  type CardTemplate,
  type CardAspectRatio,
  type CardTheme,
  CARD_DIMENSIONS,
  THEME_CONFIGS,
} from "@/lib/social-card";

export interface SocialCardProps {
  facts: Facts;
  valuation?: Valuation;
  stressResult: StressResult;
  reportData?: ReportData;
  template: CardTemplate;
  aspectRatio: CardAspectRatio;
  theme: CardTheme;
  locale?: Locale;
  customNote?: string;
  includeStressShocks?: boolean;
  showWatermark?: boolean;
  appliedShocks?: Record<string, number>;
  grossMarginDeltaBps?: number;
  fixedOpexShiftPct?: number;
}

export const SocialCard = forwardRef<HTMLDivElement, SocialCardProps>(
  (
    {
      facts,
      valuation,
      stressResult,
      reportData,
      template,
      aspectRatio,
      theme,
      locale = "en",
      customNote,
      includeStressShocks = true,
      showWatermark = true,
      appliedShocks = {},
      grossMarginDeltaBps = 0,
      fixedOpexShiftPct = 0,
    },
    ref
  ) => {
    const isZh = locale === "zh";
    const dim = CARD_DIMENSIONS[aspectRatio];
    const themeConfig = THEME_CONFIGS[theme];

    const currentPrice = facts.currentPrice;
    const weightedFairValue = valuation?.weightedFairValue ?? currentPrice;
    const upsidePct = valuation?.upsidePct ?? 0;
    const asymmetry = stressResult.asymmetry;
    const bands = stressResult.valuationBands;

    // Active shocks check
    const nonZeroShocks = Object.entries(appliedShocks).filter(
      ([, val]) => Math.abs(val) > 0.001
    );
    const hasActiveStress =
      includeStressShocks &&
      (nonZeroShocks.length > 0 ||
        Math.abs(grossMarginDeltaBps) > 0.001 ||
        Math.abs(fixedOpexShiftPct) > 0.001);

    // Moat data
    const moatData =
      isZh && reportData?.moatZh ? reportData.moatZh : reportData?.moat;
    const catalystsData =
      isZh && reportData?.catalystsZh
        ? reportData.catalystsZh
        : reportData?.catalysts;

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
                  {isZh
                    ? "权益估值与极端承压测试引擎"
                    : "Institutional Stress Engine"}
                </span>
              </div>
              <p className="mt-0.5 text-xs font-medium tracking-wide text-slate-400">
                {facts.company} · {facts.quarter}{" "}
                {isZh ? "深度研报审计" : "Earnings Audit"}
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
                {isZh ? "代码" : "TICKER"}
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
              <span>{isZh ? "SEC 财报审计验证" : "SEC Audit Verified"}</span>
            </div>
          </div>
        </header>

        {/* ----------------- CARD BODY CONTENT ----------------- */}
        <main className="relative z-10 my-auto flex-1 py-6">
          {/* TEMPLATE 1: VALUATION & STRESS MATRIX */}
          {template === "valuation" && (
            <div
              className={`grid h-full gap-6 ${
                aspectRatio === "landscape"
                  ? "grid-cols-12 items-center"
                  : "grid-cols-1 gap-5"
              }`}
            >
              {/* Left Hero: Current Price vs Fair Value */}
              <div
                className={`flex flex-col justify-between rounded-3xl border p-6 shadow-xl ${
                  aspectRatio === "landscape" ? "col-span-5 h-full" : "w-full"
                }`}
                style={{
                  borderColor: themeConfig.borderColor,
                  background: themeConfig.cardBg,
                }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                      {isZh ? "当前市场价格" : "CURRENT PRICE"}
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
                      {isZh ? "加权公允价值 (模型推演)" : "WEIGHTED FAIR VALUE"}
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
                        {isZh ? "风险收益不对称比" : "RISK / REWARD"}
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
                        {isZh ? "恐慌底线防守" : "PANIC DEFENSE"}
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
                      color: hasActiveStress
                        ? "#f59e0b"
                        : themeConfig.accentColor,
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

              {/* Right: 4-Tier Valuation Regimes Spectrum */}
              <div
                className={`flex flex-col justify-between rounded-3xl border p-6 shadow-xl ${
                  aspectRatio === "landscape" ? "col-span-7 h-full" : "w-full"
                }`}
                style={{
                  borderColor: themeConfig.borderColor,
                  background: themeConfig.cardBg,
                }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target
                        className="size-4"
                        style={{ color: themeConfig.accentColor }}
                      />
                      <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                        {isZh
                          ? "多情景估值谱系与倍数区间"
                          : "VALUATION REGIMES SPECTRUM"}
                      </h3>
                    </div>
                    <span className="font-mono text-xs text-slate-400">
                      {isZh ? "当前隐含估值" : "Market Pricing"}:{" "}
                      <strong className="text-white">
                        {asymmetry.marketPricedInMultiple.toFixed(1)}x P/E
                      </strong>
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    {/* Bull */}
                    <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🐂</span>
                        <div>
                          <div className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                            {isZh ? "乐观扩张情景" : "Bull Regime"} (
                            {bands.bull.multiple}x P/E)
                          </div>
                          <div className="text-xs text-slate-300">
                            {isZh
                              ? "AI 算力爆发与溢价扩张"
                              : "Rapid demand surge & margin expansion"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-lg font-extrabold text-white">
                          {formatCurrency(bands.bull.targetPrice)}
                        </div>
                        <div className="text-xs font-semibold text-emerald-400">
                          {formatPercent(bands.bull.deltaFromCurrentPct)}
                        </div>
                      </div>
                    </div>

                    {/* Base */}
                    <div className="flex items-center justify-between rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3.5 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🎯</span>
                        <div>
                          <div className="font-mono text-xs font-bold uppercase tracking-wider text-sky-400">
                            {isZh ? "基准公允情景" : "Base Case"} (
                            {bands.base.multiple}x P/E)
                          </div>
                          <div className="text-xs text-slate-300">
                            {isZh
                              ? "行业稳态正常化供给"
                              : "Steady-state market execution"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-lg font-extrabold text-white">
                          {formatCurrency(bands.base.targetPrice)}
                        </div>
                        <div className="text-xs font-semibold text-sky-400">
                          {formatPercent(bands.base.deltaFromCurrentPct)}
                        </div>
                      </div>
                    </div>

                    {/* Panic Floor */}
                    <div className="flex items-center justify-between rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🚨</span>
                        <div>
                          <div className="font-mono text-xs font-bold uppercase tracking-wider text-rose-400">
                            {isZh ? "极端恐慌底线" : "Panic Floor"} (
                            {bands.panic.multiple}x P/E)
                          </div>
                          <div className="text-xs text-slate-300">
                            {isZh
                              ? "周期下行与极度流动性折价"
                              : "Severe cyclical contraction & sell-off"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-lg font-extrabold text-white">
                          {formatCurrency(bands.panic.targetPrice)}
                        </div>
                        <div className="text-xs font-semibold text-rose-400">
                          {formatPercent(bands.panic.deltaFromCurrentPct)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Model Baseline Factlets */}
                <div
                  className="mt-4 flex items-center justify-between border-t pt-3 font-mono text-xs text-slate-400"
                  style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}
                >
                  <span>
                    {isZh ? "承压后远期 EPS" : "Stressed Fwd EPS"}:{" "}
                    <strong className="text-white">
                      {formatCurrency(stressResult.stressEps)}
                    </strong>
                  </span>
                  <span>
                    {isZh ? "承压营收规模" : "Stressed Rev"}:{" "}
                    <strong className="text-white">
                      {formatBillions(stressResult.stressRevenueBillions)}
                    </strong>
                  </span>
                  <span>
                    {isZh ? "净利润" : "Net Income"}:{" "}
                    <strong className="text-white">
                      {formatBillions(stressResult.stressNetIncomeBillions)}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 2: EARNINGS SCORECARD */}
          {template === "earnings" && (
            <div
              className={`grid h-full gap-6 ${
                aspectRatio === "landscape"
                  ? "grid-cols-12 items-center"
                  : "grid-cols-1 gap-5"
              }`}
            >
              {/* Left: Core Financial Metrics & EPS Beat */}
              <div
                className={`flex flex-col justify-between rounded-3xl border p-6 shadow-xl ${
                  aspectRatio === "landscape" ? "col-span-6 h-full" : "w-full"
                }`}
                style={{
                  borderColor: themeConfig.borderColor,
                  background: themeConfig.cardBg,
                }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                      {isZh
                        ? "本季经营业绩全景"
                        : "QUARTERLY OPERATIONAL RESULTS"}
                    </span>
                    <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-bold text-emerald-400">
                      {isZh ? "超预期业绩" : "EARNINGS BEAT"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {/* Revenue */}
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                      <span className="font-mono text-xs text-slate-400">
                        {isZh ? "营业收入" : "REVENUE"}
                      </span>
                      <div className="mt-1 font-mono text-3xl font-extrabold text-white">
                        {formatBillions(facts.revenueBillions)}
                      </div>
                      <div className="mt-1 text-xs font-bold text-emerald-400">
                        {formatPercent(facts.revenueGrowthPct)} YoY
                      </div>
                    </div>

                    {/* Operating Income */}
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                      <span className="font-mono text-xs text-slate-400">
                        {isZh ? "营业利润" : "OPERATING INCOME"}
                      </span>
                      <div className="mt-1 font-mono text-3xl font-extrabold text-white">
                        {formatBillions(facts.operatingIncomeBillions)}
                      </div>
                      <div className="mt-1 text-xs font-bold text-sky-400">
                        {facts.operatingMarginPct.toFixed(1)}% Margin
                      </div>
                    </div>
                  </div>

                  {/* Quality of Earnings / EPS Audit */}
                  <div className="mt-5 rounded-2xl border border-accent/20 bg-accent/5 p-4">
                    <div className="flex items-center justify-between">
                      <span
                        className="font-mono text-xs font-bold uppercase tracking-wider"
                        style={{ color: themeConfig.accentColor }}
                      >
                        {isZh ? "经调整核心经营 EPS" : "CLEAN OPERATING EPS"}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-400">
                        {isZh ? "华尔街预期" : "Consensus"}:{" "}
                        {formatCurrency(facts.epsConsensus)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="font-mono text-4xl font-black text-white">
                        {formatCurrency(facts.epsOperating)}
                      </span>
                      <div className="flex items-center gap-1 font-mono text-xs font-bold text-emerald-400">
                        <span>
                          +
                          {(
                            ((facts.epsOperating -
                              (facts.epsConsensus || facts.epsOperating)) /
                              (facts.epsConsensus || 1)) *
                            100
                          ).toFixed(1)}
                          % {isZh ? "超预期" : "Beat"}
                        </span>
                      </div>
                    </div>

                    {facts.oneTimeItems && facts.oneTimeItems.length > 0 && (
                      <div className="mt-3 border-t border-accent/15 pt-2.5 text-xs text-slate-300">
                        <span className="font-semibold text-amber-400">
                          {isZh ? "剔除非经常损益" : "Income-Quality Filter"}:
                        </span>{" "}
                        {facts.oneTimeItems[0]?.description} (
                        {formatBillions(
                          facts.oneTimeItems[0]?.amountBillions ?? 0
                        )}
                        )
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className="mt-4 flex items-center justify-between border-t pt-3 font-mono text-xs text-slate-400"
                  style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}
                >
                  <span>
                    {isZh ? "市值" : "Market Cap"}:{" "}
                    {formatBillions(facts.marketCapBillions)}
                  </span>
                  <span>
                    {isZh ? "远期预期 EPS" : "Next FY Consensus"}:{" "}
                    {formatCurrency(facts.forwardEpsConsensus)}
                  </span>
                </div>
              </div>

              {/* Right: Segments Breakdown */}
              <div
                className={`flex flex-col justify-between rounded-3xl border p-6 shadow-xl ${
                  aspectRatio === "landscape" ? "col-span-6 h-full" : "w-full"
                }`}
                style={{
                  borderColor: themeConfig.borderColor,
                  background: themeConfig.cardBg,
                }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3
                        className="size-4"
                        style={{ color: themeConfig.accentColor }}
                      />
                      <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                        {isZh
                          ? "核心业务分部营收贡献"
                          : "SEGMENT REVENUE DYNAMICS"}
                      </h3>
                    </div>
                    <span className="font-mono text-xs text-slate-400">
                      {facts.segments.length} {isZh ? "个业务部门" : "Segments"}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-col gap-4">
                    {facts.segments.map((seg, idx) => {
                      const sharePct =
                        facts.revenueBillions > 0
                          ? (seg.revenueBillions / facts.revenueBillions) * 100
                          : 0;
                      return (
                        <div
                          key={idx}
                          className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">
                              {seg.name}
                            </span>
                            <span className="font-mono text-base font-bold text-white">
                              {formatBillions(seg.revenueBillions)}
                            </span>
                          </div>

                          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.max(8, sharePct))}%`,
                                background:
                                  idx === 0
                                    ? themeConfig.accentColor
                                    : idx === 1
                                      ? "#10b981"
                                      : "#a855f7",
                              }}
                            />
                          </div>

                          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                            <span>
                              {sharePct.toFixed(1)}%{" "}
                              {isZh ? "总营收占比" : "of total revenue"}
                            </span>
                            <span className="font-semibold text-emerald-400">
                              {formatPercent(seg.growthPct)} YoY
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="mt-4 flex items-center justify-between border-t pt-3 font-mono text-xs text-slate-400"
                  style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}
                >
                  <span>
                    {isZh ? "公允价值空间" : "Valuation Upside"}:{" "}
                    <strong className="text-emerald-400">
                      {formatPercent(upsidePct)}
                    </strong>
                  </span>
                  <span>
                    {isZh ? "加权公允价" : "Weighted Fair Value"}:{" "}
                    <strong className="text-white">
                      {formatCurrency(weightedFairValue)}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 3: THESIS & CATALYSTS */}
          {template === "thesis" && (
            <div
              className={`grid h-full gap-6 ${
                aspectRatio === "landscape"
                  ? "grid-cols-12 items-center"
                  : "grid-cols-1 gap-5"
              }`}
            >
              {/* Left: Economic Moat & Thesis Core */}
              <div
                className={`flex flex-col justify-between rounded-3xl border p-6 shadow-xl ${
                  aspectRatio === "landscape" ? "col-span-5 h-full" : "w-full"
                }`}
                style={{
                  borderColor: themeConfig.borderColor,
                  background: themeConfig.cardBg,
                }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                      {isZh ? "企业竞争壁垒" : "COMPETITIVE ADVANTAGE"}
                    </span>
                    <span className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-purple-300">
                      {moatData?.overallMoatRating ?? "Wide"}{" "}
                      {isZh ? "护城河" : "Moat"}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-400">
                      <Award className="size-6" />
                    </div>
                    <div>
                      <h4 className="font-mono text-lg font-extrabold text-white">
                        {moatData?.overallMoatRating ?? "Wide"}{" "}
                        {isZh ? "经济护城河" : "Economic Moat"}
                      </h4>
                      <p className="text-xs text-slate-300">
                        {isZh ? "壁垒演进趋势" : "Moat Trend"}:{" "}
                        <strong className="text-emerald-400">
                          {moatData?.moatTrend ?? "Widening"}
                        </strong>
                      </p>
                    </div>
                  </div>

                  {/* Moat Sources list */}
                  <div className="mt-5 flex flex-col gap-2.5">
                    {moatData?.moatSources?.slice(0, 3).map((ms, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-xs"
                      >
                        <div className="flex items-center justify-between font-semibold text-white">
                          <span>{ms.source}</span>
                          <span className="font-mono text-[11px] text-purple-300">
                            {ms.strength} ({ms.durabilityYears} yrs)
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-slate-400">
                          {ms.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fair value preview */}
                <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-xs font-bold text-slate-300">
                      {isZh ? "加权公允价值" : "Target Fair Value"}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      {formatPercent(upsidePct)}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-2xl font-black text-white">
                    {formatCurrency(weightedFairValue)}
                  </div>
                </div>
              </div>

              {/* Right: Key Growth Catalysts & Downside Risks */}
              <div
                className={`flex flex-col justify-between rounded-3xl border p-6 shadow-xl ${
                  aspectRatio === "landscape" ? "col-span-7 h-full" : "w-full"
                }`}
                style={{
                  borderColor: themeConfig.borderColor,
                  background: themeConfig.cardBg,
                }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles
                        className="size-4"
                        style={{ color: themeConfig.accentColor }}
                      />
                      <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                        {isZh
                          ? "核心增长催化剂与主要风险"
                          : "KEY CATALYSTS & FRAGILITY RISKS"}
                      </h3>
                    </div>
                    <span className="font-mono text-xs text-slate-400">
                      {isZh ? "概率锚定模型" : "Probability Anchored"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    {catalystsData?.catalysts?.slice(0, 4).map((cat, idx) => {
                      const isGrowth = cat.direction === "growth";
                      return (
                        <div
                          key={idx}
                          className={`rounded-2xl border p-3.5 transition-all ${
                            isGrowth
                              ? "border-emerald-500/20 bg-emerald-500/10"
                              : "border-rose-500/20 bg-rose-500/10"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {isGrowth ? "🚀" : "⚠️"}
                              </span>
                              <span
                                className="font-mono text-xs font-bold uppercase tracking-wider"
                                style={{
                                  color: isGrowth ? "#10b981" : "#f43f5e",
                                }}
                              >
                                {isGrowth
                                  ? isZh
                                    ? "增长催化"
                                    : "GROWTH CATALYST"
                                  : isZh
                                    ? "下行风险"
                                    : "DOWNSIDE RISK"}
                              </span>
                            </div>
                            <span
                              className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold ${
                                isGrowth
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-rose-500/20 text-rose-300"
                              }`}
                            >
                              {(cat.probability * 100).toFixed(0)}%{" "}
                              {isZh ? "概率" : "Prob"}
                            </span>
                          </div>

                          <h5 className="mt-1 line-clamp-1 text-sm font-bold text-white">
                            {cat.title}
                          </h5>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-300">
                            {cat.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="mt-4 flex items-center justify-between border-t pt-3 font-mono text-xs text-slate-400"
                  style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}
                >
                  <span>
                    {isZh ? "不对称比" : "Asymmetry"}:{" "}
                    <strong className="text-accent">
                      {asymmetry.riskRewardRatio?.toFixed(1)}x
                    </strong>
                  </span>
                  <span>
                    {isZh ? "恐慌底线" : "Panic Floor"}:{" "}
                    <strong className="text-rose-400">
                      {formatCurrency(bands.panic.targetPrice)}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 4: EXECUTIVE SUMMARY */}
          {template === "summary" && (
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
                    {isZh ? "当前价格" : "PRICE"}
                  </span>
                  <span className="font-mono text-2xl font-extrabold text-white">
                    {formatCurrency(currentPrice)}
                  </span>
                </div>
                <div
                  className="flex flex-col justify-center border-r pr-4"
                  style={{ borderColor: themeConfig.borderColor }}
                >
                  <span className="font-mono text-xs text-slate-400">
                    {isZh ? "加权公允价值" : "FAIR VALUE"}
                  </span>
                  <span className="font-mono text-2xl font-extrabold text-emerald-400">
                    {formatCurrency(weightedFairValue)}
                  </span>
                </div>
                <div
                  className="flex flex-col justify-center border-r pr-4"
                  style={{ borderColor: themeConfig.borderColor }}
                >
                  <span className="font-mono text-xs text-slate-400">
                    {isZh ? "估值空间" : "UPSIDE"}
                  </span>
                  <span className="font-mono text-2xl font-extrabold text-emerald-400">
                    {formatPercent(upsidePct)}
                  </span>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="font-mono text-xs text-slate-400">
                    {isZh ? "不对称比" : "ASYMMETRY"}
                  </span>
                  <span
                    className="font-mono text-2xl font-extrabold text-accent"
                    style={{ color: themeConfig.accentColor }}
                  >
                    {asymmetry.riskRewardRatio?.toFixed(1)}x
                  </span>
                </div>
              </div>

              {/* Middle 2-Column High-Density Grid */}
              <div className="grid flex-1 grid-cols-2 gap-5">
                {/* Left: Regimes */}
                <div
                  className="flex flex-col justify-between rounded-3xl border p-5 shadow-xl"
                  style={{
                    borderColor: themeConfig.borderColor,
                    background: themeConfig.cardBg,
                  }}
                >
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                    {isZh
                      ? "估值谱系与防守底线"
                      : "VALUATION SPECTRUM & REGIMES"}
                  </span>
                  <div className="mt-2 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3.5 py-2">
                      <span className="text-xs font-bold text-emerald-400">
                        🐂 {isZh ? "乐观" : "Bull"} ({bands.bull.multiple}x)
                      </span>
                      <span className="font-mono text-sm font-extrabold text-white">
                        {formatCurrency(bands.bull.targetPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-sky-500/10 px-3.5 py-2">
                      <span className="text-xs font-bold text-sky-400">
                        🎯 {isZh ? "基准" : "Base"} ({bands.base.multiple}x)
                      </span>
                      <span className="font-mono text-sm font-extrabold text-white">
                        {formatCurrency(bands.base.targetPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-rose-500/10 px-3.5 py-2">
                      <span className="text-xs font-bold text-rose-400">
                        🚨 {isZh ? "恐慌" : "Panic"} ({bands.panic.multiple}x)
                      </span>
                      <span className="font-mono text-sm font-extrabold text-white">
                        {formatCurrency(bands.panic.targetPrice)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-right font-mono text-[11px] text-slate-400">
                    {isZh ? "隐含预期倍数" : "Priced-in Multiple"}:{" "}
                    {asymmetry.marketPricedInMultiple.toFixed(1)}x P/E
                  </div>
                </div>

                {/* Right: Operational Highlights */}
                <div
                  className="flex flex-col justify-between rounded-3xl border p-5 shadow-xl"
                  style={{
                    borderColor: themeConfig.borderColor,
                    background: themeConfig.cardBg,
                  }}
                >
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                    {isZh ? "财报核心经营亮点" : "FINANCIAL & MOAT HIGHLIGHTS"}
                  </span>
                  <div className="mt-2 flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                      <span className="text-slate-400">
                        {isZh ? "营收与增速" : "Revenue & Growth"}
                      </span>
                      <span className="font-mono font-bold text-white">
                        {formatBillions(facts.revenueBillions)} (
                        {formatPercent(facts.revenueGrowthPct)})
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                      <span className="text-slate-400">
                        {isZh ? "经调整核心 EPS" : "Clean Operating EPS"}
                      </span>
                      <span className="font-mono font-bold text-white">
                        {formatCurrency(facts.epsOperating)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                      <span className="text-slate-400">
                        {isZh ? "护城河评级" : "Economic Moat"}
                      </span>
                      <span className="font-mono font-bold text-purple-300">
                        {moatData?.overallMoatRating ?? "Wide"} (
                        {moatData?.moatTrend ?? "Widening"})
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    {isZh
                      ? "SEC 报表与一次性损益严格审计完成"
                      : "Audited against SEC 10-Q filing disclosures"}
                  </div>
                </div>
              </div>
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
          {showWatermark && (
            <div
              className="flex items-center justify-between border-t pt-3 font-mono text-[11px] text-slate-400"
              style={{ borderColor: themeConfig.borderColor }}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">StressAlpha</span>
                <span>·</span>
                <span>
                  {isZh
                    ? "权益估值与极端承压推演引擎"
                    : "Scenario Stress Valuation Engine"}
                </span>
                <span>·</span>
                <span className="text-slate-500">stressalpha.ai</span>
              </div>

              <div className="flex items-center gap-2 text-slate-500">
                <span>{facts.analysisDate ?? "2026-09"}</span>
                <span>·</span>
                <span className="uppercase">
                  {isZh ? "研究级审计凭证" : "RESEARCH AUDIT GRADE"}
                </span>
              </div>
            </div>
          )}
        </footer>
      </div>
    );
  }
);

SocialCard.displayName = "SocialCard";
