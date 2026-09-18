"use client";

import React, { useState, useMemo } from "react";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Sparkles,
  ExternalLink,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  DollarSign,
  CheckCircle2,
  Minus,
  Quote,
  Layers,
  HelpCircle,
} from "lucide-react";
import type { AnalystEstimates, AnalystEstimateEntry } from "@/lib/schemas";
import { getTranslations, type Locale } from "@/lib/i18n";

interface EstimatesTabProps {
  estimatesData?: AnalystEstimates;
  currentPrice?: number;
  locale?: Locale;
}

export const EstimatesTab: React.FC<EstimatesTabProps> = ({
  estimatesData,
  currentPrice: propCurrentPrice,
  locale = "zh",
}) => {
  const t = getTranslations(locale).estimatesTab;
  const isZh = locale === "zh";

  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "upside" | "target">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Rating badge styling helper
  const getRatingBadge = (rating: string) => {
    const r = rating.toLowerCase();
    if (r.includes("strong buy") || r.includes("strong-buy")) {
      return {
        className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        label: rating,
      };
    }
    if (
      r.includes("buy") ||
      r.includes("overweight") ||
      r.includes("outperform")
    ) {
      return {
        className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        label: rating,
      };
    }
    if (r.includes("hold") || r.includes("neutral") || r.includes("equal")) {
      return {
        className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        label: rating,
      };
    }
    if (
      r.includes("sell") ||
      r.includes("underperform") ||
      r.includes("underweight")
    ) {
      return {
        className: "bg-rose-500/15 text-rose-400 border-rose-500/30",
        label: rating,
      };
    }
    return {
      className: "bg-surface-2 text-slate-300 border-white/[0.08]",
      label: rating,
    };
  };

  // Action badge styling helper
  const getActionBadge = (action?: string | null) => {
    if (!action) return null;
    const act = action.toLowerCase();
    if (act.includes("raise") || act.includes("upgrad")) {
      return {
        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        icon: ArrowUpRight,
      };
    }
    if (act.includes("lower") || act.includes("downgrad")) {
      return {
        className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        icon: ArrowDownRight,
      };
    }
    if (act.includes("initiat")) {
      return {
        className: "bg-accent/10 text-accent border-accent/20",
        icon: Sparkles,
      };
    }
    return {
      className: "bg-surface-2 text-slate-400 border-white/[0.06]",
      icon: Minus,
    };
  };

  // Filtering & Sorting
  const filteredEstimates = useMemo(() => {
    const rawEstimates = estimatesData?.estimates ?? [];
    return rawEstimates
      .filter((item) => {
        const matchesSearch =
          item.firm.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.analyst &&
            item.analyst.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.notes &&
            item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;

        if (ratingFilter === "all") return true;
        const r = item.rating.toLowerCase();
        if (ratingFilter === "buy") {
          return (
            r.includes("buy") ||
            r.includes("outperform") ||
            r.includes("overweight") ||
            r.includes("positive") ||
            r.includes("买入") ||
            r.includes("增持") ||
            r.includes("跑赢大盘") ||
            r.includes("跑赢行业")
          );
        }
        if (ratingFilter === "hold") {
          return (
            r.includes("hold") ||
            r.includes("neutral") ||
            r.includes("equal") ||
            r.includes("market") ||
            r.includes("中性") ||
            r.includes("持有")
          );
        }
        if (ratingFilter === "sell") {
          return (
            r.includes("sell") ||
            r.includes("underperform") ||
            r.includes("underweight") ||
            r.includes("negative") ||
            r.includes("卖出") ||
            r.includes("减持") ||
            r.includes("跑输行业")
          );
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === "date") {
          diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        } else if (sortBy === "upside") {
          diff = a.upsidePct - b.upsidePct;
        } else if (sortBy === "target") {
          diff = a.priceTarget - b.priceTarget;
        }
        return sortOrder === "desc" ? -diff : diff;
      });
  }, [estimatesData?.estimates, searchTerm, ratingFilter, sortBy, sortOrder]);

  if (!estimatesData) {
    return (
      <div className="glass-panel rounded-xl p-12 text-center text-sm text-slate-400">
        {t.empty}
      </div>
    );
  }

  const {
    consensus,
    priceTargets,
    synthesisNarrative,
    sources = [],
  } = estimatesData;
  const effectiveCurrentPrice =
    priceTargets?.currentPrice || propCurrentPrice || 0;

  // Track Calculations
  const low = priceTargets.low;
  const average = priceTargets.average;
  const high = priceTargets.high;
  const current = effectiveCurrentPrice;

  const minTrack = Math.max(0, Math.min(low, current) * 0.9);
  const maxTrack = Math.max(high, current) * 1.08;
  const trackRange = maxTrack - minTrack || 1;

  const getTrackPct = (val: number) => {
    const raw = ((val - minTrack) / trackRange) * 100;
    return Math.max(2, Math.min(98, raw));
  };

  const lowPct = getTrackPct(low);
  const highPct = getTrackPct(high);
  const avgPct = getTrackPct(average);
  const curPct = getTrackPct(current);
  const avgUpsidePct = current > 0 ? ((average - current) / current) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.08] p-5 md:flex-row md:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
            <Target className="size-4" />
            <span>{t.title}</span>
            {estimatesData.asOfDate && (
              <span className="font-mono text-[11px] lowercase text-slate-500">
                • {estimatesData.asOfDate}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">{t.subtitle}</p>
        </div>

        {/* Global Summary Metric Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-surface-2 px-3 py-1.5">
            <span className="text-slate-400">{t.totalAnalysts}:</span>
            <span className="font-mono font-bold text-white">
              {consensus.totalAnalysts}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-surface-2 px-3 py-1.5">
            <span className="text-slate-400">{t.avgUpside}:</span>
            <span
              className={`font-mono font-bold ${
                avgUpsidePct >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {avgUpsidePct >= 0 ? "+" : ""}
              {avgUpsidePct.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Top 2 Cards: Consensus Breakdown & 52W Price Targets Slider */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Card 1: Analyst Consensus (5 cols) */}
        <div className="glass-panel flex flex-col justify-between rounded-2xl border border-white/[0.08] p-5 lg:col-span-5">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-accent" />
                <h3 className="text-sm font-semibold tracking-wide text-white">
                  {t.consensusTitle}
                </h3>
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                  getRatingBadge(consensus.consensus).className
                }`}
              >
                {consensus.consensus}
              </span>
            </div>

            {/* Visual Multi-Segment Bar */}
            <div className="mb-5 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-surface-3 p-0.5">
              <div
                style={{ width: `${consensus.bullishPct}%` }}
                className="h-full rounded-l-full bg-emerald-500 transition-all duration-500"
                title={`Bullish: ${consensus.bullishPct}%`}
              />
              <div
                style={{ width: `${consensus.neutralPct}%` }}
                className="h-full bg-amber-400 transition-all duration-500"
                title={`Neutral: ${consensus.neutralPct}%`}
              />
              <div
                style={{ width: `${consensus.bearishPct}%` }}
                className="h-full rounded-r-full bg-rose-500 transition-all duration-500"
                title={`Bearish: ${consensus.bearishPct}%`}
              />
            </div>

            {/* Breakdown Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* Bullish */}
              <div className="flex flex-col rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-emerald-400">
                  <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="font-medium">{t.bullish}</span>
                </div>
                <div className="font-mono text-lg font-bold text-white">
                  {consensus.bullishCount}
                </div>
                <div className="font-mono text-[11px] text-emerald-400/80">
                  {consensus.bullishPct.toFixed(1)}%
                </div>
              </div>

              {/* Neutral */}
              <div className="flex flex-col rounded-xl border border-amber-500/15 bg-amber-500/5 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-amber-400">
                  <div className="size-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  <span className="font-medium">{t.neutral}</span>
                </div>
                <div className="font-mono text-lg font-bold text-white">
                  {consensus.neutralCount}
                </div>
                <div className="font-mono text-[11px] text-amber-400/80">
                  {consensus.neutralPct.toFixed(1)}%
                </div>
              </div>

              {/* Bearish */}
              <div className="flex flex-col rounded-xl border border-rose-500/15 bg-rose-500/5 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-rose-400">
                  <div className="size-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                  <span className="font-medium">{t.bearish}</span>
                </div>
                <div className="font-mono text-lg font-bold text-white">
                  {consensus.bearishCount}
                </div>
                <div className="font-mono text-[11px] text-rose-400/80">
                  {consensus.bearishPct.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px] text-slate-400">
            <span>
              {isZh ? "华尔街卖方共识情绪" : "Wall Street Sentiment Momentum"}
            </span>
            <span className="font-medium text-slate-300">
              {consensus.bullishPct >= 70
                ? isZh
                  ? "🔥 极度看多 (High Conviction)"
                  : "🔥 High Conviction Bullish"
                : consensus.bullishPct >= 50
                  ? isZh
                    ? "偏多共识 (Moderate Bull)"
                    : "Moderate Bull"
                  : isZh
                    ? "观点分歧 (Divergent)"
                    : "Divergent"}
            </span>
          </div>
        </div>

        {/* Card 2: Analyst 52W Price Targets (7 cols) */}
        <div className="glass-panel flex flex-col justify-between rounded-2xl border border-white/[0.08] p-5 lg:col-span-7">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-accent" />
                <h3 className="text-sm font-semibold tracking-wide text-white">
                  {t.priceTargetsTitle}
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="text-slate-400">
                  {t.currentPrice}:{" "}
                  <span className="font-mono font-bold text-white">
                    ${current.toFixed(2)}
                  </span>
                </div>
                <div className="text-slate-400">
                  {t.targetRange}:{" "}
                  <span className="font-mono font-semibold text-accent">
                    ${low.toFixed(0)} – ${high.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Track Visualizer */}
            <div className="relative px-3 pb-8 pt-6">
              {/* Background Base Track */}
              <div className="relative h-3 w-full rounded-full bg-surface-3">
                {/* Target Range Highlight Bar */}
                <div
                  className="absolute inset-y-0 rounded-full border-y border-accent/40 bg-accent/20"
                  style={{
                    left: `${Math.min(lowPct, highPct)}%`,
                    width: `${Math.abs(highPct - lowPct)}%`,
                  }}
                />

                {/* Low Target Tick */}
                <div
                  className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300 shadow-sm"
                  style={{ left: `${lowPct}%` }}
                />

                {/* High Target Tick */}
                <div
                  className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300 shadow-sm"
                  style={{ left: `${highPct}%` }}
                />

                {/* Average Target Marker (Prominent) */}
                <div
                  className="absolute top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  style={{ left: `${avgPct}%` }}
                >
                  <div className="size-4 rounded-full border-2 border-surface-0 bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
                  <div className="absolute top-5 flex flex-col items-center whitespace-nowrap">
                    <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald-400 shadow-sm">
                      ${average.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {t.average}
                    </span>
                  </div>
                </div>

                {/* Current Price Pin (Distinct cyan/blue marker) */}
                {current > 0 && (
                  <div
                    className="absolute top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                    style={{ left: `${curPct}%` }}
                  >
                    <div className="size-3.5 rounded-full border-2 border-surface-0 bg-accent shadow-[0_0_10px_rgba(56,189,248,0.7)]" />
                    <div className="absolute -top-7 flex flex-col items-center whitespace-nowrap">
                      <span className="rounded border border-accent/40 bg-accent/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                        {isZh ? "现价" : "Current"}: ${current.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Min and Max Target Labels */}
              <div className="mt-5 flex justify-between pt-2 font-mono text-xs text-slate-400">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">
                    {t.low}
                  </span>
                  <span className="font-semibold text-slate-200">
                    ${low.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {current > 0
                      ? `${(((low - current) / current) * 100).toFixed(1)}%`
                      : ""}
                  </span>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">
                    {t.high}
                  </span>
                  <span className="font-semibold text-slate-200">
                    ${high.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-emerald-400">
                    {current > 0
                      ? `+${(((high - current) / current) * 100).toFixed(1)}%`
                      : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px] text-slate-400">
            <span>
              {isZh
                ? `共识目标中枢: $${average.toFixed(2)} (${avgUpsidePct >= 0 ? "+" : ""}${avgUpsidePct.toFixed(1)}%)`
                : `Consensus Target Mean: $${average.toFixed(2)} (${avgUpsidePct >= 0 ? "+" : ""}${avgUpsidePct.toFixed(1)}%)`}
            </span>
            <span className="font-mono text-slate-300">
              {isZh ? "偏度比 (High/Low): " : "Spread: "}
              {(high / (low || 1)).toFixed(2)}x
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Estimates Table (8 cols) + Ratings Synthesis Narrative (4 cols) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: Analyst Estimates Table (lg:col-span-8) */}
        <div className="glass-panel flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] lg:col-span-8">
          {/* Table Header & Controls */}
          <div className="flex flex-col justify-between gap-3 border-b border-white/[0.08] bg-surface-1/40 p-4 sm:flex-row sm:items-center sm:p-5">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white">
                <span>{t.tableTitle}</span>
                <span className="rounded-full bg-surface-3 px-2 py-0.5 font-mono text-xs text-slate-300">
                  {filteredEstimates.length}
                </span>
              </h3>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    isZh ? "搜索券商或分析师..." : "Search firm or analyst..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-36 rounded-lg border border-white/[0.08] bg-surface-2/80 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-accent/50 focus:outline-none sm:w-44"
                />
              </div>

              {/* Rating Filter Pills */}
              <div className="flex items-center rounded-lg border border-white/[0.08] bg-surface-2/80 p-0.5 text-xs">
                {(["all", "buy", "hold", "sell"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setRatingFilter(mode)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      ratingFilter === mode
                        ? "bg-accent/20 font-semibold text-accent"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {mode === "all"
                      ? isZh
                        ? "全部"
                        : "All"
                      : mode === "buy"
                        ? isZh
                          ? "看多"
                          : "Buy"
                        : mode === "hold"
                          ? isZh
                            ? "中性"
                            : "Hold"
                          : isZh
                            ? "看空"
                            : "Sell"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-surface-0/40 font-medium text-slate-400">
                  <th className="px-4 py-3">{t.colFirm}</th>
                  <th className="p-3">{t.colRating}</th>
                  <th className="px-4 py-3 text-right">{t.colTarget}</th>
                  <th className="p-3 text-right">{t.colUpside}</th>
                  <th className="px-4 py-3 text-right">{t.colDate}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredEstimates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-xs text-slate-500"
                    >
                      {isZh
                        ? "未找到匹配的分析师评级记录"
                        : "No matching analyst estimates found"}
                    </td>
                  </tr>
                ) : (
                  filteredEstimates.map((item, idx) => {
                    const ratingStyle = getRatingBadge(item.rating);
                    const actionStyle = getActionBadge(item.action);

                    return (
                      <tr
                        key={`${item.firm}-${idx}`}
                        className="group transition-colors hover:bg-surface-2/40"
                      >
                        {/* Firm & Analyst */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 font-semibold text-white">
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(`${item.firm} equity research`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 hover:text-accent hover:underline"
                                title={
                                  isZh
                                    ? `在 Google 搜索 ${item.firm} 研报`
                                    : `Search ${item.firm} research on Google`
                                }
                              >
                                <span>{item.firm}</span>
                                <ExternalLink className="size-3 text-slate-500 opacity-60 transition-opacity hover:opacity-100" />
                              </a>
                              {actionStyle && item.action && (
                                <span
                                  className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-medium ${actionStyle.className}`}
                                >
                                  <actionStyle.icon className="size-2.5" />
                                  {item.action}
                                </span>
                              )}
                            </div>
                            {item.analyst && (
                              <span className="text-[11px] text-slate-400">
                                {item.analyst}
                              </span>
                            )}
                            {item.notes && (
                              <span className="mt-1 line-clamp-1 text-[10px] italic text-slate-500 transition-all group-hover:line-clamp-none">
                                &quot;{item.notes}&quot;
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Rating */}
                        <td className="whitespace-nowrap px-3 py-3.5">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold ${ratingStyle.className}`}
                          >
                            {ratingStyle.label}
                          </span>
                        </td>

                        {/* 52W Price Target */}
                        <td className="whitespace-nowrap px-4 py-3.5 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-mono text-sm font-bold text-white">
                              ${item.priceTarget.toFixed(2)}
                            </span>
                            {item.priorPriceTarget && (
                              <span className="font-mono text-[11px] text-slate-400">
                                {t.fromPrior} $
                                {item.priorPriceTarget.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Upside % */}
                        <td className="whitespace-nowrap px-3 py-3.5 text-right">
                          <span
                            className={`inline-block rounded px-2 py-0.5 font-mono text-xs font-bold ${
                              item.upsidePct >= 0
                                ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                : "border border-rose-500/20 bg-rose-500/10 text-rose-400"
                            }`}
                          >
                            {item.upsidePct >= 0 ? "+" : ""}
                            {item.upsidePct.toFixed(1)}%
                          </span>
                        </td>

                        {/* Date */}
                        <td className="whitespace-nowrap px-4 py-3.5 text-right font-mono text-[11px] text-slate-400">
                          {item.date}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Analyst Ratings Synthesis Card (lg:col-span-4) */}
        <div className="flex flex-col gap-5 lg:col-span-4">
          {/* Narrative Card */}
          <div className="glass-panel flex h-full flex-col rounded-2xl border border-white/[0.08] p-5">
            <div className="mb-3 flex items-center gap-2 border-b border-white/[0.08] pb-3">
              <div className="rounded-lg border border-accent/20 bg-accent/10 p-1.5 text-accent">
                <Sparkles className="size-4" />
              </div>
              <h3 className="text-sm font-semibold tracking-wide text-white">
                {t.synthesisTitle}
              </h3>
            </div>

            <div className="relative my-2 border-l-2 border-accent/60 pl-3">
              <p className="whitespace-pre-line text-xs leading-relaxed text-slate-300">
                {synthesisNarrative}
              </p>
            </div>

            {/* Quick Synthesis Highlights */}
            <div className="mt-auto space-y-2.5 border-t border-white/[0.06] pt-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {isZh ? "共识核心特征" : "Consensus Anatomy"}
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-surface-2/60 p-2.5 text-xs">
                <span className="text-slate-400">
                  {isZh ? "最高目标券商" : "Street High"}
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  ${high.toFixed(2)}{" "}
                  <span className="text-[10px] text-slate-500">
                    (
                    {current > 0
                      ? `+${(((high - current) / current) * 100).toFixed(0)}%`
                      : ""}
                    )
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-surface-2/60 p-2.5 text-xs">
                <span className="text-slate-400">
                  {isZh ? "最低目标券商" : "Street Low"}
                </span>
                <span className="font-mono font-bold text-slate-300">
                  ${low.toFixed(2)}{" "}
                  <span className="text-[10px] text-slate-500">
                    (
                    {current > 0
                      ? `${(((low - current) / current) * 100).toFixed(0)}%`
                      : ""}
                    )
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-surface-2/60 p-2.5 text-xs">
                <span className="text-slate-400">
                  {isZh ? "目标价跨度 (High - Low)" : "Target Spread"}
                </span>
                <span className="font-mono font-bold text-accent">
                  ${(high - low).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sources & Citations Section if Available */}
      {sources && sources.length > 0 && (
        <div className="glass-panel rounded-2xl border border-white/[0.08] p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <ExternalLink className="size-3.5 text-accent" />
            <span>{t.sourcesTitle}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {sources.map((source, idx) => (
              <a
                key={idx}
                href={source.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between rounded-xl border border-white/[0.06] bg-surface-1 p-3 transition-all hover:border-accent/40 hover:bg-surface-2"
              >
                <div>
                  <div className="line-clamp-2 text-xs font-semibold text-slate-200 transition-colors group-hover:text-accent">
                    {source.title}
                  </div>
                  {source.publisher && (
                    <div className="mt-1 text-[11px] text-slate-400">
                      {source.publisher}
                    </div>
                  )}
                </div>
                {source.date && (
                  <div className="mt-2 font-mono text-[10px] text-slate-500">
                    {source.date}
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
