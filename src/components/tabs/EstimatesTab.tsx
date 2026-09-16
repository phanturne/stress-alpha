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

  if (!estimatesData) {
    return (
      <div className="p-12 text-center text-sm text-slate-400 glass-panel rounded-xl">
        {t.empty}
      </div>
    );
  }

  const { consensus, priceTargets, synthesisNarrative, estimates = [], sources = [] } = estimatesData;
  const effectiveCurrentPrice = priceTargets?.currentPrice || propCurrentPrice || 0;

  // Rating badge styling helper
  const getRatingBadge = (rating: string) => {
    const r = rating.toLowerCase();
    if (r.includes("strong buy") || r.includes("strong-buy")) {
      return {
        className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        label: rating,
      };
    }
    if (r.includes("buy") || r.includes("overweight") || r.includes("outperform")) {
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
    if (r.includes("sell") || r.includes("underperform") || r.includes("underweight")) {
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
    return estimates
      .filter((item) => {
        const matchesSearch =
          item.firm.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.analyst && item.analyst.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;

        if (ratingFilter === "all") return true;
        const r = item.rating.toLowerCase();
        if (ratingFilter === "buy") {
          return r.includes("buy") || r.includes("outperform") || r.includes("overweight");
        }
        if (ratingFilter === "hold") {
          return r.includes("hold") || r.includes("neutral") || r.includes("equal");
        }
        if (ratingFilter === "sell") {
          return r.includes("sell") || r.includes("underperform") || r.includes("underweight");
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
  }, [estimates, searchTerm, ratingFilter, sortBy, sortOrder]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-wider mb-1">
            <Target className="w-4 h-4" />
            <span>{t.title}</span>
            {estimatesData.asOfDate && (
              <span className="text-slate-500 font-mono text-[11px] lowercase">
                • {estimatesData.asOfDate}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">{t.subtitle}</p>
        </div>

        {/* Global Summary Metric Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-surface-2 border border-white/[0.06] flex items-center gap-2">
            <span className="text-slate-400">{t.totalAnalysts}:</span>
            <span className="font-mono font-bold text-white">
              {consensus.totalAnalysts}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-surface-2 border border-white/[0.06] flex items-center gap-2">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1: Analyst Consensus (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-white/[0.08] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-white tracking-wide">
                  {t.consensusTitle}
                </h3>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  getRatingBadge(consensus.consensus).className
                }`}
              >
                {consensus.consensus}
              </span>
            </div>

            {/* Visual Multi-Segment Bar */}
            <div className="w-full h-2.5 bg-surface-3 rounded-full overflow-hidden flex gap-0.5 p-0.5 mb-5">
              <div
                style={{ width: `${consensus.bullishPct}%` }}
                className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                title={`Bullish: ${consensus.bullishPct}%`}
              />
              <div
                style={{ width: `${consensus.neutralPct}%` }}
                className="bg-amber-400 h-full transition-all duration-500"
                title={`Neutral: ${consensus.neutralPct}%`}
              />
              <div
                style={{ width: `${consensus.bearishPct}%` }}
                className="bg-rose-500 h-full rounded-r-full transition-all duration-500"
                title={`Bearish: ${consensus.bearishPct}%`}
              />
            </div>

            {/* Breakdown Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* Bullish */}
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex flex-col">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="font-medium">{t.bullish}</span>
                </div>
                <div className="text-lg font-bold font-mono text-white">
                  {consensus.bullishCount}
                </div>
                <div className="text-[11px] text-emerald-400/80 font-mono">
                  {consensus.bullishPct.toFixed(1)}%
                </div>
              </div>

              {/* Neutral */}
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 flex flex-col">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  <span className="font-medium">{t.neutral}</span>
                </div>
                <div className="text-lg font-bold font-mono text-white">
                  {consensus.neutralCount}
                </div>
                <div className="text-[11px] text-amber-400/80 font-mono">
                  {consensus.neutralPct.toFixed(1)}%
                </div>
              </div>

              {/* Bearish */}
              <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/15 flex flex-col">
                <div className="flex items-center gap-1.5 text-xs text-rose-400 mb-1">
                  <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                  <span className="font-medium">{t.bearish}</span>
                </div>
                <div className="text-lg font-bold font-mono text-white">
                  {consensus.bearishCount}
                </div>
                <div className="text-[11px] text-rose-400/80 font-mono">
                  {consensus.bearishPct.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] text-slate-400 flex items-center justify-between">
            <span>{isZh ? "华尔街卖方共识情绪" : "Wall Street Sentiment Momentum"}</span>
            <span className="text-slate-300 font-medium">
              {consensus.bullishPct >= 70
                ? isZh ? "🔥 极度看多 (High Conviction)" : "🔥 High Conviction Bullish"
                : consensus.bullishPct >= 50
                ? isZh ? "偏多共识 (Moderate Bull)" : "Moderate Bull"
                : isZh ? "观点分歧 (Divergent)" : "Divergent"}
            </span>
          </div>
        </div>

        {/* Card 2: Analyst 52W Price Targets (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl border border-white/[0.08] flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-white tracking-wide">
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
            <div className="pt-6 pb-8 px-3 relative">
              {/* Background Base Track */}
              <div className="relative w-full h-3 bg-surface-3 rounded-full">
                {/* Target Range Highlight Bar */}
                <div
                  className="absolute top-0 bottom-0 bg-accent/20 border-y border-accent/40 rounded-full"
                  style={{
                    left: `${Math.min(lowPct, highPct)}%`,
                    width: `${Math.abs(highPct - lowPct)}%`,
                  }}
                />

                {/* Low Target Tick */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300 -translate-x-1/2 shadow-sm"
                  style={{ left: `${lowPct}%` }}
                />

                {/* High Target Tick */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300 -translate-x-1/2 shadow-sm"
                  style={{ left: `${highPct}%` }}
                />

                {/* Average Target Marker (Prominent) */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 flex flex-col items-center"
                  style={{ left: `${avgPct}%` }}
                >
                  <div className="w-4 h-4 rounded-full bg-emerald-400 border-2 border-surface-0 shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
                  <div className="absolute top-5 flex flex-col items-center whitespace-nowrap">
                    <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded shadow-sm">
                      ${average.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {t.average}
                    </span>
                  </div>
                </div>

                {/* Current Price Pin (Distinct cyan/blue marker) */}
                {current > 0 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
                    style={{ left: `${curPct}%` }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-accent border-2 border-surface-0 shadow-[0_0_10px_rgba(56,189,248,0.7)]" />
                    <div className="absolute -top-7 flex flex-col items-center whitespace-nowrap">
                      <span className="text-[10px] font-mono font-bold text-white bg-accent/20 border border-accent/40 px-1.5 py-0.5 rounded">
                        {isZh ? "现价" : "Current"}: ${current.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Min and Max Target Labels */}
              <div className="flex justify-between text-xs font-mono text-slate-400 mt-5 pt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
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
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
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

          <div className="mt-2 pt-3 border-t border-white/[0.06] text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              {isZh
                ? `共识目标中枢: $${average.toFixed(2)} (${avgUpsidePct >= 0 ? "+" : ""}${avgUpsidePct.toFixed(1)}%)`
                : `Consensus Target Mean: $${average.toFixed(2)} (${avgUpsidePct >= 0 ? "+" : ""}${avgUpsidePct.toFixed(1)}%)`}
            </span>
            <span className="text-slate-300 font-mono">
              {isZh ? "偏度比 (High/Low): " : "Spread: "}
              {(high / (low || 1)).toFixed(2)}x
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Estimates Table (8 cols) + Ratings Synthesis Narrative (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Analyst Estimates Table (lg:col-span-8) */}
        <div className="lg:col-span-8 glass-panel rounded-2xl border border-white/[0.08] overflow-hidden flex flex-col">
          {/* Table Header & Controls */}
          <div className="p-4 sm:p-5 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-1/40">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                <span>{t.tableTitle}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-3 text-slate-300 font-mono">
                  {filteredEstimates.length}
                </span>
              </h3>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={isZh ? "搜索券商或分析师..." : "Search firm or analyst..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-surface-2/80 border border-white/[0.08] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent/50 w-36 sm:w-44"
                />
              </div>

              {/* Rating Filter Pills */}
              <div className="flex items-center bg-surface-2/80 rounded-lg p-0.5 border border-white/[0.08] text-xs">
                {(["all", "buy", "hold", "sell"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setRatingFilter(mode)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      ratingFilter === mode
                        ? "bg-accent/20 text-accent font-semibold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {mode === "all"
                      ? isZh ? "全部" : "All"
                      : mode === "buy"
                      ? isZh ? "看多" : "Buy"
                      : mode === "hold"
                      ? isZh ? "中性" : "Hold"
                      : isZh ? "看空" : "Sell"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-400 font-medium bg-surface-0/40">
                  <th className="py-3 px-4">{t.colFirm}</th>
                  <th className="py-3 px-3">{t.colRating}</th>
                  <th className="py-3 px-4 text-right">{t.colTarget}</th>
                  <th className="py-3 px-3 text-right">{t.colUpside}</th>
                  <th className="py-3 px-4 text-right">{t.colDate}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredEstimates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                      {isZh ? "未找到匹配的分析师评级记录" : "No matching analyst estimates found"}
                    </td>
                  </tr>
                ) : (
                  filteredEstimates.map((item, idx) => {
                    const ratingStyle = getRatingBadge(item.rating);
                    const actionStyle = getActionBadge(item.action);

                    return (
                      <tr
                        key={`${item.firm}-${idx}`}
                        className="hover:bg-surface-2/40 transition-colors group"
                      >
                        {/* Firm & Analyst */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{item.firm}</span>
                              {actionStyle && item.action && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded border inline-flex items-center gap-0.5 font-medium ${actionStyle.className}`}
                                >
                                  <actionStyle.icon className="w-2.5 h-2.5" />
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
                              <span className="text-[10px] text-slate-500 mt-1 line-clamp-1 italic group-hover:line-clamp-none transition-all">
                                &quot;{item.notes}&quot;
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Rating */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${ratingStyle.className}`}
                          >
                            {ratingStyle.label}
                          </span>
                        </td>

                        {/* 52W Price Target */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-bold text-white text-sm">
                              ${item.priceTarget.toFixed(2)}
                            </span>
                            {item.priorPriceTarget && (
                              <span className="text-[11px] text-slate-400 font-mono">
                                {t.fromPrior} ${item.priorPriceTarget.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Upside % */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <span
                            className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-xs ${
                              item.upsidePct >= 0
                                ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                                : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                            }`}
                          >
                            {item.upsidePct >= 0 ? "+" : ""}
                            {item.upsidePct.toFixed(1)}%
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px] whitespace-nowrap">
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
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Narrative Card */}
          <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/[0.08]">
              <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                {t.synthesisTitle}
              </h3>
            </div>

            <div className="relative pl-3 border-l-2 border-accent/60 my-2">
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {synthesisNarrative}
              </p>
            </div>

            {/* Quick Synthesis Highlights */}
            <div className="mt-auto pt-4 border-t border-white/[0.06] space-y-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {isZh ? "共识核心特征" : "Consensus Anatomy"}
              </div>

              <div className="p-2.5 rounded-xl bg-surface-2/60 border border-white/[0.04] flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {isZh ? "最高目标券商" : "Street High"}
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  ${high.toFixed(2)}{" "}
                  <span className="text-[10px] text-slate-500">
                    ({current > 0 ? `+${(((high - current) / current) * 100).toFixed(0)}%` : ""})
                  </span>
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-2/60 border border-white/[0.04] flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {isZh ? "最低目标券商" : "Street Low"}
                </span>
                <span className="font-mono font-bold text-slate-300">
                  ${low.toFixed(2)}{" "}
                  <span className="text-[10px] text-slate-500">
                    ({current > 0 ? `${(((low - current) / current) * 100).toFixed(0)}%` : ""})
                  </span>
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-2/60 border border-white/[0.04] flex items-center justify-between text-xs">
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
        <div className="glass-panel p-5 rounded-2xl border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <ExternalLink className="w-3.5 h-3.5 text-accent" />
            <span>{t.sourcesTitle}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sources.map((source, idx) => (
              <a
                key={idx}
                href={source.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-surface-1 border border-white/[0.06] hover:border-accent/40 hover:bg-surface-2 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-accent transition-colors line-clamp-2">
                    {source.title}
                  </div>
                  {source.publisher && (
                    <div className="text-[11px] text-slate-400 mt-1">
                      {source.publisher}
                    </div>
                  )}
                </div>
                {source.date && (
                  <div className="text-[10px] text-slate-500 font-mono mt-2">
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
