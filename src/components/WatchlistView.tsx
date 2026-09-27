"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Shield,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  Star,
  LayoutGrid,
  Table as TableIcon,
  TrendingUp,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";
import { Skeleton } from "./ui/Skeleton";
import { MiniSnowflakeRadar } from "./snowflake/MiniSnowflakeRadar";
import type { ReportSummary } from "@/lib/repository";
import { formatCurrency, formatPercent, normalizeTicker } from "@/lib/utils";
import { getTranslations, type Locale } from "@/lib/i18n";
import { useWatchlist } from "@/lib/watchlist";
import Link from "next/link";

export interface WatchlistViewProps {
  reports: ReportSummary[];
  onSelectReport: (slug: string, mode?: "cockpit" | "memo") => void;
  locale?: Locale;
  isLoading?: boolean;
}

type MoatFilter = "all" | "wide" | "narrow";
type DivergenceFilter =
  | "all"
  | "extreme_divergence"
  | "high_conviction_alpha"
  | "moderate_alpha"
  | "in_line";

type SortField =
  | "upside"
  | "baseUpside"
  | "divergence"
  | "snowflake"
  | "price"
  | "ticker"
  | "opMargin"
  | "revGrowth";

type SortDirection = "asc" | "desc";

interface WatchlistTickerGroup {
  ticker: string;
  company: string;
  latestReport: ReportSummary;
  historicalReports: ReportSummary[];
  allReports: ReportSummary[];
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  reports,
  onSelectReport,
  locale = "en",
  isLoading = false,
}) => {
  const t = getTranslations(locale);
  const tw = t.watchlistPage;

  const { isFavorite, toggleFavorite, count: watchlistCount } = useWatchlist();
  const [searchQuery, setSearchQuery] = useState("");
  const [moatFilter, setMoatFilter] = useState<MoatFilter>("all");
  const [divergenceFilter, setDivergenceFilter] =
    useState<DivergenceFilter>("all");
  const [sortField, setSortField] = useState<SortField>("upside");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Adaptive default view mode for desktop vs mobile
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 1024px)");
    if (mql.matches) {
      const frame = requestAnimationFrame(() => setViewMode("cards"));
      return () => cancelAnimationFrame(frame);
    }
  }, []);

  // Group all favorited reports by ticker symbol
  const tickerGroups = useMemo<WatchlistTickerGroup[]>(() => {
    const favoritedReports = reports.filter((r) =>
      isFavorite(r.ticker || r.slug)
    );

    const groupMap = new Map<string, ReportSummary[]>();

    for (const report of favoritedReports) {
      const symbol = normalizeTicker(report.ticker || report.slug);
      if (!symbol) continue;
      const existing = groupMap.get(symbol);
      if (existing) {
        existing.push(report);
      } else {
        groupMap.set(symbol, [report]);
      }
    }

    const groups: WatchlistTickerGroup[] = [];

    groupMap.forEach((reps, symbol) => {
      // Sort reports by quarter descending (latest first)
      const sorted = [...reps].sort((a, b) => {
        const dateA = a.reportDate || "";
        const dateB = b.reportDate || "";
        if (dateA && dateB) return dateB.localeCompare(dateA);
        const qA = a.quarter || "";
        const qB = b.quarter || "";
        return qB.localeCompare(qA);
      });

      const latestReport = sorted[0];
      const historicalReports = sorted.slice(1);

      groups.push({
        ticker: symbol,
        company: latestReport.company || symbol,
        latestReport,
        historicalReports,
        allReports: sorted,
      });
    });

    return groups;
  }, [reports, isFavorite]);

  // Aggregate portfolio metrics across tracked tickers
  const portfolioStats = useMemo(() => {
    const count = tickerGroups.length;
    if (count === 0) {
      return {
        trackedCount: 0,
        avgUpside: 0,
        convictionLeader: null,
        wideMoatShare: 0,
        avgSnowflake: 0,
      };
    }

    let totalUpside = 0;
    let wideMoatCount = 0;
    let totalSnowflake = 0;
    let leader: ReportSummary | null = null;
    let maxUpside = -Infinity;

    for (const g of tickerGroups) {
      const r = g.latestReport;
      const upside = r.upsidePct ?? 0;
      totalUpside += upside;
      if (upside > maxUpside) {
        maxUpside = upside;
        leader = r;
      }
      if (r.moatRating?.toLowerCase() === "wide") {
        wideMoatCount++;
      }
      totalSnowflake += r.snowflakeScore ?? 0;
    }

    return {
      trackedCount: count,
      avgUpside: totalUpside / count,
      convictionLeader: leader,
      wideMoatShare: Math.round((wideMoatCount / count) * 100),
      avgSnowflake: (totalSnowflake / count).toFixed(1),
    };
  }, [tickerGroups]);

  // Filtered and sorted ticker groups
  const filteredGroups = useMemo(() => {
    let result = [...tickerGroups];

    // Search query filter (ticker, company, divergence tier)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((g) => {
        const tMatch = g.ticker.toLowerCase().includes(q);
        const cMatch = g.company.toLowerCase().includes(q);
        const tierMatch =
          g.latestReport.divergenceClassification?.toLowerCase().includes(q) ??
          false;
        return tMatch || cMatch || tierMatch;
      });
    }

    // Moat filter
    if (moatFilter !== "all") {
      result = result.filter(
        (g) => g.latestReport.moatRating?.toLowerCase() === moatFilter
      );
    }

    // Divergence Tier filter
    if (divergenceFilter !== "all") {
      result = result.filter(
        (g) => g.latestReport.divergenceClassification === divergenceFilter
      );
    }

    // Sort
    result.sort((a, b) => {
      const rA = a.latestReport;
      const rB = b.latestReport;
      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (sortField) {
        case "upside":
          valA = rA.upsidePct ?? -999;
          valB = rB.upsidePct ?? -999;
          break;
        case "baseUpside":
          valA = rA.baseUpsidePct ?? -999;
          valB = rB.baseUpsidePct ?? -999;
          break;
        case "divergence":
          valA = rA.consensusSpreadPct ?? -999;
          valB = rB.consensusSpreadPct ?? -999;
          break;
        case "snowflake":
          valA = rA.snowflakeScore ?? 0;
          valB = rB.snowflakeScore ?? 0;
          break;
        case "price":
          valA = rA.currentPrice ?? 0;
          valB = rB.currentPrice ?? 0;
          break;
        case "ticker":
          valA = a.ticker;
          valB = b.ticker;
          break;
        case "opMargin":
          valA = rA.operatingMarginPct ?? -999;
          valB = rB.operatingMarginPct ?? -999;
          break;
        case "revGrowth":
          valA = rA.revenueGrowthPct ?? -999;
          valB = rB.revenueGrowthPct ?? -999;
          break;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      const numA = Number(valA);
      const numB = Number(valB);
      return sortDirection === "asc" ? numA - numB : numB - numA;
    });

    return result;
  }, [
    tickerGroups,
    searchQuery,
    moatFilter,
    divergenceFilter,
    sortField,
    sortDirection,
  ]);

  // Suggested popular tickers for quick-add empty state
  const popularSuggestions = useMemo(() => {
    const unstarred = new Map<string, ReportSummary>();
    for (const r of reports) {
      const symbol = normalizeTicker(r.ticker || r.slug);
      if (symbol && !isFavorite(symbol) && !unstarred.has(symbol)) {
        unstarred.set(symbol, r);
      }
    }
    return Array.from(unstarred.values()).slice(0, 6);
  }, [reports, isFavorite]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getDivergenceBadge = (
    tier?:
      | "in_line"
      | "moderate_alpha"
      | "high_conviction_alpha"
      | "extreme_divergence",
    spreadPct?: number
  ) => {
    if (!tier) return null;
    const label = tw.divergenceTiers[tier] || tier;

    let badgeClass = "border-slate-500/30 bg-slate-500/10 text-slate-300";
    if (tier === "extreme_divergence") {
      badgeClass =
        "border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.15)]";
    } else if (tier === "high_conviction_alpha") {
      badgeClass =
        "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]";
    } else if (tier === "moderate_alpha") {
      badgeClass = "border-sky-500/30 bg-sky-500/15 text-sky-300";
    }

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide ${badgeClass}`}
      >
        <Sparkles className="size-2.5 shrink-0" />
        <span>{label}</span>
        {spreadPct !== undefined && (
          <span className="opacity-90">
            ({spreadPct >= 0 ? "+" : ""}
            {spreadPct.toFixed(1)}%)
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-sm">
              <Star className="size-5 fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            </div>
            <div>
              <h1 className="font-mono text-xl font-black tracking-tight text-white sm:text-2xl">
                {tw.title}
              </h1>
              <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">
                {tw.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Segmented Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center rounded-xl border border-white/[0.08] bg-surface-1/80 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === "cards"
                  ? "bg-surface-3 font-bold text-accent shadow-sm ring-1 ring-white/10"
                  : "text-slate-400 hover:text-white"
              }`}
              title={tw.viewCards}
            >
              <LayoutGrid className="size-3.5" />
              <span>{tw.viewCards}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-surface-3 font-bold text-accent shadow-sm ring-1 ring-white/10"
                  : "text-slate-400 hover:text-white"
              }`}
              title={tw.viewTable}
            >
              <TableIcon className="size-3.5" />
              <span>{tw.viewTable}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Portfolio Summary KPI Strip (when watchlist has items) */}
      {tickerGroups.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {/* 1. Tracked Equities */}
          <div className="glass-panel flex flex-col justify-between rounded-xl border border-white/[0.08] p-3.5 shadow-sm">
            <span className="text-[11px] font-medium text-slate-400">
              {tw.statsTracked}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-black text-white">
                {portfolioStats.trackedCount}
              </span>
              <span className="font-mono text-[10px] text-amber-400">
                ★ Core
              </span>
            </div>
          </div>

          {/* 2. Avg Fair Value Upside */}
          <div className="glass-panel flex flex-col justify-between rounded-xl border border-white/[0.08] p-3.5 shadow-sm">
            <span className="text-[11px] font-medium text-slate-400">
              {tw.statsAvgUpside}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={`font-mono text-2xl font-black ${
                  portfolioStats.avgUpside >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {portfolioStats.avgUpside >= 0 ? "+" : ""}
                {portfolioStats.avgUpside.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* 3. Conviction Leader */}
          <div className="glass-panel flex flex-col justify-between rounded-xl border border-white/[0.08] p-3.5 shadow-sm">
            <span className="text-[11px] font-medium text-slate-400">
              {tw.statsConvictionLeader}
            </span>
            <div className="mt-1 flex items-baseline gap-1.5 truncate">
              {portfolioStats.convictionLeader ? (
                <>
                  <span className="font-mono text-lg font-black text-white">
                    {portfolioStats.convictionLeader.ticker}
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    +
                    {(portfolioStats.convictionLeader.upsidePct ?? 0).toFixed(
                      1
                    )}
                    %
                  </span>
                </>
              ) : (
                <span className="font-mono text-sm text-slate-500">—</span>
              )}
            </div>
          </div>

          {/* 4. Wide Moat Share */}
          <div className="glass-panel flex flex-col justify-between rounded-xl border border-white/[0.08] p-3.5 shadow-sm">
            <span className="text-[11px] font-medium text-slate-400">
              {tw.statsWideMoat}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-black text-purple-300">
                {portfolioStats.wideMoatShare}%
              </span>
            </div>
          </div>

          {/* 5. Avg Snowflake Health */}
          <div className="glass-panel col-span-2 flex flex-col justify-between rounded-xl border border-white/[0.08] p-3.5 shadow-sm sm:col-span-1">
            <span className="text-[11px] font-medium text-slate-400">
              {tw.statsAvgSnowflake}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-mono text-2xl font-black text-cyan-300">
                {portfolioStats.avgSnowflake}
              </span>
              <span className="font-mono text-xs text-slate-500">/ 30</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      {tickerGroups.length > 0 && (
        <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] p-3 sm:p-4">
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tw.searchPlaceholder}
              className="w-full rounded-xl border border-white/[0.08] bg-surface-1/90 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Moat & Divergence Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Moat Filter */}
            <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-surface-1/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => setMoatFilter("all")}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  moatFilter === "all"
                    ? "bg-surface-3 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All Moats
              </button>
              <button
                type="button"
                onClick={() => setMoatFilter("wide")}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  moatFilter === "wide"
                    ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Wide Moat
              </button>
              <button
                type="button"
                onClick={() => setMoatFilter("narrow")}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  moatFilter === "narrow"
                    ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Narrow
              </button>
            </div>

            {/* Divergence Tier Filter */}
            <select
              value={divergenceFilter}
              onChange={(e) =>
                setDivergenceFilter(e.target.value as DivergenceFilter)
              }
              className="rounded-xl border border-white/[0.08] bg-surface-1/90 px-3 py-1.5 font-mono text-[11px] text-slate-300 focus:border-accent focus:outline-none"
            >
              <option value="all">All Divergence Tiers</option>
              <option value="extreme_divergence">
                {tw.divergenceTiers.extreme_divergence}
              </option>
              <option value="high_conviction_alpha">
                {tw.divergenceTiers.high_conviction_alpha}
              </option>
              <option value="moderate_alpha">
                {tw.divergenceTiers.moderate_alpha}
              </option>
              <option value="in_line">{tw.divergenceTiers.in_line}</option>
            </select>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-panel space-y-4 rounded-2xl border border-white/[0.08] p-5"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State Experience (0 items in watchlist) */}
      {!isLoading && tickerGroups.length === 0 && (
        <div className="glass-panel mx-auto my-8 flex max-w-2xl flex-col items-center gap-6 rounded-3xl border border-white/[0.08] p-8 text-center shadow-2xl sm:p-12">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.2)]">
            <Star className="size-8 fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
          </div>

          <div className="space-y-2">
            <h2 className="font-mono text-2xl font-black tracking-tight text-white">
              {tw.emptyTitle}
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-slate-400">
              {tw.emptyDesc}
            </p>
          </div>

          <Link
            href="/screener"
            className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-mono text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] hover:bg-accent/90 active:scale-[0.98]"
          >
            <BarChart3 className="size-4" />
            <span>{tw.exploreScreenerBtn}</span>
          </Link>

          {/* Quick-add popular recommendations */}
          {popularSuggestions.length > 0 && (
            <div className="mt-4 w-full border-t border-white/[0.08] pt-6">
              <div className="mb-3 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {tw.quickAddSuggestions}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {popularSuggestions.map((report) => {
                  const symbol = report.ticker || report.slug.split("-")[0];
                  return (
                    <button
                      key={report.slug}
                      type="button"
                      onClick={() => toggleFavorite(symbol)}
                      className="group flex items-center gap-2 rounded-xl border border-white/[0.08] bg-surface-1/90 px-3 py-2 text-xs transition-all hover:border-amber-500/40 hover:bg-surface-2 hover:text-white"
                    >
                      <Plus className="size-3.5 text-amber-400 transition-transform group-hover:scale-125" />
                      <span className="font-mono font-bold text-white">
                        {symbol}
                      </span>
                      {report.company && (
                        <span className="max-w-[120px] truncate text-[11px] text-slate-400">
                          {report.company}
                        </span>
                      )}
                      {report.upsidePct !== undefined && (
                        <span
                          className={`font-mono text-[10px] font-bold ${
                            report.upsidePct >= 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          {report.upsidePct >= 0 ? "+" : ""}
                          {report.upsidePct.toFixed(0)}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No results for current filter */}
      {!isLoading && tickerGroups.length > 0 && filteredGroups.length === 0 && (
        <div className="glass-panel my-8 rounded-2xl border border-white/[0.08] p-8 text-center text-slate-400">
          <p className="text-sm">No tracked equities match your filters.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setMoatFilter("all");
              setDivergenceFilter("all");
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] px-3 py-1.5 text-xs text-white hover:bg-surface-2"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* CARDS VIEW MODE */}
      {!isLoading && viewMode === "cards" && filteredGroups.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredGroups.map((group) => {
            const report = group.latestReport;
            const price = report.currentPrice ?? 0;
            const wfv = report.weightedFairValue ?? 0;
            const baseFv = report.baseFairValue ?? 0;
            const bull = report.bullFairValue ?? wfv * 1.3;
            const bear = report.bearFairValue ?? wfv * 0.7;
            const upside = report.upsidePct ?? 0;
            const baseUpside = report.baseUpsidePct ?? 0;
            const isPositive = upside >= 0;

            const rangeSpan = Math.max(bull - bear, 1);
            const pricePos = Math.min(
              100,
              Math.max(0, ((price - bear) / rangeSpan) * 100)
            );
            const basePos = Math.min(
              100,
              Math.max(0, ((baseFv - bear) / rangeSpan) * 100)
            );
            const wfvPos = Math.min(
              100,
              Math.max(0, ((wfv - bear) / rangeSpan) * 100)
            );

            const pillars = report.snowflakePillars ?? {
              valuation: 4,
              future: 4,
              earnings: 4,
              moat: 4,
              resilience: 4,
            };

            return (
              <div
                key={group.ticker}
                className="glass-panel group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] p-5 shadow-lg transition-all duration-200 hover:border-amber-500/40 hover:bg-surface-2/60"
              >
                <div>
                  {/* Card Header: Ticker, Company, Moat, Divergence Badge, Star */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(group.ticker);
                        }}
                        className="-mt-0.5 shrink-0 p-1 text-amber-400 transition-transform hover:scale-110"
                        title={tw.removeFromWatchlist}
                        aria-label={tw.removeFromWatchlist}
                      >
                        <Star className="size-5 fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg font-black tracking-tight text-white group-hover:text-accent">
                            {group.ticker}
                          </span>
                          {report.quarter && (
                            <span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-300">
                              {report.quarter}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-slate-400">
                          {group.company}
                        </p>
                      </div>
                    </div>

                    {/* Right Badges: Moat Badge */}
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {report.moatRating && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            report.moatRating.toLowerCase() === "wide"
                              ? "border border-purple-500/30 bg-purple-500/10 text-purple-300"
                              : "border border-sky-500/30 bg-sky-500/10 text-sky-300"
                          }`}
                        >
                          <Shield className="size-2.5" />
                          <span>{report.moatRating} Moat</span>
                          {report.moatTrend && (
                            <span className="font-mono text-[9px]">
                              {report.moatTrend === "Widening"
                                ? "↗"
                                : report.moatTrend === "Narrowing"
                                  ? "↘"
                                  : "→"}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Consensus Divergence Tier Ribbon */}
                  {report.divergenceClassification && (
                    <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-2.5">
                      <span className="text-[10px] font-medium text-slate-400">
                        {tw.consensusDivergence}
                      </span>
                      {getDivergenceBadge(
                        report.divergenceClassification,
                        report.consensusSpreadPct
                      )}
                    </div>
                  )}

                  {/* 4-Regime Pricing Telemetry Grid */}
                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-white/[0.06] bg-surface-0/60 p-3">
                    <div>
                      <div className="text-[10px] font-medium text-slate-400">
                        {tw.colPrice}
                      </div>
                      <div className="mt-0.5 font-mono text-sm font-bold text-white">
                        {price > 0 ? formatCurrency(price) : "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-medium text-slate-400">
                        {tw.colBaseFv}
                      </div>
                      <div className="mt-0.5 font-mono text-sm font-semibold text-slate-200">
                        {baseFv > 0 ? formatCurrency(baseFv) : "—"}
                      </div>
                      {baseFv > 0 && (
                        <div
                          className={`font-mono text-[10px] font-bold ${
                            baseUpside >= 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          {baseUpside >= 0 ? "+" : ""}
                          {baseUpside.toFixed(1)}%
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-bold text-accent">
                        {tw.colWfv}
                      </div>
                      <div className="mt-0.5 font-mono text-sm font-black text-accent">
                        {wfv > 0 ? formatCurrency(wfv) : "—"}
                      </div>
                      {wfv > 0 && (
                        <div
                          className={`inline-flex items-center gap-0.5 font-mono text-[10px] font-bold ${
                            isPositive ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="size-2.5" />
                          ) : (
                            <ArrowDownRight className="size-2.5" />
                          )}
                          {isPositive ? "+" : ""}
                          {upside.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4-Regime Valuation Bounds Spectrum Bar */}
                  {price > 0 && bull > bear && (
                    <div className="mt-3.5 space-y-1.5 rounded-lg border border-white/[0.04] bg-surface-0/40 p-2.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                          {tw.regimeSpectrum}
                        </span>
                        {report.analystTarget && report.analystTarget > 0 && (
                          <span className="font-mono text-[10px] text-slate-300">
                            Consensus:{" "}
                            <strong className="text-white">
                              ${Math.round(report.analystTarget)}
                            </strong>
                          </span>
                        )}
                      </div>
                      <div className="relative h-2 w-full rounded-full bg-surface-3">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500/30 via-slate-500/20 to-emerald-500/30" />
                        {/* Base marker */}
                        <div
                          style={{ left: `${basePos}%` }}
                          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300 bg-sky-400 shadow-sm"
                          title={`Base: ${formatCurrency(baseFv)}`}
                        />
                        {/* WFV marker */}
                        <div
                          style={{ left: `${wfvPos}%` }}
                          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-emerald-300 bg-emerald-400 shadow-sm"
                          title={`WFV: ${formatCurrency(wfv)}`}
                        />
                        {/* Current price marker */}
                        <div
                          style={{ left: `${pricePos}%` }}
                          className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-accent shadow ring-2 ring-accent/30"
                          title={`Price: ${formatCurrency(price)}`}
                        />
                      </div>
                      <div className="flex items-center justify-between font-mono text-[9px] tabular-nums text-slate-500">
                        <span>Bear ${Math.round(bear)}</span>
                        <span className="flex items-center gap-1 text-sky-400">
                          <span className="size-1.5 rounded-full bg-sky-400" />
                          Base ${Math.round(baseFv)}
                        </span>
                        <span>Bull ${Math.round(bull)}</span>
                      </div>
                    </div>
                  )}

                  {/* 5-Pillar Snowflake Radar & Score Breakdown */}
                  <div className="mt-3.5 rounded-xl border border-white/[0.06] bg-surface-0/60 p-3">
                    <div className="flex items-center justify-between border-b border-white/[0.05] pb-2 text-[10px]">
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        {tw.snowflakeBreakdown}
                      </span>
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white">
                        <span>{report.snowflakeScore ?? 0}</span>
                        <span className="text-[10px] text-slate-500">/ 30</span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center gap-3">
                      {/* Left: Mini Radar */}
                      <div className="shrink-0">
                        <MiniSnowflakeRadar
                          score={report.snowflakeScore}
                          tier={report.snowflakeTier}
                          pillars={report.snowflakePillars}
                          size={46}
                        />
                      </div>

                      {/* Right: 5 Individual Pillar Progress Bars */}
                      <div className="flex-1 space-y-1 font-mono text-[10px]">
                        {/* Valuation */}
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate text-slate-400">
                            {tw.pillarLabels.valuation}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-12 rounded-full bg-surface-3">
                              <div
                                style={{
                                  width: `${((pillars.valuation ?? 0) / 6) * 100}%`,
                                }}
                                className="h-full rounded-full bg-emerald-400"
                              />
                            </div>
                            <span className="text-[9px] text-slate-300">
                              {pillars.valuation ?? 0}/6
                            </span>
                          </div>
                        </div>

                        {/* Future Growth */}
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate text-slate-400">
                            {tw.pillarLabels.future}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-12 rounded-full bg-surface-3">
                              <div
                                style={{
                                  width: `${((pillars.future ?? 0) / 6) * 100}%`,
                                }}
                                className="h-full rounded-full bg-cyan-400"
                              />
                            </div>
                            <span className="text-[9px] text-slate-300">
                              {pillars.future ?? 0}/6
                            </span>
                          </div>
                        </div>

                        {/* Earnings Quality */}
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate text-slate-400">
                            {tw.pillarLabels.earnings}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-12 rounded-full bg-surface-3">
                              <div
                                style={{
                                  width: `${((pillars.earnings ?? 0) / 6) * 100}%`,
                                }}
                                className="h-full rounded-full bg-indigo-400"
                              />
                            </div>
                            <span className="text-[9px] text-slate-300">
                              {pillars.earnings ?? 0}/6
                            </span>
                          </div>
                        </div>

                        {/* Moat */}
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate text-slate-400">
                            {tw.pillarLabels.moat}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-12 rounded-full bg-surface-3">
                              <div
                                style={{
                                  width: `${((pillars.moat ?? 0) / 6) * 100}%`,
                                }}
                                className="h-full rounded-full bg-amber-400"
                              />
                            </div>
                            <span className="text-[9px] text-slate-300">
                              {pillars.moat ?? 0}/6
                            </span>
                          </div>
                        </div>

                        {/* Resilience */}
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate text-slate-400">
                            {tw.pillarLabels.resilience}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-12 rounded-full bg-surface-3">
                              <div
                                style={{
                                  width: `${((pillars.resilience ?? 0) / 6) * 100}%`,
                                }}
                                className="h-full rounded-full bg-rose-400"
                              />
                            </div>
                            <span className="text-[9px] text-slate-300">
                              {pillars.resilience ?? 0}/6
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Growth & Operating Margins */}
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-white/[0.04] bg-surface-0/40 px-3 py-2 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span>Rev Growth:</span>
                      <strong
                        className={`font-bold ${
                          (report.revenueGrowthPct ?? 0) >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {report.revenueGrowthPct !== undefined
                          ? formatPercent(report.revenueGrowthPct)
                          : "—"}
                      </strong>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span>Op Margin:</span>
                      <strong className="font-bold text-slate-200">
                        {report.operatingMarginPct !== undefined
                          ? `${report.operatingMarginPct.toFixed(1)}%`
                          : "—"}
                      </strong>
                    </div>
                  </div>

                  {/* Historical Quarters Pills (if multi-quarter exists) */}
                  {group.allReports.length > 1 && (
                    <div className="mt-3 space-y-1">
                      <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                        {tw.quarterlyHistory} ({group.allReports.length})
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        {group.allReports.map((qRep, idx) => {
                          const isLatest = idx === 0;
                          return (
                            <button
                              key={qRep.slug}
                              type="button"
                              onClick={() =>
                                onSelectReport(qRep.slug, "cockpit")
                              }
                              className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold transition-all ${
                                isLatest
                                  ? "bg-accent/20 text-accent ring-1 ring-accent/30 hover:bg-accent/30"
                                  : "bg-surface-3 text-slate-400 hover:bg-surface-2 hover:text-white"
                              }`}
                              title={`Open ${qRep.quarter || qRep.slug}`}
                            >
                              {qRep.quarter || qRep.slug.split("-")[1] || "Q"}
                              {isLatest && " •"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-3">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(group.ticker)}
                    className="flex items-center gap-1 text-[11px] text-slate-500 transition-colors hover:text-rose-400"
                    title={tw.removeFromWatchlist}
                  >
                    <Trash2 className="size-3" />
                    <span>{tw.removeFromWatchlist}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectReport(report.slug, "memo")}
                      className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-surface-2/80 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:bg-surface-3 hover:text-white"
                    >
                      <FileText className="size-3 text-slate-400" />
                      <span>{tw.openMemo}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectReport(report.slug, "cockpit")}
                      className="flex items-center gap-1 rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-bold text-accent ring-1 ring-accent/30 transition-all hover:bg-accent/25 hover:text-white"
                    >
                      <SlidersHorizontal className="size-3" />
                      <span>{tw.openCockpit}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MATRIX TABLE VIEW MODE */}
      {!isLoading && viewMode === "table" && filteredGroups.length > 0 && (
        <div className="glass-panel overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-surface-1/90 text-[11px] font-semibold text-slate-400">
                  <th className="py-3 pl-4 pr-2">
                    <button
                      type="button"
                      onClick={() => handleSort("ticker")}
                      className="flex items-center gap-1 hover:text-white"
                    >
                      <span>Ticker</span>
                      <ArrowUpDown className="size-3 text-slate-500" />
                    </button>
                  </th>
                  <th className="px-2 py-3">{tw.colMoat}</th>
                  <th className="px-2 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort("price")}
                      className="flex items-center gap-1 hover:text-white"
                    >
                      <span>{tw.colPrice}</span>
                      <ArrowUpDown className="size-3 text-slate-500" />
                    </button>
                  </th>
                  <th className="px-2 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort("baseUpside")}
                      className="flex items-center gap-1 hover:text-white"
                    >
                      <span>{tw.colBaseFv}</span>
                      <ArrowUpDown className="size-3 text-slate-500" />
                    </button>
                  </th>
                  <th className="px-2 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort("upside")}
                      className="flex items-center gap-1 text-accent hover:text-white"
                    >
                      <span>{tw.colWfv}</span>
                      <ArrowUpDown className="size-3 text-accent" />
                    </button>
                  </th>
                  <th className="px-2 py-3">{tw.colConsensus}</th>
                  <th className="px-2 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort("divergence")}
                      className="flex items-center gap-1 hover:text-white"
                    >
                      <span>{tw.colDivergence}</span>
                      <ArrowUpDown className="size-3 text-slate-500" />
                    </button>
                  </th>
                  <th className="px-2 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort("opMargin")}
                      className="flex items-center gap-1 hover:text-white"
                    >
                      <span>{tw.colGrowthMargin}</span>
                      <ArrowUpDown className="size-3 text-slate-500" />
                    </button>
                  </th>
                  <th className="px-2 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort("snowflake")}
                      className="flex items-center gap-1 hover:text-white"
                    >
                      <span>{tw.colSnowflake}</span>
                      <ArrowUpDown className="size-3 text-slate-500" />
                    </button>
                  </th>
                  <th className="px-2 py-3">{tw.quarterlyHistory}</th>
                  <th className="py-3 pl-2 pr-4 text-right">{tw.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredGroups.map((group) => {
                  const report = group.latestReport;
                  const price = report.currentPrice ?? 0;
                  const wfv = report.weightedFairValue ?? 0;
                  const baseFv = report.baseFairValue ?? 0;
                  const upside = report.upsidePct ?? 0;
                  const baseUpside = report.baseUpsidePct ?? 0;
                  const isPositive = upside >= 0;

                  return (
                    <tr
                      key={group.ticker}
                      className="group transition-colors hover:bg-surface-2/60"
                    >
                      {/* Ticker & Company */}
                      <td className="py-3 pl-4 pr-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleFavorite(group.ticker)}
                            className="text-amber-400 hover:scale-110"
                            title={tw.removeFromWatchlist}
                          >
                            <Star className="size-4 fill-amber-400 text-amber-400" />
                          </button>
                          <div>
                            <div className="font-bold text-white group-hover:text-accent">
                              {group.ticker}
                            </div>
                            <div className="max-w-[120px] truncate text-[10px] text-slate-400">
                              {group.company}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Moat */}
                      <td className="px-2 py-3">
                        {report.moatRating ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              report.moatRating.toLowerCase() === "wide"
                                ? "border border-purple-500/30 bg-purple-500/10 text-purple-300"
                                : "border border-sky-500/30 bg-sky-500/10 text-sky-300"
                            }`}
                          >
                            {report.moatRating}
                            {report.moatTrend && (
                              <span className="text-[9px]">
                                {report.moatTrend === "Widening" ? "↗" : "→"}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Current Price */}
                      <td className="px-2 py-3 font-semibold text-slate-200">
                        {price > 0 ? formatCurrency(price) : "—"}
                      </td>

                      {/* Base Fair Value */}
                      <td className="px-2 py-3">
                        <div className="font-semibold text-slate-300">
                          {baseFv > 0 ? formatCurrency(baseFv) : "—"}
                        </div>
                        {baseFv > 0 && (
                          <div
                            className={`text-[10px] ${
                              baseUpside >= 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            {baseUpside >= 0 ? "+" : ""}
                            {baseUpside.toFixed(1)}%
                          </div>
                        )}
                      </td>

                      {/* Weighted Fair Value */}
                      <td className="px-2 py-3">
                        <div className="font-bold text-accent">
                          {wfv > 0 ? formatCurrency(wfv) : "—"}
                        </div>
                        {wfv > 0 && (
                          <div
                            className={`text-[10px] font-bold ${
                              isPositive ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {upside.toFixed(1)}%
                          </div>
                        )}
                      </td>

                      {/* Consensus Target */}
                      <td className="px-2 py-3">
                        {report.analystTarget && report.analystTarget > 0 ? (
                          <div>
                            <span className="font-bold text-slate-200">
                              ${Math.round(report.analystTarget)}
                            </span>
                            {report.analystRating && (
                              <div className="text-[9px] text-slate-400">
                                {report.analystRating}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Consensus Divergence Spread & Tier */}
                      <td className="px-2 py-3">
                        {getDivergenceBadge(
                          report.divergenceClassification,
                          report.consensusSpreadPct
                        )}
                      </td>

                      {/* Growth & Op Margin */}
                      <td className="px-2 py-3 text-[10px]">
                        <div className="text-slate-300">
                          Rev:{" "}
                          <span
                            className={
                              (report.revenueGrowthPct ?? 0) >= 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }
                          >
                            {report.revenueGrowthPct !== undefined
                              ? formatPercent(report.revenueGrowthPct)
                              : "—"}
                          </span>
                        </div>
                        <div className="text-slate-400">
                          OpM:{" "}
                          <span className="text-slate-200">
                            {report.operatingMarginPct !== undefined
                              ? `${report.operatingMarginPct.toFixed(1)}%`
                              : "—"}
                          </span>
                        </div>
                      </td>

                      {/* Snowflake Score & Mini Radar */}
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2">
                          <MiniSnowflakeRadar
                            score={report.snowflakeScore}
                            tier={report.snowflakeTier}
                            pillars={report.snowflakePillars}
                            size={24}
                          />
                          <span className="font-bold text-white">
                            {report.snowflakeScore ?? 0}
                          </span>
                        </div>
                      </td>

                      {/* Historical Quarters */}
                      <td className="px-2 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {group.allReports.slice(0, 3).map((qRep, idx) => (
                            <button
                              key={qRep.slug}
                              type="button"
                              onClick={() =>
                                onSelectReport(qRep.slug, "cockpit")
                              }
                              className={`rounded px-1.5 py-0.5 text-[9px] font-semibold transition-all ${
                                idx === 0
                                  ? "bg-accent/20 text-accent ring-1 ring-accent/30"
                                  : "bg-surface-3 text-slate-400 hover:text-white"
                              }`}
                            >
                              {qRep.quarter || "Q"}
                            </button>
                          ))}
                          {group.allReports.length > 3 && (
                            <span className="text-[9px] text-slate-500">
                              +{group.allReports.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 pl-2 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectReport(report.slug, "memo")}
                            className="rounded px-2 py-1 text-[10px] font-semibold text-slate-400 transition-colors hover:bg-surface-3 hover:text-white"
                          >
                            {tw.openMemo}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onSelectReport(report.slug, "cockpit")
                            }
                            className="rounded bg-accent/15 px-2.5 py-1 text-[10px] font-bold text-accent ring-1 ring-accent/30 hover:bg-accent/25 hover:text-white"
                          >
                            {tw.openCockpit}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
